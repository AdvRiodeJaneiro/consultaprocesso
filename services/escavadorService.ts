import { EscavadorResponse, EscavadorInvolvedSearchResponse } from '../types';

const API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiZmIxNTk1YTBlMzk5MGFhOWIwODQ0OGFhNDE4NDllODlhMDRmYTFhYzRhYmFmOTUwNmQ1Y2JhNjRkMDk4ZGM2ZGJkMmQxN2YzNTkxODY2ZjQiLCJpYXQiOjE3NjU0NjUxNDcuNTc2MzIsIm5iZiI6MTc2NTQ2NTE0Ny41NzYzMjIsImV4cCI6MjA4MDk5Nzk0Ny41NzI3OTUsInN1YiI6IjMwMTIwNjYiLCJzY29wZXMiOlsiYWNlc3Nhcl9hcGlfcGFnYSJdfQ.f4fqXec6JVx4qQKLiwmFepcd8mRCxqUzLGsddxi3B-svkzQZJjgOIQ-Q2n9HwtpbHkEpm5-QNzNWL_gGT4WpW9Kr9pE4A3JDXcgek1haEsioLpZ8_QWmhpW5vI4rBYRB8vk7VTGkTMDTz-XVgEgpFsVNrDy0rK8DPEKPSV5kXR0Zy_Tllone-FBNX8paS2JA7hk0AANLD0coI25PYWjNRMQwzApsjqA2N5mVWekCgjcZeAmPx8j8lCVKpLdv1i2GaxjK3STEMRA74Ob92n911z8XUTmdGgNzWijhBh7pjr94xycKeN0EWzjaXfdGb1xvihsSHi4rbcDe7_tEasOOS-O3xpiyYqEY2rP2p8zXL_LhbrXajqWMA6LkFrJx7aGylTOg068mnSPhn-4aQaE-KcFb65UdAA7GSADiX9oPNKDM5dU3wnAlpV00AXRyLsa9kyhA4OSkZpVxHrms3bX_LRundZugWTRFhi3wDCMayV1zf-Z1_Fdsbq5EUg4NMYJM6_j6gTsuNrQWg1vMCJecLxZABXyVcVpoNf237nmhkUwUxZrIUBMhNjhG9f58O9ZJmTE-NMVEcWZmAwAkXK9gLFiPAz5KR2pPpoF0ev5KVbhMNJzp9Qf7Red1S8UL8yatnQo34E32TfTWM-CPkF3As7Bq6gzyoxnmI6MaFcMPg14";

const BASE_URL = "https://api.escavador.com/api/v2";
const PROXY_URL = "https://corsproxy.io/?";

const fetchEscavador = async (method: 'GET' | 'POST' | 'DELETE', path: string, body?: any): Promise<any> => {
    const endpoint = `${BASE_URL}${path}`;
    const headers = {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
    };

    const doFetch = async (url: string) => {
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`[Escavador API] Erro: ${response.status}`, errorData);
            
            if (response.status === 404) return null;
            throw new Error(errorData.message || "Erro na integração com base de dados jurídica. Contate o suporte.");
        }
        return response.json();
    };

    try {
        return await doFetch(endpoint);
    } catch (error: any) {
        if (error.message.includes('Erro na integração')) throw error;
        
        // Tentar via Proxy em caso de erro de rede/CORS
        try {
            const proxiedUrl = `${PROXY_URL}${encodeURIComponent(endpoint)}`;
            return await doFetch(proxiedUrl);
        } catch (proxyError: any) {
            throw new Error("Erro na integração com base de dados jurídica. Contate o suporte.");
        }
    }
};

export const fetchProcessData = async (processNumber: string): Promise<EscavadorResponse | null> => {
  try {
      const processData = await fetchEscavador('GET', `/processos/numero_cnj/${processNumber}`);
      if (!processData) return null;

      let movesList = [];
      try {
          const movesData = await fetchEscavador('GET', `/processos/numero_cnj/${processNumber}/movimentacoes`);
          if (movesData && movesData.items) movesList = movesData.items;
      } catch (e) { console.warn("Falha nas movimentações detalhadas."); }

      return { ...processData, movimentacoes: movesList };
  } catch (error: any) { throw error; }
};

export const fetchProcessesByInvolved = async (query: string): Promise<EscavadorInvolvedSearchResponse | null> => {
    const digitsOnly = query.replace(/\D/g, '');
    let path = `/envolvido/processos`;
    if (digitsOnly.length === 11 || digitsOnly.length === 14) {
        path += `?cpf_cnpj=${digitsOnly}`;
    } else {
        path += `?nome=${encodeURIComponent(query)}`;
    }
    return await fetchEscavador('GET', path);
};

// --- NOVAS FUNÇÕES DE MONITORAMENTO REAL ---

export const createProcessMonitoring = async (cnj: string) => {
    return await fetchEscavador('POST', '/monitoramentos/processos', {
        tipo_monitoramento: "UNICO",
        valor: cnj,
        frequencia: "DIARIA"
    });
};

export const listActiveMonitorings = async () => {
    return await fetchEscavador('GET', '/monitoramentos/processos');
};

export const deleteMonitoring = async (id: number) => {
    return await fetchEscavador('DELETE', `/monitoramentos/processos/${id}`);
};