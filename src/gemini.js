import Groq from "groq-sdk";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const groq = new Groq({ apiKey: API_KEY, dangerouslyAllowBrowser: true });

/* ── JSON extractor ─────────────────────────── */
const extractJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) throw new Error("Could not extract JSON from response.");
    return JSON.parse(match[0].replace(/```json/gi, '').replace(/```/gi, ''));
  }
};

/* ── Script enforcement note (injected into every prompt) ─── */
const SCRIPT_RULE = (lang) => `
CRITICAL SCRIPT RULE: Every single word/character in ${lang} MUST use its own native script.
- Telugu → తెలుగు script (e.g. నమస్కారం, నేను, వెళ్తున్నాను)
- Hindi → हिंदी/Devanagari script (e.g. नमस्ते, मैं, खाना)
- Tamil → தமிழ் script (e.g. வணக்கம், நான், சாப்பிடுகிறேன்)
- Kannada → ಕನ್ನಡ script (e.g. ನಮಸ್ಕಾರ, ನಾನು, ಊಟ)
- English → English Latin letters
NEVER use romanization, transliteration, or English letters for Indian languages.
A response like "main khaana khaata hoon" for Hindi is WRONG. "मैं खाना खाता हूँ" is CORRECT.
`;

/* ═══════════════════════════════════════════════════
   1. LEVEL CONTENT — story + questions (levels only)
═══════════════════════════════════════════════════ */
export const generateLevelContent = async (learningLanguage, nativeLanguage, levelId, levelDifficulty) => {
  const numQuestions = parseInt(levelId) + 1; // Level 1 = 2, Level 2 = 3, etc.
  const targetWordCount = 40 + (parseInt(levelId) * 20); // Scaled word count

  const prompt = `You are an expert language teacher creating a compelling, culturally relevant story-based exercise.

Learning Language: ${learningLanguage}
Native Language: ${nativeLanguage}
Level: ${levelId}
Difficulty: ${levelDifficulty} (1=easiest, 5=hardest)

${SCRIPT_RULE(learningLanguage)}

Generate EXACTLY ${numQuestions} questions based on the story.

Return ONLY this JSON (no markdown, no extra text):

{
  "story_text_learning": "A rich, logical, and interesting narrative story of approximately ${targetWordCount} words written entirely in the PURE NATIVE SCRIPT of ${learningLanguage}. The narrative depth and vocabulary should scale up with the ${levelDifficulty} difficulty.",
  "story_text_native": "The exact translation of the story in ${nativeLanguage}",
  "questions": [
    {
      "id": 1,
      "text_native": "A clear question formatted in ${nativeLanguage} based on the story",
      "correct_answer_tiles": ["word1", "word2", "word3"],
      "correct_answer_native": "The meaning of the correct answer sentence in ${nativeLanguage}",
      "available_tiles": ["word1", "word2", "word3", "distractor1", "distractor2", "distractor3"]
    }
  ]
}

CRITICAL RULES:
1. PURE NATIVE SCRIPT: Under NO CIRCUMSTANCES should you use English letters/transliteration for ${learningLanguage}. You MUST write in its actual alphabet/script (e.g. தமிழ், हिंदी, తెలుగు).
2. PERFECT SPLIT: The 'correct_answer_tiles' array MUST contain the exact words of the answer split word-by-word perfectly. Do NOT skip any words required to form the correct answer.
3. available_tiles = all correct_answer_tiles words PLUS exactly 3 distractor words in ${learningLanguage} script.
4. Distractors must be plausible ${learningLanguage} words, not random.
5. Generate EXACTLY ${numQuestions} questions.
6. Questions must test comprehension of the story directly.
7. Difficulty ${levelDifficulty}: ${levelDifficulty <= 2 ? 'use simple vocabulary, present tense, and very short sentences' : levelDifficulty <= 3 ? 'use moderate vocabulary, compound sentences, and introduce past tense' : 'use complex grammar, advanced vocabulary, richer narrative, and mixed tenses'}.

Return ONLY raw JSON.`;

  try {
    const result = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a perfect JSON generator for language learning content. Output ONLY valid JSON. Never use romanization for Indian language scripts." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    return extractJSON(result.choices[0].message.content);
  } catch (error) {
    console.error("Groq level content error:", error);
    throw new Error("Failed to generate level content. Please try again.");
  }
};

/* ═══════════════════════════════════════════════════
   2. ANSWER VALIDATION
═══════════════════════════════════════════════════ */
export const validateAnswer = async (userSentence, correctSentence, learningLanguage, questionContext) => {
  // Fast local check first
  const normalize = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  if (normalize(userSentence) === normalize(correctSentence)) {
    return { is_correct: true, similarity_score: 1.0 };
  }

  const prompt = `You are an answer validator for a ${learningLanguage} language learning app.

Question: ${questionContext}
User's Answer: "${userSentence}"
Correct Answer: "${correctSentence}"

Compare the MEANING (not exact spelling/order). 
- If the meaning is essentially the same → is_correct: true
- If words are missing or meaning changes → is_correct: false
- Allow minor grammatical variations

Return ONLY this JSON: {"is_correct": true_or_false, "similarity_score": 0.0_to_1.0}`;

  try {
    const result = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Answer validator. Return only JSON." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      temperature: 0.1,
    });
    return extractJSON(result.choices[0].message.content);
  } catch {
    // Fallback: exact match
    return {
      is_correct: normalize(userSentence) === normalize(correctSentence),
      similarity_score: normalize(userSentence) === normalize(correctSentence) ? 1.0 : 0.0
    };
  }
};

/* ═══════════════════════════════════════════════════
   3. BASICS DATA — flashcards for the Basics page
═══════════════════════════════════════════════════ */
export const generateBasicsData = async (learningLanguage, nativeLanguage) => {
  const prompt = `You are an expert language teacher.

Generate beginner basics for learning ${learningLanguage} for a ${nativeLanguage} speaker.

${SCRIPT_RULE(learningLanguage)}

ReOutput STRICTLY in JSON format:
{
  "alphabet": "Name the script used and provide 8-12 fundamental letters/vowels as an example.",
  "pronunciation": "Provide a detailed paragraph on how pronunciation/tones and vowels generally work in ${learningLanguage}.",
  "sentenceStructure": "Explain the grammar and sentence structure (e.g., Subject-Object-Verb) with clear examples showing the differences to ${nativeLanguage}.",
  "flashcards": [
    { "term": "phrase in ${learningLanguage} native script", "definition": "meaning in ${nativeLanguage}", "category": "Travel" },
    { "term": "phrase in ${learningLanguage} native script", "definition": "meaning in ${nativeLanguage}", "category": "Dining" },
    { "term": "phrase in ${learningLanguage} native script", "definition": "meaning in ${nativeLanguage}", "category": "Greeting" },
    { "term": "phrase in ${learningLanguage} native script", "definition": "meaning in ${nativeLanguage}", "category": "Emergency" },
    { "term": "phrase in ${learningLanguage} native script", "definition": "meaning in ${nativeLanguage}", "category": "Core Words" },
    { "term": "phrase in ${learningLanguage} native script", "definition": "meaning in ${nativeLanguage}", "category": "Core Words" },
    { "term": "phrase in ${learningLanguage} native script", "definition": "meaning in ${nativeLanguage}", "category": "Travel" },
    { "term": "phrase in ${learningLanguage} native script", "definition": "meaning in ${nativeLanguage}", "category": "Dining" },
    { "term": "phrase in ${learningLanguage} native script", "definition": "meaning in ${nativeLanguage}", "category": "Greeting" },
    { "term": "phrase in ${learningLanguage} native script", "definition": "meaning in ${nativeLanguage}", "category": "Emergency" },
    { "term": "phrase in ${learningLanguage} native script", "definition": "meaning in ${nativeLanguage}", "category": "Core Words" },
    { "term": "phrase in ${learningLanguage} native script", "definition": "meaning in ${nativeLanguage}", "category": "Core Words" }
  ]
}

Return ONLY raw JSON. Generate exactly 12 highly useful real-life flashcard phrases across multiple categories. ${learningLanguage} script. NO romanization. NO English transliteration.
Return ONLY raw JSON.`;

  try {
    const result = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Perfect JSON generator. Never romanize Indian language scripts." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.6,
    });
    return extractJSON(result.choices[0].message.content);
  } catch (error) {
    console.error("Groq basics error:", error);
    throw new Error("Failed to load basics content.");
  }
};

/* ═══════════════════════════════════════════════════
   4. BASICS QUIZ — 6 MCQ questions, no stories
═══════════════════════════════════════════════════ */
export const generateBasicsQuiz = async (learningLanguage, nativeLanguage) => {
  const prompt = `You are an expert language quiz generator.

Create a 6-question beginner quiz to test knowledge of ${learningLanguage} for a speaker of ${nativeLanguage}. Make sure the questions are reasonable, basic, and understandable for an early learner.

${SCRIPT_RULE(learningLanguage)}

Question types:
- "mcq": Show a ${learningLanguage} word → pick the correct ${nativeLanguage} meaning
- "reverse": Show a ${nativeLanguage} meaning → pick the correct ${learningLanguage} word

Return ONLY this JSON:

{
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "Question text in ${nativeLanguage}",
      "word_in_learning_lang": "The ${learningLanguage} word/phrase being tested (pure native script)",
      "options": ["option1 in ${nativeLanguage}", "option2", "option3", "option4"],
      "correct": "the correct option (exact match to one of options)",
      "explanation": "One sentence explanation in ${nativeLanguage} — usage tip or memory trick."
    }
  ]
}

RULES:
1. Generate exactly 6 questions.
2. Mix types: 2 "mcq", 2 "reverse", and 2 "listen" or any blend.
3. All 4 options must be distinct and plausible — no obviously wrong answers.
4. Shuffle the correct answer position randomly across the 4 options (don't always put it first).
5. Cover these topics across the 6 questions: greetings, numbers, basic verbs, food/dining, travel/directions.
6. Return ONLY raw JSON.`;

  try {
    const result = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Perfect JSON quiz generator. Never romanize Indian scripts. Generate exactly 6 questions." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    const data = extractJSON(result.choices[0].message.content);
    // Enforce max 6 questions
    if (data.questions?.length > 6) data.questions = data.questions.slice(0, 6);
    return data;
  } catch (error) {
    console.error("Groq quiz error:", error);
    throw new Error("Failed to generate quiz.");
  }
};

/* ═══════════════════════════════════════════════════
   5. PLACEMENT TEST — 3 direct translation questions, NO story
═══════════════════════════════════════════════════ */
export const generatePlacementTest = async (learningLanguage, nativeLanguage) => {
  const prompt = `You are a language assessor creating a placement test.

Task: Generate exactly 3 direct translation questions from ${nativeLanguage} to ${learningLanguage}.
NO stories. NO context paragraphs. Just direct sentence translation questions.

${SCRIPT_RULE(learningLanguage)}

Return ONLY this JSON:

{
  "questions": [
    {
      "id": 1,
      "text_native": "A short, complete sentence to be translated, written in ${nativeLanguage}. E.g., 'How are you?' or 'I want water.'",
      "correct_answer_tiles": ["word1", "word2", "word3"],
      "available_tiles": ["word1", "word2", "word3", "distractor1", "distractor2", "distractor3"]
    }
  ]
}

RULES:
1. Generate EXACTLY 3 questions.
2. Sentences should be practical everyday phrases (greetings, basic needs, common activities).
3. correct_answer_tiles = the translated sentence in ${learningLanguage} native script, split WORD BY WORD.
4. available_tiles = all correct tiles + exactly 3 distractor words (also in ${learningLanguage} native script).
5. Question 1: very simple (greeting or self-introduction).
6. Question 2: medium (expressing a need or action).
7. Question 3: slightly harder (a complete sentence with context).
8. ALL ${learningLanguage} text MUST be in pure native script — NO romanization.

Return ONLY raw JSON.`;

  try {
    const result = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Language assessment JSON generator. Pure native scripts only. No romanization." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.5,
    });
    return extractJSON(result.choices[0].message.content);
  } catch (error) {
    console.error("Groq placement test error:", error);
    throw new Error("Failed to generate placement test.");
  }
};