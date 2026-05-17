import { Platform } from 'react-native';

// For Android emulators, use 10.0.2.2 instead of localhost
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000/api/v1' : 'http://localhost:8000/api/v1';

export const ApiClient = {
  get: async (endpoint: string) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer YOUR_TOKEN_HERE',
        },
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.detail || 'API Error');
      return json;
    } catch (error) {
      console.error(`[API GET Error] ${endpoint}:`, error);
      throw error;
    }
  },

  post: async (endpoint: string, data: any) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer YOUR_TOKEN_HERE',
        },
        body: JSON.stringify(data),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.detail || 'API Error');
      return json;
    } catch (error) {
      console.error(`[API POST Error] ${endpoint}:`, error);
      throw error;
    }
  }
};
