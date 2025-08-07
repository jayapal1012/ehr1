import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getAuthHeaders } from '@/lib/auth';
import { User, Calendar, Phone, Activity } from 'lucide-react';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
}

export function PatientModal({ isOpen, onClose, patientId }: PatientModalProps) {
  const { data: patient, isLoading } = useQuery({
    queryKey: [`/api/patient/${patientId}/data`],
    queryFn: async () => {
      const response = await fetch(`/api/patient/${patientId}/data`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch patient data');
      return response.json();
    },
    enabled: isOpen && !!patientId,
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User size={20} />
            Patient Portal
          </DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View medical records and information
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : patient ? (
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User size={20} />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Patient ID
                    </label>
                    <p className="text-lg font-semibold text-primary">
                      {patient.patientId}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name
                    </label>
                    <p className="text-lg text-gray-900 dark:text-white">
                      {patient.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Age
                    </label>
                    <p className="text-lg text-gray-900 dark:text-white">
                      {patient.age} years
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone Number
                    </label>
                    <p className="text-lg text-gray-900 dark:text-white">
                      {patient.phone}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Current Vitals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity size={20} />
                    Current Vitals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Blood Pressure
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-gray-900 dark:text-white">
                        {patient.bloodPressureSystolic}/{patient.bloodPressureDiastolic} mmHg
                      </span>
                      <Badge variant={
                        patient.bloodPressureSystolic > 140 || patient.bloodPressureDiastolic > 90
                          ? 'destructive'
                          : 'default'
                      }>
                        {patient.bloodPressureSystolic > 140 || patient.bloodPressureDiastolic > 90
                          ? 'High'
                          : 'Normal'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Blood Sugar
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-gray-900 dark:text-white">
                        {patient.bloodSugar} mg/dL
                      </span>
                      <Badge variant={patient.bloodSugar > 140 ? 'destructive' : 'default'}>
                        {patient.bloodSugar > 140 ? 'High' : 'Normal'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Overall Status
                    </label>
                    <div className="mt-1">
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Medical History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar size={20} />
                  Medical History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-800 dark:text-gray-200">
                    {patient.medicalHistory}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Visits */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Visits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Latest Consultation
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Dr. Sarah Johnson
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {patient.updatedAt ? new Date(patient.updatedAt).toLocaleTimeString() : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Patient not found or access denied
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
