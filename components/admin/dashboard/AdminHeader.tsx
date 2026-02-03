import React from 'react';
import { Shield, Save, Users, Wifi, WifiOff, Sparkles, Zap, RefreshCw } from 'lucide-react';

interface HeaderProps {
    onlineCount: number;
    isFirebaseConnected: boolean;
    isDarkMode: boolean;
    onToggleDarkMode: (v: boolean) => void;
    onForceUpdate: () => void;
    onSaveSettings: () => void;
}

export const AdminHeader: React.FC<HeaderProps> = ({ 
    onlineCount, isFirebaseConnected, isDarkMode, onToggleDarkMode, onForceUpdate, onSaveSettings 
}) => {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6">
              <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                      <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg"><Shield size={20} /></div>
                      <div>
                          <h2 className="font-black text-slate-800 text-lg leading-none">Admin Console</h2>
                          <div className="flex items-center gap-2 mt-2">
                              {/* ONLINE USERS */}
                              <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200" title="Active Users (5m)">
                                  <div className="relative">
                                      <Users size={10} className="text-slate-500" />
                                      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-white animate-pulse"></div>
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-600">{onlineCount}</span>
                              </div>

                              {/* FIREBASE STATUS INDICATOR */}
                              {isFirebaseConnected ? (
                                  <span className="flex items-center gap-1 bg-green-100 text-green-700 text-[9px] px-2 py-0.5 rounded-full font-bold">
                                      <Wifi size={10} /> Online
                                  </span>
                              ) : (
                                  <span className="flex items-center gap-1 bg-red-100 text-red-700 text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                                      <WifiOff size={10} /> Disconnected
                                  </span>
                              )}
                          </div>
                      </div>
                  </div>
                  <div className="flex gap-2">
                      <button 
                          onClick={onForceUpdate}
                          className="bg-red-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow hover:bg-red-700 flex items-center gap-2 animate-pulse"
                      >
                          <RefreshCw size={16} /> Force Update
                      </button>
                      <button onClick={onSaveSettings} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-green-700 flex items-center gap-2"><Save size={16} /> Save Settings</button>
                  </div>
              </div>
              
              <div className="flex justify-end mb-4 px-2">
                  <button 
                      onClick={() => onToggleDarkMode(!isDarkMode)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isDarkMode ? 'bg-slate-800 text-yellow-400 border border-slate-700' : 'bg-white text-slate-600 border border-slate-200'}`}
                  >
                      {isDarkMode ? <Sparkles size={14} /> : <Zap size={14} />}
                      {isDarkMode ? 'Dark Mode On' : 'Dark Mode Off'}
                  </button>
              </div>
        </div>
    );
};
