import React, { useState } from 'react';
import { signInWithGoogle, signUpEmail, logInEmail, resetPassword, isMock, enableDemoMode } from '../services/firebase';

type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false); 
  const [domainError, setDomainError] = useState(false); 
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const clearState = () => {
    setError(null);
    setConfigError(false);
    setDomainError(false);
    setSuccessMessage(null);
    setIsLoading(false);
  };

  const getErrorMessage = (error: any) => {
    if (!error || !error.code) {
        if (error.message?.includes('not initialized')) return "FIREBASE_CONFIG_MISSING";
        return error.message || "An unexpected error occurred.";
    }
    switch (error.code) {
      case 'auth/email-already-in-use': return "Email already taken.";
      case 'auth/user-not-found': return "User not found.";
      case 'auth/wrong-password': return "Wrong password.";
      case 'auth/invalid-email': return "Invalid email.";
      case 'auth/weak-password': return "Password too weak.";
      case 'auth/unauthorized-domain': return "DOMAIN_ERROR";
      default: return `Error: ${error.message}`;
    }
  };

  const validateForm = (): boolean => {
      if (!email.includes('@') || !email.includes('.')) {
          setError("Invalid Email.");
          return false;
      }
      if (mode !== 'FORGOT') {
          if (!password) { setError("Password required."); return false; }
          if (mode === 'SIGNUP') {
              if (!STRONG_PASSWORD_REGEX.test(password)) { setError("Password weak."); return false; }
              if (password !== confirmPassword) { setError("Passwords don't match."); return false; }
          }
      }
      return true;
  };

  const handleGoogleLogin = async () => {
    clearState();
    try {
      await signInWithGoogle();
    } catch (err: any) {
      const msg = getErrorMessage(err);
      if (msg === 'FIREBASE_CONFIG_MISSING') setConfigError(true);
      else if (msg === 'DOMAIN_ERROR') setDomainError(true);
      else setError(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearState();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
        if (mode === 'LOGIN') await logInEmail(email, password);
        else if (mode === 'SIGNUP') await signUpEmail(email, password);
        else if (mode === 'FORGOT') {
            await resetPassword(email);
            setSuccessMessage("Reset link sent.");
            setIsLoading(false);
        }
    } catch (err: any) {
        const msg = getErrorMessage(err);
        if (msg === 'FIREBASE_CONFIG_MISSING') setConfigError(true);
        else if (msg === 'DOMAIN_ERROR') setDomainError(true);
        else setError(msg);
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
    <div className="min-h-screen flex items-center justify-center bg-neo-bg dark:bg-neo-dark relative overflow-hidden font-sans bg-pattern">
      
      {/* Decor Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-neo-secondary border-2 border-black shadow-neo rotate-12 hidden md:block"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-neo-accent rounded-full border-2 border-black shadow-neo hidden md:block"></div>

      <div className="bg-white dark:bg-neutral-900 border-2 border-black shadow-neo-xl p-8 w-full max-w-md z-10 relative">
        
        {/* Card Header Bar */}
        <div className="absolute top-0 left-0 w-full h-6 bg-neo-primary border-b-2 border-black flex items-center px-2 gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full border border-black"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full border border-black"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full border border-black"></div>
        </div>

        {isMock && (
            <div className="mt-4 mb-4 bg-neo-accent border-2 border-black p-2 text-xs font-bold text-center uppercase shadow-neo-sm transform -rotate-1">
                ⚠️ Demo Mode Active
            </div>
        )}

        <div className="text-center mb-8 mt-6">
            <div className="w-16 h-16 bg-neo-black text-white mx-auto flex items-center justify-center border-2 border-black shadow-neo mb-4">
                <i className="fa-solid fa-atom text-3xl animate-pulse-slow"></i>
            </div>
            <h1 className="text-4xl font-black text-black dark:text-white uppercase tracking-tighter">Nexus</h1>
            <p className="text-sm font-bold bg-black text-white inline-block px-2 py-0.5 mt-2">AUTHORIZED PERSONNEL ONLY</p>
        </div>

        {domainError ? (
            <div className="text-center space-y-4">
                 <div className="bg-neo-accent border-2 border-black p-4 shadow-neo">
                     <h3 className="font-black text-lg uppercase">Bad Domain</h3>
                     <p className="text-xs font-medium mt-2">Domain not authorized in Firebase.</p>
                 </div>
                <button onClick={enableDemoMode} className="w-full bg-neo-secondary border-2 border-black text-white font-bold py-3 shadow-neo active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all">
                    SWITCH TO DEMO MODE
                </button>
                <button onClick={() => setDomainError(false)} className="text-xs font-bold underline">Back</button>
             </div>
        ) : configError ? (
             <div className="text-center space-y-4">
                 <div className="bg-red-500 border-2 border-black p-4 shadow-neo text-white">
                     <h3 className="font-black text-lg uppercase">Missing Keys</h3>
                     <p className="text-xs font-medium mt-2">Firebase config not found.</p>
                 </div>
                <button onClick={enableDemoMode} className="w-full bg-neo-secondary border-2 border-black text-white font-bold py-3 shadow-neo active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all">
                    SWITCH TO DEMO MODE
                </button>
                <button onClick={() => setConfigError(false)} className="text-xs font-bold underline">Back</button>
             </div>
        ) : (
        <>
            {error && (
                <div className="bg-red-500 border-2 border-black text-white font-bold text-xs p-3 mb-6 shadow-neo flex items-center gap-2">
                    <i className="fa-solid fa-bomb"></i> <span>{error}</span>
                </div>
            )}
            
            {successMessage && (
                <div className="bg-green-500 border-2 border-black text-white font-bold text-xs p-3 mb-6 shadow-neo flex items-center gap-2">
                    <i className="fa-solid fa-check"></i> <span>{successMessage}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-black uppercase mb-1 border-b-2 border-black inline-block">Email</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white dark:bg-neutral-800 border-2 border-black p-3 text-sm outline-none focus:shadow-neo transition-shadow font-medium"
                        placeholder="USER@CORP.NET"
                    />
                </div>

                {mode !== 'FORGOT' && (
                    <>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-black uppercase border-b-2 border-black inline-block">Password</label>
                        </div>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white dark:bg-neutral-800 border-2 border-black p-3 text-sm outline-none focus:shadow-neo transition-shadow font-medium"
                                placeholder="******"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 font-bold text-xs uppercase"
                            >
                                {showPassword ? 'HIDE' : 'SHOW'}
                            </button>
                        </div>
                    </div>
                    {mode === 'SIGNUP' && (
                        <div>
                             <label className="block text-xs font-black uppercase mb-1 border-b-2 border-black inline-block">Confirm</label>
                             <input 
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-white dark:bg-neutral-800 border-2 border-black p-3 text-sm outline-none focus:shadow-neo transition-shadow font-medium"
                                    placeholder="******"
                             />
                        </div>
                    )}
                    </>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-neo-black hover:bg-gray-800 text-white font-black uppercase py-3 border-2 border-black shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'LOADING...' : mode === 'LOGIN' ? 'ENTER SYSTEM' : mode === 'SIGNUP' ? 'INITIALIZE USER' : 'SEND RESET LINK'}
                </button>
            </form>

            {mode !== 'FORGOT' && (
                <>
                    <div className="relative my-6 text-center">
                         <span className="bg-white dark:bg-neutral-900 px-2 text-xs font-bold border-2 border-black py-1">OR</span>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full bg-white dark:bg-neutral-800 text-black dark:text-white font-bold py-3 px-4 border-2 border-black shadow-neo hover:bg-gray-50 dark:hover:bg-neutral-700 active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-sm transition-all flex items-center justify-center gap-3 uppercase text-sm"
                    >
                        <i className="fa-brands fa-google"></i> Google Login
                    </button>
                </>
            )}

            <div className="mt-6 text-center text-xs font-bold">
                {mode === 'LOGIN' ? (
                    <p>
                        NO ACCESS?{' '}
                        <button onClick={() => switchMode('SIGNUP')} className="text-neo-primary underline uppercase">
                            REGISTER
                        </button>
                        <span className="mx-2">|</span>
                        <button onClick={() => switchMode('FORGOT')} className="text-gray-500 underline uppercase">
                            LOST KEY?
                        </button>
                    </p>
                ) : (
                    <p>
                        HAS KEY?{' '}
                        <button onClick={() => switchMode('LOGIN')} className="text-neo-primary underline uppercase">
                            LOGIN
                        </button>
                    </p>
                )}
            </div>
        </>
        )}
      </div>
    </div>
  );
};

export default Auth;