import { EscavadorResponse, EscavadorInvolvedSearchResponse } from '../types';

const API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiZmIxNTk1YTBlMzk5MGFhOWIwODQ0OGFhNDE4NDllODlhMDRmYTFhYzRhYmFmOTUwNmQ1Y2JhNjRkMDk4ZGM2ZGJkMmQxN2YzNTkxODY2ZjQiLCJpYXQiOjE3NjU0NjUxNDcuNTc2MzIsIm5iZiI6MTc2NTQ2NTE0Ny41NzYzMjIsImV4cCI6MjA4MDk5Nzk0Ny41NzI3OTUsInN1YiI6IjMwMTIwNjYiLCJzY29wZXMiOlsiYWNlc3Nhcl9hcGlfcGFnYSJdfQ.f4fqXec6JVx4qQKLiwmFepcd8mRCxqUzLGsddxi3B-svkzQZJjgOIQ-Q2n9HwtpbHkEpm5-QNzNWL_gGT4WpW9Kr9pE4A3JDXcgek1haEsioLpZ8_QWmhpW5vI4rBYRB8vk7VTGkTMDTz-XVgEgpFsVNrDy0rK8DPEKPSV5kXR0Zy_Tllone-FBNX8paS2JA7hk0AANLD0coI25PYWjNRMQwzApsjqA2N5mVWekCgjcZeAmPx8j8lCVKpLdv1i2GaxjK3STEMRA74Ob92n911z8XUTmdGgNzWijhBh7pjr94xycKeN0EWzjaXfdGb1xvihsSHi4rbcDe7_tEasOOS-O3xpiyYqEY2rP2p8zXL_LhbrXajqWMA6LkFrJx7aGylTOg068mnSPhn-4aQaE-KcFb65UdAA7GSADiX9oPNKDM5dU3wnAlpV00AXRyLsa9kyhA4OSkZpVxHrms3bX_LRundZugWTRFhi3wDCMayV1zf-Z1_Fdsbq5EUg4NMYJM6_j6gTsuNrQWg1vMCJecLxZABXyVcVpoNf237nmhkUwUxZrIUBMhNjhG9f58O9ZJmTE-NMVEcWZmAwAkXK9gLFiPAz5KR2pPpoF0ev5KVbhMNJzp9Qf7Red1S8UL8yatnQo34E32TfTWM-CPkF3As7Bq6gzyoxnmI6MaFcMPg14";

const BASE_URL = "https://api.escavador.com/api/v2";
const PROXY_URL = "https://corsproxy.io/?";

const fetchWithFallback = async (endpoint: string): Promise<any> => {
    const headers = {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    };

    const doFetch = async (url: string) => {
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Escavador API] Erro real: ${response.status} - ${errorText}`);
            
            if (response.status === 404) return null;
            
            // Lançamos o erro genérico para a UI
            throw new Error("Erro na integração com base de dados jurídica. Contate o suporte.");
        }
        return response.json();
    };

    try {
        return await doFetch(endpoint);
    } catch (error: any) {
        if (error.message.includes('Erro na integração')) throw error;
        
        console.error("[Escavador API] Erro de rede:", error);
        try {
            const proxiedUrl = `${PROXY_URL}${encodeURIComponent(endpoint)}`;
            return await doFetch(proxiedUrl);
        } catch (proxyError: any) {
            throw new Error("Erro na integração com base de dados jurídica. Contate o suporte.");
        }
    }
};

const parseDateString = (dateStr: string): number => {
    if (!dateStr) return 0;
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day).getTime();
    }
    const timestamp = new Date(dateStr).getTime();
    return isNaN(timestamp) ? 0 : timestamp;
};

export const fetchProcessData = async (processNumber: string): Promise<EscavadorResponse | null> => {
  const processEndpoint = `${BASE_URL}/processos/numero_cnj/${processNumber}`;
  const movesEndpoint = `${BASE_URL}/processos/numero_cnj/${processNumber}/movimentacoes`;

  try {
      const processData = await fetchWithFallback(processEndpoint);
      if (!processData) return null;

      let movesList = [];
      try {
          const movesData = await fetchWithFallback(movesEndpoint);
          if (movesData && movesData.items) {
              movesList = movesData.items;
              movesList.sort((a: any, b: any) => parseDateString(b.data) - parseDateString(a.data));
          }
      } catch (e) {
          console.warn("[Escavador API] Falha nas movimentações detalhadas.");
      }

      return { ...processData, movimentacoes: movesList };
  } catch (error: any) {
      throw error;
  }
};

export const fetchProcessesByInvolved = async (query: string): Promise<EscavadorInvolvedSearchResponse | null> => {
    const digitsOnly = query.replace(/\D/g, '');
    const isNumeric = digitsOnly.length > 0 && digitsOnly.length <= 14 && /^\d+$/.test(digitsOnly);
    
    let endpoint = `${BASE_URL}/envolvido/processos`;
    if (isNumeric && (digitsOnly.length === 11 || digitsOnly.length === 14)) {
        endpoint += `?cpf_cnpj=${digitsOnly}`;
    } else {
        endpoint += `?nome=${encodeURIComponent(query)}`;
    }

    try {
        const data = await fetchWithFallback(endpoint);
        if (!data || !data.items) return { total_encontrados: 0, items: [] };
        return data as EscavadorInvolvedSearchResponse;
    } catch (error: any) {
        throw error;
    }
};