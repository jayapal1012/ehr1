import React, { useState } from 'react';
import { Navigation } from '@/components/navigation';
import { DashboardTabs } from '@/components/dashboard-tabs';
import { DashboardOverview } from '@/components/dashboard-overview';
import { PatientManagement } from '@/components/patient-management';
import { AITools } from '@/components/ai-tools';
import { AdminPanel } from '@/components/admin-panel';
import { useAuth } from '@/components/auth-provider';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { hasRole, hasAnyRole } = useAuth();

  // Set default tab based on role
  React.useEffect(() => {
    if (hasRole('admin')) {
      setActiveTab('dashboard');
    } else if (hasRole('staff')) {
      setActiveTab('dashboard');
    }
  }, [hasRole]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return hasAnyRole(['staff', 'admin']) ? <DashboardOverview /> : null;
      case 'patients':
        return hasAnyRole(['staff', 'admin']) ? <PatientManagement /> : null;
      case 'ai-tools':
        return hasAnyRole(['staff', 'admin']) ? <AITools /> : null;
      case 'admin':
        return hasRole('admin') ? <AdminPanel /> : null;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="tab-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
