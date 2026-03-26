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
    const { type, query, processNumber } = await req.json()
    const ESC_API_KEY = Deno.env.get('ESCAVADOR_API_KEY')
    const BASE_URL = "https://api.escavador.com/api/v2"

    if (!ESC_API_KEY) {
      console.error("[search-legal-data] API Key is missing");
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Determine usage type based on request
    const usageType = type === 'involved' ? 'search' : (type === 'process' ? 'process' : null)

    // 1. Check limits (if it's a countable action)
    if (usageType) {
        const { data: hasLimit, error: limitError } = await supabaseAdmin.rpc('check_user_usage_limit', {
            target_user_id: user.id,
            usage_type: usageType
        })

        if (limitError) {
            console.error("[search-legal-data] Limit check error:", limitError)
            return new Response(JSON.stringify({ error: 'Error checking limits' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        if (!hasLimit) {
            return new Response(JSON.stringify({ error: 'Limit reached' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }
    }

    // 2. Prepare Escavador request
    let endpoint = ""
    if (type === 'process') {
      // Validate process number (basic check)
      if (!processNumber || !/^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/.test(processNumber)) {
        // Many CNJs are slightly different, so let's just ensure it's not malicious
        if (!/^[0-9.-]+$/.test(processNumber)) {
            return new Response(JSON.stringify({ error: 'Invalid process number' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }
      }
      endpoint = `${BASE_URL}/processos/numero_cnj/${processNumber}`
    } else if (type === 'involved') {
      const digitsOnly = query.replace(/\D/g, '')
      const isCpfCnpj = digitsOnly.length === 11 || digitsOnly.length === 14
      endpoint = `${BASE_URL}/envolvido/processos`
      if (isCpfCnpj) {
        endpoint += `?cpf_cnpj=${digitsOnly}`
      } else {
        // Sanitize name query
        const sanitizedQuery = query.replace(/[^\w\s\u00C0-\u017F.-]/g, '')
        endpoint += `?nome=${encodeURIComponent(sanitizedQuery)}`
      }
    } else if (type === 'movements') {
      endpoint = `${BASE_URL}/processos/numero_cnj/${processNumber}/movimentacoes`
    } else {
        return new Response(JSON.stringify({ error: 'Invalid search type' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    console.log(`[search-legal-data] Calling Escavador: ${endpoint}`)

    const escResponse = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ESC_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })

    if (!escResponse.ok) {
      const errorText = await escResponse.text()
      console.error(`[search-legal-data] Escavador error: ${escResponse.status} - ${errorText}`)
      
      // If 404, just return null as the app expects
      if (escResponse.status === 404) {
          return new Response(null, {
            status: 200, // Returning null is a valid outcome for a search
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
      }

      return new Response(errorText, {
        status: escResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = await escResponse.json()

    // 3. Increment usage on success (only for 'process' and 'involved')
    if (usageType && data && (data.id || (data.items && data.items.length >= 0))) {
        const { error: incError } = await supabaseAdmin.rpc('increment_user_usage', {
            target_user_id: user.id,
            usage_type: usageType
        })
        if (incError) {
            console.error("[search-legal-data] Increment error:", incError)
        }
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error("[search-legal-data] Unexpected error:", err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
