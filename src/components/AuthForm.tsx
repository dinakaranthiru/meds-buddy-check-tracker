// src/components/AuthForm.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth'; // We'll still use this in App.tsx for top-level auth check
import { useNavigate } from 'react-router-dom';

interface AuthFormProps {
  // This prop will be called after successful authentication, if needed by a parent.
  // For this flow, we'll mostly rely on the useAuth hook to trigger navigation.
  onAuthSuccess?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true); // true for login, false for signup
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const { user, loading: authHookLoading } = useAuth(); // Monitor global auth state
  const navigate = useNavigate();

  // Redirect authenticated users
  useEffect(() => {
    if (user && !authHookLoading) {
      // User is authenticated. Now, check if their role is set.
      // For now, we'll navigate to the onboarding page to choose a role.
      // Later, App.tsx will manage this more intelligently based on a 'profiles' table.
      navigate('/onboarding-role-select'); // A new route for role selection
    }
  }, [user, authHookLoading, navigate]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    // Basic client-side validation
    if (!email || !password) {
      setAuthError('Email and password are required.');
      setAuthLoading(false);
      return;
    }
    if (password.length < 6 && !isLoginMode) { // Supabase default min password length for signup
      setAuthError('Password must be at least 6 characters long.');
      setAuthLoading(false);
      return;
    }

    try {
      let authResponse;
      if (isLoginMode) {
        authResponse = await supabase.auth.signInWithPassword({ email, password });
      } else {
        authResponse = await supabase.auth.signUp({ email, password });
        // For signup, Supabase often sends a confirmation email.
        // You might want to show a message about email verification here.
        if (!authResponse.error && !authResponse.data.user) {
            setAuthError('Please check your email to confirm your account before logging in.');
            setAuthLoading(false);
            return;
        }
      }

      const { error: supabaseError } = authResponse;

      if (supabaseError) {
        setAuthError(supabaseError.message);
        console.error('Auth error:', supabaseError.message);
      } else {
        // Authentication successful.
        // The useEffect above (or in App.tsx) will handle the navigation based on the new session.
        if (onAuthSuccess) {
            onAuthSuccess(); // Notify parent of success
        }
      }
    } catch (err: any) {
      setAuthError('An unexpected error occurred: ' + err.message);
      console.error('Auth exception:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  // If the auth hook is still loading the session, display a loading state
  if (authHookLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-xl text-foreground">Loading authentication state...</div>
      </div>
    );
  }

  // If user is already authenticated, this component should not be rendered.
  // The useEffect above will handle redirection.
  if (user) {
    return null; // Component should theoretically not be reached if already authenticated
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-6">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            {isLoginMode ? 'Welcome Back!' : 'Join MediCare Companion'}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground mt-2">
            {isLoginMode ? 'Sign in to continue to your dashboard.' : 'Create an account to get started.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuthSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 p-2 w-full border rounded-md"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 p-2 w-full border rounded-md"
              />
            </div>
            {authError && <p className="text-red-600 text-sm mt-2">{authError}</p>}
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg rounded-md transition-colors"
              type="submit"
              disabled={authLoading}
            >
              {authLoading ? 'Processing...' : (isLoginMode ? 'Login' : 'Sign Up')}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isLoginMode ? (
              <>
                Don't have an account?{" "}
                <Button
                  variant="link"
                  onClick={() => { setIsLoginMode(false); setAuthError(null); }}
                  className="p-0 h-auto text-blue-600 hover:text-blue-700 underline"
                >
                  Sign Up
                </Button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Button
                  variant="link"
                  onClick={() => { setIsLoginMode(true); setAuthError(null); }}
                  className="p-0 h-auto text-blue-600 hover:text-blue-700 underline"
                >
                  Login
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;