
import { GoogleGenAI, Content, Part, Tool, Type, GenerateContentResponse } from "@google/genai";
import { Agent, Message, KnowledgeItem, GroundingMetadata, ChartData, Directive, EmailDraft, CalendarEvent } from "../types";

const MAX_HISTORY_LENGTH = 30;

const formatHistory = (messages: Message[]): Content[] => {
  const recentMessages = messages.length > MAX_HISTORY_LENGTH 
    ? messages.slice(messages.length - MAX_HISTORY_LENGTH) 
    : messages;

  return recentMessages.map(m => {
    const parts: Part[] = [];
    if (m.attachments && m.attachments.length > 0) {
      m.attachments.forEach(att => {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });
    }
    parts.push({ text: m.isUser ? m.content : `${m.senderName}: ${m.content}` });
    return { role: m.isUser ? 'user' : 'model', parts: parts };
  });
};

const CORE_DIRECTIVES = `
--- UNBREAKABLE CORE DIRECTIVES ---
1. TRUTHFULNESS: Your primary duty is to be truthful and accurate. NEVER invent facts or provide speculative information.
2. ADMIT IGNORANCE: If you do not know the answer to a question or lack sufficient information from the provided context (Knowledge Base, conversation history), you MUST state that you do not have the information.
3. SOURCE OF TRUTH: The provided Shared Knowledge Base is your primary and single source of truth for internal matters regarding AlkaTara.
4. CITATION REQUIREMENT: You must explicitly reference the Knowledge Base when you use it.
5. PROTOCOL PRIORITY: Your Core Directives take absolute priority over your persona.
6. ACTION LIMITATION: You can only reply in the chat windows.
7. EXTERNAL VERIFICATION: For real-world data not in the KB, you MUST use the Google Search tool.
`;

interface AgentResponse {
  text: string;
  groundingMetadata?: GroundingMetadata;
  chartData?: ChartData;
  canvasUpdate?: { title: string; content: string; };
  emailDraft?: EmailDraft;
  calendarEvent?: CalendarEvent;
  contextUsed?: string;
}

const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status === 503 || error.status === 429 || error.status === 500 || error.message?.includes('fetch'))) {
      console.warn(`API Call failed. Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const generateAgentResponse = async (
  currentAgent: Agent,
  activeAgents: Agent[],
  history: Message[],
  knowledgeBase: KnowledgeItem[],
  contextInstruction?: string,
  isDevilsAdvocateMode?: boolean,
  isDeepResearchMode?: boolean,
  currentCanvasContent?: string,
  userDirectives: Directive[] = [],
  modelName: string = 'gemini-2.5-flash'
): Promise<AgentResponse> => {
  if (!process.env.API_KEY) return { text: "Error: API Key is missing. Please check your configuration." };

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare Knowledge Base Context
  const kbContext = knowledgeBase.length > 0 
    ? knowledgeBase.map(k => `[${k.category}] ${k.title}: ${k.content}`).join('\n')
    : "No shared knowledge recorded yet.";

  const otherAgents = activeAgents.filter(a => a.id !== currentAgent.id);
  const colleagueContext = otherAgents.length > 0
    ? `You are currently in a conversation with the following colleagues. You can reference their expertise if necessary, but do not speak for them:\n${otherAgents.map(a => `- ${a.name} ${a.surname} (${a.role}): ${a.expertise}`).join('\n')}`
    : "You are speaking with the user individually.";

  const devilsAdvocateInstruction = isDevilsAdvocateMode
    ? `\n\n⚠️ DEVIL'S ADVOCATE MODE ACTIVE ⚠️\n- You MUST critically challenge the user's assumptions.\n- Look for flaws, risks, legal loopholes, or technical bottlenecks.`
    : "";

  const deepResearchInstruction = isDeepResearchMode
    ? `\n\n🔍 DEEP RESEARCH MODE ACTIVE 🔍\n- Reason extensively. Use Google Search to triangulate facts.`
    : "";

  const canvasContext = currentCanvasContent 
    ? `\n\n📝 CURRENT CANVAS CONTENT 📝\n\`\`\`\n${currentCanvasContent}\n\`\`\`\nIf the user asks for edits, output the FULL updated document in 'canvas_update'.`
    : `\n\n📝 CANVAS AVAILABLE 📝\nTo write long-form content (code, articles), use 'canvas_update' JSON.`;

  const groupDynamicsInstruction = activeAgents.length > 1 
    ? `\nIMPORTANT GROUP DYNAMICS:\n- Do NOT start your response with "As [Name] said...".\n- Provide *new, additive value* based on your role (${currentAgent.role}).`
    : "";

  // Format User Directives
  const activeDirectives = userDirectives.filter(d => d.active).map((d, i) => `${i+1}. ${d.content}`).join('\n');
  const userDirectivesBlock = activeDirectives ? `\n--- USER-DEFINED PROTOCOLS ---\nThe user has defined these additional mandatory rules:\n${activeDirectives}` : "";

  const currentDate = new Date();
  const timeContext = `CURRENT DATE AND TIME: ${currentDate.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}.`;

  const finalSystemInstruction = `
    ${CORE_DIRECTIVES}
    ${userDirectivesBlock}
    ${timeContext}
    
    --- AGENT PROFILE ---
    Name: ${currentAgent.name} ${currentAgent.surname}
    Role: ${currentAgent.role}
    
    --- PERSONAL BACKSTORY ---
    ${currentAgent.backstory}
    
    --- SYSTEM INSTRUCTIONS ---
    ${currentAgent.systemInstruction}

    --- CONTEXTUAL AWARENESS ---
    1. COLLEAGUES PRESENT:
    ${colleagueContext}

    2. SHARED KNOWLEDGE BASE:
    ${kbContext}

    ${devilsAdvocateInstruction}
    ${deepResearchInstruction}
    ${canvasContext}
    ${groupDynamicsInstruction}

    3. INSTRUCTIONS & OUTPUT FORMATS:
    - Use Markdown.
    - **Action: Save to KB**: \`\`\`json { "new_kb_entry": { "title": "...", "category": "...", "content": "..." } } \`\`\`
    - **Action: Create Task**: \`\`\`json { "new_task": { "title": "...", "description": "...", "priority": "...", "assignee": "...", "dueDate": "..." } } \`\`\`
    - **Action: Chart**: \`\`\`json { "chart_data": { "title": "...", "type": "BAR|LINE|PIE", "labels": [], "datasets": [] } } \`\`\`
    - **Action: Update Canvas**: \`\`\`json { "canvas_update": { "title": "...", "content": "..." } } \`\`\`
    - **Action: Draft Email**: \`\`\`json { "draft_email": { "to": "...", "subject": "...", "body": "..." } } \`\`\`
    - **Action: Schedule Meeting**: \`\`\`json { "schedule_meeting": { "title": "...", "startTime": "YYYY-MM-DDTHH:MM", "endTime": "YYYY-MM-DDTHH:MM", "description": "...", "location": "..." } } \`\`\`
    
    ${contextInstruction || ''}
  `;

  try {
    const contents = formatHistory(history);
    const tools: Tool[] = [{ googleSearch: {} }];
    
    // Set thinking budget based on model capabilities
    // Gemini 3 Pro max budget: 32768
    // Gemini 2.5 Flash max budget: 24576
    let thinkingBudget = isDeepResearchMode ? 8192 : undefined;
    if (isDeepResearchMode && modelName === 'gemini-3-pro-preview') {
        thinkingBudget = 16384; // Allow more thinking for Pro
    }

    const thinkingConfig = isDeepResearchMode ? { thinkingBudget } : undefined; 

    const apiCall = () => ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: finalSystemInstruction,
        temperature: isDevilsAdvocateMode ? 0.7 : 0.5, 
        tools: tools,
        thinkingConfig: thinkingConfig 
      }
    });

    const timeoutPromise = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out")), 90000) // Extended timeout for Pro models
    );

    const response = await retryWithBackoff(() => Promise.race([apiCall(), timeoutPromise]));
    
    let text = response.text;
    if (!text) throw new Error("Received empty response from agent");

    let chartData: ChartData | undefined;
    let canvasUpdate: { title: string; content: string } | undefined;
    let emailDraft: EmailDraft | undefined;
    let calendarEvent: CalendarEvent | undefined;
    
    const extractJson = (regex: RegExp, sourceText: string): any | null => {
        const match = sourceText.match(regex);
        if (match && match[1]) {
            try { return JSON.parse(match[1]); } catch (e) {
                try { return JSON.parse(match[1].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')); } 
                catch (e2) { return null; }
            }
        }
        return null;
    };

    // Extract Charts
    const chartRegex = /```json\s*(\{[\s\S]*?"chart_data"[\s\S]*?\})\s*```/;
    const chartJson = extractJson(chartRegex, text);
    if (chartJson?.chart_data) {
        chartData = chartJson.chart_data;
        text = text.replace(chartRegex, '').trim();
    }

    // Extract Canvas
    const canvasRegex = /```json\s*(\{[\s\S]*?"canvas_update"[\s\S]*?\})\s*```/;
    const canvasJson = extractJson(canvasRegex, text);
    if (canvasJson?.canvas_update) {
        canvasUpdate = canvasJson.canvas_update;
        text = text.replace(canvasRegex, '').trim();
        if (text.length < 50) text += "\n\n(I have updated the Canvas with the details.)";
    }

    // Extract Email Drafts
    const emailRegex = /```json\s*(\{[\s\S]*?"draft_email"[\s\S]*?\})\s*```/;
    const emailJson = extractJson(emailRegex, text);
    if (emailJson?.draft_email) {
        emailDraft = emailJson.draft_email;
        text = text.replace(emailRegex, '').trim();
        if (text.length < 50) text += "\n\n(I have drafted an email for you.)";
    }

    // Extract Calendar Events
    const calRegex = /```json\s*(\{[\s\S]*?"schedule_meeting"[\s\S]*?\})\s*```/;
    const calJson = extractJson(calRegex, text);
    if (calJson?.schedule_meeting) {
        calendarEvent = calJson.schedule_meeting;
        text = text.replace(calRegex, '').trim();
        if (text.length < 50) text += "\n\n(I have prepared a calendar invite.)";
    }
    
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata as GroundingMetadata | undefined;

    // Build a simplified context string for transparency
    const contextSummary = `Model: ${modelName}\nActive Agents: ${activeAgents.map(a => a.name).join(', ')}\nKnowledge Base Size: ${knowledgeBase.length} items\nActive Directives: ${userDirectives.filter(d => d.active).length}\nModes: ${isDeepResearchMode ? 'Deep Research' : ''} ${isDevilsAdvocateMode ? 'Devil\'s Advocate' : ''}`;

    return { text, groundingMetadata, chartData, canvasUpdate, emailDraft, calendarEvent, contextUsed: contextSummary };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const errorMessage = error.message?.includes('timed out') 
        ? "I apologize, but my thought process timed out. Please ask again." 
        : `I encountered an error processing your request (${error.status || error.message || 'Unknown'}). Please try again.`;
    return { text: errorMessage };
  }
};

export const autoFormatKnowledge = async (rawText: string): Promise<{ title: string, category: string, content: string } | null> => {
    if (!process.env.API_KEY) return null;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Format as KB entry. RAW: "${rawText}"`;
    try {
        const response = (await retryWithBackoff(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        category: { type: Type.STRING },
                        content: { type: Type.STRING }
                    },
                    required: ['title', 'category', 'content']
                }
            }
        }))) as GenerateContentResponse;
        return response.text ? JSON.parse(response.text) : null;
    } catch (error) { return null; }
};

export const analyzeFile = async (base64Data: string, mimeType: string): Promise<{ title: string, summary: string, category: string } | null> => {
    if (!process.env.API_KEY) return null;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze for AlkaTara. Identify type, summarize, categorize (STRATEGY, KPI, LEGAL, PRODUCT, OTHER).`;
    try {
        const response = (await retryWithBackoff(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [ { inlineData: { mimeType, data: base64Data } }, { text: prompt } ]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        category: { type: Type.STRING }
                    },
                    required: ['title', 'summary', 'category']
                }
            }
        }))) as GenerateContentResponse;
        return response.text ? JSON.parse(response.text) : null;
    } catch (error) { return null; }
};
