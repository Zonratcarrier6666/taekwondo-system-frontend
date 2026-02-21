import api from '../api/axios';

// Interfaces para las respuestas del servidor de Render
interface LoginResponse {
  access_token: string;
  token_type: string;
  user_role: 'SuperAdmin' | 'Escuela' | 'Profesor' | 'Juez';
}

export const authService = {
  /**
   * Realiza el login usando OAuth2 Password Flow
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    // Petición a https://taekwondo-system-api.onrender.com/auth/login
    const response = await api.post<LoginResponse>('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data;
  },

  /**
   * Obtiene el perfil extendido si fuera necesario
   */
  async getProfile() {
    const response = await api.get('/usuarios/perfil');
    return response.data;
  }
};