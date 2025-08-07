import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from './auth-provider';
import { 
  BarChart3, 
  Users, 
  Brain, 
  Settings,
  Activity 
} from 'lucide-react';

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  const { hasAnyRole } = useAuth();

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      roles: ['staff', 'admin'],
    },
    {
      id: 'patients',
      label: 'Patients',
      icon: Users,
      roles: ['staff', 'admin'],
    },
    {
      id: 'ai-tools',
      label: 'AI Tools',
      icon: Brain,
      roles: ['staff', 'admin'],
    },
    {
      id: 'admin',
      label: 'Admin Panel',
      icon: Settings,
      roles: ['admin'],
    },
    {
      id: 'patient-view',
      label: 'My Records',
      icon: Activity,
      roles: ['patient'],
    },
  ];

  const visibleTabs = tabs.filter(tab => hasAnyRole(tab.roles));

  return (
    <div className="mb-8">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                className={`border-b-2 rounded-none py-4 px-1 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => onTabChange(tab.id)}
              >
                <Icon size={16} className="mr-2" />
                {tab.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
