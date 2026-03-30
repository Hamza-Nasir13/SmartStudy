const { GoogleGenerativeAI } = require('@google/generative-ai');

// Force v1 endpoint (not v1beta) to access newer models
// Override the default baseUrl to use v1 API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
  baseUrl: 'https://generativelanguage.googleapis.com/v1'
});

// Use Gemini 2.5 Flash - the newest model available on free tier
// Compatible with v1 API, offers 1M context window and great performance
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 1.0, // Higher for more variety and less repetition
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192, // Increased for quiz questions with options
  },
});

/**
 * Generate flashcards from textbook text using Gemini AI
 * @param {string} text - The extracted text from the textbook
 * @param {number} count - Number of flashcards to generate (default 10)
 * @param {Array<string>} existingConcepts - List of already existing flashcard fronts to avoid (default [])
 * @returns {Promise<Array<{front: string, back: string}>>}
 */
async function generateFlashcardsWithGemini(text, count = 10, existingConcepts = []) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // Truncate text to avoid exceeding token limits (but keep enough context)
  const maxTextLength = 30000; // Gemini can handle up to 1M tokens but we keep it reasonable
  const truncatedText = text.length > maxTextLength
    ? text.substring(0, maxTextLength) + '...'
    : text;

  // Build prompt with existing concepts avoidance
  const existingListPrompt = existingConcepts && existingConcepts.length > 0
    ? `\nALREADY COVERED CONCEPTS:\nThe following terms have already been used in previous flashcards. DO NOT create flashcards for these terms. Focus on completely NEW concepts:\n${existingConcepts.slice(0, 50).map(c => `- ${c}`).join('\n')}\n`
    : '';

  const prompt = `You are an expert educator creating flashcards for students. Analyze the textbook content and create exactly ${count} high-quality flashcards.${existingListPrompt}

CRITICAL RULES:
1. CREATE EXACTLY ${count} FLASHCARDS - no more, no less.
2. Each flashcard must cover a COMPLETELY DIFFERENT concept. Do NOT create multiple cards about the same general topic even if wording differs.
3. FRONT (Term): Clear, specific concept name (2-6 words). Examples: "Short-tail keywords", "Cost Per Click", "Transactional Keywords".
   - NEVER use vague terms: "users", "data", "information", "results", "click", "search", "the", "website" alone.
   - Use proper noun phrases: "Higher CPC" not just "CPC".
4. BACK (Definition): Concise explanation (1-2 sentences) using ONLY information from the text.
5. Scan the ENTIRE text (beginning, middle, end) to ensure broad topic coverage.
6. If the text lacks enough distinct concepts, create FEWER cards rather than repeating concepts.

OUTPUT FORMAT: Return ONLY a valid JSON array with exactly ${count} objects: {"front": "...", "back": "..."}

Textbook content:
"""${truncatedText}"""

Generate exactly ${count} DIFFERENT flashcards now:`;

  try {
    console.log('Generating flashcards with Gemini...', { textLength: truncatedText.length, requestedCount: count });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();

    console.log('Gemini raw response (first 500 chars):', responseText.substring(0, 500));

    // Clean response: remove markdown code blocks if present
    responseText = responseText
      .replace(/^```json\s*/, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim();

    // Find the outermost JSON array by finding first '[' and last ']'
    const arrayStart = responseText.indexOf('[');
    const arrayEnd = responseText.lastIndexOf(']') + 1;

    if (arrayStart === -1 || arrayEnd === -1 || arrayStart >= arrayEnd) {
      throw new Error('Gemini did not return valid JSON array. Response: ' + responseText.substring(0, 200));
    }

    const jsonString = responseText.substring(arrayStart, arrayEnd);

    let flashcards;
    try {
      flashcards = JSON.parse(jsonString);
    } catch (parseErr) {
      console.error('JSON parse error. Raw match:', jsonString);
      throw new Error('Failed to parse Gemini response as JSON: ' + parseErr.message);
    }

    // Validate structure
    if (!Array.isArray(flashcards)) {
      throw new Error('Gemini response is not an array, got: ' + typeof flashcards);
    }

    console.log('Gemini returned raw array:', { length: flashcards.length, firstItem: flashcards[0] });

    // Prepare sets for deduplication
    const existingSet = new Set(existingConcepts.map(c => c.toLowerCase()));
    const validFlashcards = [];
    const seen = new Set(); // Avoid duplicates within this batch

    for (const card of flashcards) {
      if (!card || typeof card !== 'object') continue;

      const front = (card.front || '').trim();
      const back = (card.back || '').trim();

      if (!front || !back) continue;
      if (front.length < 2 || front.length > 100) continue;
      if (back.length < 10) continue;

      const frontLower = front.toLowerCase();

      // Skip if duplicate within this batch
      if (seen.has(frontLower)) {
        console.log('Skipping duplicate (batch):', front);
        continue;
      }

      // Skip if this concept already exists in user's flashcards
      if (existingSet.has(frontLower)) {
        console.log('Skipping existing concept:', front);
        continue;
      }

      seen.add(frontLower);
      validFlashcards.push({ front, back });
    }

    const totalSkipped = flashcards.length - validFlashcards.length;
    console.log('Flashcards after validation:', {
      requested: count,
      raw: flashcards.length,
      valid: validFlashcards.length,
      totalSkipped,
      duplicatesRemovedWithinBatch: flashcards.length - validFlashcards.length - existingConcepts.filter(c => seen.has(c.toLowerCase())).length
    });

    // If we got fewer than requested, that's okay - return what we have
    // But ensure we don't return more than count
    const finalFlashcards = validFlashcards.slice(0, count);

    if (finalFlashcards.length === 0) {
      console.warn('All flashcards were filtered out. Raw data:', flashcards);
    }

    return finalFlashcards;

  } catch (err) {
    console.error('Gemini flashcard generation failed:', err);
    throw new Error(`AI generation failed: ${err.message}`);
  }
}

/**
 * Generate quizzes from textbook text using Gemini AI
 * @param {string} text - The extracted text from the textbook
 * @param {number} count - Number of questions to generate (default 5)
 * @param {string} title - Quiz title for context
 * @param {string} topic - Optional topic for focused questions
 * @returns {Promise<Array<{question: string, options: string[], correctAnswer: number, explanation: string}>>}
 */
async function generateQuizWithGemini(text, count = 5, title = '', topic = '') {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // Truncate text to avoid exceeding token limits
  const maxTextLength = 30000;
  const truncatedText = text.length > maxTextLength
    ? text.substring(0, maxTextLength) + '...'
    : text;

  const prompt = `You are an expert educator creating high-quality multiple-choice quiz questions. Based on the textbook content below, create exactly ${count} diverse and challenging questions.

IMPORTANT RULES:
1. CREATE EXACTLY ${count} QUESTIONS - no more, no less.
2. Each question must test understanding, not just recall. Focus on key concepts, definitions, relationships, and applications.
3. Questions should vary in type:
   - Definition questions
   - Concept explanation questions
   - Application/scenario questions
   - Comparison questions
4. OPTIONS (4 per question):
   - Only ONE correct answer
   - Three plausible wrong answers (common misconceptions, related but incorrect concepts, partial truths)
   - All options should be similar in length and style to avoid giving away the answer
5. The correct answer must be directly supported by the text.
6. Explanations should clearly explain why the correct answer is right AND why the others are wrong.

OUTPUT FORMAT: Return ONLY a valid JSON array with exactly ${count} objects:
{
  "question": "Clear, complete question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0-3 (index of correct option),
  "explanation": "Why this answer is correct and why others are wrong"
}

${topic ? `Topic focus: ${topic}` : ''}
${title ? `Quiz title context: ${title}` : ''}

Textbook content:
"""${truncatedText}"""

Generate ${count} high-quality quiz questions now:`;

  try {
    console.log('Generating quiz with Gemini...', { textLength: truncatedText.length, requestedCount: count });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();

    console.log('Gemini quiz raw response (first 500 chars):', responseText.substring(0, 500));

    // Clean response: remove markdown code blocks if present
    responseText = responseText
      .replace(/^```json\s*/, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim();

    // Find the outermost JSON array by finding first '[' and last ']'
    const arrayStart = responseText.indexOf('[');
    const arrayEnd = responseText.lastIndexOf(']') + 1;

    if (arrayStart === -1 || arrayEnd === -1 || arrayStart >= arrayEnd) {
      throw new Error('Gemini did not return valid JSON array. Response: ' + responseText.substring(0, 200));
    }

    const jsonString = responseText.substring(arrayStart, arrayEnd);

    let questions;
    try {
      questions = JSON.parse(jsonString);
    } catch (parseErr) {
      console.error('JSON parse error. Raw match:', jsonString);
      throw new Error('Failed to parse Gemini response as JSON: ' + parseErr.message);
    }

    if (!Array.isArray(questions)) {
      throw new Error('Gemini response is not an array, got: ' + typeof questions);
    }

    console.log('Gemini returned raw questions:', { length: questions.length, firstQuestion: questions[0]?.question?.substring(0, 100) });

    // Validate and clean questions
    const validQuestions = [];
    for (const q of questions) {
      if (!q || typeof q !== 'object') continue;

      const question = (q.question || '').trim();
      const options = Array.isArray(q.options) ? q.options.map(o => (o || '').trim()) : [];
      const correctAnswer = q.correctAnswer;
      const explanation = (q.explanation || '').trim();

      // Validation
      if (!question || question.length < 10) {
        console.log('Skipping invalid question (too short):', question?.substring(0, 50));
        continue;
      }
      if (options.length !== 4) {
        console.log('Skipping question - wrong number of options:', options.length);
        continue;
      }
      if (typeof correctAnswer !== 'number' || correctAnswer < 0 || correctAnswer > 3) {
        console.log('Skipping question - invalid correctAnswer:', correctAnswer);
        continue;
      }
      if (!explanation || explanation.length < 10) {
        console.log('Skipping question - missing or too short explanation');
        continue;
      }
      // Ensure all options have content
      if (options.some(opt => opt.length < 1)) {
        console.log('Skipping question - empty option');
        continue;
      }

      validQuestions.push({
        question,
        options,
        correctAnswer,
        explanation,
      });
    }

    console.log('Questions after validation:', {
      requested: count,
      raw: questions.length,
      valid: validQuestions.length,
      skipped: questions.length - validQuestions.length
    });

    const finalQuestions = validQuestions.slice(0, count);

    if (finalQuestions.length === 0) {
      console.warn('All questions were filtered out. Raw data:', questions);
    }

    return finalQuestions;

  } catch (err) {
    console.error('Gemini quiz generation failed:', err);
    throw new Error(`AI quiz generation failed: ${err.message}`);
  }
}

module.exports = { generateFlashcardsWithGemini, generateQuizWithGemini };
