import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import { loginSchema } from '@shared/schema';
import { Hospital, Loader2 } from 'lucide-react';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      role: 'staff' as const,
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await login(data);
      toast({ title: 'Login successful', description: 'Welcome to MedCare Pro' });
      
      // Redirect based on role
      if (data.role === 'patient') {
        setLocation('/patient-view');
      } else {
        setLocation('/dashboard');
      }
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Hospital className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">MedCare Pro</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Hospital Management System</p>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User ID / Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your credentials"
                        className="h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter password"
                        className="h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="patient">Patient</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs">
              <p>Admin: admin / admin123</p>
              <p>Staff: staff / staff123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
