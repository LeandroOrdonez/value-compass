import api from './api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

const authService = {
  login: async (credentials: LoginCredentials) => {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post('/user-service/auth/token', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await api.post('/user-service/users/register', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await api.get('/user-service/users/me');
    return response.data;
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    const response = await api.put('/user-service/users/me', data);
    return response.data;
  },

  isAuthenticated: () => {
    return localStorage.getItem('token') !== null;
  },
};

export default authService;
