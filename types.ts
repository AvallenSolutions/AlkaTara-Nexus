
export enum ChatMode {
  INDIVIDUAL = 'INDIVIDUAL',
  FOCUS_GROUP = 'FOCUS_GROUP',
  WHOLE_SUITE = 'WHOLE_SUITE'
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export interface Directive {
    id: string;
    content: string;
    active: boolean;
    createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee?: string; // Agent Name or 'User'
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: number; // Timestamp
  createdAt: number;
}

export interface ChartData {
  title: string;
  type: 'BAR' | 'LINE' | 'PIE';
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

export interface CanvasDocument {
  title: string;
  content: string; // Markdown/Code
  language: string; // 'markdown', 'javascript', etc.
  lastUpdatedBy: string;
  lastUpdatedAt: number;
}

export interface Agent {
  id: string;
  name: string; // First Name
  surname: string;
  role: string;
  expertise: string;
  systemInstruction: string;
  backstory: string;
  avatarUrl?: string;
  avatarColor: string; // Fallback
  isCustom?: boolean;
  voiceURI?: string; // For TTS
  gender?: 'male' | 'female'; // New field for Voice Selection
}

export interface EmailDraft {
    to: string;
    subject: string;
    body: string;
}

export interface CalendarEvent {
    title: string;
    startTime: string; // ISO
    endTime: string; // ISO
    description: string;
    location?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string; // 'User' or Agent Name
  content: string;
  timestamp: number;
  isUser: boolean;
  attachments?: Attachment[];
  groundingMetadata?: GroundingMetadata;
  chartData?: ChartData; 
  canvasAction?: {
    type: 'UPDATE' | 'CREATE';
    title?: string;
  };
  emailDraft?: EmailDraft;
  calendarEvent?: CalendarEvent;
  feedback?: 'UP' | 'DOWN';
  contextUsed?: string; // For debugging/transparency
  status?: 'SENDING' | 'SENT' | 'ERROR'; // New field for tracking message state
}

export interface GroundingMetadata {
  searchEntryPoint?: {
    renderedContent?: string;
  };
  groundingChunks?: {
    web?: {
      uri: string;
      title: string;
    };
  }[];
}

export interface Attachment {
  mimeType: string;
  data: string; // Base64
  name: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  mode: ChatMode;
  participantIds: string[];
  createdAt: number;
  lastMessageAt: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export type KnowledgeType = 'NOTE' | 'FILE' | 'LINK';

export interface KnowledgeItem {
  id: string;
  type: KnowledgeType;
  folderId: string | null; // null = root
  title: string;
  content: string; // Summary for files, Content for notes
  category: 'STRATEGY' | 'KPI' | 'LEGAL' | 'PRODUCT' | 'OTHER';
  
  // File/Link Specifics
  fileName?: string;
  fileMimeType?: string;
  fileData?: string; // Base64
  url?: string;
  
  createdBy: string;
  timestamp: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}
