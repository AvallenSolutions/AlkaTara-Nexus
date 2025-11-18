
import React, { useState } from 'react';
import { signInWithGoogle, signUpEmail, logInEmail, resetPassword } from '../services/firebase';

type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const clearState = () => {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(false);
  };

  const getErrorMessage = (error: any) => {
    if (!error || !error.code) return error.message || "An unexpected error occurred.";

    switch (error.code) {
      case 'auth/email-already-in-use':
        return "This email address is already registered. Please sign in instead.";
      case 'auth/user-not-found':
        return "No account found with this email address. Please sign up.";
      case 'auth/wrong-password':
        return "The password you entered is incorrect. Please try again.";
      case 'auth/invalid-email':
        return "Please enter a valid email address.";
      case 'auth/weak-password':
        return "Password is too weak. It must be at least 6 characters long.";
      case 'auth/too-many-requests':
        return "Too many failed attempts. Please try again later or reset your password.";
      case 'auth/network-request-failed':
        return "Network error. Please check your internet connection.";
      case 'auth/popup-closed-by-user':
        return "Sign-in was cancelled.";
      case 'auth/invalid-credential':
        return "Invalid credentials provided. Please check your input.";
      case 'auth/operation-not-allowed':
        return "This sign-in method is currently disabled.";
      case 'auth/user-disabled':
        return "This account has been disabled. Please contact support.";
      default:
        return "An error occurred (" + error.code + "). Please try again.";
    }
  };

  const handleGoogleLogin = async () => {
    clearState();
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearState();
    setIsLoading(true);

    if (!email) {
        setError("Email is required.");
        setIsLoading(false);
        return;
    }

    try {
        if (mode === 'LOGIN') {
            if (!password) throw new Error("Password is required.");
            await logInEmail(email, password);
        } else if (mode === 'SIGNUP') {
            if (!password) throw new Error("Password is required.");
            if (password.length < 6) {
                const err = { code: 'auth/weak-password' };
                throw err;
            }
            await signUpEmail(email, password);
        } else if (mode === 'FORGOT') {
            await resetPassword(email);
            setSuccessMessage("Password reset link sent to your email. Please check your inbox.");
            setIsLoading(false);
        }
    } catch (err: any) {
        console.error(err);
        // If it's a standard Error object without a code, use message
        if (!err.code && err.message) {
             setError(err.message);
        } else {
             setError(getErrorMessage(err));
        }
        setIsLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
      setMode(newMode);
      clearState();
      // Keep email if switching between login/signup/forgot for convenience
      if (newMode === 'FORGOT') setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-avallen-900 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-400/20 dark:bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="bg-white/80 dark:bg-avallen-800/80 backdrop-blur-md border border-gray-200 dark:border-avallen-700 p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 transform transition-all duration-500">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-avallen-accent rounded-xl mx-auto flex items-center justify-center shadow-lg shadow-avallen-accent/30 mb-4">
                <i className="fa-solid fa-atom text-white text-3xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">AlkaTara Nexus</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm font-medium">Intelligent C-Suite Operating System</p>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-sm p-3 rounded-lg mb-6 flex items-start gap-3 animate-fade-in">
             <i className="fa-solid fa-circle-exclamation mt-1 shrink-0"></i> 
             <span>{error}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 dark:bg-green-900/50 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 text-sm p-3 rounded-lg mb-6 flex items-start gap-3 animate-fade-in">
             <i className="fa-solid fa-check-circle mt-1 shrink-0"></i> 
             <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="fa-regular fa-envelope text-gray-400 dark:text-slate-500"></i>
                    </div>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-avallen-900/50 border border-gray-300 dark:border-avallen-600 rounded-lg pl-10 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-avallen-accent focus:ring-1 focus:ring-avallen-accent transition-all"
                        placeholder="client@alkatara.com"
                        autoComplete="email"
                    />
                </div>
            </div>

            {mode !== 'FORGOT' && (
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                        {mode === 'LOGIN' && (
                            <button 
                                type="button"
                                onClick={() => switchMode('FORGOT')}
                                className="text-xs text-avallen-accent hover:text-sky-600 dark:hover:text-sky-300 transition-colors"
                            >
                                Forgot Password?
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i className="fa-solid fa-lock text-gray-400 dark:text-slate-500"></i>
                        </div>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-avallen-900/50 border border-gray-300 dark:border-avallen-600 rounded-lg pl-10 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-avallen-accent focus:ring-1 focus:ring-avallen-accent transition-all"
                            placeholder="••••••••"
                            autoComplete={mode === 'LOGIN' ? "current-password" : "new-password"}
                        />
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-avallen-accent text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-400 transition-all shadow-lg shadow-avallen-accent/20 hover:shadow-avallen-accent/40 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <i className="fa-solid fa-circle-notch fa-spin"></i> Processing...
                    </span>
                ) : (
                    mode === 'LOGIN' ? 'Sign In' : mode === 'SIGNUP' ? 'Create Account' : 'Send Reset Link'
                )}
            </button>
        </form>

        {mode !== 'FORGOT' && (
            <>
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-avallen-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-avallen-800 text-gray-500 dark:text-slate-500 font-medium">Or continue with</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white text-gray-800 dark:text-avallen-900 font-bold py-3 px-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 shadow-sm"
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                    Google
                </button>
            </>
        )}

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-slate-400">
            {mode === 'LOGIN' ? (
                <p>
                    Don't have an account?{' '}
                    <button onClick={() => switchMode('SIGNUP')} className="text-avallen-accent hover:text-sky-600 dark:hover:text-sky-300 font-semibold ml-1 transition-colors">
                        Sign Up Now
                    </button>
                </p>
            ) : (
                <p>
                    {mode === 'SIGNUP' ? 'Already have an account?' : 'Remember your details?'} {' '}
                    <button onClick={() => switchMode('LOGIN')} className="text-avallen-accent hover:text-sky-600 dark:hover:text-sky-300 font-semibold ml-1 transition-colors">
                        Back to Login
                    </button>
                </p>
            )}
        </div>
      </div>
      
      {/* Footer Credit */}
      <div className="absolute bottom-4 text-gray-400 dark:text-slate-600 text-xs">
        &copy; {new Date().getFullYear()} AlkaTara. All rights reserved.
      </div>
    </div>
  );
};

export default Auth;