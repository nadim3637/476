import React, { useState, useEffect } from 'react';
import { User, SystemSettings, ViewState } from '../types';
import { AdminSidebar } from './admin/dashboard/AdminSidebar';
import { AdminHeader } from './admin/dashboard/AdminHeader';
import { AiZone } from './admin/dashboard/zones/AiZone';
import { UsersZone } from './admin/dashboard/zones/UsersZone';
import { ContentZone } from './admin/dashboard/zones/ContentZone';
import { MonetizationZone } from './admin/dashboard/zones/MonetizationZone';
import { SystemZone } from './admin/dashboard/zones/SystemZone';
import { AnalyticsZone } from './admin/dashboard/zones/AnalyticsZone';
import { checkFirebaseConnection, subscribeToUsers } from '../firebase';
import { AdminDashboardLegacy } from './AdminDashboardLegacy';

interface Props {
  onNavigate: (view: ViewState) => void;
  settings?: SystemSettings;
  onUpdateSettings?: (s: SystemSettings) => void;
  onImpersonate?: (user: User) => void;
  logActivity: (action: string, details: string) => void;
  user?: User; 
  isDarkMode?: boolean;
  onToggleDarkMode?: (v: boolean) => void;
}

export const AdminDashboard: React.FC<Props> = (props) => {
    const [activeZone, setActiveZone] = useState<string>('DASHBOARD');
    const [onlineCount, setOnlineCount] = useState(0);
    const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
    const [useLegacy, setUseLegacy] = useState(false);

    useEffect(() => {
        setIsFirebaseConnected(checkFirebaseConnection());
        const unsub = subscribeToUsers((users) => {
             if (!users) return;
             const count = users.filter(u => {
                if (!u.lastActiveTime) return false;
                return (Date.now() - new Date(u.lastActiveTime).getTime()) < 5 * 60 * 1000;
            }).length;
            setOnlineCount(count);
        });
        return () => unsub();
    }, []);

    const handleForceUpdate = () => {
        if(confirm("Force Update?")) {
            alert("Update Signal Sent");
        }
    };

    const handleSaveSettings = () => {
        alert("Global Settings Saved");
    };

    if (useLegacy) {
        return (
            <div className="relative">
                <button 
                    onClick={() => setUseLegacy(false)}
                    className="fixed top-4 right-4 z-[100] bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg font-bold text-xs"
                >
                    Switch to New Admin v3.0
                </button>
                <AdminDashboardLegacy {...props} />
            </div>
        );
    }

    const renderZone = () => {
        switch(activeZone) {
            case 'AI': return <AiZone />;
            case 'USERS': return <UsersZone {...props} />;
            case 'CONTENT': return <ContentZone {...props} />;
            case 'MONETIZATION': return <MonetizationZone {...props} />;
            case 'SYSTEM': return <SystemZone {...props} />;
            case 'ANALYTICS': return <AnalyticsZone {...props} />;
            default: return (
                <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-slate-200 mt-6">
                    <h2 className="text-3xl font-black text-slate-800 mb-4">Welcome to Admin v3.0</h2>
                    <p className="text-slate-500 mb-8">Select a zone from the sidebar to begin.</p>
                    
                    <button 
                        onClick={() => setUseLegacy(true)}
                        className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold border border-slate-200 hover:bg-slate-200 transition-colors"
                    >
                        Access Legacy Dashboard
                    </button>
                </div>
            );
        }
    };

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <AdminSidebar activeZone={activeZone} onZoneChange={setActiveZone} />
            <div className="flex-1 ml-64 p-6">
                <AdminHeader 
                    onlineCount={onlineCount}
                    isFirebaseConnected={isFirebaseConnected}
                    isDarkMode={props.isDarkMode || false}
                    onToggleDarkMode={props.onToggleDarkMode || (() => {})}
                    onForceUpdate={handleForceUpdate}
                    onSaveSettings={handleSaveSettings}
                />
                {renderZone()}
            </div>
        </div>
    );
};
