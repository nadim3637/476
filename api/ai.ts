export const config = {
  runtime: 'edge',
};

// Endpoints
const PROVIDERS = {
  OPENAI: 'https://api.openai.com/v1/chat/completions',
  GROQ: 'https://api.groq.com/openai/v1/chat/completions',
  OPENROUTER: 'https://openrouter.ai/api/v1/chat/completions',
  // GEMINI requires a different structure usually, but via OpenAI compatibility layer or direct REST
};

export default async function handler(req: Request) {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { 
        status: 405,
        headers: { "Content-Type": "application/json" }
      });
    }

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
    }

    const { messages, model, provider, apiKey, temperature, max_tokens, stream, tools, tool_choice } = body;

    // Default to Groq if not specified
    const targetProvider = (provider || 'GROQ').toUpperCase();
    
    // API KEY RESOLUTION
    let finalApiKey = apiKey;

    if (!finalApiKey) {
        // Fallback to Server ENV
        if (targetProvider === 'GROQ') {
            const keysRaw = process.env.GROQ_API_KEYS;
            if (keysRaw) {
                const keys = keysRaw.split(",").map(k => k.trim()).filter(Boolean);
                if (keys.length > 0) finalApiKey = keys[Math.floor(Math.random() * keys.length)];
            }
        } else if (targetProvider === 'OPENAI') {
            finalApiKey = process.env.OPENAI_API_KEY;
        } else if (targetProvider === 'OPENROUTER') {
            finalApiKey = process.env.OPENROUTER_API_KEY;
        } else if (targetProvider === 'GEMINI') {
            finalApiKey = process.env.GEMINI_API_KEY;
        }
    }

    if (!finalApiKey) {
        return new Response(JSON.stringify({ error: `Server Configuration Error: No valid keys found for ${targetProvider}.` }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    // PROVIDER SPECIFIC LOGIC
    let endpoint = PROVIDERS.GROQ;
    let payload: any = {
      model: model || "llama3-8b-8192",
      messages,
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 4096,
      stream: !!stream
    };

    if (targetProvider === 'OPENAI') {
        endpoint = PROVIDERS.OPENAI;
        // OpenAI specifics if needed
    } else if (targetProvider === 'OPENROUTER') {
        endpoint = PROVIDERS.OPENROUTER;
        payload = {
            ...payload,
            route: "fallback" // OpenRouter specific
        };
    } else if (targetProvider === 'GEMINI') {
        // Handle Gemini REST API
        // Simplified: Assuming using Gemini 1.5 via OpenAI compatibility or direct
        // For now, let's assume we use the standard OpenAI format which Gemini supports via some endpoints or just implement standard REST
        // Actually Gemini has `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${finalApiKey}`
        
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${finalApiKey}`;
        
        // Gemini requires different payload
        const contents = messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));
        
        // Handle System Prompt (Gemini separates it)
        let systemInstruction = undefined;
        const systemMsg = messages.find((m: any) => m.role === 'system');
        if (systemMsg) {
             systemInstruction = { parts: [{ text: systemMsg.content }] };
             // Remove system message from contents
             // But map index might be messed up, so filter
        }
        const filteredContents = contents.filter((c: any) => c.role !== 'system' && c.role !== 'function'); // Gemini uses 'function' role differently?

        payload = {
            contents: filteredContents,
            generationConfig: {
                temperature: temperature || 0.7,
                maxOutputTokens: max_tokens || 4096
            }
        };
        if(systemInstruction) payload.systemInstruction = systemInstruction;

        // Gemini uses Query Param for Key, not Header
    }

    // FETCH HEADERS
    const headers: any = {
        "Content-Type": "application/json"
    };

    if (targetProvider !== 'GEMINI') {
        headers["Authorization"] = `Bearer ${finalApiKey}`;
        if (targetProvider === 'OPENROUTER') {
            headers["HTTP-Referer"] = "https://your-site.com"; // Required by OpenRouter
            headers["X-Title"] = "NSTA";
        }
    }

    // EXECUTE FETCH
    const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({ error: `${targetProvider} API Error`, detail: errorText }), { 
            status: response.status,
            headers: { "Content-Type": "application/json" }
        });
    }

    if (stream) {
        return new Response(response.body, {
            status: 200,
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        });
    }

    const data = await response.json();

    // NORMALIZE GEMINI RESPONSE TO OPENAI FORMAT
    if (targetProvider === 'GEMINI') {
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const normalized = {
            choices: [{
                message: {
                    role: "assistant",
                    content: content
                }
            }]
        };
        return new Response(JSON.stringify(normalized), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: "AI Gateway Internal Error", detail: err.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
    });
  }
}
