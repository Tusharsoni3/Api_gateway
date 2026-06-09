import api from './axios';

export const getKeys = async () => {
  const response = await api.get('/api/getAllKeys');
  return response.data;
};

export const generateKey = async (data) => {
  const response = await api.post('/api/apikey-gen', data);
  return response.data;
};

export const deleteKey = async (apikey) => {
  const response = await api.delete(`/api/deleteKey/${apikey}`);
  return response.data;
};

export const toggleKeyStatus = async (apikey) => {
  const response = await api.post(`/api/changeActiveStatus/${apikey}`);
  return response.data;
};
