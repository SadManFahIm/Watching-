import OpenAI from 'openai';
import type { Product } from '@/types';

// Initialize OpenAI (API key should be on backend for security)
const getRecommendations = async (
  userPreferences: {
    viewedProducts: string[];
    purchaseHistory: string[];
    wishlist: string[];
    searchQueries: string[];
  },
  availableProducts: Product[]
): Promise<Product[]> => {
  try {
    // This should be called from backend API for security
    const response = await fetch('/api/ai/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        preferences: userPreferences,
        products: availableProducts,
      }),
    });

    const data = await response.json();
    return data.recommendations;
  } catch (error) {
    console.error('AI Recommendation error:', error);
    return [];
  }
};

// Generate personalized product description
export const generateProductDescription = async (
  product: Product,
  userContext: string
): Promise<string> => {
  try {
    const response = await fetch('/api/ai/product-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product,
        userContext,
      }),
    });

    const data = await response.json();
    return data.description;
  } catch (error) {
    console.error('AI Description error:', error);
    return product.description;
  }
};

// Smart search suggestions
export const getSearchSuggestions = async (
  query: string,
  userHistory: string[]
): Promise<string[]> => {
  try {
    const response = await fetch('/api/ai/search-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        history: userHistory,
      }),
    });

    const data = await response.json();
    return data.suggestions;
  } catch (error) {
    console.error('AI Suggestions error:', error);
    return [];
  }
};

// Chatbot integration
export const sendChatMessage = async (
  message: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> => {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history: conversationHistory,
      }),
    });

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error('AI Chat error:', error);
    return 'Sorry, I am having trouble responding right now.';
  }
};

// Product comparison AI
export const compareProducts = async (productIds: string[]): Promise<string> => {
  try {
    const response = await fetch('/api/ai/compare-products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productIds }),
    });

    const data = await response.json();
    return data.comparison;
  } catch (error) {
    console.error('AI Comparison error:', error);
    return '';
  }
};

// Size/fit recommendations
export const getSizeRecommendation = async (
  productId: string,
  userMeasurements: any
): Promise<string> => {
  try {
    const response = await fetch('/api/ai/size-recommendation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId,
        measurements: userMeasurements,
      }),
    });

    const data = await response.json();
    return data.recommendation;
  } catch (error) {
    console.error('AI Size Recommendation error:', error);
    return '';
  }
};

// Sentiment analysis for reviews
export const analyzeReviewSentiment = async (
  reviews: Array<{ text: string; rating: number }>
): Promise<{
  positive: number;
  negative: number;
  neutral: number;
  insights: string[];
}> => {
  try {
    const response = await fetch('/api/ai/sentiment-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reviews }),
    });

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error('AI Sentiment Analysis error:', error);
    return {
      positive: 0,
      negative: 0,
      neutral: 0,
      insights: [],
    };
  }
};

export default getRecommendations;
