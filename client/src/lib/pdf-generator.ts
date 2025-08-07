import jsPDF from 'jspdf';

interface PatientData {
  patientInfo: {
    id: string;
    name: string;
    age: number;
    phone: string;
    weight?: number;
    height?: number;
    createdAt: string;
  };
  vitals: {
    bloodSugar: number;
    systolicBP: number;
    diastolicBP: number;
  };
  medicalHistory: string;
  healthHistory: Array<{
    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    bloodSugar: number;
    weight?: number;
    height?: number;
    notes?: string;
    recordedAt: string;
    recordedBy: number;
  }>;
  healthPredictions: Array<{
    cardiovascularRisk: number;
    diabetesRisk: number;
    overallHealthScore: number;
    recommendations: string[];
    createdAt: string;
  }>;
  medicalImages: Array<{
    filename: string;
    analysisType: string;
    findings: string;
    recommendations: string[];
    createdAt: string;
  }>;
  generatedBy: string;
  generatedAt: string;
}

export async function generatePatientPDF(data: PatientData): Promise<void> {
  const doc = new jsPDF();
  let yPosition = 20;

  // Helper function to add text with proper line breaks
  const addText = (text: string, x: number, y: number, maxWidth: number = 180) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * 5);
  };

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  yPosition = addText('PATIENT MEDICAL REPORT', 20, yPosition);
  yPosition += 10;

  // Patient Information
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  yPosition = addText('Patient Information', 20, yPosition);
  yPosition += 5;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  yPosition = addText(`Patient ID: ${data.patientInfo.id}`, 20, yPosition);
  yPosition = addText(`Name: ${data.patientInfo.name}`, 20, yPosition);
  yPosition = addText(`Age: ${data.patientInfo.age} years`, 20, yPosition);
  yPosition = addText(`Phone: ${data.patientInfo.phone}`, 20, yPosition);
  yPosition = addText(`Patient Since: ${data.patientInfo.createdAt ? new Date(data.patientInfo.createdAt).toLocaleDateString() : 'N/A'}`, 20, yPosition);
  yPosition += 10;

  // Vital Signs
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  yPosition = addText('Current Vital Signs', 20, yPosition);
  yPosition += 5;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  yPosition = addText(`Blood Sugar: ${data.vitals.bloodSugar} mg/dL`, 20, yPosition);
  yPosition = addText(`Blood Pressure: ${data.vitals.systolicBP}/${data.vitals.diastolicBP} mmHg`, 20, yPosition);
  
  // Add BMI if weight and height are available
  if (data.patientInfo.weight && data.patientInfo.height) {
    const bmi = (data.patientInfo.weight / Math.pow(data.patientInfo.height / 100, 2)).toFixed(1);
    const bmiCategory = parseFloat(bmi) > 25 ? 'Overweight' : parseFloat(bmi) < 18.5 ? 'Underweight' : 'Normal';
    yPosition = addText(`BMI: ${bmi} kg/m² (${bmiCategory})`, 20, yPosition);
  }
  
  // Add physical stats
  if (data.patientInfo.weight || data.patientInfo.height) {
    const physicalStats = [];
    if (data.patientInfo.weight) physicalStats.push(`Weight: ${data.patientInfo.weight} kg`);
    if (data.patientInfo.height) physicalStats.push(`Height: ${data.patientInfo.height} cm`);
    yPosition = addText(`Physical Stats: ${physicalStats.join(', ')}`, 20, yPosition);
  }
  
  yPosition += 10;

  // Medical History
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  yPosition = addText('Medical History', 20, yPosition);
  yPosition += 5;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  yPosition = addText(data.medicalHistory, 20, yPosition);
  yPosition += 10;

  // Health History (Vital Signs Over Time)
  if (data.healthHistory && data.healthHistory.length > 0) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('Health History & Vital Signs Timeline', 20, yPosition);
    yPosition += 5;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    yPosition = addText(`Total Records: ${data.healthHistory.length}`, 20, yPosition);
    yPosition += 5;

    data.healthHistory.forEach((record, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      const formatted = record.recordedAt
        ? record.recordedAt.replace('T', ' ').replace('Z', '').split('.')[0]
        : 'N/A';

      yPosition = addText(`Record ${index + 1} - ${formatted}`, 20, yPosition);

      yPosition += 3;

      doc.setFont('helvetica', 'normal');
      yPosition = addText(`Blood Pressure: ${record.bloodPressureSystolic}/${record.bloodPressureDiastolic} mmHg`, 25, yPosition);
      yPosition = addText(`Blood Sugar: ${record.bloodSugar} mg/dL`, 25, yPosition);
      
      if (record.weight) {
        yPosition = addText(`Weight: ${record.weight} kg`, 25, yPosition);
      }
      if (record.height) {
        yPosition = addText(`Height: ${record.height} cm`, 25, yPosition);
      }
      if (record.weight && record.height) {
        const bmi = (record.weight / Math.pow(record.height / 100, 2)).toFixed(1);
        const bmiCategory = parseFloat(bmi) > 25 ? 'Overweight' : parseFloat(bmi) < 18.5 ? 'Underweight' : 'Normal';
        yPosition = addText(`BMI: ${bmi} kg/m² (${bmiCategory})`, 25, yPosition);
      }
      if (record.notes) {
        yPosition = addText(`Notes: ${record.notes}`, 25, yPosition);
      }

      // Health status indicator
      const bpStatus = record.bloodPressureSystolic > 140 || record.bloodPressureDiastolic > 90 ? 'High' : 
                      record.bloodPressureSystolic > 120 || record.bloodPressureDiastolic > 80 ? 'Elevated' : 'Normal';
      const sugarStatus = record.bloodSugar > 200 ? 'High' : record.bloodSugar > 140 ? 'Elevated' : 'Normal';
      
      yPosition = addText(`BP Status: ${bpStatus} | Sugar Status: ${sugarStatus}`, 25, yPosition);
      yPosition += 8;
    });
    yPosition += 10;
  }

  // Health Predictions
  if (data.healthPredictions.length > 0) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('AI Health Analysis', 20, yPosition);
    yPosition += 5;

    data.healthPredictions.forEach((prediction, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      yPosition = addText(`Analysis ${index + 1} - ${prediction.createdAt ? new Date(prediction.createdAt).toLocaleDateString() : 'N/A'}`, 20, yPosition);
      yPosition += 3;

      doc.setFont('helvetica', 'normal');
      yPosition = addText(`Cardiovascular Risk: ${(prediction.cardiovascularRisk * 100).toFixed(1)}%`, 20, yPosition);
      yPosition = addText(`Diabetes Risk: ${(prediction.diabetesRisk * 100).toFixed(1)}%`, 20, yPosition);
      yPosition = addText(`Overall Health Score: ${(prediction.overallHealthScore * 100).toFixed(1)}%`, 20, yPosition);
      
      if (prediction.recommendations && prediction.recommendations.length > 0) {
        yPosition = addText('Recommendations:', 20, yPosition);
        const recommendations = Array.isArray(prediction.recommendations) ? prediction.recommendations : [prediction.recommendations];
        recommendations.forEach(rec => {
          yPosition = addText(`• ${rec}`, 25, yPosition);
        });
      }
      yPosition += 8;
    });
  }

  // Medical Images
  if (data.medicalImages.length > 0) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('Medical Image Analysis', 20, yPosition);
    yPosition += 5;

    data.medicalImages.forEach((image, index) => {
      if (yPosition > 230) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      yPosition = addText(`Image ${index + 1} - ${image.analysisType.toUpperCase()}`, 20, yPosition);
      yPosition += 3;

      doc.setFont('helvetica', 'normal');
      yPosition = addText(`Filename: ${image.filename}`, 20, yPosition);
      yPosition = addText(`Analysis Date: ${image.createdAt ? new Date(image.createdAt).toLocaleDateString() : 'N/A'}`, 20, yPosition);
      yPosition = addText(`Findings: ${image.findings}`, 20, yPosition);
      
      if (image.recommendations && image.recommendations.length > 0) {
        yPosition = addText('Recommendations:', 20, yPosition);
        const recommendations = Array.isArray(image.recommendations) ? image.recommendations : [image.recommendations];
        recommendations.forEach(rec => {
          yPosition = addText(`• ${rec}`, 25, yPosition);
        });
      }
      yPosition += 8;
    });
  }

  // Footer
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  yPosition += 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  yPosition = addText(`Report generated on: ${data.generatedAt ? new Date(data.generatedAt).toLocaleString() : new Date().toLocaleString()}`, 20, yPosition);
  yPosition = addText(`Generated by: ${data.generatedBy}`, 20, yPosition);
  yPosition = addText('MedCare Pro - Hospital Management System', 20, yPosition);

  // Save the PDF
  doc.save(`patient_${data.patientInfo.id}_report.pdf`);
}