import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// In CJS bundle (production), __dirname is provided natively by Node.js.
// In dev (TSX ESM), we fallback cleanly without crashing.
const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper to initialize Gemini API client lazily with telemetry User-Agent
  function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // AI Coach Chat endpoint
  app.post('/api/ai-coach/chat', async (req, res) => {
    try {
      const { message, history, userProfile, currentWeekContext, academicContext } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required.' });
        return;
      }

      const ai = getGeminiClient();

      // System instruction grounding the AI coach with user profile, goals, habits, tasks, subjects, deadlines, and long-term ambitions
      const systemInstruction = `You are the empathetic, intellectually rigorous, and highly motivating AI Academic & Life Coach inside "My Week" — a luxury personal planner and executive study suite.

USER PROFILE & IDENTITY:
- Name: ${userProfile?.name || 'Friend'}
- Stated Life Goals & Dreams:
${
  userProfile?.goals && userProfile.goals.length > 0
    ? userProfile.goals.map((g: string, i: number) => `  ${i + 1}. ${g}`).join('\n')
    : '  (No specific goals set yet)'
}
- Desired Daily Feelings / State of Mind: ${
        userProfile?.desiredFeelings && userProfile.desiredFeelings.length > 0
          ? userProfile.desiredFeelings.join(', ')
          : 'Focused, Grounded, Intellectually Disciplined'
      }

LONG-TERM ACADEMIC & CAREER AMBITIONS (Persisting across all weeks):
${
  academicContext?.longTermGoals && academicContext.longTermGoals.length > 0
    ? academicContext.longTermGoals
        .map(
          (g: any, i: number) =>
            `  • [${g.category?.toUpperCase() || 'GOAL'}] ${g.title} (Target: ${g.targetDate || 'Ongoing'})\n    Why it matters: ${g.whyItMatters || 'Personal excellence'}\n    Milestones: ${
              g.milestones?.map((m: any) => `[${m.completed ? '✓' : ' '}] ${m.text}`).join('; ') || 'None'
            }`
        )
        .join('\n')
    : '  • General Academic & Personal Mastery'
}

ACADEMIC SUBJECTS & STUDY LOGS (Current School Year / This Week):
${
  academicContext?.subjects && academicContext.subjects.length > 0
    ? academicContext.subjects
        .map(
          (s: any) =>
            `  • ${s.name}: ${s.totalLoggedHours || 0} hrs logged / ${s.weeklyTargetHours || 0} hrs target (${s.progressPercent || 0}%)\n    Current Topic: "${s.currentTopic || 'Core curriculum'}"`
        )
        .join('\n')
    : '  (No specific academic subjects configured yet)'
}

UPCOMING EXAMS & ASSIGNMENT DEADLINES (With Countdown):
${
  academicContext?.deadlines && academicContext.deadlines.length > 0
    ? academicContext.deadlines
        .map(
          (d: any) =>
            `  • [${d.type?.toUpperCase() || 'DEADLINE'}] ${d.title} (${d.subjectName || 'General'})\n    Due Date: ${d.dueDate} (${d.daysRemainingText || 'Upcoming'})\n    Priority: ${d.priority?.toUpperCase()} | Status: ${d.status}\n    Notes: ${d.notes || 'None'}`
        )
        .join('\n')
    : '  • No urgent deadlines this week'
}

CURRENT WEEK CONTEXT (${currentWeekContext?.startOfWeek || 'Active Week'}):
- Today is: ${currentWeekContext?.currentDay || 'Today'} (${currentWeekContext?.currentDate || ''})
- Weekly Focus: "${currentWeekContext?.focus || 'None set'}"
- Weekly Reward: "${currentWeekContext?.reward || 'None set'}"
- Affirmation: "${currentWeekContext?.affirmation || 'None set'}"
- Overall Task Progress: ${currentWeekContext?.completedTasksCount || 0} completed / ${currentWeekContext?.totalTasksCount || 0} total tasks (${currentWeekContext?.overallCompletionRate || 0}%)
- Off / Quiet Rest Days: ${currentWeekContext?.offDaysSummary || 'None set'}
- Daily Tasks Breakdown:
${currentWeekContext?.daysSummary || 'No tasks logged'}
- Weekly Habits Tracked:
${currentWeekContext?.habitsSummary || 'No habits logged'}

COACHING MANDATE & GUIDELINES:
1. Greet the user by name (${userProfile?.name || 'there'}) in an inspiring, refined, editorial tone (warm, confident, intellectual, and practical).
2. QUIET MODE & NO-GUILT REST DAYS:
   - Days marked as "Off / Rest / Sick / Travel" are designated Quiet Days. Habits and tasks on these days are completely exempt from streaks and completion rate requirements.
   - NEVER comment on or count an Off day as a miss, failure, or lack of discipline. Explicitly support restorative sleep, mental recovery, or travel when relevant.
3. DEEPLY CONNECT DAILY TASKS TO LONG-TERM GOALS:
   - Always relate daily efforts to their big ambitions (e.g. National Entrance Exam, Scholarship applications, Study Abroad dreams, Research milestones).
   - Suggest concrete micro-tasks that advance specific long-term milestones (e.g., "Draft Section 2 of your scholarship manifesto today").
4. ACADEMIC TIME AUDITING & EXAM READINESS:
   - Actively cross-reference upcoming exams with current study hours logged.
   - If an exam is 2-5 days away and the subject's study hours are lagging behind target, explicitly highlight the risk and recommend focused 60-90 minute deep-study blocks with active recall / past paper problem sets.
5. ACTIONABLE 1-2-3 PLANS:
   - When asked "what should I do today" or "how to prepare", construct a structured, prioritized 1-2-3 daily roadmap balancing urgent academic deadlines, long-term ambitions, and core habits.
6. CELEBRATE MOMENTUM & PROVIDE GENTLE RE-ALIGNMENT:
   - Celebrate streaks and logged study hours. Offer compassionate, strategic adjustments when days were missed without inducing guilt.
7. Keep responses elegant, well-formatted (using bolding, clear bullet points, and concise paragraphs), and free from generic platitudes.`;

      if (!ai) {
        // Fallback response if API key is not configured
        const fallbackText = `Hello ${userProfile?.name || 'there'}! I'm your My Week Academic & Life Coach.

I am grounded in your long-term ambitions:
${academicContext?.longTermGoals?.map((g: any) => `• ${g.title}`).join('\n') || '• Your academic and personal excellence'}

Current Academic Snapshot:
• Active Subjects: ${academicContext?.subjects?.length || 0} subjects tracked
• Upcoming Deadlines: ${academicContext?.deadlines?.length || 0} exams & assignments on your horizon
• Weekly Tasks: ${currentWeekContext?.completedTasksCount || 0}/${currentWeekContext?.totalTasksCount || 0} done (${currentWeekContext?.overallCompletionRate || 0}%)

Tip: Connect your Gemini API Key in Settings to enable real-time intelligent study scheduling, exam countdown analysis, and scholarship strategy!`;

        res.json({
          reply: fallbackText,
          suggestedActions: [
            {
              label: 'Exam Prep Audit',
              prompt: 'How should I allocate my study hours for upcoming exams?',
            },
            {
              label: 'Scholarship Milestone Check',
              prompt: 'Suggest daily tasks to move my scholarship and long-term goals forward.',
            },
            {
              label: 'Daily 1-2-3 Plan',
              prompt: 'What should I prioritize today given my deadlines and study targets?',
            },
          ],
        });
        return;
      }

      // Build conversation contents
      const conversationContents: any[] = [];

      // Add recent history if provided
      if (Array.isArray(history) && history.length > 0) {
        history.slice(-8).forEach((msg: any) => {
          conversationContents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
          });
        });
      }

      // Add the current user message
      conversationContents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: conversationContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || 'I analyzed your week. Let me know how else I can help you stay aligned with your goals!';

      res.json({
        reply: replyText,
      });
    } catch (error: any) {
      console.error('Error in AI Coach chat endpoint:', error);
      res.status(500).json({
        error: error.message || 'Failed to generate coach response.',
        reply: "I ran into a temporary issue analyzing your week's data. Please try asking again in a moment.",
      });
    }
  });

  // TTS Speech Synthesis endpoint using Gemini TTS
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, voice = 'Kore' } = req.body;

      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'Text is required.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({ error: 'Gemini API not configured' });
        return;
      }

      const cleanText = text
        .replace(/[*_~`#>-]/g, ' ')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 1200);

      const validVoices = ['Kore', 'Puck', 'Zephyr', 'Fenrir', 'Charon'];
      const selectedVoice = validVoices.includes(voice) ? voice : 'Kore';

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: cleanText }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      const mimeType =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType ||
        'audio/pcm;rate=24000';

      if (base64Audio) {
        res.json({ audioBase64: base64Audio, mimeType });
      } else {
        res.status(500).json({ error: 'No audio returned from Gemini TTS' });
      }
    } catch (error: any) {
      console.error('Error in TTS endpoint:', error);
      res.status(500).json({ error: error.message || 'TTS generation failed' });
    }
  });

  // Language Practice Chat endpoint
  app.post('/api/language-practice/chat', async (req, res) => {
    try {
      const {
        message,
        targetLanguage = 'Spanish',
        proficiency = 'intermediate',
        practiceMode = 'conversation',
        scenario = 'Everyday conversation & routine',
        history = [],
      } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required.' });
        return;
      }

      const ai = getGeminiClient();

      if (!ai) {
        // Fallback response if API key is not configured
        res.json({
          reply: `¡Hola! Practicing ${targetLanguage} is a wonderful habit.`,
          translation: `Hello! Practicing ${targetLanguage} is a wonderful habit.`,
          pronunciationGuide: 'EE-lah!',
          corrections: [],
          vocabulary: [
            {
              word: 'Práctica',
              translation: 'Practice',
              notes: 'Essential daily habit for fluency',
            },
          ],
        });
        return;
      }

      const systemInstruction = `You are an encouraging, expert native language tutor and conversation partner specializing in ${targetLanguage}.
You help the learner practice both SPEAKING and WRITING in ${targetLanguage}.

LEARNER PROFILE:
- Target Language: ${targetLanguage}
- Proficiency Level: ${proficiency} (${
        proficiency === 'beginner'
          ? 'CEFR A1-A2: Keep responses concise, clear, and easy to parse.'
          : proficiency === 'intermediate'
          ? 'CEFR B1-B2: Natural conversational dialogue, authentic idioms, gentle expansions.'
          : 'CEFR C1-C2: Rich vocabulary, native subtleties, intellectual flow.'
      })
- Practice Mode: ${practiceMode} (Mode details: ${
        practiceMode === 'roleplay'
          ? `Immersive Roleplay: "${scenario}". Stay in character while guiding the conversation.`
          : practiceMode === 'writing_critique'
          ? 'Writing Critique: Thoroughly inspect the learner’s text, identify grammar/spelling/phrasing nuances, and provide constructive rewrites.'
          : practiceMode === 'pronunciation'
          ? 'Pronunciation & Speaking Drill: Offer phrases to read aloud, give phonetic breakdowns, and cheer the learner on.'
          : 'Free Flowing Dialogue: Ask engaging follow-up questions to keep the conversation going.'
      })

CRITICAL OUTPUT FORMAT:
You MUST respond with a valid JSON object ONLY (do not wrap in markdown quotes if possible, or use standard raw JSON) matching this exact schema:
{
  "reply": "Your conversational response written entirely in ${targetLanguage}",
  "translation": "Accurate English translation of your reply",
  "pronunciationGuide": "Phonetic pronunciation guide or romanization (e.g. Romaji/Pinyin/Transliteration if non-Latin, or helpful pronunciation tips for tricky vowels/accents)",
  "corrections": [
    {
      "original": "The word or phrase the learner used with a mistake or awkward phrasing (leave empty if none)",
      "improved": "The natural, grammatically correct way to say it",
      "explanation": "Brief, friendly explanation of why this sounds more native"
    }
  ],
  "vocabulary": [
    {
      "word": "New or useful word/phrase from your reply",
      "phonetic": "Pronunciation hint",
      "translation": "English meaning",
      "notes": "Context or usage tip"
    }
  ]
}

Ensure "corrections" is an empty array if the learner made no errors. Always keep "reply" natural and conversational!`;

      // Build conversation history
      const conversationContents: any[] = [];
      if (Array.isArray(history) && history.length > 0) {
        history.slice(-6).forEach((msg: any) => {
          conversationContents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
          });
        });
      }

      conversationContents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: conversationContents,
        config: {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      });

      const rawJson = response.text || '{}';
      try {
        const parsed = JSON.parse(rawJson);
        res.json(parsed);
      } catch (parseErr) {
        console.warn('Failed to parse JSON response from language tutor, returning raw text', parseErr);
        res.json({
          reply: response.text,
          translation: 'See response above.',
          corrections: [],
          vocabulary: [],
        });
      }
    } catch (error: any) {
      console.error('Error in language practice endpoint:', error);
      res.status(500).json({
        error: error.message || 'Failed to generate language tutor response.',
        reply: 'Let us try that again! What would you like to say in your target language?',
        translation: '',
        corrections: [],
        vocabulary: [],
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Serve static assets from public directory in dev and production
  app.use(express.static(path.join(currentDir, 'public')));

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`My Week server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
