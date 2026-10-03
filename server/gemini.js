require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateLesson(topic, level = 'B') {
  const levelDescriptions = {
    A: 'A1-A2 Elementary. Simple vocabulary, short sentences, present/past simple tenses, clear everyday expressions.',
    B: 'B1-B2 Intermediate. Richer vocabulary, phrasal verbs, common idioms, varied sentence structures and connectors.',
    C: 'C1-C2 Advanced. Sophisticated vocabulary, subtle idioms, nuanced tone, formal/colloquial richness, complex clauses.'
  };

  const levelDesc = levelDescriptions[level] || levelDescriptions.B;

  const prompt = `You are an expert English language teacher creating a micro-study lesson for a Portuguese-speaking student.
Topic: "${topic}"
Target CEFR Level: ${level} (${levelDesc})

Requirements:
1. Create an engaging, natural, modern English text about the topic appropriate for level ${level}.
   - Length:
     - Level A: 4 to 6 clear, short sentences.
     - Level B: 6 to 8 well-crafted sentences.
     - Level C: 8 to 10 rich, natural sentences.
2. For every sentence, provide the accurate Brazilian Portuguese translation.
3. For each word in each sentence, provide its contextual Portuguese translation and standard IPA phonetic transcription.
4. Extract 3 to 5 key vocabulary terms or expressions from the text with Portuguese explanations and usage examples.
5. Provide the full text and full Portuguese translation.

You MUST respond strictly with a valid JSON object (no markdown backticks, no code fences, only raw JSON):
{
  "title": "Short title in English",
  "titlePt": "Título em português",
  "topic": "${topic}",
  "level": "${level}",
  "fullText": "Full text in English...",
  "fullTranslation": "Texto completo em português...",
  "sentences": [
    {
      "id": 1,
      "text": "Exact sentence in English.",
      "translation": "Tradução exata da frase em português.",
      "words": [
        { "word": "ExactWord", "translation": "tradução no contexto", "phonetic": "/fəˈnɛtɪk/" }
      ]
    }
  ],
  "keyExpressions": [
    {
      "expression": "phrasal verb or key idiom",
      "meaning": "Significado em português",
      "example": "Example sentence using it.",
      "examplePt": "Tradução do exemplo em português."
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    }
  });

  const raw = response.text.trim();
  return JSON.parse(raw);
}

module.exports = { generateLesson };
