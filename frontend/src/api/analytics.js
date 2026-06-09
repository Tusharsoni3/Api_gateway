import api from './axios';

export const getUserAnalytics = async () => {
  const response = await api.get('/api/analytics/user');
  return response.data;
};

export const getKeyOverview = async (apikey) => {
  const response = await api.get(`/api/analytics/overview/${apikey}`);
  return response.data;
};
