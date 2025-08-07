import { apiRequest } from "./queryClient";
import { getAuthHeaders } from "./auth";

export interface HealthPredictionInput {
  age: number;
  gender: 'male' | 'female';
  systolicBP: number;
  diastolicBP: number;
  bloodSugar: number;
  bmi: number;
  patientId?: number;
}

export interface HealthPredictionResult {
  cardiovascularRisk: number;
  diabetesRisk: number;
  overallHealthScore: number;
  recommendations: string[];
}

export interface ImageAnalysisInput {
  filename: string;
  analysisType: 'xray' | 'ct' | 'mri' | 'ultrasound';
  patientId?: number;
}

export interface ImageAnalysisResult {
  abnormalityDetected: boolean;
  confidence: number;
  findings: string;
  recommendations: string[];
}

export class AIService {
  static async predictHealthRisk(input: HealthPredictionInput): Promise<HealthPredictionResult> {
    const response = await fetch('/api/ai/health-prediction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error('Failed to predict health risk');
    }

    return await response.json();
  }

  static async analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisResult> {
    const response = await fetch('/api/ai/image-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze image');
    }

    return await response.json();
  }
}
