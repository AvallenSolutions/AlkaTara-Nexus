
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  writeBatch,
  getDocs,
  getDoc,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, isMock } from './firebase';
import { Agent, Message, KnowledgeItem, Task, TaskStatus, Folder, ChatSession, Directive } from '../types';
import { INITIAL_AGENTS, MOCK_KNOWLEDGE_BASE } from '../constants';

// Helpers for Mock Data (localStorage)
const getMockData = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setMockData = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

// --- ERROR HANDLING & SANITIZATION ---
const checkPermissionError = (error: any) => {
    if (error && (error.code === 'permission-denied' || error.message?.includes('permission-denied') || error.code === 'f' || error.toString().includes('Missing or insufficient permissions'))) {
        console.warn("Firestore Permission Error Detected");
        window.dispatchEvent(new CustomEvent('firestore-permission-error'));
    }
};

// Firestore throws error if a field is 'undefined'. We must remove them or convert to null.
const removeUndefined = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => removeUndefined(v));
    } else if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            const value = obj[key];
            if (value !== undefined) {
                acc[key] = removeUndefined(value);
            }
            return acc;
        }, {} as any);
    }
    return obj;
};

const safeWrite = async (operation: () => Promise<void>) => {
    try {
        await operation();
    } catch (error: any) {
        checkPermissionError(error);
        throw error; // Re-throw so UI knows the specific action failed
    }
};

// --- USER PROFILE MANAGEMENT ---

export const readUserData = async (userId: string) => {
  if (isMock) {
      return getMockData(`avallen_${userId}_profile`) || null;
  }
  try {
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return userDocSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error reading user data:", error);
    checkPermissionError(error);
    return null;
  }
};

export const writeUserData = async (userId: string, dataToSave: { displayName?: string | null; email?: string | null; [key: string]: any }) => {
  if (isMock) {
      const current = getMockData(`avallen_${userId}_profile`) || {};
      setMockData(`avallen_${userId}_profile`, { ...current, ...dataToSave, uid: userId });
      return;
  }
  
  const userDocRef = doc(db, "users", userId);
  await safeWrite(() => setDoc(userDocRef, removeUndefined(dataToSave), { merge: true }));
};

/**
 * Seeds the database with initial agents and knowledge base if they don't exist for the user.
 * Also syncs the user profile data.
 */
export const initializeUserData = async (user: User) => {
  const userId = user.uid;

  // Sync User Profile
  try {
    await writeUserData(userId, {
        displayName: user.displayName,
        email: user.email,
        lastLogin: Date.now()
    });
  } catch (e) {
      // If profile write fails (permissions), we stop here to avoid flooding with other errors
      return;
  }

  if (isMock) {
      // Seed local storage if empty
      if (getMockData(`avallen_${userId}_agents`).length === 0) {
          setMockData(`avallen_${userId}_agents`, INITIAL_AGENTS);
      }
      if (getMockData(`avallen_${userId}_kb`).length === 0) {
          const kb = MOCK_KNOWLEDGE_BASE.map(k => ({...k, type: 'NOTE', folderId: null}));
          setMockData(`avallen_${userId}_kb`, kb);
      }
      return;
  }

  try {
    const agentsRef = collection(db, 'users', userId, 'agents');
    const kbRef = collection(db, 'users', userId, 'knowledge_base');
    const agentsSnapshot = await getDocs(agentsRef);
    
    if (agentsSnapshot.empty) {
      const batch = writeBatch(db);
      INITIAL_AGENTS.forEach(agent => {
        const docRef = doc(agentsRef, agent.id);
        batch.set(docRef, removeUndefined(agent));
      });
      MOCK_KNOWLEDGE_BASE.forEach(kb => {
        const docRef = doc(kbRef, kb.id);
        batch.set(docRef, removeUndefined({ 
            ...kb, 
            type: 'NOTE', 
            folderId: null, 
            timestamp: Timestamp.fromMillis(kb.timestamp) 
        }));
      });
      await batch.commit();
    }
  } catch (error) {
    console.error("Error seeding data:", error);
    checkPermissionError(error);
  }
};

export const listenToAgents = (userId: string, callback: (agents: Agent[]) => void) => {
  if (isMock) {
    const check = () => {
        const data = getMockData(`avallen_${userId}_agents`);
        callback(data.length ? data : INITIAL_AGENTS);
    }
    check();
    const handler = () => check();
    window.addEventListener('mock-agent-change', handler);
    return () => window.removeEventListener('mock-agent-change', handler);
  }
  const q = query(collection(db, 'users', userId, 'agents'));
  return onSnapshot(q, (snapshot) => {
    const agents = snapshot.docs.map(d => d.data() as Agent);
    callback(agents.length ? agents : INITIAL_AGENTS);
  }, (error) => {
      checkPermissionError(error);
      // Fallback to initial agents on permission error so app is usable
      callback(INITIAL_AGENTS);
  });
};

export const saveAgent = async (userId: string, agent: Agent) => {
    if (isMock) {
        let agents = getMockData(`avallen_${userId}_agents`);
        const index = agents.findIndex((a: Agent) => a.id === agent.id);
        if (index >= 0) agents[index] = agent;
        else agents.push(agent);
        setMockData(`avallen_${userId}_agents`, agents);
        window.dispatchEvent(new Event('mock-agent-change'));
        return;
    }
    const ref = doc(collection(db, 'users', userId, 'agents'), agent.id);
    await safeWrite(() => setDoc(ref, removeUndefined(agent), { merge: true }));
};

export const deleteAgent = async (userId: string, agentId: string) => {
    if (isMock) {
        let agents = getMockData(`avallen_${userId}_agents`);
        agents = agents.filter((a: Agent) => a.id !== agentId);
        setMockData(`avallen_${userId}_agents`, agents);
        window.dispatchEvent(new Event('mock-agent-change'));
        return;
    }
    const ref = doc(collection(db, 'users', userId, 'agents'), agentId);
    await safeWrite(() => deleteDoc(ref));
};

export const listenToKnowledgeBase = (userId: string, callback: (items: KnowledgeItem[]) => void) => {
  if (isMock) {
    const data = getMockData(`avallen_${userId}_kb`);
    const formatted = data.map((d: any) => ({
        ...d,
        type: d.type || 'NOTE',
        folderId: d.folderId || null
    }));
    callback(formatted);
    const handler = () => {
        const updated = getMockData(`avallen_${userId}_kb`);
         const formattedUpdate = updated.map((d: any) => ({
            ...d,
            type: d.type || 'NOTE',
            folderId: d.folderId || null
        }));
        callback(formattedUpdate);
    };
    window.addEventListener('mock-kb-change', handler);
    return () => window.removeEventListener('mock-kb-change', handler);
  }
  const q = query(collection(db, 'users', userId, 'knowledge_base'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(d => {
        const data = d.data();
        return {
            ...data,
            timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now()
        } as KnowledgeItem;
    });
    callback(items);
  }, (error) => {
      checkPermissionError(error);
      // Don't callback with empty on error to avoid wiping UI if data existed
  });
};

export const listenToFolders = (userId: string, callback: (folders: Folder[]) => void) => {
    if (isMock) {
        const data = getMockData(`avallen_${userId}_folders`);
        callback(data);
        const handler = () => callback(getMockData(`avallen_${userId}_folders`));
        window.addEventListener('mock-folder-change', handler);
        return () => window.removeEventListener('mock-folder-change', handler);
    }
    const q = query(collection(db, 'users', userId, 'folders'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const folders = snapshot.docs.map(d => d.data() as Folder);
        callback(folders);
    }, (error) => checkPermissionError(error));
};

export const createFolder = async (userId: string, folder: Folder) => {
    if (isMock) {
        const folders = getMockData(`avallen_${userId}_folders`);
        folders.push(folder);
        setMockData(`avallen_${userId}_folders`, folders);
        window.dispatchEvent(new Event('mock-folder-change'));
        return;
    }
    const ref = doc(collection(db, 'users', userId, 'folders'), folder.id);
    await safeWrite(() => setDoc(ref, removeUndefined(folder)));
};

export const deleteFolder = async (userId: string, folderId: string) => {
     if (isMock) {
        let folders = getMockData(`avallen_${userId}_folders`);
        folders = folders.filter((f: Folder) => f.id !== folderId);
        setMockData(`avallen_${userId}_folders`, folders);
        window.dispatchEvent(new Event('mock-folder-change'));
        return;
    }
    const ref = doc(collection(db, 'users', userId, 'folders'), folderId);
    await safeWrite(() => deleteDoc(ref));
};

/** SESSION MANAGEMENT **/

export const listenToUserSessions = (userId: string, callback: (sessions: ChatSession[]) => void) => {
    if (isMock) {
        const check = () => {
             const data = getMockData(`avallen_${userId}_sessions`);
             callback(data.sort((a: any, b: any) => b.lastMessageAt - a.lastMessageAt));
        }
        check();
        const handler = () => check();
        window.addEventListener('mock-session-change', handler);
        return () => window.removeEventListener('mock-session-change', handler);
    }
    const q = query(collection(db, 'users', userId, 'sessions'), orderBy('lastMessageAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const sessions = snapshot.docs.map(d => d.data() as ChatSession);
        callback(sessions);
    }, (error) => checkPermissionError(error));
};

export const createNewSession = async (userId: string, session: ChatSession) => {
    if (isMock) {
        const sessions = getMockData(`avallen_${userId}_sessions`);
        sessions.push(session);
        setMockData(`avallen_${userId}_sessions`, sessions);
        window.dispatchEvent(new Event('mock-session-change'));
        return;
    }
    const ref = doc(collection(db, 'users', userId, 'sessions'), session.id);
    await safeWrite(() => setDoc(ref, removeUndefined(session)));
};

export const deleteSession = async (userId: string, sessionId: string) => {
    if (isMock) {
        let sessions = getMockData(`avallen_${userId}_sessions`);
        sessions = sessions.filter((s: ChatSession) => s.id !== sessionId);
        setMockData(`avallen_${userId}_sessions`, sessions);
        window.dispatchEvent(new Event('mock-session-change'));
        return;
    }
    await safeWrite(() => deleteDoc(doc(db, 'users', userId, 'sessions', sessionId)));
};

export const listenToMessages = (userId: string, sessionId: string, callback: (msgs: Message[]) => void) => {
  if (isMock) {
    const check = () => {
        const allMessages = getMockData(`avallen_${userId}_messages`);
        const sessionMessages = allMessages.filter((m: any) => m.sessionId === sessionId);
        callback(sessionMessages);
    }
    check();
    // Using an event listener for instant updates + polling as backup
    const handler = () => check();
    window.addEventListener('mock-message-change', handler);
    const interval = setInterval(check, 2000); 
    
    return () => {
        window.removeEventListener('mock-message-change', handler);
        clearInterval(interval);
    };
  }

  const q = query(
    collection(db, 'users', userId, 'sessions', sessionId, 'messages'), 
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(d => d.data() as Message);
    callback(messages);
  }, (error) => {
      console.error("Error listening to messages:", error);
      checkPermissionError(error);
  });
};

export const addMessage = async (userId: string, sessionId: string, message: Message) => {
  if (isMock) {
      const all = getMockData(`avallen_${userId}_messages`);
      all.push({ ...message, sessionId });
      setMockData(`avallen_${userId}_messages`, all);
      window.dispatchEvent(new Event('mock-message-change'));
      
      // Update session timestamp
      let sessions = getMockData(`avallen_${userId}_sessions`);
      const sessIdx = sessions.findIndex((s: any) => s.id === sessionId);
      if (sessIdx >= 0) {
          sessions[sessIdx].lastMessageAt = Date.now();
          setMockData(`avallen_${userId}_sessions`, sessions);
          window.dispatchEvent(new Event('mock-session-change'));
      }
      return;
  }

  const ref = doc(collection(db, 'users', userId, 'sessions', sessionId, 'messages'), message.id);
  // Sanitize message: Remove 'status' as that is a local-only field
  const { status, ...dbMessage } = message;
  
  await safeWrite(async () => {
      await setDoc(ref, removeUndefined(dbMessage));
      // Update session timestamp
      const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
      await updateDoc(sessionRef, { lastMessageAt: Date.now() });
  });
};

export const updateMessage = async (userId: string, sessionId: string, message: Message) => {
    if (isMock) {
        const all = getMockData(`avallen_${userId}_messages`);
        const index = all.findIndex((m: any) => m.id === message.id);
        if (index >= 0) {
            all[index] = { ...all[index], ...message };
            setMockData(`avallen_${userId}_messages`, all);
            window.dispatchEvent(new Event('mock-message-change'));
        }
        return;
    }
    const ref = doc(collection(db, 'users', userId, 'sessions', sessionId, 'messages'), message.id);
    const { status, ...dbMessage } = message;
    await safeWrite(() => setDoc(ref, removeUndefined(dbMessage), { merge: true }));
};

export const addKnowledgeItem = async (userId: string, item: KnowledgeItem) => {
  if (isMock) {
      const all = getMockData(`avallen_${userId}_kb`);
      all.unshift(item);
      setMockData(`avallen_${userId}_kb`, all);
      window.dispatchEvent(new Event('mock-kb-change'));
      return;
  }
  const ref = doc(collection(db, 'users', userId, 'knowledge_base'), item.id);
  await safeWrite(() => setDoc(ref, removeUndefined({ ...item, timestamp: Timestamp.fromMillis(item.timestamp) })));
};

export const updateKnowledgeItem = async (userId: string, item: KnowledgeItem) => {
  if (isMock) {
      let all = getMockData(`avallen_${userId}_kb`);
      const index = all.findIndex((k: KnowledgeItem) => k.id === item.id);
      if (index >= 0) {
          all[index] = item;
          setMockData(`avallen_${userId}_kb`, all);
          window.dispatchEvent(new Event('mock-kb-change'));
      }
      return;
  }
  const ref = doc(collection(db, 'users', userId, 'knowledge_base'), item.id);
  await safeWrite(() => setDoc(ref, removeUndefined({ ...item, timestamp: Timestamp.fromMillis(item.timestamp) }), { merge: true }));
};

export const deleteKnowledgeItem = async (userId: string, itemId: string) => {
  if (isMock) {
      let all = getMockData(`avallen_${userId}_kb`);
      all = all.filter((k: KnowledgeItem) => k.id !== itemId);
      setMockData(`avallen_${userId}_kb`, all);
      window.dispatchEvent(new Event('mock-kb-change'));
      return;
  }
  const ref = doc(collection(db, 'users', userId, 'knowledge_base'), itemId);
  await safeWrite(() => deleteDoc(ref));
};

export const listenToTasks = (userId: string, callback: (tasks: Task[]) => void) => {
    if (isMock) {
        const data = getMockData(`avallen_${userId}_tasks`);
        callback(data);
        const handler = () => callback(getMockData(`avallen_${userId}_tasks`));
        window.addEventListener('mock-task-change', handler);
        return () => window.removeEventListener('mock-task-change', handler);
    }
    const q = query(collection(db, 'users', userId, 'tasks'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map(d => d.data() as Task);
        callback(tasks);
    }, (error) => checkPermissionError(error));
};

export const updateTask = async (userId: string, task: Task) => {
    if (isMock) {
        let tasks = getMockData(`avallen_${userId}_tasks`);
        const idx = tasks.findIndex((t: Task) => t.id === task.id);
        if (idx >= 0) tasks[idx] = task;
        else tasks.push(task);
        setMockData(`avallen_${userId}_tasks`, tasks);
        window.dispatchEvent(new Event('mock-task-change'));
        return;
    }
    const ref = doc(collection(db, 'users', userId, 'tasks'), task.id);
    await safeWrite(() => setDoc(ref, removeUndefined(task), { merge: true }));
};

export const deleteTask = async (userId: string, taskId: string) => {
    if (isMock) {
        let tasks = getMockData(`avallen_${userId}_tasks`);
        tasks = tasks.filter((t: Task) => t.id !== taskId);
        setMockData(`avallen_${userId}_tasks`, tasks);
        window.dispatchEvent(new Event('mock-task-change'));
        return;
    }
    const ref = doc(collection(db, 'users', userId, 'tasks'), taskId);
    await safeWrite(() => deleteDoc(ref));
};

/** DIRECTIVES **/
export const listenToDirectives = (userId: string, callback: (directives: Directive[]) => void) => {
    if (isMock) {
        const check = () => {
            const data = getMockData(`avallen_${userId}_directives`);
            callback(data);
        }
        check();
        const handler = () => check();
        window.addEventListener('mock-directive-change', handler);
        return () => window.removeEventListener('mock-directive-change', handler);
    }
    const q = query(collection(db, 'users', userId, 'directives'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(d => d.data() as Directive);
        callback(data);
    }, (error) => checkPermissionError(error));
};

export const saveDirective = async (userId: string, directive: Directive) => {
    if (isMock) {
        let list = getMockData(`avallen_${userId}_directives`);
        const idx = list.findIndex((d: Directive) => d.id === directive.id);
        if (idx >= 0) list[idx] = directive;
        else list.push(directive);
        setMockData(`avallen_${userId}_directives`, list);
        window.dispatchEvent(new Event('mock-directive-change'));
        return;
    }
    await safeWrite(() => setDoc(doc(db, 'users', userId, 'directives', directive.id), removeUndefined(directive)));
};

export const deleteDirective = async (userId: string, id: string) => {
    if (isMock) {
        let list = getMockData(`avallen_${userId}_directives`);
        list = list.filter((d: Directive) => d.id !== id);
        setMockData(`avallen_${userId}_directives`, list);
        window.dispatchEvent(new Event('mock-directive-change'));
        return;
    }
    await safeWrite(() => deleteDoc(doc(db, 'users', userId, 'directives', id)));
};
