const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use gemini-1.5-pro for best quality
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
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

  const prompt = `You are an expert educator creating flashcards for students. Your task is to analyze the following textbook content and create ${count} high-quality flashcards.

IMPORTANT RULES:
1. FRONT (Term): Should be a clear, specific concept, term, or question (2-6 words max). Avoid vague terms like "users", "data", "information", "results", "click", "search".
2. BACK (Definition/Answer): Should be a concise explanation (1-2 sentences max) that directly answers or defines the front.
3. Focus on KEY CONCEPTS that students should memorize.
4. Extract proper noun phrases: "Short-tail keywords" not just "keywords", "Cost Per Click" not just "CPC".
5. Identify explicit definitions in the text: "X is Y", "X means Y", "X refers to Y", "X: Y", "X = Y".
6. Do NOT include your own explanations - use only what's in the provided text.
7. Quality over quantity - if you can't find ${count} good cards, return fewer high-quality ones.

OUTPUT FORMAT: Return ONLY a valid JSON array of objects with "front" and "back" properties. No other text.
Example:
[
  {
    "front": "Short-tail keywords",
    "back": "Search terms with 1-2 words and high search volume; broad and competitive."
  },
  {
    "front": "Transactional keywords",
    "back": "Keywords that show strong buying intent; users are ready to purchase."
  }
]

Textbook content:
"""${truncatedText}"""

Generate ${count} flashcards now:`;

  try {
    console.log('Generating flashcards with Gemini...', { textLength: truncatedText.length, requestedCount: count });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text().trim();

    console.log('Gemini response received:', { responseLength: responseText.length });

    // Extract JSON from response (Gemini might add markdown formatting)
    let jsonMatch = responseText.match(/\[.*\]/s);
    if (!jsonMatch) {
      throw new Error('Gemini did not return valid JSON array');
    }

    const flashcards = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!Array.isArray(flashcards)) {
      throw new Error('Gemini response is not an array');
    }

    const validFlashcards = flashcards.filter(card => {
      return card.front && card.back &&
             typeof card.front === 'string' &&
             typeof card.back === 'string' &&
             card.front.trim().length > 0 &&
             card.back.trim().length > 0;
    });

    console.log('Flashcards validated:', { total: flashcards.length, valid: validFlashcards.length });

    return validFlashcards.slice(0, count); // Ensure we don't exceed requested count

  } catch (err) {
    console.error('Gemini flashcard generation failed:', err);
    throw new Error(`AI generation failed: ${err.message}`);
  }
}

module.exports = { generateFlashcardsWithGemini };
