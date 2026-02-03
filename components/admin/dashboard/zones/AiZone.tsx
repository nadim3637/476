import React, { useState, useEffect } from 'react';
import { Bot, Plus, Trash2, Save, Activity, RefreshCw } from 'lucide-react';
import { aiOrchestrator } from '../../../services/aiOrchestrator';
import { AIModel, AISystemConfig } from '../../../types';

export const AiZone: React.FC = () => {
    const [config, setConfig] = useState<AISystemConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newModel, setNewModel] = useState<Partial<AIModel>>({ provider: 'groq', enabled: true, priority: 5 });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setIsLoading(true);
        // Force reload from storage
        await aiOrchestrator.loadConfig();
        setConfig(aiOrchestrator.getConfig());
        setIsLoading(false);
    };

    const handleSave = async () => {
        if (config) {
            await aiOrchestrator.saveConfig(config);
            alert("AI Configuration Saved!");
        }
    };

    const handleAddModel = () => {
        if (!config || !newModel.id || !newModel.name) return;
        const model: AIModel = {
            id: newModel.id!,
            name: newModel.name!,
            provider: newModel.provider as any,
            enabled: true,
            priority: newModel.priority || 5,
            apiKey: newModel.apiKey
        };
        setConfig({ ...config, models: [...config.models, model] });
        setNewModel({ provider: 'groq', enabled: true, priority: 5 });
    };

    const handleDelete = (modelId: string) => {
        if (!config) return;
        const updated = config.models.filter((m) => m.id !== modelId);
        setConfig({ ...config, models: updated });
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading AI Config...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <Bot className="text-indigo-600" /> AI Control Tower
                </h2>
                <button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg">
                    <Save size={18} /> Save Changes
                </button>
            </div>

            {/* LIVE STATUS CARD */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-green-600" /> Live Model Status
                </h3>
                {config?.models.filter(m => m.enabled).length === 0 && (
                    <p className="text-sm text-red-500 font-bold bg-red-50 p-2 rounded">⚠️ No active models! AI features will fail.</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {config?.models.filter(m => m.enabled).map((m, i) => (
                        <div key={i} className="p-4 rounded-xl border flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div>
                                <p className="font-bold text-sm text-slate-800">{m.name}</p>
                                <p className="text-xs text-slate-500 uppercase">{m.provider}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></span>
                                    Active
                                </span>
                                <span className="text-xs font-black text-slate-400 bg-white border px-1.5 py-0.5 rounded">P{m.priority}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODEL REGISTRY */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-700 mb-4">Model Registry</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                            <tr>
                                <th className="p-3">Priority</th>
                                <th className="p-3">Provider</th>
                                <th className="p-3">Name</th>
                                <th className="p-3">Model ID</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {config?.models.sort((a,b) => a.priority - b.priority).map((m, idx) => (
                                <tr key={m.id} className="hover:bg-slate-50 group">
                                    <td className="p-3">
                                        <input 
                                            type="number" 
                                            value={m.priority}
                                            onChange={(e) => {
                                                const updated = [...config.models];
                                                const index = updated.findIndex(x => x.id === m.id);
                                                updated[index] = { ...m, priority: Number(e.target.value) };
                                                setConfig({ ...config, models: updated });
                                            }}
                                            className="w-12 p-1.5 border rounded-lg text-center font-bold text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                            m.provider === 'openai' ? 'bg-green-100 text-green-700' :
                                            m.provider === 'groq' ? 'bg-orange-100 text-orange-700' :
                                            m.provider === 'gemini' ? 'bg-blue-100 text-blue-700' :
                                            'bg-purple-100 text-purple-700'
                                        }`}>
                                            {m.provider}
                                        </span>
                                    </td>
                                    <td className="p-3 font-bold text-slate-800">{m.name}</td>
                                    <td className="p-3 font-mono text-xs text-slate-500">{m.id}</td>
                                    <td className="p-3">
                                        <button 
                                            onClick={() => {
                                                const updated = [...config.models];
                                                const index = updated.findIndex(x => x.id === m.id);
                                                updated[index] = { ...m, enabled: !m.enabled };
                                                setConfig({ ...config, models: updated });
                                            }}
                                            className={`w-10 h-5 rounded-full relative transition-colors ${m.enabled ? 'bg-green-500' : 'bg-slate-300'}`}
                                        >
                                            <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all shadow-sm ${m.enabled ? 'left-6' : 'left-1'}`} />
                                        </button>
                                    </td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => handleDelete(m.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ADD NEW MODEL */}
                <div className="mt-6 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Plus size={14}/> Add New Model</p>
                    <div className="flex gap-3 items-center flex-wrap">
                        <select 
                            value={newModel.provider} 
                            onChange={e => setNewModel({...newModel, provider: e.target.value as any})}
                            className="p-3 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                        >
                            <option value="groq">Groq</option>
                            <option value="openai">OpenAI</option>
                            <option value="gemini">Gemini</option>
                            <option value="openrouter">OpenRouter</option>
                        </select>
                        <input 
                            type="text" 
                            placeholder="Display Name" 
                            value={newModel.name || ''} 
                            onChange={e => setNewModel({...newModel, name: e.target.value})}
                            className="p-3 rounded-xl border border-slate-200 text-xs flex-1 min-w-[150px]"
                        />
                        <input 
                            type="text" 
                            placeholder="Model ID (e.g. gpt-4)" 
                            value={newModel.id || ''} 
                            onChange={e => setNewModel({...newModel, id: e.target.value})}
                            className="p-3 rounded-xl border border-slate-200 text-xs flex-1 font-mono min-w-[150px]"
                        />
                        <input 
                            type="text" 
                            placeholder="API Key (Optional)" 
                            value={newModel.apiKey || ''} 
                            onChange={e => setNewModel({...newModel, apiKey: e.target.value})}
                            className="p-3 rounded-xl border border-slate-200 text-xs flex-1 font-mono min-w-[150px]"
                        />
                        <button onClick={handleAddModel} className="bg-slate-800 text-white p-3 rounded-xl hover:bg-black transition-colors shadow-lg">
                            <Plus size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
