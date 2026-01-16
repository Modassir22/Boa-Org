import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, ArrowRight, Shield } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { adminAuthAPI } from '@/lib/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Set page title for admin login
    document.title = 'Admin Login - Bihar Ophthalmic Association';
    
    // Restore original title when component unmounts
    return () => {
      document.title = 'Bihar Ophthalmic Association';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Use admin auth API
      const response = await adminAuthAPI.login(username, password);
      
      if (!response.success) {
        toast({
          title: 'Login Failed',
          description: response.message || 'Invalid credentials',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Save admin token and data
      localStorage.setItem('adminToken', response.token);
      localStorage.setItem('admin', JSON.stringify(response.admin));
      
      // Show success message
      toast({
        title: 'Admin Login Successful!',
        description: `Welcome back, ${response.admin.full_name || response.admin.username}!`,
      });
      
      // Redirect to admin panel
      setTimeout(() => {
        navigate('/admin');
      }, 500);
      
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Login</h1>
            <p className="text-muted-foreground">
              Access the BOA administration panel
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="username"
                    name="admin-username"
                    type="text"
                    placeholder="Enter admin username"
                    className="pl-10"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    name="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter admin password"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full gradient-primary text-primary-foreground" size="lg" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Admin Sign In'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                <button 
                  onClick={() => navigate('/login')}
                  className="text-primary font-medium hover:underline"
                >
                  User Login
                </button>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Admin access is restricted. Contact super admin for credentials.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
