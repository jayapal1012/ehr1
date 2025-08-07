# MedCare Pro - Hospital Management System

## Overview

MedCare Pro is a comprehensive hospital management system built with a modern full-stack architecture. The system provides medical professionals with tools for patient management, health prediction using AI models, and medical record management. It features role-based access control supporting staff, admin, and patient roles.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based authentication with bcrypt for password hashing
- **API**: RESTful API endpoints

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Located in `shared/schema.ts` for type safety across client and server

## Key Components

### Authentication & Authorization
- Role-based access control (staff, admin, patient)
- Session management with secure token storage
- Protected routes based on user roles
- Authentication provider using React Context

### Patient Management
- Complete patient record management
- Patient search and filtering capabilities
- Medical history tracking
- Vital signs monitoring (blood pressure, blood sugar, BMI)

### AI-Powered Health Tools
- **PyTorch Neural Networks**: Custom trained models for health prediction
- **Health Risk Prediction**: Neural network analyzing cardiovascular and diabetes risk
- **Medical Image Classification**: CNN-based analysis of X-rays, CT scans, MRI, and ultrasound
- **Real-time AI Processing**: Python backend integration with Node.js server
- **Intelligent Recommendations**: ML-generated medical recommendations

### User Interface
- Responsive design with mobile-first approach
- Dark mode support
- Medical-themed color scheme
- Component library using Radix UI primitives
- Accessible UI components following WCAG guidelines

## Data Flow

1. **Authentication Flow**:
   - User submits credentials via login form
   - Server validates against database
   - Session token generated and stored
   - Client receives user data and token
   - Subsequent requests include authentication headers

2. **Patient Management Flow**:
   - Staff/admin creates or searches for patients
   - Patient data validated using Zod schemas
   - Database operations performed through Drizzle ORM
   - Real-time updates via TanStack Query

3. **AI Prediction Flow**:
   - Health parameters collected from patient data
   - AI models process input data
   - Risk scores calculated using rule-based algorithms
   - Recommendations generated and stored
   - Results displayed with confidence indicators

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database operations
- **bcrypt**: Password hashing
- **@tanstack/react-query**: Server state management
- **@hookform/resolvers**: Form validation
- **zod**: Runtime type validation

### UI Components
- **@radix-ui/***: Accessible primitive components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Tools
- **vite**: Build tool and development server
- **tsx**: TypeScript execution
- **esbuild**: Fast bundler for production

## Deployment Strategy

### Development
- Vite development server with HMR
- Express server running on development mode
- Database migrations using Drizzle Kit
- Environment variables for database connection

### Production
- Vite build for optimized frontend bundle
- esbuild for server-side code bundling
- Static file serving through Express
- Database schema management via migration files

### Environment Configuration
- `DATABASE_URL` required for PostgreSQL connection
- Session management using environment-specific settings
- Production-ready error handling and logging


## User Preferences

```
Preferred communication style: Simple, everyday language.
```