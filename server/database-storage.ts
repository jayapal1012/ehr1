import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import 'dotenv/config';

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
import { eq, and, or, like, desc, count, gte } from "drizzle-orm";
import { IStorage } from "./storage";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
export const db = drizzle(pool);

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Patient methods
  async getPatient(id: number): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.id, id));
    return result[0];
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.patientId, patientId));
    return result[0];
  }

  async createPatient(patient: InsertPatient & { createdBy: number }): Promise<Patient> {
    const result = await db.insert(patients).values(patient).returning();
    
    // Create initial health history entry
      await this.createHealthHistory({
        patientId: result[0].id,
        bloodPressureSystolic: patient.bloodPressureSystolic,
        bloodPressureDiastolic: patient.bloodPressureDiastolic,
        bloodSugar: patient.bloodSugar,
        weight: patient.weight,
        height: patient.height,
        recordedBy: patient.createdBy,
        notes: "Initial patient record",
        changeType: "initial_record" // ✅ Required field
      });


    return result[0];
  }

  async updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined> {
    const existingPatient = await this.getPatient(id);
    if (!existingPatient) return undefined;

    const result = await db.update(patients).set(patient).where(eq(patients.id, id)).returning();
    
    // Create health history entry for the update
    if (patient.bloodPressureSystolic || patient.bloodPressureDiastolic || patient.bloodSugar || patient.weight || patient.height) {
      await this.createHealthHistory({
        patientId: id,
        bloodPressureSystolic: patient.bloodPressureSystolic || existingPatient.bloodPressureSystolic,
        bloodPressureDiastolic: patient.bloodPressureDiastolic || existingPatient.bloodPressureDiastolic,
        bloodSugar: patient.bloodSugar || existingPatient.bloodSugar,
        weight: patient.weight || existingPatient.weight,
        height: patient.height || existingPatient.height,
        recordedBy: 1, // TODO: Get from current user context
        notes: "Patient record updated",
        changeType: "manual_edit" // ✅ Required field
      });
    }

    return result[0];
  }

  async deletePatient(id: number): Promise<boolean> {
    try {
      // Delete related health history first
      await db.delete(healthHistory).where(eq(healthHistory.patientId, id));

      // Then delete patient
      const result = await db.delete(patients).where(eq(patients.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error in deletePatient:', error);
      throw error;
    }
  }



  async searchPatients(query: string): Promise<Patient[]> {
    return await db.select().from(patients).where(
      or(
        like(patients.name, `%${query}%`),
        like(patients.patientId, `%${query}%`),
        like(patients.phone, `%${query}%`)
      )
    );
  }

  async getAllPatients(): Promise<Patient[]> {
    return await db.select().from(patients).orderBy(desc(patients.createdAt));
  }

  async getPatientsByCreator(createdBy: number): Promise<Patient[]> {
    return await db.select().from(patients).where(eq(patients.createdBy, createdBy));
  }

  // Health prediction methods
  async createHealthPrediction(prediction: InsertHealthPrediction): Promise<HealthPrediction> {
    const result = await db.insert(healthPredictions).values(prediction).returning();
    return result[0];
  }

  async getHealthPredictionsByPatient(patientId: number): Promise<HealthPrediction[]> {
    return await db.select().from(healthPredictions).where(eq(healthPredictions.patientId, patientId));
  }

  // Medical image methods
  async createMedicalImage(image: InsertMedicalImage): Promise<MedicalImage> {
    const result = await db.insert(medicalImages).values(image).returning();
    return result[0];
  }

  async getMedicalImagesByPatient(patientId: number): Promise<MedicalImage[]> {
    return await db.select().from(medicalImages).where(eq(medicalImages.patientId, patientId));
  }

  // Health history methods
  async createHealthHistory(history: InsertHealthHistory): Promise<HealthHistory> {
    const result = await db.insert(healthHistory).values(history).returning();
    return result[0];
  }

  async getHealthHistoryByPatient(patientId: number): Promise<HealthHistory[]> {
    return await db.select().from(healthHistory)
      .where(eq(healthHistory.patientId, patientId))
      //.orderBy(desc(healthHistory.timestamp)); // Fix: use correct field
  }


  // Appointment methods
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const result = await db.insert(appointments).values(appointment).returning();
    return result[0];
  }

  async getAppointmentsByPatient(patientId: number): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.patientId, patientId));
  }

  async getAppointmentsByStaff(staffId: number): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.staffId, staffId));
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments).orderBy(desc(appointments.appointmentDate));
  }

  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const result = await db.update(appointments).set(appointment).where(eq(appointments.id, id)).returning();
    return result[0];
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const result = await db.delete(appointments).where(eq(appointments.id, id));
    return result.rowCount > 0;
  }

  // Audit log methods
  async createAuditLog(log: { userId: number; action: string; targetType: string; targetId: string; details: string }): Promise<AuditLog> {
    const result = await db.insert(auditLogs).values(log).returning();
    return result[0];
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
  }

  // Statistics
    async getPatientStats(): Promise<{
    totalPatients: number;
    newAdmissions: number;
    criticalCases: number;
    aiPredictions: number;
  }> {
    const totalPatients = await db.select({ count: count() }).from(patients);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newAdmissions = await db
      .select({ count: count() })
      .from(patients)
      .where(gte(patients.createdAt, today));

    const aiPredictions = await db
      .select({ count: count() })
      .from(healthPredictions);

    const criticalCases = await db
      .select({ count: count() })
      .from(patients)
      .where(
        or(
          gte(patients.bloodPressureSystolic, 140),
          gte(patients.bloodSugar, 200)
        )
      );

    return {
      totalPatients: totalPatients[0].count,
      newAdmissions: newAdmissions[0].count,
      criticalCases: criticalCases[0].count,
      aiPredictions: aiPredictions[0].count,
    };
  }
}