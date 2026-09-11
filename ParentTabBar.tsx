import React from 'react';
import { 
  LayoutDashboard, 
  Video, 
  MapPin, 
  Sliders, 
  Bell, 
  Shield 
} from 'lucide-react';
import { ActiveTab } from '../../types';

interface ParentTabBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  flaggedCount: number;
}

export const ParentTabBar: React.FC<ParentTabBarProps> = ({
  activeTab,
  onTabChange,
  flaggedCount
}) => {
  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'livestream' as ActiveTab, label: 'Live Stream', icon: Video },
    { id: 'location' as ActiveTab, label: 'Location', icon: MapPin },
    { id: 'apps' as ActiveTab, label: 'App Rules', icon: Sliders },
    { id: 'notifications' as ActiveTab, label: 'Notifications', icon: Bell, badge: flaggedCount > 0 ? flaggedCount : undefined },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 py-2 px-4">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`tab-nav-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative ${
                isActive ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-indigo-500 absolute bottom-0" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
