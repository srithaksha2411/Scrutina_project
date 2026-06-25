const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use Gemini 1.5 Pro for better business analysis
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro"
});

/**
 * Analyze business query and extract insights using Gemini AI
 */
const analyzeBusinessQuery = async (query) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.log('⚠️ Gemini API key not configured, skipping AI analysis');
      return null;
    }

    const prompt = `Analyze this business search query and extract key information:
Query: "${query}"

Provide a JSON response with:
1. category: Main business category
2. location: Geographic location
3. searchIntent: What the user is looking for
4. suggestions: Alternative search terms (array of 3)

Response format (JSON only):
{
  "category": "...",
  "location": "...",
  "searchIntent": "...",
  "suggestions": ["...", "...", "..."]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error('Gemini AI Analysis Error:', error.message);
    return null;
  }
};

/**
 * Generate business insights summary using Gemini AI
 */
const generateBusinessInsights = async (businesses, query) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return null;
    }

    // Limit to top 10 businesses for analysis
    const topBusinesses = businesses.slice(0, 10).map(b => ({
      name: b.name,
      industry: b.industry,
      rating: b.rating,
      trustScore: b.verificationScore
    }));

    const prompt = `Analyze these business search results and provide insights:

Query: "${query}"

Businesses found:
${JSON.stringify(topBusinesses, null, 2)}

Provide a brief analysis (2-3 sentences) about:
1. Market overview
2. Business quality
3. Key recommendations

Keep response concise and actionable.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.trim();
  } catch (error) {
    console.error('Gemini Insights Error:', error.message);
    return null;
  }
};

/**
 * Enhance trust score with AI analysis
 */
const enhanceTrustScoreWithAI = async (business) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return null;
    }

    const prompt = `Analyze this business data and provide a trust assessment:

Business: ${business.name}
Industry: ${business.industry || 'Unknown'}
Rating: ${business.rating || 'N/A'}
Has Website: ${business.website ? 'Yes' : 'No'}
Has Phone: ${business.phone ? 'Yes' : 'No'}
Status: ${business.businessStatus || 'Unknown'}

Provide a single sentence trust assessment.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.trim();
  } catch (error) {
    console.error('Gemini Trust Enhancement Error:', error.message);
    return null;
  }
};

/**
 * Generate search recommendations based on results
 */
const generateSearchRecommendations = async (query, businessCount) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return [];
    }

    const prompt = `User searched for: "${query}" and found ${businessCount} businesses.

Suggest 3 related search queries that might be useful. Format as JSON array:
["suggestion1", "suggestion2", "suggestion3"]

Keep suggestions specific and relevant.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON array
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return [];
  } catch (error) {
    console.error('Gemini Recommendations Error:', error.message);
    return [];
  }
};

module.exports = {
  analyzeBusinessQuery,
  generateBusinessInsights,
  enhanceTrustScoreWithAI,
  generateSearchRecommendations
};
