import React from 'react';
import { 
  LayoutDashboard, Users, FileText, Settings, Shield, 
  Banknote, Activity, Bot
} from 'lucide-react';

interface SidebarProps {
  activeZone: string | null;
  onZoneChange: (zone: string) => void;
}

export const AdminSidebar: React.FC<SidebarProps> = ({ activeZone, onZoneChange }) => {
  const zones = [
    { id: 'USERS', label: 'Users & Access', icon: Users },
    { id: 'CONTENT', label: 'Content Manager', icon: FileText },
    { id: 'AI', label: 'AI Control Tower', icon: Bot },
    { id: 'MONETIZATION', label: 'Monetization', icon: Banknote },
    { id: 'SYSTEM', label: 'System & Config', icon: Settings },
    { id: 'ANALYTICS', label: 'Analytics', icon: Activity },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col fixed left-0 top-0 h-full overflow-y-auto z-50">
      <div className="flex items-center gap-3 mb-8 px-2 mt-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none">Admin</h1>
          <span className="text-[10px] text-slate-400 font-mono">PANEL v3.0</span>
        </div>
      </div>

      <div className="space-y-2">
        <button 
            onClick={() => onZoneChange('DASHBOARD')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${!activeZone || activeZone === 'DASHBOARD' ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
        >
            <LayoutDashboard size={20} />
            <span className="font-bold text-sm">Dashboard</span>
        </button>

        <div className="my-4 border-t border-slate-800" />

        {zones.map(zone => (
          <button
            key={zone.id}
            onClick={() => onZoneChange(zone.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeZone === zone.id ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            <zone.icon size={20} />
            <span className="font-bold text-sm">{zone.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
