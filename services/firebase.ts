
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
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
const firebaseConfig = win.__firebase_config || {
  apiKey: process.env.FIREBASE_API_KEY || "mock-key",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "mock-domain",
  projectId: process.env.FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: "mock-bucket",
  messagingSenderId: "123",
  appId: win.__app_id || "1:123:web:456"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Simple check to see if we are in a real firebase environment or need to mock
export const isMock = firebaseConfig.apiKey === "mock-key" || !firebaseConfig.apiKey;

if (!getApps().length && !isMock) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // Ensure persistence is set to local (default, but explicit is safer)
    setPersistence(auth, browserLocalPersistence).catch((error) => {
        console.error("Firebase persistence error:", error);
    });
  } catch (e) {
    console.error("Firebase Initialization Error:", e);
    console.warn("Falling back to Mock Mode due to configuration error.");
    // @ts-ignore
    exports.isMock = true;
  }
} else if (isMock) {
    console.warn("Running in Mock Firebase Mode - No API Keys Detected");
}

export { auth, db };

// Event Emitter for Mock Auth updates
const mockAuthEvent = new EventTarget();

// --- SECURE MOCK IMPLEMENTATION ---
// This simulates a real database in localStorage so you can't just "log in with anything"
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
        
        // In mock mode, we simulate a google user.
        // We check if this google user exists in our mock DB to be consistent, or just auto-create.
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
        
        // Save user "securely" (simple hash simulation)
        const newUser = {
            uid: 'user-' + Math.random().toString(36).substr(2, 9),
            email,
            displayName: email.split('@')[0],
            passwordHash: btoa(password), // Simple encoding for demo (NOT REAL ENCRYPTION)
            createdAt: Date.now(),
            providerId: 'password'
        };
        saveMockUser(email, newUser);
        
        // Auto login after signup
        localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify({
            uid: newUser.uid,
            email: newUser.email,
            displayName: newUser.displayName
        }));
        mockAuthEvent.dispatchEvent(new Event('auth-change'));
        return;
    }
    try {
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

        // Success
        localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
        }));
        mockAuthEvent.dispatchEvent(new Event('auth-change'));
        return;
    }
    try {
        return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Error during login:", error);
        throw error;
    }
};

export const resetPassword = async (email: string) => {
    if (isMock) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const users = getMockUsers();
        // In production, we usually don't reveal if a user exists, but for mock we can log it
        console.log(`Mock password reset requested for ${email}. Exists: ${!!users[email.toLowerCase()]}`);
        return;
    }
    try {
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
        await signOut(auth);
    } catch (error) {
        console.error("Error during sign out:", error);
    }
};

// Auth Hook
export const useAuth = () => {
    const [user, setUser] = React.useState<User | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
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

        if (isMock) {
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
