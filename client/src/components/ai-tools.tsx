import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { AIService } from '@/lib/ai-service';
import { TrendingUp, X as XIcon, Brain, Upload, Eye } from 'lucide-react';

const healthPredictionSchema = z.object({
  age: z.number().min(1).max(150),
  gender: z.enum(['male', 'female']),
  systolicBP: z.number().min(60).max(300),
  diastolicBP: z.number().min(40).max(200),
  bloodSugar: z.number().min(50).max(500),
  bmi: z.number().min(10).max(50),
});

const imageAnalysisSchema = z.object({
  filename: z.string().min(1),
  analysisType: z.enum(['xray', 'ct', 'mri', 'ultrasound']),
});

export function AITools() {
  const [healthPrediction, setHealthPrediction] = useState<any>(null);
  const [imageAnalysis, setImageAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const healthForm = useForm({
    resolver: zodResolver(healthPredictionSchema),
    defaultValues: {
      age: 35,
      gender: 'male' as const,
      systolicBP: 120,
      diastolicBP: 80,
      bloodSugar: 95,
      bmi: 24.5,
    },
  });

  const imageForm = useForm({
    resolver: zodResolver(imageAnalysisSchema),
    defaultValues: {
      filename: '',
      analysisType: 'xray' as const,
    },
  });

  const onHealthSubmit = async (data: any) => {
    setIsAnalyzing(true);
    try {
      const result = await AIService.predictHealthRisk(data);
      setHealthPrediction(result);
      toast({ title: 'Health prediction completed' });
    } catch (error) {
      toast({ title: 'Prediction failed', description: 'Please try again', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onImageSubmit = async (data: any) => {
    if (!selectedFile) {
      toast({ title: 'Please select a file', variant: 'destructive' });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await AIService.analyzeImage({
        filename: selectedFile.name,
        analysisType: data.analysisType,
      });
      setImageAnalysis(result);
      toast({ title: 'Image analysis completed' });
    } catch (error) {
      toast({ title: 'Analysis failed', description: 'Please try again', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      imageForm.setValue('filename', file.name);
    }
  };

  const getRiskBadgeVariant = (risk: number) => {
    if (risk < 30) return 'default';
    if (risk < 60) return 'secondary';
    return 'destructive';
  };

  const getRiskLabel = (risk: number) => {
    if (risk < 30) return 'Low';
    if (risk < 60) return 'Medium';
    return 'High';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Health Prediction Model */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={20} className="text-orange-500" />
            Health Prediction Model
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AI-powered health risk analysis
          </p>
        </CardHeader>
        <CardContent>
          <Form {...healthForm}>
            <form onSubmit={healthForm.handleSubmit(onHealthSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={healthForm.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={healthForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={healthForm.control}
                  name="systolicBP"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Systolic BP</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={healthForm.control}
                  name="diastolicBP"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diastolic BP</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={healthForm.control}
                  name="bloodSugar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Sugar (mg/dL)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={healthForm.control}
                  name="bmi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>BMI</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isAnalyzing}
              >
                <Brain size={16} className="mr-2" />
                {isAnalyzing ? 'Analyzing...' : 'Analyze Health Risk'}
              </Button>
            </form>
          </Form>

          {/* Health Prediction Results */}
          {healthPrediction && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                AI Prediction Results
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Cardiovascular Risk
                  </span>
                  <Badge variant={getRiskBadgeVariant(healthPrediction.cardiovascularRisk)}>
                    {getRiskLabel(healthPrediction.cardiovascularRisk)} ({healthPrediction.cardiovascularRisk.toFixed(0)}%)
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Diabetes Risk
                  </span>
                  <Badge variant={getRiskBadgeVariant(healthPrediction.diabetesRisk)}>
                    {getRiskLabel(healthPrediction.diabetesRisk)} ({healthPrediction.diabetesRisk.toFixed(0)}%)
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Overall Health Score
                  </span>
                  <Badge variant="outline">
                    {healthPrediction.overallHealthScore.toFixed(0)}/100
                  </Badge>
                </div>
                {healthPrediction.recommendations && healthPrediction.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                      Recommendations:
                    </h5>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      {healthPrediction.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Image Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XIcon size={20} className="text-primary" />
            Medical Image Analysis
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AI-powered medical image classification
          </p>
        </CardHeader>
        <CardContent>
          <Form {...imageForm}>
            <form onSubmit={imageForm.handleSubmit(onImageSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Upload Medical Image</Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <Upload size={32} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Drag and drop your medical image here, or
                  </p>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Choose File
                  </Button>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Supported formats: JPG, PNG, DICOM
                  </p>
                  {selectedFile && (
                    <p className="text-sm text-primary mt-2">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>

              <FormField
                control={imageForm.control}
                name="analysisType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Analysis Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="xray">X-Ray Analysis</SelectItem>
                        <SelectItem value="ct">CT Scan Analysis</SelectItem>
                        <SelectItem value="mri">MRI Analysis</SelectItem>
                        <SelectItem value="ultrasound">Ultrasound Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isAnalyzing || !selectedFile}
              >
                <Eye size={16} className="mr-2" />
                {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
              </Button>
            </form>
          </Form>

          {/* Image Analysis Results */}
          {imageAnalysis && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                AI Analysis Results
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Abnormality Detection
                  </span>
                  <Badge variant={imageAnalysis.abnormalityDetected ? 'destructive' : 'default'}>
                    {imageAnalysis.abnormalityDetected ? 'Abnormal' : 'Normal'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Confidence Score
                  </span>
                  <Badge variant="outline">
                    {(imageAnalysis.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    Findings:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {imageAnalysis.findings}
                  </p>
                </div>
                {imageAnalysis.recommendations && imageAnalysis.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                      Recommendations:
                    </h5>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      {imageAnalysis.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
