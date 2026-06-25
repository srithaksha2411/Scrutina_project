/**
 * INDUSTRY CLASSIFICATION SERVICE
 * Classifies businesses using business name + description + search query.
 * Returns industry only if confidence > 50%, otherwise "Unknown".
 *
 * Signal weights:
 *   Query hit   = 2.0  (user explicitly typed the industry)
 *   Title hit   = 1.5  (business name contains keyword)
 *   Desc hit    = 1.0  (snippet/description contains keyword)
 *
 * Confidence = rawScore / maxExpectedScore, capped at 1.0
 * maxExpectedScore = 2 * QUERY_WEIGHT = 4.0 (2 query keyword hits)
 */

const INDUSTRY_RULES = [
  {
    industry: 'Information Technology',
    keywords: [
      'software', 'technology', 'technologies', 'tech', ' it ', 'it company', 'infotech',
      'digital', 'cybersecurity', 'cyber security', 'cloud', 'saas', 'erp',
      'web development', 'app development', 'data analytics', 'ai solutions',
      'machine learning', 'artificial intelligence', 'devops', 'programming', 'coding',
      'zoho', 'infosys', 'wipro', 'tcs', 'cognizant', 'hcl', 'accenture'
    ]
  },
  {
    industry: 'Healthcare',
    keywords: [
      'hospital', 'clinic', 'healthcare', 'health care', 'medical', 'doctor',
      'physician', 'cardiologist', 'dentist', 'pharmacy', 'pharma', 'diagnostic',
      'nursing', 'surgeon', 'ortho', 'pediatric', 'gynaecolog', 'ophthalm',
      'pathology', 'radiology', 'rehabilitation', 'wellness center', 'health center'
    ]
  },
  {
    industry: 'Hospitality',
    keywords: [
      'hotel', 'resort', 'inn', 'motel', 'lodge', 'suites', 'accommodation',
      'restaurant', 'cafe', 'bistro', 'eatery', 'dining', 'food & beverage',
      'catering', 'banquet', 'hospitality'
    ]
  },
  {
    industry: 'Education',
    keywords: [
      'school', 'college', 'university', 'institute', 'academy', 'coaching',
      'training center', 'e-learning', 'polytechnic', 'preschool', 'kindergarten',
      'education', 'learning center', 'tutorial', 'edtech'
    ]
  },
  {
    industry: 'Finance',
    keywords: [
      'finance', 'fintech', 'bank', 'banking', 'insurance', 'investment',
      'wealth management', 'mutual fund', 'stock', 'nbfc', 'lending', 'loan',
      'credit', 'capital', 'asset management', 'financial services'
    ]
  },
  {
    industry: 'Manufacturing',
    keywords: [
      'manufacturing', 'factory', 'fabrication', 'production', 'plant',
      'foundry', 'forge', 'assembly', 'industrial', 'machinery', 'equipment manufacturer',
      'auto parts', 'spare parts', 'components', 'packaging'
    ]
  }
];

const QUERY_WEIGHT = 2.0;
const TITLE_WEIGHT = 1.5;
const DESC_WEIGHT  = 1.0;
const CONFIDENCE_THRESHOLD = 0.50;
const MAX_EXPECTED_SCORE = 2 * QUERY_WEIGHT; // normalise against 2 strong query hits

class IndustryClassificationService {
  /**
   * Classify a single business
   * @param {string} name        - business name / title
   * @param {string} description - snippet or description
   * @param {string} query       - original search query (strong signal)
   * @returns {{ industry: string, confidence: number }}
   */
  classify(name = '', description = '', query = '') {
    const titleText = (name  || '').toLowerCase();
    const descText  = (description || '').toLowerCase();
    const queryText = (query || '').toLowerCase();

    const scores = {};

    for (const rule of INDUSTRY_RULES) {
      let score = 0;

      for (const keyword of rule.keywords) {
        if (queryText.includes(keyword)) score += QUERY_WEIGHT;
        if (titleText.includes(keyword))  score += TITLE_WEIGHT;
        if (descText.includes(keyword))   score += DESC_WEIGHT;
      }

      if (score > 0) scores[rule.industry] = score;
    }

    if (Object.keys(scores).length === 0) {
      return { industry: 'Unknown', confidence: 0 };
    }

    const [industry, rawScore] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    const confidence = Math.min(rawScore / MAX_EXPECTED_SCORE, 1.0);

    if (confidence < CONFIDENCE_THRESHOLD) {
      return { industry: 'Unknown', confidence: Math.round(confidence * 100) / 100 };
    }

    return { industry, confidence: Math.round(confidence * 100) / 100 };
  }

  /**
   * Classify and attach industry to a business object.
   * Requires business.searchQuery to be set by the discovery phase.
   */
  classifyBusiness(business) {
    const { industry, confidence } = this.classify(
      business.businessName,
      business.description,
      business.searchQuery
    );

    return { ...business, industry, industryConfidence: confidence };
  }

  /**
   * Batch classify businesses
   */
  batchClassify(businesses) {
    return businesses.map(b => this.classifyBusiness(b));
  }
}

module.exports = new IndustryClassificationService();
