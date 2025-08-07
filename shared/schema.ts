import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'staff', 'admin', 'patient'
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull().unique(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  phone: text("phone").notNull(),
  bloodSugar: real("blood_sugar").notNull(),
  bloodPressureSystolic: integer("blood_pressure_systolic").notNull(),
  bloodPressureDiastolic: integer("blood_pressure_diastolic").notNull(),
  weight: real("weight"),
  height: real("height"),
  medicalHistory: text("medical_history").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
});

export const healthPredictions = pgTable("health_predictions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  cardiovascularRisk: real("cardiovascular_risk").notNull(),
  diabetesRisk: real("diabetes_risk").notNull(),
  overallHealthScore: real("overall_health_score").notNull(),
  predictionData: text("prediction_data").notNull(), // JSON string
  createdAt: timestamp("created_at").defaultNow(),
});

export const medicalImages = pgTable("medical_images", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  filename: text("filename").notNull(),
  analysisType: text("analysis_type").notNull(),
  analysisResult: text("analysis_result").notNull(), // JSON string
  confidence: real("confidence").notNull(),
  findings: text("findings").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  details: text("details").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const healthHistory = pgTable("health_history", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  recordedBy: integer("recorded_by").references(() => users.id).notNull(),
  bloodSugar: real("blood_sugar"),
  bloodPressureSystolic: integer("blood_pressure_systolic"),
  bloodPressureDiastolic: integer("blood_pressure_diastolic"),
  changeType: text("change_type").notNull(), // 'manual_edit', 'ai_prediction', 'initial_record'
  notes: text("notes"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  staffId: integer("staff_id").references(() => users.id).notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  description: text("description"),
  status: text("status").default("scheduled"), // 'scheduled', 'completed', 'cancelled'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
});

export const insertPatientSchema = createInsertSchema(patients).pick({
  name: true,
  age: true,
  phone: true,
  bloodSugar: true,
  bloodPressureSystolic: true,
  bloodPressureDiastolic: true,
  weight: true,
  height: true,
  medicalHistory: true,
});

export const insertHealthPredictionSchema = createInsertSchema(healthPredictions).pick({
  patientId: true,
  cardiovascularRisk: true,
  diabetesRisk: true,
  overallHealthScore: true,
  predictionData: true,
});

export const insertMedicalImageSchema = createInsertSchema(medicalImages).pick({
  patientId: true,
  filename: true,
  analysisType: true,
  analysisResult: true,
  confidence: true,
  findings: true,
});

export const insertHealthHistorySchema = createInsertSchema(healthHistory).pick({
  patientId: true,
  recordedBy: true,
  bloodSugar: true,
  bloodPressureSystolic: true,
  bloodPressureDiastolic: true,
  changeType: true,
  notes: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).pick({
  patientId: true,
  staffId: true,
  appointmentDate: true,
  description: true,
  status: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertHealthPrediction = z.infer<typeof insertHealthPredictionSchema>;
export type HealthPrediction = typeof healthPredictions.$inferSelect;
export type InsertMedicalImage = z.infer<typeof insertMedicalImageSchema>;
export type MedicalImage = typeof medicalImages.$inferSelect;
export type InsertHealthHistory = z.infer<typeof insertHealthHistorySchema>;
export type HealthHistory = typeof healthHistory.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
