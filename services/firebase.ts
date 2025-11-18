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
  User 
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import React from 'react';

// Access globals safely without augmenting Window interface globally to prevent type shadowing
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
export const isMock = firebaseConfig.apiKey === "mock-key";

if (!getApps().length && !isMock) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else if (isMock) {
    console.warn("Running in Mock Firebase Mode");
}

export { auth, db };

// Event Emitter for Mock Auth updates to avoid page reloads
const mockAuthEvent = new EventTarget();

export const signInWithGoogle = async () => {
    if (isMock) {
        // Simulation for demo purposes if no firebase keys provided
        const mockUser: any = { uid: 'test-user-google', email: 'ceo@alkatara.com', displayName: 'AlkaTara CEO' };
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
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
        const mockUser: any = { uid: 'test-user-' + Date.now(), email: email, displayName: email.split('@')[0] };
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
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
        // Allow any mock login
        const mockUser: any = { uid: 'test-user-' + email, email: email, displayName: email.split('@')[0] };
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
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
        console.log(`Mock password reset sent to ${email}`);
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
        localStorage.removeItem('mockUser');
        mockAuthEvent.dispatchEvent(new Event('auth-change'));
        return;
    }
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error during sign out:", error);
    }
};

// Mock Auth Hook helper
export const useAuth = () => {
    const [user, setUser] = React.useState<User | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const checkMockUser = () => {
            const stored = localStorage.getItem('mockUser');
            if (stored) {
                try {
                    setUser(JSON.parse(stored));
                } catch (e) {
                    console.error("Failed to parse mock user", e);
                    localStorage.removeItem('mockUser');
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        if (isMock) {
            checkMockUser(); // Initial check
            
            // Listen for custom events for mock auth
            const handler = () => checkMockUser();
            mockAuthEvent.addEventListener('auth-change', handler);
            return () => mockAuthEvent.removeEventListener('auth-change', handler);
        } else {
            // Safe check if auth is initialized
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