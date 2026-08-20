'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, Mail, User as UserIcon, Phone, KeyRound, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
  defaultTab?: 'login' | 'register' | 'forgot';
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  defaultTab = 'login',
}: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(defaultTab);
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed.');

      if (data.token && typeof window !== 'undefined') {
        localStorage.setItem('suroor_auth_token', data.token);
      }

      toast.success('Welcome back!', { description: `Logged in as ${data.user.fullName}` });
      if (onSuccess) onSuccess(data.user);
      onClose();
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, phone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed.');

      if (data.token && typeof window !== 'undefined') {
        localStorage.setItem('suroor_auth_token', data.token);
      }

      toast.success('Account created successfully!', { description: 'Welcome to Suroor Villa' });
      if (onSuccess) onSuccess(data.user);
      onClose();
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const [forgotSent, setForgotSent] = useState(false);
  const [resetUrl, setResetUrl] = useState('');

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed.');

      toast.success('Reset link dispatched!', { description: data.message });
      setForgotSent(true);
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch (err: any) {
      toast.error(err.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Credentials Auto-Fill
  const fillDemoAdmin = () => {
    setEmail('admin@suroorvilla.in');
    setPassword('Admin@123456');
    toast.info('Filled Admin credentials');
  };

  const fillDemoGuest = () => {
    setEmail('guest@example.com');
    setPassword('Guest@123456');
    toast.info('Filled Guest credentials');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] bg-card border-border shadow-2xl p-6 rounded-lg">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Lock className="w-5 h-5" />
          </div>
          <DialogTitle className="font-serif text-2xl tracking-wide text-foreground">
            {tab === 'login' && 'Guest & Admin Portal'}
            {tab === 'register' && 'Create Your Account'}
            {tab === 'forgot' && 'Reset Password'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {tab === 'login' && 'Sign in to manage your bookings or access estate controls.'}
            {tab === 'register' && 'Join Suroor Villa for exclusive rates and curated stays.'}
            {tab === 'forgot' && 'Enter your registered email address to receive reset instructions.'}
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex border-b border-border mb-4">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'login'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'register'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Register
          </button>
        </div>

        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="guest@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setTab('forgot')}
                  className="text-xs text-accent hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-2">
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>

            {/* Demo Quick Fills */}
            <div className="pt-3 border-t border-border/60">
              <p className="text-xs text-muted-foreground mb-2 text-center font-medium">Quick Demo Sign In</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fillDemoAdmin}
                  className="text-xs border-accent/40 text-accent hover:bg-accent/10"
                >
                  <Sparkles className="w-3 h-3 mr-1" /> Admin Demo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fillDemoGuest}
                  className="text-xs border-border"
                >
                  Guest Demo
                </Button>
              </div>
            </div>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="reg-name">Full Name</Label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="reg-name"
                  required
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="reg-email">Email Address</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="reg-email"
                  type="email"
                  required
                  placeholder="vikram@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="reg-phone">Phone Number</Label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="reg-phone"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="reg-password">Password (min 6 characters)</Label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="reg-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-2">
              {loading ? 'Creating Account...' : 'Register Account'}
            </Button>
          </form>
        )}

        {tab === 'forgot' && (
          <div className="space-y-4">
            {forgotSent ? (
              <div className="space-y-4 text-center py-2">
                <div className="p-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-md text-sm text-left">
                  <p className="font-semibold">Reset Link Dispatched</p>
                  <p className="text-xs mt-1">
                    If an account is associated with <strong>{email}</strong>, we have sent instructions with a secure reset link valid for 1 hour.
                  </p>
                </div>

                {resetUrl && (
                  <div className="p-3 bg-muted/60 rounded-md text-xs text-left space-y-2">
                    <p className="font-medium text-foreground">Direct Link:</p>
                    <a
                      href={resetUrl}
                      onClick={() => onClose()}
                      className="block text-accent underline break-all font-mono text-[11px]"
                    >
                      {resetUrl}
                    </a>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setForgotSent(false);
                    setTab('login');
                  }}
                  className="w-full"
                >
                  Return to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="fg-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      id="fg-email"
                      type="email"
                      required
                      placeholder="your-email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {loading ? 'Sending...' : 'Send Password Reset Link'}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setForgotSent(false);
                    setTab('login');
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground text-center w-full mt-2"
                >
                  Back to Sign In
                </button>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
