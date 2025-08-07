CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"staff_id" integer NOT NULL,
	"appointment_date" timestamp NOT NULL,
	"description" text,
	"status" text DEFAULT 'scheduled',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"details" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"recorded_by" integer NOT NULL,
	"blood_sugar" real,
	"blood_pressure_systolic" integer,
	"blood_pressure_diastolic" integer,
	"change_type" text NOT NULL,
	"notes" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health_predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer,
	"cardiovascular_risk" real NOT NULL,
	"diabetes_risk" real NOT NULL,
	"overall_health_score" real NOT NULL,
	"prediction_data" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "medical_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer,
	"filename" text NOT NULL,
	"analysis_type" text NOT NULL,
	"analysis_result" text NOT NULL,
	"confidence" real NOT NULL,
	"findings" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"name" text NOT NULL,
	"age" integer NOT NULL,
	"phone" text NOT NULL,
	"blood_sugar" real NOT NULL,
	"blood_pressure_systolic" integer NOT NULL,
	"blood_pressure_diastolic" integer NOT NULL,
	"weight" real,
	"height" real,
	"medical_history" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "patients_patient_id_unique" UNIQUE("patient_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_history" ADD CONSTRAINT "health_history_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_history" ADD CONSTRAINT "health_history_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_predictions" ADD CONSTRAINT "health_predictions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_images" ADD CONSTRAINT "medical_images_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;