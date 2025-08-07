import { 
  users, 
  patients, 
  healthPredictions, 
  medicalImages, 
  auditLogs,
  healthHistory,
  appointments,
  type User, 
  type InsertUser,
  type Patient,
  type InsertPatient,
  type HealthPrediction,
  type InsertHealthPrediction,
  type MedicalImage,
  type InsertMedicalImage,
  type AuditLog,
  type HealthHistory,
  type InsertHealthHistory,
  type Appointment,
  type InsertAppointment
} from "@shared/schema";
import { eq, and, or, like, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Patient methods
  getPatient(id: number): Promise<Patient | undefined>;
  getPatientByPatientId(patientId: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient & { createdBy: number }): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: number): Promise<boolean>;
  searchPatients(query: string): Promise<Patient[]>;
  getAllPatients(): Promise<Patient[]>;
  getPatientsByCreator(createdBy: number): Promise<Patient[]>;
  
  // Health prediction methods
  createHealthPrediction(prediction: InsertHealthPrediction): Promise<HealthPrediction>;
  getHealthPredictionsByPatient(patientId: number): Promise<HealthPrediction[]>;
  
  // Medical image methods
  createMedicalImage(image: InsertMedicalImage): Promise<MedicalImage>;
  getMedicalImagesByPatient(patientId: number): Promise<MedicalImage[]>;
  
  // Health history methods
  createHealthHistory(history: InsertHealthHistory): Promise<HealthHistory>;
  getHealthHistoryByPatient(patientId: number): Promise<HealthHistory[]>;
  
  // Appointment methods
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointmentsByPatient(patientId: number): Promise<Appointment[]>;
  getAppointmentsByStaff(staffId: number): Promise<Appointment[]>;
  getAllAppointments(): Promise<Appointment[]>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  
  // Audit log methods
  createAuditLog(log: { userId: number; action: string; targetType: string; targetId: string; details: string }): Promise<AuditLog>;
  getAuditLogs(): Promise<AuditLog[]>;
  
  // Statistics
  getPatientStats(): Promise<{
    totalPatients: number;
    newAdmissions: number;
    criticalCases: number;
    aiPredictions: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private healthPredictions: Map<number, HealthPrediction>;
  private medicalImages: Map<number, MedicalImage>;
  private auditLogs: Map<number, AuditLog>;
  private healthHistories: Map<number, HealthHistory>;
  private appointments: Map<number, Appointment>;
  private currentUserId: number;
  private currentPatientId: number;
  private currentHealthPredictionId: number;
  private currentMedicalImageId: number;
  private currentAuditLogId: number;
  private currentHealthHistoryId: number;
  private currentAppointmentId: number;
  private patientIdCounter: number;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.healthPredictions = new Map();
    this.medicalImages = new Map();
    this.auditLogs = new Map();
    this.healthHistories = new Map();
    this.appointments = new Map();
    this.currentUserId = 1;
    this.currentPatientId = 1;
    this.currentHealthPredictionId = 1;
    this.currentMedicalImageId = 1;
    this.currentAuditLogId = 1;
    this.currentHealthHistoryId = 1;
    this.currentAppointmentId = 1;
    this.patientIdCounter = 1;
    
    // Initialize with demo data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default admin user
    const adminUser: User = {
      id: this.currentUserId++,
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'System Administrator',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
    this.users.set(adminUser.id, adminUser);

    // Create default staff user
    const staffUser: User = {
      id: this.currentUserId++,
      username: 'staff',
      password: 'staff123',
      role: 'staff',
      name: 'Dr. Sarah Johnson',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
    this.users.set(staffUser.id, staffUser);

    // Create sample patients
    const patient1: Patient = {
      id: this.currentPatientId++,
      patientId: 'PT-2024-001',
      name: 'John Smith',
      age: 45,
      phone: '+1-555-0123',
      bloodSugar: 120,
      bloodPressureSystolic: 130,
      bloodPressureDiastolic: 85,
      weight: 80.5,
      height: 175,
      medicalHistory: 'Hypertension, Type 2 diabetes managed with medication',
      createdBy: adminUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
    this.patients.set(patient1.id, patient1);

    const patient2: Patient = {
      id: this.currentPatientId++,
      patientId: 'PT-2024-002',
      name: 'Mary Johnson',
      age: 62,
      phone: '+1-555-0456',
      bloodSugar: 95,
      bloodPressureSystolic: 125,
      bloodPressureDiastolic: 80,
      weight: 65.2,
      height: 160,
      medicalHistory: 'Regular checkups, no major health issues',
      createdBy: staffUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
    this.patients.set(patient2.id, patient2);

    const patient3: Patient = {
      id: this.currentPatientId++,
      patientId: 'PT-2024-003',
      name: 'Robert Davis',
      age: 38,
      phone: '+1-555-0789',
      bloodSugar: 180,
      bloodPressureSystolic: 150,
      bloodPressureDiastolic: 95,
      weight: 95.0,
      height: 180,
      medicalHistory: 'Recently diagnosed with diabetes, high blood pressure',
      createdBy: staffUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
    this.patients.set(patient3.id, patient3);

    // Create patient user for patient portal
    const patientUser: User = {
      id: this.currentUserId++,
      username: 'PT-2024-001',
      password: 'patient123',
      role: 'patient',
      name: 'John Smith',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
    this.users.set(patientUser.id, patientUser);

    // Create sample health prediction
    const healthPrediction: HealthPrediction = {
      id: this.currentHealthPredictionId++,
      patientId: patient1.id,
      cardiovascularRisk: 15.5,
      diabetesRisk: 8.2,
      overallHealthScore: 72,
      predictionData: JSON.stringify({
        recommendations: [
          'Regular exercise 3-4 times per week',
          'Monitor blood sugar levels daily',
          'Maintain healthy diet with reduced sugar intake'
        ]
      }),
      createdAt: new Date(),
    };
    this.healthPredictions.set(healthPrediction.id, healthPrediction);

    // Create sample health history for each patient
    const createHealthHistoryEntry = (patientId: number, daysAgo: number, bloodSugar: number, systolic: number, diastolic: number) => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      const history: HealthHistory = {
        id: this.currentHealthHistoryId++,
        patientId,
        recordedBy: staffUser.id,
        timestamp: date,
        bloodSugar,
        bloodPressureSystolic: systolic,
        bloodPressureDiastolic: diastolic,
        changeType: 'routine_checkup',
        notes: `Routine checkup - ${date.toDateString()}`
      };
      this.healthHistories.set(history.id, history);
    };

    // John Smith (PT-2024-001) - gradually improving health
    createHealthHistoryEntry(patient1.id, 150, 140, 140, 90);
    createHealthHistoryEntry(patient1.id, 120, 135, 138, 88);
    createHealthHistoryEntry(patient1.id, 90, 130, 135, 87);
    createHealthHistoryEntry(patient1.id, 60, 125, 132, 86);
    createHealthHistoryEntry(patient1.id, 30, 122, 130, 85);
    createHealthHistoryEntry(patient1.id, 0, 120, 130, 85); // Current values

    // Mary Johnson (PT-2024-002) - stable good health
    createHealthHistoryEntry(patient2.id, 150, 100, 128, 82);
    createHealthHistoryEntry(patient2.id, 120, 98, 127, 81);
    createHealthHistoryEntry(patient2.id, 90, 96, 126, 80);
    createHealthHistoryEntry(patient2.id, 60, 95, 125, 80);
    createHealthHistoryEntry(patient2.id, 30, 95, 125, 80);
    createHealthHistoryEntry(patient2.id, 0, 95, 125, 80); // Current values

    // Robert Davis (PT-2024-003) - concerning trend, needs attention
    createHealthHistoryEntry(patient3.id, 150, 160, 135, 85);
    createHealthHistoryEntry(patient3.id, 120, 165, 140, 88);
    createHealthHistoryEntry(patient3.id, 90, 170, 145, 90);
    createHealthHistoryEntry(patient3.id, 60, 175, 148, 93);
    createHealthHistoryEntry(patient3.id, 30, 178, 150, 94);
    createHealthHistoryEntry(patient3.id, 0, 180, 150, 95); // Current values

    this.patientIdCounter = 4;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(patient => patient.patientId === patientId);
  }

  async createPatient(insertPatient: InsertPatient & { createdBy: number }): Promise<Patient> {
    const id = this.currentPatientId++;
    const patientId = `PT-2024-${String(this.patientIdCounter++).padStart(3, '0')}`;
    const patient: Patient = {
      ...insertPatient,
      id,
      patientId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: number, updates: Partial<InsertPatient>, recordedBy?: number): Promise<Patient | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;
    
    const updatedPatient = { ...patient, ...updates, updatedAt: new Date() };
    this.patients.set(id, updatedPatient);
    
    // Create health history record if vital signs are updated
    if (recordedBy && (updates.bloodSugar || updates.bloodPressureSystolic || updates.bloodPressureDiastolic)) {
      await this.createHealthHistory({
        patientId: id,
        recordedBy,
        bloodSugar: updates.bloodSugar || patient.bloodSugar,
        bloodPressureSystolic: updates.bloodPressureSystolic || patient.bloodPressureSystolic,
        bloodPressureDiastolic: updates.bloodPressureDiastolic || patient.bloodPressureDiastolic,
        changeType: 'manual_edit',
        notes: 'Patient record updated by staff'
      });
    }
    
    return updatedPatient;
  }

  async deletePatient(id: number): Promise<boolean> {
    return this.patients.delete(id);
  }

  async searchPatients(query: string): Promise<Patient[]> {
    const searchQuery = query.toLowerCase();
    return Array.from(this.patients.values()).filter(patient =>
      patient.name.toLowerCase().includes(searchQuery) ||
      patient.patientId.toLowerCase().includes(searchQuery)
    );
  }

  async getAllPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async getPatientsByCreator(createdBy: number): Promise<Patient[]> {
    return Array.from(this.patients.values()).filter(patient => patient.createdBy === createdBy);
  }

  async createHealthPrediction(insertPrediction: InsertHealthPrediction): Promise<HealthPrediction> {
    const id = this.currentHealthPredictionId++;
    const prediction: HealthPrediction = {
      ...insertPrediction,
      id,
      createdAt: new Date(),
    };
    this.healthPredictions.set(id, prediction);
    return prediction;
  }

  async getHealthPredictionsByPatient(patientId: number): Promise<HealthPrediction[]> {
    return Array.from(this.healthPredictions.values()).filter(pred => pred.patientId === patientId);
  }

  async createMedicalImage(insertImage: InsertMedicalImage): Promise<MedicalImage> {
    const id = this.currentMedicalImageId++;
    const image: MedicalImage = {
      ...insertImage,
      id,
      createdAt: new Date(),
    };
    this.medicalImages.set(id, image);
    return image;
  }

  async getMedicalImagesByPatient(patientId: number): Promise<MedicalImage[]> {
    return Array.from(this.medicalImages.values()).filter(img => img.patientId === patientId);
  }

  async createAuditLog(logData: { userId: number; action: string; targetType: string; targetId: string; details: string }): Promise<AuditLog> {
    const id = this.currentAuditLogId++;
    const log: AuditLog = {
      ...logData,
      id,
      createdAt: new Date(),
    };
    this.auditLogs.set(id, log);
    return log;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values()).sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getPatientStats(): Promise<{
    totalPatients: number;
    newAdmissions: number;
    criticalCases: number;
    aiPredictions: number;
  }> {
    const totalPatients = this.patients.size;
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    const newAdmissions = Array.from(this.patients.values()).filter(
      patient => patient.createdAt && patient.createdAt > yesterday
    ).length;
    
    const criticalCases = Array.from(this.patients.values()).filter(
      patient => patient.bloodPressureSystolic > 140 || patient.bloodSugar > 200
    ).length;
    
    const aiPredictions = this.healthPredictions.size;
    
    return {
      totalPatients,
      newAdmissions,
      criticalCases,
      aiPredictions,
    };
  }

  // Health History methods
  async createHealthHistory(insertHistory: InsertHealthHistory): Promise<HealthHistory> {
    const id = this.currentHealthHistoryId++;
    const history: HealthHistory = {
      ...insertHistory,
      id,
      timestamp: new Date(),
    };
    this.healthHistories.set(id, history);
    return history;
  }

  async getHealthHistoryByPatient(patientId: number): Promise<HealthHistory[]> {
    return Array.from(this.healthHistories.values())
      .filter(history => history.patientId === patientId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  // Appointment methods
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    const appointment: Appointment = {
      ...insertAppointment,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async getAppointmentsByPatient(patientId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(appointment => appointment.patientId === patientId)
      .sort((a, b) => (b.appointmentDate?.getTime() || 0) - (a.appointmentDate?.getTime() || 0));
  }

  async getAppointmentsByStaff(staffId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(appointment => appointment.staffId === staffId)
      .sort((a, b) => (b.appointmentDate?.getTime() || 0) - (a.appointmentDate?.getTime() || 0));
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .sort((a, b) => (b.appointmentDate?.getTime() || 0) - (a.appointmentDate?.getTime() || 0));
  }

  async updateAppointment(id: number, updates: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const updatedAppointment = { ...appointment, ...updates, updatedAt: new Date() };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }
}

// Switch back to in-memory storage for SQLite compatibility
import { DatabaseStorage } from './database-storage';

export const storage = new DatabaseStorage();
