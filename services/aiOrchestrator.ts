import { AIModel, AISystemConfig } from "../types";
import { storage } from "../utils/storage";
import { rtdb } from "../firebase";
import { ref, get, set } from "firebase/database";

// Default Configuration
const DEFAULT_MODELS: AIModel[] = [
    { id: 'llama-3.1-8b-instant', name: 'Groq LLaMA 3.1', provider: 'groq', enabled: true, priority: 1, maxTokens: 8000 },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gemini', enabled: true, priority: 2 },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', enabled: false, priority: 3, isFallback: true },
    { id: 'openai/gpt-3.5-turbo', name: 'OpenRouter GPT-3.5', provider: 'openrouter', enabled: true, priority: 4, isFallback: true },
];

class AIOrchestratorService {
    private config: AISystemConfig = {
        models: DEFAULT_MODELS,
        tasks: [],
        globalEnabled: true,
        defaultModelId: 'llama-3.1-8b-instant',
        retryCount: 2
    };

    private isInitialized = false;

    constructor() {
        this.loadConfig();
    }

    public async loadConfig() {
        try {
            // 1. Try Firebase RTDB (Global Sync)
            if (rtdb) {
                const snapshot = await get(ref(rtdb, 'ai_config'));
                if (snapshot.exists()) {
                    this.config = snapshot.val();
                    this.isInitialized = true;
                    console.log("Loaded AI Config from Firebase");
                    return;
                }
            }
        } catch (e) {
            console.warn("Firebase AI Config Load Error:", e);
        }

        // 2. Fallback to Local Storage
        try {
            const aiConfigStr = await storage.getItem('nst_ai_config');
            if (aiConfigStr) {
                this.config = typeof aiConfigStr === 'string' ? JSON.parse(aiConfigStr) : aiConfigStr;
            } else {
                this.config.models = DEFAULT_MODELS;
            }
            this.isInitialized = true;
        } catch (e) {
            console.error("Failed to load AI Config", e);
            this.isInitialized = true; 
        }
    }

    public getModels(): AIModel[] {
        return this.config.models;
    }
    
    public getConfig(): AISystemConfig {
        return this.config;
    }

    public async saveConfig(newConfig: AISystemConfig) {
        this.config = newConfig;
        
        // 1. Local Save
        await storage.setItem('nst_ai_config', JSON.stringify(newConfig));
        
        // 2. Cloud Sync (For Students)
        try {
            if (rtdb) {
                await set(ref(rtdb, 'ai_config'), newConfig);
                console.log("AI Config Synced to Firebase");
            }
        } catch(e) { 
            console.error("Firebase Sync Error", e); 
        }
    }

    public getBestModel(taskType?: string): AIModel {
        // 1. Filter enabled models
        const enabled = this.config.models.filter(m => m.enabled);
        if (enabled.length === 0) {
            // Fallback to internal default if everything disabled
            console.warn("All AI models disabled in config. Using system default.");
            return DEFAULT_MODELS[0];
        }

        // 2. Sort by priority
        return enabled.sort((a, b) => a.priority - b.priority)[0];
    }

    public async callAI(messages: any[], taskType?: string, temperature: number = 0.7, jsonMode: boolean = false): Promise<string> {
        if (!this.isInitialized) await this.loadConfig();
        if (!this.config.globalEnabled) throw new Error("AI System is Globally Disabled.");

        const triedModels = new Set<string>();
        const enabledModels = this.config.models.filter(m => m.enabled).sort((a, b) => a.priority - b.priority);
        
        if (enabledModels.length === 0) {
             enabledModels.push(DEFAULT_MODELS[0]); // Emergency fallback
        }

        for (const model of enabledModels) {
            if (triedModels.has(model.id)) continue;
            triedModels.add(model.id);

            try {
                // console.log(`🤖 AI Orchestrator: Calling ${model.name} (${model.provider})...`);
                const result = await this.executeCall(model, messages, temperature, jsonMode);
                return result;
            } catch (error: any) {
                console.warn(`⚠️ Model ${model.name} Failed:`, error.message);
                // Continue to next model
            }
        }

        throw new Error("All AI Models failed to respond.");
    }

    private async executeCall(model: AIModel, messages: any[], temperature: number, jsonMode: boolean): Promise<string> {
        // Prepare Payload
        const payload = {
            provider: model.provider.toUpperCase(),
            model: model.id,
            messages: messages,
            temperature: temperature,
            apiKey: model.apiKey || undefined // Use override if present
        };

        const response = await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
    }
    
    // STREAMING SUPPORT
    public async callAIStream(messages: any[], onChunk: (text: string) => void, taskType?: string): Promise<string> {
         if (!this.isInitialized) await this.loadConfig();
         
         // Simplified: Just use primary model for streaming for now
         // Streaming with failover is complex (need to buffer/retry)
         const model = this.getBestModel(taskType);
         
         const response = await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                provider: model.provider.toUpperCase(),
                model: model.id,
                messages,
                stream: true
            })
        });

        if (!response.ok) throw new Error("Stream Error");
        if (!response.body) throw new Error("No body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6);
                    if (jsonStr.trim() === '[DONE]') return accumulated;
                    try {
                        const json = JSON.parse(jsonStr);
                        const content = json.choices?.[0]?.delta?.content || "";
                        if (content) {
                            accumulated += content;
                            onChunk(accumulated);
                        }
                    } catch (e) {}
                }
            }
        }
        return accumulated;
    }
}

export const aiOrchestrator = new AIOrchestratorService();
