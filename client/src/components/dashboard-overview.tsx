import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getAuthHeaders } from '@/lib/auth';
import { 
  Users, 
  UserPlus, 
  AlertTriangle, 
  Brain,
  TrendingUp 
} from 'lucide-react';

export function DashboardOverview() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ['/api/patients'],
    queryFn: async () => {
      const response = await fetch('/api/patients', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch patients');
      return response.json();
    },
  });

  const getVitalStatus = (systolic: number, diastolic: number, sugar: number) => {
    if (systolic > 140 || diastolic > 90 || sugar > 200) {
      return { status: 'Critical', variant: 'destructive' as const };
    }
    if (systolic > 120 || diastolic > 80 || sugar > 140) {
      return { status: 'Warning', variant: 'secondary' as const };
    }
    return { status: 'Normal', variant: 'default' as const };
  };

  if (statsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-12 w-12 rounded-lg mb-4" />
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalPatients || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="text-primary" size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="text-green-500 mr-1" size={12} />
              <span className="text-green-500 font-medium">+12% </span>
              <span className="text-gray-600 dark:text-gray-400">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New Admissions</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.newAdmissions || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <UserPlus className="text-green-600 dark:text-green-400" size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="text-green-500 mr-1" size={12} />
              <span className="text-green-500 font-medium">+8% </span>
              <span className="text-gray-600 dark:text-gray-400">from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical Cases</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.criticalCases || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-red-500" size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-red-500 font-medium">Requires attention</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Predictions</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.aiPredictions || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Brain className="text-orange-500" size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-500 font-medium">92% accuracy</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Patients */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Patients</CardTitle>
        </CardHeader>
        <CardContent>
          {patientsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Patient ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Vitals
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {patients?.slice(0, 5).map((patient: any) => {
                    const vitalStatus = getVitalStatus(
                      patient.bloodPressureSystolic,
                      patient.bloodPressureDiastolic,
                      patient.bloodSugar
                    );
                    return (
                      <tr key={patient.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-primary">
                            {patient.patientId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {patient.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {patient.age}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            <Badge variant="outline" className="mr-1">
                              BP: {patient.bloodPressureSystolic}/{patient.bloodPressureDiastolic}
                            </Badge>
                            <Badge variant="outline">
                              Sugar: {patient.bloodSugar}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={vitalStatus.variant}>
                            {vitalStatus.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
