import React from 'react';
import { useAuth } from './auth-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, LogOut, Hospital } from 'lucide-react';

export function Navigation() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                <Hospital className="text-white" size={16} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white">MedCare Pro</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Hospital Management</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.name}
              </span>
              <Badge variant="secondary" className="ml-2">
                {user?.role}
              </Badge>
            </div>
            
            <Button variant="ghost" size="icon">
              <Bell size={16} />
            </Button>
            
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
