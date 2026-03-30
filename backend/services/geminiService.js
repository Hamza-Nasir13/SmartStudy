const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use gemini-1.5-pro for best quality
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  generationConfig: {
    temperature: 1.0, // Higher for more variety and less repetition
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 4096, // Allow more output for more cards
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

    // Extract JSON array - handle both compact and formatted JSON
    let jsonMatch = responseText.match(/(\[.*?\])/s);
    if (!jsonMatch) {
      // Try finding array without capturing surrounding text
      const arrayStart = responseText.indexOf('[');
      const arrayEnd = responseText.lastIndexOf(']') + 1;
      if (arrayStart !== -1 && arrayEnd > arrayStart) {
        jsonMatch = [responseText.substring(arrayStart, arrayEnd)];
      } else {
        throw new Error('Gemini did not return valid JSON array. Response: ' + responseText.substring(0, 200));
      }
    }

    let flashcards;
    try {
      flashcards = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('JSON parse error. Raw match:', jsonMatch[0]);
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

module.exports = { generateFlashcardsWithGemini };
