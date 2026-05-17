import { ApiClient } from './api';

export const authService = {
  login: async (email: string, password: string) => {
    return ApiClient.post('/auth/login', { email, password });
  },
  logout: async () => {
    return ApiClient.post('/auth/logout', {});
  },
  getProfile: async () => {
    return ApiClient.get('/auth/profile');
  }
};
