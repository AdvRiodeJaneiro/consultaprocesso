const API_KEY = "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";
const BASE_URL = "https://api-publica.datajud.cnj.jus.br";
const PROXY_URL = "https://corsproxy.io/?";

export const fetchProcessData = async (alias: string, processNumber: string): Promise<any | null> => {
  const endpoint = `${BASE_URL}/${alias}/_search`;
  
  // Remove formatting for the query payload
  const cleanNumber = processNumber.replace(/[^\d]/g, '');

  const payload = {
    "query": {
        "match": {
            "numeroProcesso": cleanNumber
        }
    }
  };

  const headers = {
    'Authorization': `APIKey ${API_KEY}`,
    'Content-Type': 'application/json'
  };

  const doFetch = async (url: string) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  };

  try {
    // Attempt 1: Direct connection
    return await doFetch(endpoint);
  } catch (error: any) {
    console.warn("Direct Datajud API failed, trying proxy...", error);

    // Check if error is likely CORS (Failed to fetch)
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      try {
        // Attempt 2: Via Proxy
        // Note: corsproxy.io requires the destination URL to be encoded
        const proxiedUrl = `${PROXY_URL}${encodeURIComponent(endpoint)}`;
        return await doFetch(proxiedUrl);
      } catch (proxyError) {
        console.error("Datajud API Proxy error:", proxyError);
        return null;
      }
    }
    
    return null;
  }
};