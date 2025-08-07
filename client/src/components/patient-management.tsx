import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getAuthHeaders } from '@/lib/auth';
import { Search, Plus, Edit, Trash2, User, Download, FileText, BarChart3, TrendingUp } from 'lucide-react';
import { insertPatientSchema } from '@shared/schema';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const searchSchema = z.object({
  patientId: z.string().optional(),
  name: z.string().optional(),
});

export function PatientManagement() {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patients, isLoading } = useQuery({
    queryKey: ['/api/patients'],
    queryFn: async () => {
      const response = await fetch('/api/patients', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch patients');
      return response.json();
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create patient');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      toast({ title: 'Patient created successfully' });
      form.reset();
    },
    onError: (error) => {
      toast({ title: 'Error creating patient', description: error.message, variant: 'destructive' });
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/patients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update patient');
      return response.json();
    },
    onSuccess: (updatedPatient) => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/patients', updatedPatient.id, 'history'] });
      toast({ title: 'Patient updated successfully', description: 'Health history automatically recorded' });
      setShowEditModal(false);
      setEditingPatient(null);
      editForm.reset();
      
      // Update the selected patient if it's the same one being edited
      if (selectedPatient?.id === updatedPatient.id) {
        setSelectedPatient(updatedPatient);
      }
    },
    onError: (error) => {
      toast({ title: 'Error updating patient', description: error.message, variant: 'destructive' });
    },
  });

  const form = useForm({
    resolver: zodResolver(insertPatientSchema),
    defaultValues: {
      name: '',
      age: 0,
      phone: '',
      bloodSugar: 0,
      bloodPressureSystolic: 0,
      bloodPressureDiastolic: 0,
      weight: 0,
      height: 0,
      medicalHistory: '',
    },
  });

  const editForm = useForm({
    resolver: zodResolver(insertPatientSchema.partial()),
    defaultValues: {
      name: '',
      age: 0,
      phone: '',
      bloodSugar: 0,
      bloodPressureSystolic: 0,
      bloodPressureDiastolic: 0,
      weight: 0,
      height: 0,
      medicalHistory: '',
    },
  });

  const onSubmit = (data: any) => {
    createPatientMutation.mutate(data);
  };

  const onEditSubmit = (data: any) => {
    if (editingPatient) {
      updatePatientMutation.mutate({ id: editingPatient.id, data });
    }
  };

  const handleEditPatient = (patient: any) => {
    setEditingPatient(patient);
    editForm.reset({
      name: patient.name,
      age: patient.age,
      phone: patient.phone,
      bloodSugar: patient.bloodSugar,
      bloodPressureSystolic: patient.bloodPressureSystolic,
      bloodPressureDiastolic: patient.bloodPressureDiastolic,
      weight: patient.weight || 0,
      height: patient.height || 0,
      medicalHistory: patient.medicalHistory,
    });
    setShowEditModal(true);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await fetch(`/api/patients/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Search failed');
      const results = await response.json();
      
      if (results.length > 0) {
        setSelectedPatient(results[0]);
      } else {
        toast({ title: 'No patients found', description: 'Try a different search term' });
      }
    } catch (error) {
      toast({ title: 'Search error', description: 'Failed to search patients', variant: 'destructive' });
    }
  };

  const getVitalStatus = (systolic: number, diastolic: number, sugar: number) => {
    if (systolic > 140 || diastolic > 90 || sugar > 200) {
      return { status: 'Critical', variant: 'destructive' as const };
    }
    if (systolic > 120 || diastolic > 80 || sugar > 140) {
      return { status: 'Warning', variant: 'secondary' as const };
    }
    return { status: 'Normal', variant: 'default' as const };
  };

  const exportPatientData = async () => {
    try {
      const response = await fetch('/api/patients/export', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patients_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({ title: 'Export completed', description: 'Patient data exported successfully' });
    } catch (error) {
      toast({ title: 'Export failed', description: 'Failed to export patient data', variant: 'destructive' });
    }
  };

  const exportPatientPDF = async (patientId: string) => {
    try {
      const response = await fetch(`/api/patients/${patientId}/export-pdf`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('PDF export failed');
      
      const patientData = await response.json();
      
      // Generate PDF using jsPDF
      const { generatePatientPDF } = await import('../lib/pdf-generator');
      await generatePatientPDF(patientData);
      
      toast({ title: 'PDF exported', description: 'Patient report exported successfully' });
    } catch (error) {
      toast({ title: 'PDF export failed', description: 'Failed to export patient report', variant: 'destructive' });
    }
  };

  const { data: patientHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/patients', selectedPatient?.id, 'history'],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${selectedPatient?.id}/history`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch patient history');
      return response.json();
    },
    enabled: !!selectedPatient?.id,
  });

  // Transform real health history data for chart display
  const chartData = patientHistory?.vitalsHistory?.map((entry: any) => ({
    date: entry.date ? new Date(entry.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown',
    bloodSugar: entry.bloodSugar,
    systolic: entry.systolic,
    diastolic: entry.diastolic,
    notes: entry.notes || ''
  })) || [];

  return (
    <div className="space-y-6">
      {/* Patient Records Management Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Patient Records Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Search, manage, and export patient data</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportPatientData} variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Patient List Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Patients</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-64"
              />
              <Button onClick={handleSearch} size="sm">
                <Search size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading patients...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Patient ID</th>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Contact</th>
                    <th className="text-left p-3 font-medium">Vitals</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients?.map((patient: any) => (
                    <tr key={patient.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3 text-blue-600 font-medium">{patient.patientId}</td>
                      <td className="p-3">{patient.name}</td>
                      <td className="p-3">{patient.phone}</td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div>BP: {patient.bloodPressureSystolic}/{patient.bloodPressureDiastolic}</div>
                          <div>Sugar: {patient.bloodSugar} mg/dL</div>
                        </div>
                      </td>
                      <td className="p-3">
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
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button onClick={() => setSelectedPatient(patient)} variant="outline" size="sm">
                            View
                          </Button>
                          <Button onClick={() => handleEditPatient(patient)} variant="outline" size="sm">
                            <Edit size={14} />
                          </Button>
                          <Button onClick={() => exportPatientPDF(patient.patientId)} variant="outline" size="sm">
                            <FileText size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {patients?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No patients found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Patient Details</CardTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowHistory(!showHistory)} 
                  variant="outline" 
                  size="sm"
                >
                  <BarChart3 size={16} className="mr-2" />
                  {showHistory ? 'Hide History' : 'View History'}
                </Button>
                <Button onClick={() => exportPatientPDF(selectedPatient.patientId)} variant="outline" size="sm">
                  <FileText size={16} className="mr-2" />
                  Export PDF
                </Button>
                <Button onClick={() => handleEditPatient(selectedPatient)} variant="outline" size="sm">
                  <Edit size={16} className="mr-2" />
                  Edit
                </Button>
                <Button onClick={() => setSelectedPatient(null)} variant="outline" size="sm">
                  Close
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Patient ID</Label>
                    <p className="text-lg font-semibold text-primary">{selectedPatient.patientId}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</Label>
                    <p className="text-lg text-gray-900 dark:text-white">{selectedPatient.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Age</Label>
                    <p className="text-lg text-gray-900 dark:text-white">{selectedPatient.age} years</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</Label>
                    <p className="text-lg text-gray-900 dark:text-white">{selectedPatient.phone}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Blood Sugar Level</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-gray-900 dark:text-white">{selectedPatient.bloodSugar} mg/dL</span>
                      <Badge variant={selectedPatient.bloodSugar > 140 ? 'destructive' : 'default'}>
                        {selectedPatient.bloodSugar > 140 ? 'High' : 'Normal'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Blood Pressure</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-gray-900 dark:text-white">
                        {selectedPatient.bloodPressureSystolic}/{selectedPatient.bloodPressureDiastolic} mmHg
                      </span>
                      <Badge variant={
                        selectedPatient.bloodPressureSystolic > 140 || selectedPatient.bloodPressureDiastolic > 90 
                          ? 'destructive' 
                          : 'default'
                      }>
                        {selectedPatient.bloodPressureSystolic > 140 || selectedPatient.bloodPressureDiastolic > 90 
                          ? 'High' 
                          : 'Normal'}
                      </Badge>
                    </div>
                  </div>
                  {selectedPatient.weight && selectedPatient.height && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">BMI</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-gray-900 dark:text-white">
                          {(selectedPatient.weight / Math.pow(selectedPatient.height / 100, 2)).toFixed(1)}
                        </span>
                        <Badge variant={
                          (selectedPatient.weight / Math.pow(selectedPatient.height / 100, 2)) > 25 
                            ? 'destructive' 
                            : (selectedPatient.weight / Math.pow(selectedPatient.height / 100, 2)) < 18.5 
                              ? 'secondary' 
                              : 'default'
                        }>
                          {(selectedPatient.weight / Math.pow(selectedPatient.height / 100, 2)) > 25 
                            ? 'Overweight' 
                            : (selectedPatient.weight / Math.pow(selectedPatient.height / 100, 2)) < 18.5 
                              ? 'Underweight' 
                              : 'Normal'}
                        </Badge>
                      </div>
                    </div>
                  )}
                  {(selectedPatient.weight || selectedPatient.height) && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Physical Stats</Label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedPatient.weight && `Weight: ${selectedPatient.weight} kg`}
                        {selectedPatient.weight && selectedPatient.height && ' • '}
                        {selectedPatient.height && `Height: ${selectedPatient.height} cm`}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Status</Label>
                    <div className="mt-1">
                      <Badge variant={getVitalStatus(
                        selectedPatient.bloodPressureSystolic,
                        selectedPatient.bloodPressureDiastolic,
                        selectedPatient.bloodSugar
                      ).variant}>
                        {getVitalStatus(
                          selectedPatient.bloodPressureSystolic,
                          selectedPatient.bloodPressureDiastolic,
                          selectedPatient.bloodSugar
                        ).status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Medical History</Label>
                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-800 dark:text-gray-200">{selectedPatient.medicalHistory}</p>
                </div>
              </div>

              {/* Patient History Graph */}
              {showHistory && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Health Indicators History</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Blood Sugar Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 10 }}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip 
                              formatter={(value) => [`${value} mg/dL`, 'Blood Sugar']}
                              labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="bloodSugar" 
                              stroke="#ef4444" 
                              strokeWidth={2}
                              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Blood Pressure Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 10 }}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip 
                              formatter={(value, name) => {
                                const unit = name === 'Systolic' || name === 'Diastolic' ? 'mmHg' : 'mg/dL';
                                return [`${value} ${unit}`, name];
                              }}
                              labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="systolic" 
                              stroke="#3b82f6" 
                              strokeWidth={2}
                              name="Systolic"
                              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="diastolic" 
                              stroke="#10b981" 
                              strokeWidth={2}
                              name="Diastolic"
                              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Patient Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus size={20} />
            Add New Patient
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter patient name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter age"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bloodSugar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Sugar Level (mg/dL)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="95"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bloodPressureSystolic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Systolic BP</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="120"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bloodPressureDiastolic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diastolic BP</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="80"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="70"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="170"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="medicalHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical History</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter medical history" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={createPatientMutation.isPending}>
                {createPatientMutation.isPending ? 'Adding...' : 'Add Patient'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Edit Patient Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="25"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1-555-0123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="bloodSugar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Sugar (mg/dL)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="120"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="bloodPressureSystolic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Systolic BP</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="120"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="bloodPressureDiastolic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diastolic BP</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="80"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="70"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="170"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="medicalHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical History</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter medical history" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updatePatientMutation.isPending}>
                  {updatePatientMutation.isPending ? 'Updating...' : 'Update Patient'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}