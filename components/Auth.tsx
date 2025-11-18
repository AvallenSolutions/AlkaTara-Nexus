
import React, { useState } from 'react';
import { signInWithGoogle, signUpEmail, logInEmail, resetPassword, isMock } from '../services/firebase';

type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Regular Expression for Strong Password: Min 8 chars, Upper, Lower, Number, Special
  const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const clearState = () => {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(false);
  };

  const getErrorMessage = (error: any) => {
    if (!error || !error.code) return error.message || "An unexpected error occurred.";

    switch (error.code) {
      case 'auth/email-already-in-use':
        return "This email is already registered. Please sign in.";
      case 'auth/user-not-found':
        return "No account found. Please sign up first.";
      case 'auth/wrong-password':
        return "Incorrect password. Please try again.";
      case 'auth/invalid-email':
        return "Please enter a valid email address.";
      case 'auth/weak-password':
        return "Password is too weak.";
      case 'auth/too-many-requests':
        return "Too many failed attempts. Reset password or try later.";
      case 'auth/network-request-failed':
        return "Network error. Check your internet connection.";
      default:
        return `Error: ${error.message}`;
    }
  };

  const validateForm = (): boolean => {
      if (!email.includes('@') || !email.includes('.')) {
          setError("Please enter a valid email address.");
          return false;
      }
      if (mode !== 'FORGOT') {
          if (!password) {
              setError("Password is required.");
              return false;
          }
          if (mode === 'SIGNUP') {
              if (!STRONG_PASSWORD_REGEX.test(password)) {
                  setError("Password must be 8+ chars, with uppercase, lowercase, number, and special char.");
                  return false;
              }
              if (password !== confirmPassword) {
                  setError("Passwords do not match.");
                  return false;
              }
          }
      }
      return true;
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
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
        if (mode === 'LOGIN') {
            await logInEmail(email, password);
        } else if (mode === 'SIGNUP') {
            await signUpEmail(email, password);
        } else if (mode === 'FORGOT') {
            await resetPassword(email);
            setSuccessMessage("If an account exists, a reset link has been sent to your email.");
            setIsLoading(false);
        }
    } catch (err: any) {
        console.error(err);
        setError(getErrorMessage(err));
        setIsLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
      setMode(newMode);
      clearState();
      setPassword('');
      setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-avallen-900 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/10 dark:bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/10 dark:bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="bg-white dark:bg-avallen-800 border border-gray-200 dark:border-avallen-700 p-8 rounded-2xl shadow-xl w-full max-w-md z-10">
        
        {isMock && (
            <div className="absolute top-0 left-0 w-full bg-amber-500 text-white text-[10px] font-bold text-center py-1">
                DEMO MODE: MOCK AUTHENTICATION ACTIVE
            </div>
        )}

        <div className="text-center mb-8 mt-4">
            <div className="w-14 h-14 bg-avallen-accent rounded-xl mx-auto flex items-center justify-center shadow-lg shadow-avallen-accent/20 mb-4">
                <i className="fa-solid fa-shield-halved text-white text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">AlkaTara Nexus</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm">Secure C-Suite Platform</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-200 text-xs p-3 rounded-lg mb-6 flex items-start gap-2 animate-fade-in">
             <i className="fa-solid fa-circle-exclamation mt-0.5"></i> 
             <span>{error}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-200 text-xs p-3 rounded-lg mb-6 flex items-start gap-2 animate-fade-in">
             <i className="fa-solid fa-check-circle mt-0.5"></i> 
             <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Email</label>
                <div className="relative">
                    <i className="fa-solid fa-envelope absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs"></i>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-avallen-900/50 border border-gray-300 dark:border-avallen-600 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-avallen-accent focus:ring-1 focus:ring-avallen-accent transition-all"
                        placeholder="you@company.com"
                        autoComplete="email"
                    />
                </div>
            </div>

            {mode !== 'FORGOT' && (
                <>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Password</label>
                        {mode === 'LOGIN' && (
                            <button 
                                type="button"
                                onClick={() => switchMode('FORGOT')}
                                className="text-[10px] text-avallen-accent hover:underline"
                            >
                                Forgot?
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <i className="fa-solid fa-lock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs"></i>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-avallen-900/50 border border-gray-300 dark:border-avallen-600 rounded-lg pl-9 pr-9 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-avallen-accent focus:ring-1 focus:ring-avallen-accent transition-all"
                            placeholder="••••••••"
                            autoComplete="new-password"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                        >
                            <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                        </button>
                    </div>
                </div>

                {mode === 'SIGNUP' && (
                     <div className="animate-fade-in">
                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Confirm Password</label>
                        <div className="relative">
                            <i className="fa-solid fa-lock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs"></i>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full bg-gray-50 dark:bg-avallen-900/50 border rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-avallen-accent focus:ring-1 focus:ring-avallen-accent transition-all ${password && confirmPassword && password !== confirmPassword ? 'border-red-300 dark:border-red-800' : 'border-gray-300 dark:border-avallen-600'}`}
                                placeholder="••••••••"
                            />
                        </div>
                         <div className="mt-2 text-[10px] text-gray-400 dark:text-slate-500 space-y-1">
                            <p className={password.length >= 8 ? 'text-green-500' : ''}><i className={`fa-solid ${password.length >= 8 ? 'fa-check' : 'fa-circle text-[4px]'} mr-1`}></i> Min 8 characters</p>
                            <p className={/[A-Z]/.test(password) ? 'text-green-500' : ''}><i className={`fa-solid ${/[A-Z]/.test(password) ? 'fa-check' : 'fa-circle text-[4px]'} mr-1`}></i> Uppercase letter</p>
                            <p className={/[0-9]/.test(password) ? 'text-green-500' : ''}><i className={`fa-solid ${/[0-9]/.test(password) ? 'fa-check' : 'fa-circle text-[4px]'} mr-1`}></i> Number</p>
                         </div>
                    </div>
                )}
                </>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-avallen-accent hover:bg-sky-500 text-white font-bold py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm mt-2"
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
                    <div className="relative flex justify-center">
                        <span className="px-2 bg-white dark:bg-avallen-800 text-xs text-gray-400 dark:text-slate-500 font-medium">OR</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white dark:bg-avallen-700/50 text-gray-700 dark:text-white font-semibold py-2.5 px-4 rounded-lg border border-gray-200 dark:border-avallen-600 hover:bg-gray-50 dark:hover:bg-avallen-700 transition-colors flex items-center justify-center gap-3 text-sm"
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                    Continue with Google
                </button>
            </>
        )}

        <div className="mt-6 text-center text-xs text-gray-500 dark:text-slate-400">
            {mode === 'LOGIN' ? (
                <p>
                    Don't have an account?{' '}
                    <button onClick={() => switchMode('SIGNUP')} className="text-avallen-accent hover:text-sky-600 dark:hover:text-sky-300 font-bold ml-1">
                        Sign Up
                    </button>
                </p>
            ) : (
                <p>
                    {mode === 'SIGNUP' ? 'Already have an account?' : 'Remember password?'} {' '}
                    <button onClick={() => switchMode('LOGIN')} className="text-avallen-accent hover:text-sky-600 dark:hover:text-sky-300 font-bold ml-1">
                        Sign In
                    </button>
                </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
