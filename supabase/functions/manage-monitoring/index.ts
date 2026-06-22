import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const { action, processNumber, whatsappNumber, monitoringId, title_polo_ativo, title_polo_passivo } = await req.json()
    const ESC_API_KEY = Deno.env.get('ESCAVADOR_API_KEY')
    const BASE_URL = "https://api.escavador.com/api/v2"

    if (!ESC_API_KEY) {
      console.error("[manage-monitoring] API Key is missing");
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'create') {
        // 1. Check limit
        const { data: canMonitor, error: limitError } = await supabaseAdmin.rpc('check_monitoring_limit', {
            target_user_id: user.id
        })

        if (limitError || !canMonitor) {
            return new Response(JSON.stringify({ error: 'Limit reached or error checking limit' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 2. Call Escavador
        const escResponse = await fetch(`${BASE_URL}/monitoramentos/processos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ESC_API_KEY}`,
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                numero: processNumber,
                frequencia: 'SEMANAL'
            })
        })

        if (!escResponse.ok) {
            const errorText = await escResponse.text()
            return new Response(errorText, {
                status: escResponse.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const escData = await escResponse.json()
        const escId = escData.id

        // 3. Save to database
        const { data: dbData, error: dbError } = await supabaseAdmin
            .from('monitored_processes')
            .insert({
                user_id: user.id,
                escavador_monitoring_id: escId,
                process_number: processNumber,
                whatsapp_number: whatsappNumber,
                title_polo_ativo: title_polo_ativo || null,
                title_polo_passivo: title_polo_passivo || null,
                status: 'ATIVO',
                frequency: 'SEMANAL'
            })
            .select()
            .single()

        if (dbError) {
            console.error("[manage-monitoring] DB Insert Error:", dbError)
            // Ideally we should delete from Escavador if DB fails
            return new Response(JSON.stringify({ error: 'Error saving monitoring to database' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 4. Send Confirmation Email (Resend)
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (resendApiKey) {
          try {
            // Fetch profile details
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('email, first_name')
              .eq('id', user.id)
              .maybeSingle();

            const userEmail = profile?.email;
            const userName = profile?.first_name || "Doutor(a)";

            if (userEmail) {
              let finalSubject = `🔍 Monitoramento Ativo - Processo CNJ: ${processNumber}`;
              let emailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <title>Monitoramento Ativo</title>
                </head>
                <body>
                  <h2>Monitoramento Ativo</h2>
                  <p>Olá, <strong>${userName}</strong>,</p>
                  <p>Seu processo de número <strong>${processNumber}</strong> está sendo monitorado com sucesso.</p>
                </body>
                </html>
              `;

              // Load template from DB
              const { data: templateData } = await supabaseAdmin
                .from('email_templates')
                .select('subject, body_html')
                .eq('slug', 'monitoring_confirmation')
                .maybeSingle();

              if (templateData) {
                const linkPainel = `https://consultaprocesso.advogadoriodejaneiro.com/meus-processos`;

                let body = templateData.body_html;
                body = body.replace(/\{\{nome_usuario\}\}/g, userName);
                body = body.replace(/\{\{numero_processo\}\}/g, processNumber);
                body = body.replace(/\{\{link_painel\}\}/g, linkPainel);

                emailHtml = body;

                let subj = templateData.subject;
                subj = subj.replace(/\{\{nome_usuario\}\}/g, userName);
                subj = subj.replace(/\{\{numero_processo\}\}/g, processNumber);
                finalSubject = subj;
              }

              console.log("[manage-monitoring] Enviando e-mail de confirmação para:", userEmail);
              const emailRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${resendApiKey}`
                },
                body: JSON.stringify({
                  from: 'Consulta Processo <consultaprocesso@advogadoriodejaneiro.com>',
                  to: [userEmail],
                  subject: finalSubject,
                  html: emailHtml
                })
              });

              if (!emailRes.ok) {
                const errData = await emailRes.json();
                console.error("[manage-monitoring] Erro ao enviar e-mail via Resend:", errData);
              } else {
                console.log("[manage-monitoring] E-mail de confirmação enviado com sucesso!");
              }
            }
          } catch (emailErr) {
            console.error("[manage-monitoring] Erro no envio do e-mail de confirmação:", emailErr);
          }
        }

        return new Response(JSON.stringify(dbData), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } else if (action === 'delete') {
        // 1. Get escavador_monitoring_id if not provided
        let escId = monitoringId
        if (!escId) {
            return new Response(JSON.stringify({ error: 'Missing monitoring ID' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 2. Call Escavador
        const escResponse = await fetch(`${BASE_URL}/monitoramentos/processos/${escId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${ESC_API_KEY}`,
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })

        // Even if Escavador fails (e.g. 404), we should proceed with DB delete if it's our intention
        if (!escResponse.ok && escResponse.status !== 404) {
            const errorText = await escResponse.text()
            return new Response(errorText, {
                status: escResponse.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 3. Delete from database
        const { error: dbError } = await supabaseAdmin
            .from('monitored_processes')
            .delete()
            .eq('escavador_monitoring_id', escId)
            .eq('user_id', user.id)

        if (dbError) {
            return new Response(JSON.stringify({ error: 'Error deleting monitoring from database' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } else {
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

  } catch (err: any) {
    console.error("[manage-monitoring] Unexpected error:", err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
