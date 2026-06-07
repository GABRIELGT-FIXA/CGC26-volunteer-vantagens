import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Nunca interceptar a própria rota de refresh — evita loop infinito
    if (original?.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data.accessToken;
        setAccessToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        setAccessToken(null);
        // Não redirecionar aqui — deixar o AuthBootstrap/Zustand cuidar
      }
    }

    return Promise.reject(error);
  }
);
