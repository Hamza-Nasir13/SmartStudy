const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use gemini-1.5-pro for best quality
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  generationConfig: {
    temperature: 0.9, // Higher for more variety and less repetition
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 4096, // Allow more output for more cards
  },
});

/**
 * Generate flashcards from textbook text using Gemini AI
 * @param {string} text - The extracted text from the textbook
 * @param {number} count - Number of flashcards to generate (default 10)
 * @returns {Promise<Array<{front: string, back: string}>>}
 */
async function generateFlashcardsWithGemini(text, count = 10) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // Truncate text to avoid exceeding token limits (but keep enough context)
  const maxTextLength = 30000; // Gemini can handle up to 1M tokens but we keep it reasonable
  const truncatedText = text.length > maxTextLength
    ? text.substring(0, maxTextLength) + '...'
    : text;

  const prompt = `You are an expert educator creating flashcards for students. Your task is to analyze the following textbook content and create exactly ${count} DIFFERENT high-quality flashcards.

CRITICAL RULES:
1. CREATE EXACTLY ${count} FLASHCARDS - no more, no less.
2. Each flashcard MUST cover a DIFFERENT concept/topic. Do NOT repeat the same concept with slight variations.
3. FRONT (Term): Clear, specific concept name (2-6 words). Examples: "Short-tail keywords", "Cost Per Click", "Transactional Keywords".
   - NEVER use vague terms like "users", "data", "information", "results", "click", "search", "the", "website" alone.
   - Use proper noun phrases: "Higher CPC" not just "CPC", "Search engine algorithms" not just "algorithms".
4. BACK (Definition): Concise explanation using ONLY information from the text (1-2 sentences max).
5. Scan the ENTIRE text and pick the ${count} most important, definable concepts.
6. If text is short, still create ${count} cards by finding multiple aspects of each concept.

OUTPUT FORMAT: Return ONLY a valid JSON array with exactly ${count} objects. Each object: {"front": "...", "back": "..."}
Example (for count=3):
[
  {"front": "Short-tail keywords", "back": "Search terms with 1-2 words and high search volume; broad and competitive."},
  {"front": "Transactional keywords", "back": "Keywords that show strong buying intent; users are ready to purchase."},
  {"front": "CPC", "back": "Cost Per Click - the amount advertisers pay each time someone clicks their ad."}
]

Textbook content to study:
"""${truncatedText}"""

Now generate exactly ${count} different flashcards:`;

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

    // Validate and clean each card
    const validFlashcards = [];
    const seen = new Set(); // Avoid duplicates

    for (const card of flashcards) {
      if (!card || typeof card !== 'object') continue;

      const front = (card.front || '').trim();
      const back = (card.back || '').trim();

      if (!front || !back) continue;
      if (front.length < 2 || front.length > 100) continue;
      if (back.length < 10) continue; // Definition too short

      // Create a signature to detect duplicates (case-insensitive front)
      const signature = front.toLowerCase();
      if (seen.has(signature)) {
        console.log('Skipping duplicate card:', front);
        continue;
      }
      seen.add(signature);

      validFlashcards.push({ front, back });
    }

    console.log('Flashcards after validation:', { requested: count, raw: flashcards.length, valid: validFlashcards.length, duplicatesRemoved: flashcards.length - validFlashcards.length });

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
