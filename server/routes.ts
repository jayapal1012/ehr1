import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateUser } from "./auth";
import { AIHealthPredictor, AIImageAnalyzer } from "./ai-models";
import { 
  loginSchema, 
  insertPatientSchema, 
  insertHealthPredictionSchema,
  insertMedicalImageSchema,
  insertAppointmentSchema
} from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: string;
        name: string;
      };
    }
  }
}


// Simple session middleware
const sessions = new Map<string, any>();

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function requireAuth(req: any, res: any, next: any) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  req.user = sessions.get(sessionId);
  next();
}

function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post('/api/login', async (req, res) => {
    try {
      console.log('Login attempt:', req.body);
      const credentials = loginSchema.parse(req.body);
      console.log('Parsed credentials:', credentials);
      const user = await authenticateUser(credentials);
      console.log('User found:', user);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const sessionId = generateSessionId();
      sessions.set(sessionId, {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      });
      
      res.json({ 
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
        },
        token: sessionId 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: 'Invalid request data' });
    }
  });

  app.post('/api/logout', requireAuth, (req, res) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (sessionId) {
      sessions.delete(sessionId);
    }
    res.json({ message: 'Logged out successfully' });
  });

  app.get('/api/me', requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  // Patient routes
  app.post('/api/patients', requireAuth, requireRole(['staff', 'admin']), async (req, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient({
        patientId: `PT-${Date.now()}`, // or use uuid(), nanoid(), etc.
        ...patientData,
        createdBy: req.user!.id,
      });


      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'CREATE_PATIENT',
        targetType: 'patient',
        targetId: patient.patientId,
        details: `Created patient: ${patient.name}`,
      });

      res.json(patient);
    } catch (error) {
      res.status(400).json({ message: 'Invalid patient data', error });
    }
  });


  app.get('/api/patients', requireAuth, async (req, res) => {
    try {
      let patients;
      if (req.user!.role === 'admin') {
        patients = await storage.getAllPatients();
      } else {
        patients = await storage.getPatientsByCreator(req.user!.id);
      }
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch patients' });
    }
  });

  app.get('/api/patients/search', requireAuth, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: 'Query parameter is required' });
      }
      
      const patients = await storage.searchPatients(query);
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: 'Failed to search patients' });
    }
  });

  // Patient export route
  app.get('/api/patients/export', requireAuth, requireRole(['staff', 'admin']), async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      
      // Helper function to escape CSV fields
      const escapeCsvField = (field: any): string => {
        if (field == null || field === undefined) return '';
        const str = String(field);
        // Escape quotes by doubling them and wrap in quotes if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      
      // Create CSV content with proper escaping
      const csvHeader = 'Patient ID,Name,Age,Phone,Blood Sugar,Systolic BP,Diastolic BP,Medical History,Created Date\n';
      const csvData = patients.map(patient => {
        return [
          escapeCsvField(patient.patientId),
          escapeCsvField(patient.name),
          escapeCsvField(patient.age),
          escapeCsvField(patient.phone),
          escapeCsvField(patient.bloodSugar),
          escapeCsvField(patient.bloodPressureSystolic),
          escapeCsvField(patient.bloodPressureDiastolic),
          escapeCsvField(patient.medicalHistory),
          escapeCsvField(new Date(patient.createdAt).toISOString().split('T')[0])
        ].join(',');
      }).join('\n');
      
      const csvContent = csvHeader + csvData;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=patients_export_${new Date().toISOString().split('T')[0]}.csv`);
      res.send('\uFEFF' + csvContent); // Add BOM for UTF-8 support
    } catch (error) {
      console.error('CSV export error:', error);
      res.status(500).json({ message: 'Failed to export patient data' });
    }
  });

  // Patient PDF export route
  // Patient PDF export route
app.get('/api/patients/:patientId/export-pdf', requireAuth, async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const patient = await storage.getPatientByPatientId(patientId);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get patient health predictions, medical images, and health history
    const healthPredictions = await storage.getHealthPredictionsByPatient(patient.id);
    const medicalImages = await storage.getMedicalImagesByPatient(patient.id);
    const healthHistory = await storage.getHealthHistoryByPatient(patient.id);

    // Create structured data for PDF generation
    const patientData = {
      patientInfo: {
        id: patient.patientId,
        name: patient.name,
        age: patient.age,
        phone: patient.phone,
        weight: patient.weight,
        height: patient.height,
        createdAt: patient.createdAt, // ✅ Use as-is
      },
      vitals: {
        bloodSugar: patient.bloodSugar,
        systolicBP: patient.bloodPressureSystolic,
        diastolicBP: patient.bloodPressureDiastolic,
      },
      medicalHistory: patient.medicalHistory || 'No medical history recorded',
      healthHistory: healthHistory.map(entry => ({
        bloodPressureSystolic: entry.bloodPressureSystolic,
        bloodPressureDiastolic: entry.bloodPressureDiastolic,
        bloodSugar: entry.bloodSugar,
        weight: entry.weight,
        height: entry.height,
        notes: entry.notes,
        recordedAt: entry.timestamp, // ✅ Use DB timestamp as-is
        recordedBy: entry.recordedBy,
      })),
      healthPredictions: healthPredictions.map(pred => ({
        cardiovascularRisk: pred.cardiovascularRisk,
        diabetesRisk: pred.diabetesRisk,
        overallHealthScore: pred.overallHealthScore,
        recommendations: pred.recommendations,
        createdAt: pred.createdAt, // ✅ Use DB timestamp as-is
      })),
      medicalImages: medicalImages.map(img => ({
        filename: img.filename,
        analysisType: img.analysisType,
        findings: img.findings,
        recommendations: img.recommendations,
        createdAt: img.createdAt, // ✅ Use DB timestamp as-is
      })),
      generatedBy: req.user?.name,
      generatedAt: new Date(), // or `new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })` if needed
      };

      res.json(patientData);
    } catch (error) {
      console.error('PDF export error:', error);
      res.status(500).json({ message: 'Failed to export patient PDF' });
    }
  });

  // Patient history route
  app.get('/api/patients/:id/history', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patient = await storage.getPatient(id);
      
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      const healthPredictions = await storage.getHealthPredictionsByPatient(id);
      const medicalImages = await storage.getMedicalImagesByPatient(id);
      const healthHistory = await storage.getHealthHistoryByPatient(id);
      
      res.json({
        patient,
        healthPredictions,
        medicalImages,
        healthHistory,
        vitalsHistory: healthHistory.map(entry => ({
          date: entry.timestamp?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          bloodSugar: entry.bloodSugar,
          systolic: entry.bloodPressureSystolic,
          diastolic: entry.bloodPressureDiastolic,
          changeType: entry.changeType,
          notes: entry.notes
        }))
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch patient history' });
    }
  });

  // Patient data route for patient portal
  app.get('/api/patient/:patientId/data', requireAuth, async (req, res) => {
    try {
      const patientId = req.params.patientId;
      
      // Allow patients to view their own data, staff/admin can view any patient
      if (req.user?.role === 'patient' && req.user?.username !== patientId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const patient = await storage.getPatientByPatientId(patientId);
      
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      const healthPredictions = await storage.getHealthPredictionsByPatient(patient.id);
      const medicalImages = await storage.getMedicalImagesByPatient(patient.id);
      
      res.json({
        ...patient,
        healthPredictions,
        medicalImages,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch patient data' });
    }
  });

  app.get('/api/patients/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patient = await storage.getPatient(id);
      
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      
      // Check permissions
      if (req.user!.role !== 'admin' && patient.createdBy !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch patient' });
    }
  });

  app.get('/api/patient/:patientId/data', requireAuth, async (req, res) => {
    try {
      const patientId = req.params.patientId;
      const patient = await storage.getPatientByPatientId(patientId);
      
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      
      // Check permissions - patients can only view their own data
      if (req.user!.role === 'patient' && patient.patientId !== req.user!.username) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch patient data' });
    }
  });

  app.put('/api/patients/:id', requireAuth, requireRole(['admin', 'staff']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertPatientSchema.partial().parse(req.body);
      
      const patient = await storage.updatePatient(id, updates, req.user!.id);
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'UPDATE_PATIENT',
        targetType: 'patient',
        targetId: patient.patientId,
        details: `Updated patient: ${patient.name}`,
      });
      
      res.json(patient);
    } catch (error) {
      console.error('Patient update error:', error);
      res.status(400).json({ 
        message: 'Invalid update data', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.delete('/api/patients/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patient = await storage.getPatient(id);
      
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      const deleted = await storage.deletePatient(id);
      console.log('Was patient deleted?', deleted);
      
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete patient' });
      }

      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'DELETE_PATIENT',
        targetType: 'patient',
        targetId: patient.patientId,
        details: `Deleted patient: ${patient.name}`,
      });

      res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
      console.error('Error in DELETE /api/patients/:id:', error);
      res.status(500).json({ message: 'Failed to delete patient' });
    }
  });


  // AI routes
  app.post('/api/ai/health-prediction', requireAuth, requireRole(['staff', 'admin']), async (req, res) => {
    try {
      const input = z.object({
        age: z.number(),
        gender: z.enum(['male', 'female']),
        systolicBP: z.number(),
        diastolicBP: z.number(),
        bloodSugar: z.number(),
        bmi: z.number(),
        patientId: z.number().optional(),
      }).parse(req.body);
      
      const prediction = await AIHealthPredictor.predictHealthRisk(input);
      
      // Save prediction if patientId is provided
      if (input.patientId) {
        await storage.createHealthPrediction({
          patientId: input.patientId,
          cardiovascularRisk: prediction.cardiovascularRisk,
          diabetesRisk: prediction.diabetesRisk,
          overallHealthScore: prediction.overallHealthScore,
          predictionData: JSON.stringify({ input, recommendations: prediction.recommendations }),
        });
      }
      
      res.json(prediction);
    } catch (error) {
      console.error('Health prediction error:', error);
      res.status(400).json({ message: 'Invalid prediction data' });
    }
  });

  app.post('/api/ai/image-analysis', requireAuth, requireRole(['staff', 'admin']), async (req, res) => {
    try {
      const input = z.object({
        filename: z.string(),
        analysisType: z.enum(['xray', 'ct', 'mri', 'ultrasound']),
        patientId: z.number().optional(),
      }).parse(req.body);
      
      const analysis = await AIImageAnalyzer.analyzeImage(input.filename, input.analysisType);
      
      // Save analysis if patientId is provided
      if (input.patientId) {
        await storage.createMedicalImage({
          patientId: input.patientId,
          filename: input.filename,
          analysisType: input.analysisType,
          analysisResult: JSON.stringify(analysis),
          confidence: analysis.confidence,
          findings: analysis.findings,
        });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error('Image analysis error:', error);
      res.status(400).json({ message: 'Invalid image analysis data' });
    }
  });

  // Statistics routes
  app.get('/api/stats', requireAuth, async (req, res) => {
    try {
      const stats = await storage.getPatientStats();
      res.json(stats);
    } catch (error) {
      console.error("Stats error:", error);  // <-- log the real error
      res.status(500).json({ message: 'Failed to fetch statistics', error });
    }
  });


  // Admin routes
  app.get('/api/admin/users', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      // Get all users from storage (we'll need to implement this)
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.post('/api/admin/users', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const userData = z.object({
        username: z.string().min(3),
        name: z.string().min(2),
        password: z.string().min(6),
        role: z.enum(['staff', 'admin', 'patient']),
      }).parse(req.body);

      const user = await storage.createUser(userData);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'CREATE_USER',
        targetType: 'user',
        targetId: user.id.toString(),
        details: `Created user: ${user.username} (${user.role})`,
      });

      res.json(user);
    } catch (error) {
      res.status(400).json({ message: 'Failed to create user' });
    }
  });

  app.delete('/api/admin/users/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const deleted = await storage.deleteUser(userId);
      
      if (deleted) {
        await storage.createAuditLog({
          userId: req.user!.id,
          action: 'DELETE_USER',
          targetType: 'user',
          targetId: userId.toString(),
          details: `Deleted user ID: ${userId}`,
        });
        res.json({ message: 'User deleted successfully' });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  app.get('/api/admin/export-system-data', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      const users = await storage.getAllUsers();
      const auditLogs = await storage.getAuditLogs();
      
      const systemData = {
        patients: patients.map(p => ({
          ...p,
          // Remove sensitive data
          createdBy: undefined,
        })),
        users: users.map(u => ({
          id: u.id,
          username: u.username,
          name: u.name,
          role: u.role,
          createdAt: u.createdAt,
        })),
        auditLogs: auditLogs.slice(0, 100), // Last 100 logs
        exportedAt: new Date().toISOString(),
        exportedBy: req.user?.name,
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=system_export_${new Date().toISOString().split('T')[0]}.json`);
      res.json(systemData);
    } catch (error) {
      res.status(500).json({ message: 'Failed to export system data' });
    }
  });

  app.get('/api/admin/audit-logs', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const logs = await storage.getAuditLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });

  // Appointment routes
  app.post('/api/appointments', requireAuth, async (req, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(appointmentData);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'CREATE_APPOINTMENT',
        targetType: 'appointment',
        targetId: appointment.id.toString(),
        details: `Created appointment for ${new Date(appointment.appointmentDate).toLocaleDateString()}`,
      });
      
      res.json(appointment);
    } catch (error) {
      res.status(400).json({ message: 'Invalid appointment data' });
    }
  });

  app.get('/api/appointments', requireAuth, async (req, res) => {
    try {
      let appointments;
      
      if (req.user!.role === 'admin') {
        appointments = await storage.getAllAppointments();
      } else if (req.user!.role === 'staff') {
        appointments = await storage.getAppointmentsByStaff(req.user!.id);
      } else {
        // For patients, find their patient record first
        const patient = await storage.getPatientByPatientId(req.user!.username);
        if (patient) {
          appointments = await storage.getAppointmentsByPatient(patient.id);
        } else {
          appointments = [];
        }
      }
      
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch appointments' });
    }
  });

  app.put('/api/appointments/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertAppointmentSchema.partial().parse(req.body);
      
      const appointment = await storage.updateAppointment(id, updates);
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'UPDATE_APPOINTMENT',
        targetType: 'appointment',
        targetId: appointment.id.toString(),
        details: `Updated appointment`,
      });
      
      res.json(appointment);
    } catch (error) {
      res.status(400).json({ message: 'Invalid appointment data' });
    }
  });

  app.delete('/api/appointments/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAppointment(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'DELETE_APPOINTMENT',
        targetType: 'appointment',
        targetId: id.toString(),
        details: `Deleted appointment`,
      });
      
      res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete appointment' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
