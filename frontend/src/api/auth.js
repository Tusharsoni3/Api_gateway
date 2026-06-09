import api from './axios';
import Cookies from 'js-cookie';

export const signup = async (data) => {
  const response = await api.post('/api/auth/signup', data);
  return response.data;
};

export const login = async (data) => {
  const response = await api.post('/api/auth/login', data);
  Cookies.set('isAuth', 'true', { expires: 20 });
  if (data.email) {
    Cookies.set('userEmail', data.email, { expires: 20 });
    const storedName = Cookies.get('userName');
    if (!storedName) {
      Cookies.set('userName', data.email.split('@')[0], { expires: 20 });
    }
  }
  return response.data;
};

export const logout = async () => {
  try {
    await api.post('/api/auth/logout');
  } finally {
    Cookies.remove('isAuth');
    Cookies.remove('userName');
    Cookies.remove('userEmail');
  }
};

export const isAuthenticated = () => !!Cookies.get('isAuth');
