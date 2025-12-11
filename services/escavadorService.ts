
import { EscavadorResponse } from '../types';

const API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiZmIxNTk1YTBlMzk5MGFhOWIwODQ0OGFhNDE4NDllODlhMDRmYTFhYzRhYmFmOTUwNmQ1Y2JhNjRkMDk4ZGM2ZGJkMmQxN2YzNTkxODY2ZjQiLCJpYXQiOjE3NjU0NjUxNDcuNTc2MzIsIm5iZiI6MTc2NTQ2NTE0Ny41NzYzMjIsImV4cCI6MjA4MDk5Nzk0Ny41NzI3OTUsInN1YiI6IjMwMTIwNjYiLCJzY29wZXMiOlsiYWNlc3Nhcl9hcGlfcGFnYSJdfQ.f4fqXec6JVx4qQKLiwmFepcd8mRCxqUzLGsddxi3B-svkzQZJjgOIQ-Q2n9HwtpbHkEpm5-QNzNWL_gGT4WpW9Kr9pE4A3JDXcgek1haEsioLpZ8_QWmhpW5vI4rBYRB8vk7VTGkTMDTz-XVgEgpFsVNrDy0rK8DPEKPSV5kXR0Zy_Tllone-FBNX8paS2JA7hk0AANLD0coI25PYWjNRMQwzApsjqA2N5mVWekCgjcZeAmPx8j8lCVKpLdv1i2GaxjK3STEMRA74Ob92n911z8XUTmdGgNzWijhBh7pjr94xycKeN0EWzjaXfdGb1xvihsSHi4rbcDe7_tEasOOS-O3xpiyYqEY2rP2p8zXL_LhbrXajqWMA6LkFrJx7aGylTOg068mnSPhn-4aQaE-KcFb65UdAA7GSADiX9oPNKDM5dU3wnAlpV00AXRyLsa9kyhA4OSkZpVxHrms3bX_LRundZugWTRFhi3wDCMayV1zf-Z1_Fdsbq5EUg4NMYJM6_j6gTsuNrQWg1vMCJecLxZABXyVcVpoNf237nmhkUwUxZrIUBMhNjhG9f58O9ZJmTE-NMVEcWZmAwAkXK9gLFiPAz5KR2pPpoF0ev5KVbhMNJzp9Qf7Red1S8UL8yatnQo34E32TfTWM-CPkF3As7Bq6gzyoxnmI6MaFcMPg14";
const BASE_URL = "https://api.escavador.com/api/v2";
const PROXY_URL = "https://corsproxy.io/?";

// Helper to handle the fetch logic with Proxy fallback
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
            let errorBody = "";
            try {
                errorBody = await response.text();
            } catch (e) {
                errorBody = "No error details available";
            }
            
            // Allow 404 to be handled by caller
            if (response.status === 404) {
                return null;
            }

            throw new Error(`API Error ${response.status}: ${errorBody}`);
        }
        return response.json();
    };

    try {
        // Attempt 1: Direct
        return await doFetch(endpoint);
    } catch (error: any) {
        // If logic error, throw
        if (error.message.includes('API Error')) {
            throw error;
        }
        
        // If network/CORS error, try proxy
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('Load failed')) {
            try {
                const proxiedUrl = `${PROXY_URL}${encodeURIComponent(endpoint)}`;
                return await doFetch(proxiedUrl);
            } catch (proxyError: any) {
                console.error("Proxy error for endpoint " + endpoint, proxyError);
                throw proxyError;
            }
        }
        throw error;
    }
};

// Robust date parser for both ISO (YYYY-MM-DD) and BR (DD/MM/YYYY) formats
const parseDateString = (dateStr: string): number => {
    if (!dateStr) return 0;
    
    // Check for DD/MM/YYYY format
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day).getTime();
    }
    
    // Fallback to standard Date parse (handles YYYY-MM-DD)
    const timestamp = new Date(dateStr).getTime();
    return isNaN(timestamp) ? 0 : timestamp;
};

export const fetchProcessData = async (processNumber: string): Promise<EscavadorResponse | null> => {
  const processEndpoint = `${BASE_URL}/processos/numero_cnj/${processNumber}`;
  const movesEndpoint = `${BASE_URL}/processos/numero_cnj/${processNumber}/movimentacoes`;

  try {
      // 1. Fetch Process Metadata
      const processData = await fetchWithFallback(processEndpoint);
      
      if (!processData) {
          return null; // Process not found
      }

      // 2. Fetch Moves (Best effort - if fails, we still return process data)
      let movesList = [];
      try {
          const movesData = await fetchWithFallback(movesEndpoint);
          if (movesData && movesData.items) {
              movesList = movesData.items;
              
              // 3. Sort Moves: Descending Order (Newest First)
              // We use the custom parser to ensure '30/06/2025' isn't treated as Invalid Date
              movesList.sort((a: any, b: any) => {
                const dateA = parseDateString(a.data);
                const dateB = parseDateString(b.data);
                return dateB - dateA; // Descending
              });
          }
      } catch (e) {
          console.warn("Could not fetch detailed movements, continuing with basic data.", e);
      }

      // 4. Merge Data
      // Attach the movements list to the root object so Gemini can see it
      const result: EscavadorResponse = {
          ...processData,
          movimentacoes: movesList
      };

      return result;

  } catch (error) {
      console.error("Escavador Service Error:", error);
      throw error;
  }
};
