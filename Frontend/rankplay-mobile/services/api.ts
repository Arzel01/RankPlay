/**
 * RankPlay API Service
 * Handles all HTTP requests to the Django backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// URL del backend segun el entorno
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.100.23:8000/api/v1'  // Desarrollo local
  : 'https://rankplay-production.up.railway.app/api/v1';  // Produccion 

// Token storage keys
const ACCESS_TOKEN_KEY = 'rankplay_access_token';
const REFRESH_TOKEN_KEY = 'rankplay_refresh_token';
const USER_KEY = 'rankplay_user';

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  profile: UserProfile;
  friends_count: number;
}

export interface UserProfile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  current_level: number;
  total_xp: number;
  games_played: number;
  total_playtime_seconds: number;
  xp_for_next_level: number;
}

export interface Game {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructions: string;
  category: string;
  icon_url: string | null;
  banner_url: string | null;
  thumbnail_url: string | null;
  xp_per_play: number;
  is_featured: boolean;
  play_count: number;
  total_players: number;
  best_score: number;
}

export interface Score {
  id: string;
  user: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  user_level: number;
  game: string;
  game_title: string;
  score_value: number;
  metadata: Record<string, any>;
  is_best: boolean;
  created_at: string;
  rank?: number;
}

export interface RankingEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  score: number;
  is_current_user: boolean;
}

export interface Friendship {
  id: string;
  requester: string;
  requester_username: string;
  requester_avatar: string | null;
  receiver: string;
  receiver_username: string;
  receiver_avatar: string | null;
  status: 'pending' | 'accepted' | 'blocked' | 'rejected';
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  game: string | null;
  game_title: string | null;
  achievement_type: string;
  target_value: number;
  xp_reward: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlocked_count: number;
}

export interface UserAchievement {
  id: string;
  achievement: Achievement;
  unlocked_at: string;
  progress: number;
  is_claimed: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  // Initialize tokens from storage
  async init() {
    this.accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    this.refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }

  // Store tokens
  async setTokens(tokens: AuthTokens) {
    this.accessToken = tokens.access;
    this.refreshToken = tokens.refresh;
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }

  // Clear tokens
  async clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
  }

  // Store user data
  async setUser(user: User) {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Get stored user
  async getUser(): Promise<User | null> {
    const userData = await AsyncStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Make authenticated request
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('[API] Making request to:', url);
    console.log('[API] Method:', options.method || 'GET');
    console.log('[API] Body:', options.body ? 'Present' : 'None');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    console.log('[API] Headers:', headers);
    
    try {
      console.log('[API] Calling fetch...');
      const response = await fetch(url, {
        ...options,
        headers,
      });
      console.log('[API] Response status:', response.status);
      console.log('[API] Response ok:', response.ok);

      // Handle token refresh
      if (response.status === 401 && this.refreshToken) {
        console.log('[API] 401 response, attempting token refresh');
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, { ...options, headers });
          if (!retryResponse.ok) {
            throw new Error(`API Error: ${retryResponse.status}`);
          }
          return retryResponse.json();
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('[API] Error response:', error);
        
        // Extraer mensaje de error específico del backend
        let errorMessage = `Error ${response.status}`;
        if (error.error) {
          errorMessage = error.error;
        } else if (error.detail) {
          errorMessage = error.detail;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'object') {
          // Extraer errores de campos específicos
          const fieldErrors = Object.entries(error)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`;
              }
              return `${field}: ${messages}`;
            })
            .join('\n');
          if (fieldErrors) errorMessage = fieldErrors;
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('[API] Success response:', responseData);
      return responseData;
    } catch (error) {
      console.error('[API] Request failed with error:', error);
      throw error;
    }
  }

  // Refresh access token
  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access;
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.access);
        return true;
      }
    } catch (e) {
      console.error('Token refresh failed:', e);
    }

    await this.clearTokens();
    return false;
  }

  // ============== AUTH ENDPOINTS ==============

  async register(data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    display_name?: string;
  }): Promise<{ user: User; tokens: AuthTokens }> {
    console.log('[API] register called');
    console.log('[API] Username:', data.username);
    console.log('[API] API_BASE_URL:', API_BASE_URL);
    console.log('[API] Full URL:', `${API_BASE_URL}/auth/register/`);
    
    const response = await this.request<{ user: User; tokens: AuthTokens }>(
      '/auth/register/',
      { method: 'POST', body: JSON.stringify(data) }
    );
    await this.setTokens(response.tokens);
    await this.setUser(response.user);
    return response;
  }

  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    console.log('[API] login called');
    console.log('[API] Email:', email);
    console.log('[API] API_BASE_URL:', API_BASE_URL);
    console.log('[API] Full URL:', `${API_BASE_URL}/auth/login/`);
    
    const response = await this.request<{ user: User; tokens: AuthTokens }>(
      '/auth/login/',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    await this.setTokens(response.tokens);
    await this.setUser(response.user);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh: this.refreshToken }),
      });
    } catch (e) {
      // Ignore errors on logout
    }
    await this.clearTokens();
  }

  async getMe(): Promise<User> {
    return this.request<User>('/users/me/');
  }

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    return this.request<UserProfile>('/profiles/me/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ============== GAMES ENDPOINTS ==============

  async getGames(params?: { category?: string; featured?: boolean }): Promise<Game[]> {
    let endpoint = '/games/';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.category) queryParams.append('category', params.category);
      if (params.featured) queryParams.append('featured', 'true');
      endpoint += `?${queryParams.toString()}`;
    }
    return this.request<Game[]>(endpoint);
  }

  async getGame(id: string): Promise<Game> {
    return this.request<Game>(`/games/${id}/`);
  }

  async getFeaturedGames(): Promise<Game[]> {
    return this.request<Game[]>('/games/featured/');
  }

  async getPopularGames(): Promise<Game[]> {
    return this.request<Game[]>('/games/popular/');
  }

  async getCategories(): Promise<{ value: string; label: string }[]> {
    return this.request('/games/categories/');
  }

  // ============== SCORES & RANKINGS ENDPOINTS ==============

  async submitScore(gameId: string, scoreValue: number, metadata?: Record<string, any>): Promise<{
    score: Score;
    rank: number;
    is_new_best: boolean;
    xp_earned: number;
  }> {
    return this.request('/scores/submit/', {
      method: 'POST',
      body: JSON.stringify({ game: gameId, score_value: scoreValue, metadata }),
    });
  }

  async getMyScores(gameId?: string): Promise<Score[]> {
    let endpoint = '/scores/my_scores/';
    if (gameId) endpoint += `?game=${gameId}`;
    return this.request<Score[]>(endpoint);
  }

  async getMyBestScores(): Promise<Score[]> {
    return this.request<Score[]>('/scores/my_best/');
  }

  async getGameLeaderboard(gameId: string, limit = 100): Promise<Score[]> {
    const response = await this.request<{
      game: Game;
      rankings: RankingEntry[];
      total_players: number;
      current_user_rank: number | null;
    }>(`/games/${gameId}/leaderboard/?limit=${limit}`);
    
    // Convertir rankings a formato Score para compatibilidad
    return response.rankings.map((r, index) => ({
      id: index.toString(),
      user: r.user_id,
      username: r.username,
      display_name: r.display_name,
      avatar_url: r.avatar_url,
      user_level: r.level,
      game: gameId,
      game_title: response.game.title,
      score_value: r.score,
      metadata: {},
      is_best: true,
      created_at: new Date().toISOString(),
      rank: r.rank,
    })) as Score[];
  }

  async getFriendsLeaderboard(gameId: string): Promise<Score[]> {
    const response = await this.request<{
      game: Game;
      rankings: RankingEntry[];
      current_user_rank: number | null;
    }>(`/games/${gameId}/friends_leaderboard/`);
    
    return response.rankings.map((r, index) => ({
      id: index.toString(),
      user: r.user_id,
      username: r.username,
      display_name: r.display_name,
      avatar_url: r.avatar_url,
      user_level: r.level,
      game: gameId,
      game_title: response.game.title,
      score_value: r.score,
      metadata: {},
      is_best: true,
      created_at: new Date().toISOString(),
      rank: r.rank,
    })) as Score[];
  }

  async getUserProfile(userId: string): Promise<any> {
    return this.request(`/users/${userId}/`);
  }

  async getUserScores(userId: string): Promise<Score[]> {
    return this.request<Score[]>(`/users/${userId}/scores/`);
  }

  // ============== FRIENDSHIPS ENDPOINTS ==============

  async getFriends(): Promise<User[]> {
    return this.request<User[]>('/friendships/friends/');
  }

  async getPendingRequests(): Promise<Friendship[]> {
    return this.request<Friendship[]>('/friendships/pending/');
  }

  async getSentRequests(): Promise<Friendship[]> {
    return this.request<Friendship[]>('/friendships/sent/');
  }

  async sendFriendRequest(username: string): Promise<Friendship> {
    const response = await this.request<{ friendship: Friendship }>(
      '/friendships/send_request/',
      { method: 'POST', body: JSON.stringify({ receiver_username: username }) }
    );
    return response.friendship;
  }

  async acceptFriendRequest(friendshipId: string): Promise<void> {
    await this.request(`/friendships/${friendshipId}/accept/`, { method: 'POST' });
  }

  async rejectFriendRequest(friendshipId: string): Promise<void> {
    await this.request(`/friendships/${friendshipId}/reject/`, { method: 'POST' });
  }

  async removeFriend(friendshipId: string): Promise<void> {
    await this.request(`/friendships/${friendshipId}/unfriend/`, { method: 'DELETE' });
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.request<User[]>(`/users/search/?q=${encodeURIComponent(query)}`);
  }

  // ============== ACHIEVEMENTS ENDPOINTS ==============

  async getAchievements(gameId?: string): Promise<Achievement[]> {
    let endpoint = '/achievements/';
    if (gameId) endpoint += `?game=${gameId}`;
    return this.request<Achievement[]>(endpoint);
  }

  async getMyAchievements(): Promise<UserAchievement[]> {
    return this.request<UserAchievement[]>('/user-achievements/my_achievements/');
  }
  
  async getAllAchievementsWithProgress(): Promise<Achievement[]> {
    return this.request<Achievement[]>('/user-achievements/all_with_progress/');
  }

  async getUnclaimedAchievements(): Promise<UserAchievement[]> {
    return this.request<UserAchievement[]>('/user-achievements/unclaimed/');
  }

  async claimAchievement(achievementId: string): Promise<{
    xp_earned: number;
    new_total_xp: number;
    new_level: number;
  }> {
    return this.request(`/user-achievements/${achievementId}/claim/`, { method: 'POST' });
  }

  async claimAllAchievements(): Promise<{
    total_xp_earned: number;
    new_total_xp: number;
    new_level: number;
  }> {
    return this.request('/user-achievements/claim_all/', { method: 'POST' });
  }

  async getAchievementStats(): Promise<{
    total_achievements: number;
    unlocked: number;
    locked: number;
    completion_percentage: number;
    by_rarity: Record<string, number>;
    total_xp_earned: number;
  }> {
    return this.request('/user-achievements/stats/');
  }

  // ============== SESSIONS ENDPOINTS ==============

  async startGameSession(gameId: string, deviceInfo?: Record<string, any>): Promise<{
    session: { id: string };
  }> {
    return this.request('/sessions/start/', {
      method: 'POST',
      body: JSON.stringify({ game_id: gameId, device_info: deviceInfo }),
    });
  }

  async endGameSession(sessionId: string, scoreValue?: number, metadata?: Record<string, any>): Promise<{
    session: any;
    score?: Score;
    rank?: number;
    xp_earned?: number;
  }> {
    return this.request('/sessions/end/', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, score_value: scoreValue, metadata }),
    });
  }

  async getSessionStats(): Promise<{
    total_sessions: number;
    total_time_seconds: number;
    total_time_hours: number;
    avg_duration_seconds: number;
    favorite_game: Game | null;
  }> {
    return this.request('/sessions/stats/');
  }
}

export const api = new ApiService();
export default api;
