import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Heart, 
  Activity, 
  FileText, 
  Download, 
  BarChart3,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Calendar,
  Phone,
  MapPin,
  Clock,
  LogOut
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { getAuthHeaders } from '@/lib/auth';

export default function PatientView() {
  const { user, logout } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');

  const { data: patientData, isLoading } = useQuery({
    queryKey: ['/api/patient', user?.username, 'data'],
    queryFn: async () => {
      const response = await fetch(`/api/patient/${user?.username}/data`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch patient data');
      return response.json();
    },
    enabled: !!user?.username && user?.role === 'patient',
  });

  // Fetch patient's historical data for charts
  const { data: patientHistory } = useQuery({
    queryKey: ['/api/patients', patientData?.id, 'history'],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${patientData?.id}/history`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch patient history');
      return response.json();
    },
    enabled: !!patientData?.id,
  });

  const exportPatientPDF = async () => {
    try {
      const response = await fetch(`/api/patients/${user?.username}/export-pdf`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('PDF export failed');
      
      const patientData = await response.json();
      
      // Generate PDF using jsPDF
      const { generatePatientPDF } = await import('../lib/pdf-generator');
      await generatePatientPDF(patientData);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getVitalStatus = (systolic: number, diastolic: number, sugar: number) => {
    if (systolic > 140 || diastolic > 90 || sugar > 200) {
      return { 
        status: 'Critical', 
        variant: 'destructive' as const,
        icon: <AlertCircle size={16} className="text-red-500" />
      };
    }
    if (systolic > 120 || diastolic > 80 || sugar > 140) {
      return { 
        status: 'Warning', 
        variant: 'secondary' as const,
        icon: <AlertCircle size={16} className="text-yellow-500" />
      };
    }
    return { 
      status: 'Normal', 
      variant: 'default' as const,
      icon: <CheckCircle size={16} className="text-green-500" />
    };
  };

  // Transform real health history data for chart display
// Transform real health history data for chart display (oldest → newest)
  const historicalData = (patientHistory?.vitalsHistory || [])
    .slice() // clone to avoid mutating original
    .reverse() // oldest first for correct chart timeline
    .map((entry: any) => ({
      date: entry.date 
        ? new Date(entry.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) 
        : 'Unknown',
      bloodSugar: entry.bloodSugar,
      systolic: entry.systolic,
      diastolic: entry.diastolic,
      notes: entry.notes || ''
  }));
  console.log("Raw vitalsHistory:", patientHistory?.vitalsHistory);
  console.log("Transformed chart data (historicalData):", historicalData);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your medical records...</p>
        </div>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Patient Records Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please contact your healthcare provider for assistance.
          </p>
        </div>
      </div>
    );
  }

  const vitalStatus = getVitalStatus(
    patientData.bloodPressureSystolic,
    patientData.bloodPressureDiastolic,
    patientData.bloodSugar
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Patient Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{patientData.name}</h1>
              <p className="text-blue-100">Patient ID: {patientData.patientId}</p>
              <p className="text-blue-100">Age: {patientData.age} years</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              {vitalStatus.icon}
              <Badge variant={vitalStatus.variant} className="text-white">
                {vitalStatus.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportPatientPDF} variant="outline" className="text-blue-600 border-white">
                <Download size={16} className="mr-2" />
                Download Report
              </Button>
              <Button onClick={logout} variant="outline" className="text-blue-600 border-white">
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Portal Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
          <TabsTrigger value="history">Medical History</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Blood Sugar Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{patientData.bloodSugar}</p>
                    <p className="text-sm text-gray-500">mg/dL</p>
                  </div>
                  <Activity size={24} className="text-blue-500" />
                </div>
                <div className="mt-2">
                  <Badge variant={patientData.bloodSugar > 140 ? 'destructive' : 'default'}>
                    {patientData.bloodSugar > 140 ? 'High' : 'Normal'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Blood Pressure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {patientData.bloodPressureSystolic}/{patientData.bloodPressureDiastolic}
                    </p>
                    <p className="text-sm text-gray-500">mmHg</p>
                  </div>
                  <Heart size={24} className="text-red-500" />
                </div>
                <div className="mt-2">
                  <Badge variant={
                    patientData.bloodPressureSystolic > 140 || patientData.bloodPressureDiastolic > 90 
                      ? 'destructive' 
                      : 'default'
                  }>
                    {patientData.bloodPressureSystolic > 140 || patientData.bloodPressureDiastolic > 90 
                      ? 'High' 
                      : 'Normal'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* BMI Card */}
            {patientData.weight && patientData.height && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    BMI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {(patientData.weight / Math.pow(patientData.height / 100, 2)).toFixed(1)}
                      </p>
                      <p className="text-sm text-gray-500">kg/m²</p>
                    </div>
                    <Activity size={24} className="text-purple-500" />
                  </div>
                  <div className="mt-2">
                    <Badge variant={
                      (patientData.weight / Math.pow(patientData.height / 100, 2)) > 25 
                        ? 'destructive' 
                        : (patientData.weight / Math.pow(patientData.height / 100, 2)) < 18.5 
                          ? 'secondary' 
                          : 'default'
                    }>
                      {(patientData.weight / Math.pow(patientData.height / 100, 2)) > 25 
                        ? 'Overweight' 
                        : (patientData.weight / Math.pow(patientData.height / 100, 2)) < 18.5 
                          ? 'Underweight' 
                          : 'Normal'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Physical Stats Card */}
            {(patientData.weight || patientData.height) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Physical Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {patientData.weight && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Weight</span>
                        <span className="font-medium">{patientData.weight} kg</span>
                      </div>
                    )}
                    {patientData.height && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Height</span>
                        <span className="font-medium">{patientData.height} cm</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-500" />
                    <span className="text-sm">{patientData.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    <span className="text-sm">
                      Registered: {new Date(patientData.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medical History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} />
                Medical History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-800 dark:text-gray-200">
                  {patientData.medicalHistory || 'No medical history recorded.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vitals Tab */}
        <TabsContent value="vitals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 size={20} />
                  Blood Sugar Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} mg/dL`, 'Blood Sugar']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bloodSugar" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart size={20} />
                  Blood Pressure Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
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
                      dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="diastolic" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Diastolic"
                      dot={{ fill: '#10b981', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Current Vital Signs */}
          <Card>
            <CardHeader>
              <CardTitle>Current Vital Signs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Activity size={32} className="text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{patientData.bloodSugar}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Blood Sugar (mg/dL)</p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <Heart size={32} className="text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">
                    {patientData.bloodPressureSystolic}/{patientData.bloodPressureDiastolic}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Blood Pressure (mmHg)</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{vitalStatus.status}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Overall Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Health Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                {patientData.healthPredictions && patientData.healthPredictions.length > 0 ? (
                  <div className="space-y-3">
                    {patientData.healthPredictions.map((prediction: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Health Risk Assessment</span>
                          <span className="text-sm text-gray-500">
                            {new Date(prediction.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p>Cardiovascular Risk: {prediction.cardiovascularRisk}%</p>
                          <p>Diabetes Risk: {prediction.diabetesRisk}%</p>
                          <p>Overall Health Score: {prediction.overallHealthScore}/100</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No AI health predictions available yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medical Images</CardTitle>
              </CardHeader>
              <CardContent>
                {patientData.medicalImages && patientData.medicalImages.length > 0 ? (
                  <div className="space-y-3">
                    {patientData.medicalImages.map((image: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{image.analysisType.toUpperCase()}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(image.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p>Confidence: {image.confidence}%</p>
                          <p>Findings: {image.findings}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No medical images available.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={20} />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No upcoming appointments scheduled.</p>
                <Button variant="outline">
                  <Phone size={16} className="mr-2" />
                  Contact Healthcare Provider
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}