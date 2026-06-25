// Business Data Extraction Service
// Phase 1: Mock extraction logic
// Future: Will extract from web scraping results

const extractBusinessData = async (rawData) => {
  try {
    // Parse query to extract category and location
    const extractedData = {
      category: 'General Business',
      location: 'Unknown'
    };

    // Simple category extraction
    const categories = ['cardiologist', 'software', 'dental', 'manufacturing', 'cyber security', 'fintech'];
    for (const cat of categories) {
      if (rawData.toLowerCase().includes(cat)) {
        extractedData.category = cat.charAt(0).toUpperCase() + cat.slice(1);
        break;
      }
    }

    // Simple location extraction
    const commonLocations = ['birmingham', 'chennai', 'coimbatore', 'texas', 'bangalore', 'mumbai', 'delhi'];
    for (const loc of commonLocations) {
      if (rawData.toLowerCase().includes(loc)) {
        extractedData.location = loc.charAt(0).toUpperCase() + loc.slice(1);
        break;
      }
    }

    return extractedData;
  } catch (error) {
    console.error('Extraction Service Error:', error);
    throw error;
  }
};

module.exports = { extractBusinessData };
