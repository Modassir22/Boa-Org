import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api';

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'membership'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [membershipNo, setMembershipNo] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let response;

      if (loginMethod === 'email') {
        response = await authAPI.login(email, password);
      } else {
        response = await authAPI.loginWithMembership(membershipNo, password);
      }

      // Check if user is admin - redirect to admin login
      if (response.user.role === 'admin') {
        toast({
          title: 'Admin Account Detected',
          description: 'Please use admin login page.',
          variant: 'destructive',
        });
        setTimeout(() => {
          navigate('/admin-login');
        }, 1000);
        setIsLoading(false);
        return;
      }

      // Save token
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Show success message
      toast({
        title: 'Login Successful!',
        description: `Welcome back, ${response.user.first_name}!`,
      });

      // Reload and redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
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
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 px-4" style={{ background: '#F9FAFB', transform: 'translateZ(0)', backfaceVisibility: 'hidden', opacity: 1, visibility: 'visible' }}>
        <div className="w-full max-w-4xl" style={{ transform: 'translateZ(0)', opacity: 1, visibility: 'visible' }}>
          {/* Single Card Container */}
          <div className="gov-card overflow-hidden" style={{ transform: 'translateZ(0)', opacity: 1, visibility: 'visible' }}>
            <div className="grid lg:grid-cols-2" style={{ transform: 'translateZ(0)', opacity: 1, visibility: 'visible' }}>
              {/* Left Side - Image & Info */}
              <div className="hidden lg:block p-6 relative" style={{ background: 'linear-gradient(135deg, #0B3C5D 0%, #0A2540 100%)' }}>
                <div className="h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-semibold mb-2 text-white">
                        Ophthalmic Association Of Bihar
                      </h2>
                      <p className="text-sm text-white/80">
                        Advancing eye care excellence through education, research, and collaboration since 2021
                      </p>
                    </div>

                    {/* Medical Image */}
                    <div className="rounded-lg overflow-hidden border-2" style={{ borderColor: '#C9A227' }}>
                      <img
                        src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80"
                        alt="Medical Conference"
                        className="w-full h-36 object-cover"
                      />
                    </div>

                    {/* Features */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201, 162, 39, 0.2)' }}>
                          <svg className="w-4 h-4" style={{ color: '#C9A227' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-sm mb-0.5 text-white">Access CME Programs</h3>
                          <p className="text-xs text-white/70">Earn credits through certified continuing medical education</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(46, 125, 50, 0.2)' }}>
                          <svg className="w-4 h-4" style={{ color: '#2E7D32' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-sm mb-0.5 text-white">Network with Peers</h3>
                          <p className="text-xs text-white/70">Connect with ophthalmologists across Bihar</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201, 162, 39, 0.2)' }}>
                          <svg className="w-4 h-4" style={{ color: '#C9A227' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-sm mb-0.5 text-white">Register for Events</h3>
                          <p className="text-xs text-white/70">Easy registration for seminars and conferences</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Element */}
                  <div className="absolute bottom-0 right-0 w-24 h-24 opacity-10">
                    <svg viewBox="0 0 100 100" fill="currentColor" className="text-white">
                      <circle cx="50" cy="50" r="40" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Right Side - Login Form */}
              <div className="p-6 lg:p-8" style={{ minHeight: '500px', transform: 'translateZ(0)', backfaceVisibility: 'hidden', opacity: 1, visibility: 'visible' }}>
                <div className="text-center mb-6" style={{ transform: 'translateZ(0)', opacity: 1, visibility: 'visible' }}>
                  <h1 className="text-2xl font-semibold mb-1" style={{ color: '#1F2933', opacity: 1, visibility: 'visible' }}>Welcome Back</h1>
                  <p className="text-sm" style={{ color: '#616E7C', opacity: 1, visibility: 'visible' }}>
                    Sign in to access your BOA account
                  </p>
                </div>

                <Tabs defaultValue="email" className="mb-5" onValueChange={(v) => setLoginMethod(v as 'email' | 'membership')} style={{ transform: 'translateZ(0)', opacity: 1, visibility: 'visible' }}>
                  <TabsList className="grid w-full grid-cols-2" style={{ opacity: 1, visibility: 'visible' }}>
                    <TabsTrigger value="email" style={{ opacity: 1, visibility: 'visible' }}>Email</TabsTrigger>
                    <TabsTrigger value="membership" style={{ opacity: 1, visibility: 'visible' }}>Membership No.</TabsTrigger>
                  </TabsList>
                </Tabs>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden', opacity: 1, visibility: 'visible' }}>
                  <div className="space-y-1.5" style={{ minHeight: '80px', transform: 'translateZ(0)', opacity: 1, visibility: 'visible' }}>
                    <Label htmlFor="identifier" className="text-sm" style={{ opacity: 1, visibility: 'visible' }}>
                      {loginMethod === 'email' ? 'Email Address' : 'Membership Number'}
                    </Label>
                    <div className="relative" style={{ transform: 'translateZ(0)', opacity: 1, visibility: 'visible' }}>
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#616E7C', opacity: 1, visibility: 'visible' }} />
                      <Input
                        id="identifier"
                        type={loginMethod === 'email' ? 'email' : 'text'}
                        placeholder={loginMethod === 'email' ? 'your@email.com' : 'BOA-XXXX-XXXX'}
                        className="pl-9 h-10"
                        style={{ transition: 'none', animation: 'none', transform: 'translateZ(0)', opacity: 1, visibility: 'visible' }}
                        value={loginMethod === 'email' ? email : membershipNo}
                        onChange={(e) => loginMethod === 'email' ? setEmail(e.target.value) : setMembershipNo(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5" style={{ minHeight: '80px', transform: 'translateZ(0)', opacity: 1, visibility: 'visible' }}>
                    <div className="flex items-center justify-between" style={{ opacity: 1, visibility: 'visible' }}>
                      <Label htmlFor="password" className="text-sm" style={{ opacity: 1, visibility: 'visible' }}>Password</Label>
                      <Link to="/forgot-password" className="text-xs hover:underline" style={{ color: '#0B3C5D', opacity: 1, visibility: 'visible' }}>
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative" style={{ transform: 'translateZ(0)', opacity: 1, visibility: 'visible' }}>
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#616E7C', opacity: 1, visibility: 'visible' }} />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className="pl-9 pr-10 h-10"
                        style={{ transition: 'none', animation: 'none', transform: 'translateZ(0)', opacity: 1, visibility: 'visible' }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: '#616E7C', opacity: 1, visibility: 'visible' }}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full gov-button-primary h-10" disabled={isLoading} style={{ transform: 'translateZ(0)', opacity: 1, visibility: 'visible' }}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>

                <div className="mt-5 text-center">
                  <p className="text-sm" style={{ color: '#616E7C' }}>
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium hover:underline" style={{ color: '#0B3C5D' }}>
                      Register here
                    </Link>
                  </p>
                </div>

                {/* Mobile - Show BOA Info */}
                <div className="lg:hidden mt-6 pt-6 border-t" style={{ borderColor: '#E5E7EB' }}>
                  <p className="text-center text-xs" style={{ color: '#616E7C' }}>
                    Advancing eye care excellence since 2021
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
