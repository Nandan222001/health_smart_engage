import { useState } from 'react';
import { authService } from '../services/authService';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string, onSuccess?: () => void) => {
    setLoading(true);
    setError(null);
    try {
      await authService.login(email, password);
      onSuccess?.();
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
};
