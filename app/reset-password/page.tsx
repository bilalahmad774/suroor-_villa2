'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { KeyRound, CheckCircle2, AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setTokenValid(false);
      setTokenError('No password reset token provided. Please request a new link.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (res.ok && data.valid) {
          setTokenValid(true);
          setUserEmail(data.email || '');
        } else {
          setTokenValid(false);
          setTokenError(data.error || 'Invalid or expired password reset link.');
        }
      } catch {
        setTokenValid(false);
        setTokenError('Failed to verify password reset token.');
      } finally {
        setValidating(false);
      }
    };

    verify();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken: token,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }

      setSuccess(true);
      toast.success('Password updated successfully!', {
        description: 'You can now sign in with your new credentials.',
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
      <Card className="w-full max-w-md bg-card border-border shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <KeyRound className="w-6 h-6" />
          </div>
          <CardTitle className="font-serif text-2xl tracking-wide">Set New Password</CardTitle>
          <CardDescription>
            {userEmail
              ? `Update the password for ${userEmail}`
              : 'Enter your new secure account password below.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {validating ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Verifying secure token...
            </div>
          ) : tokenValid === false ? (
            <div className="space-y-4 text-center py-4">
              <div className="p-4 bg-destructive/10 text-destructive rounded-md flex items-start gap-3 text-left text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Reset Link Expired or Invalid</p>
                  <p className="mt-1 text-xs text-destructive/90">{tokenError}</p>
                </div>
              </div>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                </Button>
              </Link>
            </div>
          ) : success ? (
            <div className="space-y-6 text-center py-4">
              <div className="p-4 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-md flex items-center gap-3 text-left text-sm">
                <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-semibold">Password Successfully Changed</p>
                  <p className="text-xs mt-0.5">Your account password has been updated securely.</p>
                </div>
              </div>
              <Link href="/">
                <Button className="w-full bg-primary text-primary-foreground">
                  Return to Home & Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-2"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center">Loading...</div>}>
          <ResetPasswordContent />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
