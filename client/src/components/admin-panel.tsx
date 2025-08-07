import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getAuthHeaders } from '@/lib/auth';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Shield, 
  Download, 
  Upload, 
  Search, 
  Filter, 
  Eye, 
  Trash2,
  BarChart3,
  Settings,
  Lock,
  FileText,
  Calendar
} from 'lucide-react';

const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['staff', 'admin', 'patient']),
});

export function AdminPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ['/api/admin/audit-logs'],
    queryFn: async () => {
      const response = await fetch('/api/admin/audit-logs', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      return response.json();
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: 'User created successfully' });
      setShowUserForm(false);
      userForm.reset();
    },
    onError: (error) => {
      toast({ title: 'Error creating user', description: error.message, variant: 'destructive' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: 'User deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting user', description: error.message, variant: 'destructive' });
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: async (patientId: number) => {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete patient');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({ title: 'Patient deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting patient', description: error.message, variant: 'destructive' });
    },
  });

  const userForm = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      name: '',
      password: '',
      role: 'staff' as 'staff' | 'admin' | 'patient',
    },
  });

  const handleCreateUser = (data: any) => {
    createUserMutation.mutate(data);
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleDeletePatient = (patientId: number) => {
    if (window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      deletePatientMutation.mutate(patientId);
    }
  };

  const exportSystemData = async () => {
    try {
      const response = await fetch('/api/admin/export-system-data', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system_export_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({ title: 'System data exported successfully' });
    } catch (error) {
      toast({ title: 'Export failed', description: 'Failed to export system data', variant: 'destructive' });
    }
  };

  const filteredPatients = patients?.filter((patient: any) => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.patientId.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (filterStatus !== 'all') {
      const isActive = patient.isActive !== false;
      matchesFilter = filterStatus === 'active' ? isActive : !isActive;
    }
    
    return matchesSearch && matchesFilter;
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

  return (
    <div className="space-y-6">
      {/* Admin Panel Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage system users, patients, and settings</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportSystemData} variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            Export System Data
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats?.totalPatients || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Patients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{users?.length || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats?.criticalCases || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Critical Cases</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats?.aiPredictions || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">AI Predictions</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users size={20} />
                User Management
              </CardTitle>
              <Button onClick={() => setShowUserForm(!showUserForm)} size="sm">
                <UserPlus size={16} className="mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showUserForm && (
              <div className="mb-6 p-4 border rounded-lg">
                <h3 className="font-semibold mb-4">Add New User</h3>
                <Form {...userForm}>
                  <form onSubmit={userForm.handleSubmit(handleCreateUser)} className="space-y-4">
                    <FormField
                      control={userForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="patient">Patient</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowUserForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
            
            {usersLoading ? (
              <div className="text-center py-4">Loading users...</div>
            ) : (
              <div className="space-y-2">
                {users?.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield size={16} className="text-gray-500" />
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                      <Button
                        onClick={() => handleDeleteUser(user.id)}
                        variant="outline"
                        size="sm"
                        disabled={user.role === 'admin' && users.filter((u: any) => u.role === 'admin').length === 1}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Patient Management</CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {patientsLoading ? (
              <div className="text-center py-4">Loading patients...</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredPatients?.map((patient: any) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {patient.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{patient.name}</div>
                        <div className="text-sm text-gray-500">{patient.patientId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getVitalStatus(
                        patient.bloodPressureSystolic,
                        patient.bloodPressureDiastolic,
                        patient.bloodSugar
                      ).variant}>
                        {getVitalStatus(
                          patient.bloodPressureSystolic,
                          patient.bloodPressureDiastolic,
                          patient.bloodSugar
                        ).status}
                      </Badge>
                      <Button
                        onClick={() => handleDeletePatient(patient.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock size={20} />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Password Policy</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Minimum 6 characters required
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Session Timeout</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                24 hours automatic logout
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Audit Logging</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All admin actions logged
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={20} />
            Recent Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLoading ? (
            <div className="text-center py-4">Loading audit logs...</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {auditLogs?.slice(0, 10).map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-500" />
                    <div>
                      <div className="font-medium">{log.action}</div>
                      <div className="text-sm text-gray-500">
                        {log.targetType}: {log.targetId}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
              {auditLogs?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No audit logs found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}