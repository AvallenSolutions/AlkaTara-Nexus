
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  Auth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut, 
  onAuthStateChanged, 
  User,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import React from 'react';

// Access globals safely
const win = window as any;

const getEnv = (key: string) => {
    try {
        // @ts-ignore
        return process.env[key];
    } catch (e) {
        return undefined;
    }
};

// Configuration from snippet
const firebaseConfig = win.__firebase_config || {
  apiKey: getEnv('FIREBASE_API_KEY') || "AIzaSyBQaZ55RPKFHgZ90Xbh4SpIu9IrP1E--iY",
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN') || "alkatara-nexus.firebaseapp.com",
  projectId: getEnv('FIREBASE_PROJECT_ID') || "alkatara-nexus",
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET') || "alkatara-nexus.firebasestorage.app",
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID') || "795944217054",
  appId: getEnv('FIREBASE_APP_ID') || "1:795944217054:web:9333ce07fdd4a579bbd54f",
  measurementId: "G-JCV66BGLQV"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: any;

// Allow manual override via LocalStorage for testing
const forceDemo = typeof window !== 'undefined' ? window.localStorage.getItem('alkatara_force_demo') === 'true' : false;

// Check for Dev/Preview environments
const isDevEnvironment = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('stackblitz') || 
    window.location.hostname.includes('webcontainer') ||
    window.location.hostname.includes('bolt') ||
    window.location.hostname.includes('repl') ||
    window.location.hostname.includes('sandbox')
);

const keysMissing = !firebaseConfig.apiKey;

// Mock mode enabled if:
// 1. DEMO_MODE env var is true
// 2. Manually forced via UI
// 3. We are in a DEV environment AND keys are missing
export const isMock = getEnv('DEMO_MODE') === 'true' || forceDemo || (isDevEnvironment && keysMissing);

if (!getApps().length && !isMock) {
  try {
    if (keysMissing) {
        console.error("Firebase Configuration Missing: FIREBASE_API_KEY is not set.");
    } else {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        if (typeof window !== 'undefined') {
          analytics = getAnalytics(app);
        }
        
        // Ensure persistence is set to local
        setPersistence(auth, browserLocalPersistence).catch((error) => {
            console.error("Firebase persistence error:", error);
        });
    }
  } catch (e) {
    console.error("Firebase Initialization Error:", e);
  }
} else if (isMock) {
    console.warn("Running in EXPLICIT DEMO MODE (Mock Data)");
}

export { auth, db };

// Helper to enable demo mode from UI
export const enableDemoMode = () => {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem('alkatara_force_demo', 'true');
        window.location.reload();
    }
};

// Event Emitter for Mock Auth updates
const mockAuthEvent = new EventTarget();

// --- SECURE MOCK IMPLEMENTATION (Only active if isMock is true) ---
const MOCK_DB_KEY = 'alkatara_secure_mock_users';
const MOCK_CURRENT_USER_KEY = 'mockCurrentUser';

const getMockUsers = (): Record<string, any> => {
    try {
        return JSON.parse(localStorage.getItem(MOCK_DB_KEY) || '{}');
    } catch { return {}; }
};

const saveMockUser = (email: string, data: any) => {
    const users = getMockUsers();
    users[email.toLowerCase()] = data;
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(users));
};

export const signInWithGoogle = async () => {
    if (isMock) {
        console.log("Simulating Google Sign In...");
        await new Promise(resolve => setTimeout(resolve, 1000)); // Fake network delay
        
        const email = "demo-google@alkatara.com";
        const users = getMockUsers();
        let mockUser = users[email];
        
        if (!mockUser) {
             mockUser = { 
                uid: 'google-user-' + Date.now(), 
                email: email, 
                displayName: 'Google User (Demo)',
                photoURL: 'https://lh3.googleusercontent.com/a/default-user',
                providerId: 'google.com',
                createdAt: Date.now()
            };
            saveMockUser(email, mockUser);
        }
        
        localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(mockUser));
        mockAuthEvent.dispatchEvent(new Event('auth-change'));
        return;
    }
    try {
        if (!auth) throw new Error("Firebase Auth not initialized. Check configuration.");
        const provider = new GoogleAuthProvider();
        return await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Error during google sign in:", error);
        throw error;
    }
};

export const signUpEmail = async (email: string, password: string) => {
    if (isMock) {
        await new Promise(resolve => setTimeout(resolve, 800)); // Fake delay
        const users = getMockUsers();
        if (users[email.toLowerCase()]) {
            const error: any = new Error("Email already in use");
            error.code = 'auth/email-already-in-use';
            throw error;
        }
        
        const newUser = {
            uid: 'user-' + Math.random().toString(36).substr(2, 9),
            email,
            displayName: email.split('@')[0],
            passwordHash: btoa(password), // Simple encoding for demo
            createdAt: Date.now(),
            providerId: 'password'
        };
        saveMockUser(email, newUser);
        
        localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify({
            uid: newUser.uid,
            email: newUser.email,
            displayName: newUser.displayName
        }));
        mockAuthEvent.dispatchEvent(new Event('auth-change'));
        return;
    }
    try {
        if (!auth) throw new Error("Firebase Auth not initialized.");
        return await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Error during sign up:", error);
        throw error;
    }
};

export const logInEmail = async (email: string, password: string) => {
    if (isMock) {
        await new Promise(resolve => setTimeout(resolve, 800));
        const users = getMockUsers();
        const user = users[email.toLowerCase()];
        
        if (!user) {
            const error: any = new Error("User not found");
            error.code = 'auth/user-not-found';
            throw error;
        }

        if (user.providerId === 'google.com') {
             const error: any = new Error("Please sign in with Google");
             error.code = 'auth/wrong-password'; 
             throw error;
        }

        if (user.passwordHash !== btoa(password)) {
            const error: any = new Error("Wrong password");
            error.code = 'auth/wrong-password';
            throw error;
        }

        localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
        }));
        mockAuthEvent.dispatchEvent(new Event('auth-change'));
        return;
    }
    try {
        if (!auth) throw new Error("Firebase Auth not initialized.");
        return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Error during login:", error);
        throw error;
    }
};

export const resetPassword = async (email: string) => {
    if (isMock) {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`Mock password reset requested for ${email}.`);
        return;
    }
    try {
        if (!auth) throw new Error("Firebase Auth not initialized.");
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        console.error("Error sending password reset:", error);
        throw error;
    }
};

export const logOut = async () => {
    if (isMock) {
        localStorage.removeItem(MOCK_CURRENT_USER_KEY);
        mockAuthEvent.dispatchEvent(new Event('auth-change'));
        return;
    }
    try {
        if (auth) await signOut(auth);
    } catch (error) {
        console.error("Error during sign out:", error);
    }
};

// Auth Hook
export const useAuth = () => {
    const [user, setUser] = React.useState<User | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (isMock) {
            const checkMockUser = () => {
                const stored = localStorage.getItem(MOCK_CURRENT_USER_KEY);
                if (stored) {
                    try {
                        setUser(JSON.parse(stored));
                    } catch (e) {
                        console.error("Failed to parse mock user", e);
                        localStorage.removeItem(MOCK_CURRENT_USER_KEY);
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
                setLoading(false);
            };
            checkMockUser();
            const handler = () => checkMockUser();
            mockAuthEvent.addEventListener('auth-change', handler);
            return () => mockAuthEvent.removeEventListener('auth-change', handler);
        } else {
            if (!auth) {
                 setLoading(false);
                 return;
            }
            const unsubscribe = onAuthStateChanged(auth, (u) => {
                setUser(u);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, []);
    return { user, loading };
};
