import axios from 'axios';
import { useAuthStore } from '../store/auth';
import type { User } from '../store/auth';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Needed for httpOnly refresh cookies
});

// Request interceptor: attach Bearer access token from Zustand store
axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: catch 401 and attempt silent refresh via cookie
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/register')) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const newAccessToken = data.data.accessToken;
        useAuthStore.getState().setAccessToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Reconnect socket with new token
        import('./socket').then(({ reconnectSocket }) => reconnectSocket());

        return axiosInstance(originalRequest);
      } catch {
        useAuthStore.getState().logout();
      }
    }

    if (error.response?.status === 403 && error.response?.data?.error?.code === 'PROFILE_INCOMPLETE') {
      window.location.href = '/profile/complete';
    }

    return Promise.reject(error);
  }
);

// ─── Type Helpers ───────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export interface Conversation {
  id: string;
  participantOne: { id: string; profile: { displayName: string; avatarUrl: string | null } | null };
  participantTwo: { id: string; profile: { displayName: string; avatarUrl: string | null } | null };
  order: { id: string; status: string; listing: { title: string } } | null;
  lastMessage: { content: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  sender: {
    id: string;
    profile: { displayName: string; avatarUrl: string | null } | null;
  };
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: {
    id: string;
    username?: string;
    profile: { displayName: string; avatarUrl: string | null } | null;
  };
  _count: { likes: number; comments: number };
  likedByMe: boolean;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    profile: { displayName: string; avatarUrl: string | null } | null;
  };
}

export interface FilmCredit {
  id: string;
  actorProfileId: string;
  tmdbMovieId: number;
  title: string;
  releaseYear: number | null;
  posterUrl: string | null;
  roleName: string;
}

export interface ActorProfile {
  id: string;
  userId: string;
  availabilityStatus: 'AVAILABLE' | 'BUSY' | 'NOT_LOOKING';
  filmCredits: FilmCredit[];
  user: {
    id: string;
    username: string;
    profile: { displayName: string; avatarUrl: string | null; headline: string | null; location: string | null; bio: string | null; } | null;
  };
}



export interface Subscription {
  id: string;
  userId: string;
  plan: string;
  status: string;
  expiresAt: string;
}

// ─── API Wrapper Functions ──────────────────────────────────────────

export const api = {
  // ── Auth ────────────────────────────────────────────────────
  register: async (payload: { username: string; email: string; password: string; displayName: string; role: 'BUYER' | 'SELLER' }) => {
    const { data } = await axiosInstance.post('/auth/register', payload);
    return data.data as { user: User; accessToken: string };
  },

  login: async (payload: { email: string; password: string }) => {
    const { data } = await axiosInstance.post('/auth/login', payload);
    return data.data as { user: User; accessToken: string };
  },

  logout: async () => {
    const { data } = await axiosInstance.post('/auth/logout');
    useAuthStore.getState().logout();
    return data.data;
  },

  getMe: async () => {
    const { data } = await axiosInstance.get('/auth/me');
    return data.data as User;
  },

  // ── Profiles ───────────────────────────────────────────────
  getProfileByUsername: async (username: string) => {
    const { data } = await axiosInstance.get(`/profiles/u/${username}`);
    return data.data;
  },

  getProfile: async (userId: string) => {
    const { data } = await axiosInstance.get(`/profiles/${userId}`);
    return data.data;
  },

  updateProfile: async (payload: Record<string, unknown>) => {
    const { data } = await axiosInstance.patch('/profiles/me', payload);
    return data.data;
  },

  updateRole: async (role: 'BUYER' | 'SELLER' | 'ADMIN') => {
    const { data } = await axiosInstance.patch('/profiles/role', { role });
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
    }
    const store = useAuthStore.getState();
    if (store.user) {
      store.setUser({ ...store.user, role } as User);
    }
    return data.data;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await axiosInstance.post('/profiles/me/avatar', formData);
    return data.data as { avatarUrl: string };
  },

  uploadBanner: async (file: File) => {
    const formData = new FormData();
    formData.append('banner', file);
    const { data } = await axiosInstance.post('/profiles/me/banner', formData);
    return data.data as { bannerUrl: string };
  },

  // ── Listings (Marketplace) ─────────────────────────────────
  getListings: async (params?: { category?: string; minPrice?: number; maxPrice?: number; q?: string; page?: number; limit?: number }) => {
    const { data } = await axiosInstance.get('/listings', { params });
    return data as PaginatedResponse<any>;
  },

  getListing: async (id: string) => {
    const { data } = await axiosInstance.get(`/listings/${id}`);
    return data.data;
  },

  createListing: async (payload: { title: string; description: string; category: string; price: number; deliveryDays: number }) => {
    const { data } = await axiosInstance.post('/listings', payload);
    return data.data;
  },

  updateListing: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await axiosInstance.patch(`/listings/${id}`, payload);
    return data.data;
  },

  deleteListing: async (id: string) => {
    const { data } = await axiosInstance.delete(`/listings/${id}`);
    return data.data;
  },

  // ── Orders ─────────────────────────────────────────────────
  createOrder: async (payload: { listingId: string; requirements?: string }) => {
    const { data } = await axiosInstance.post('/orders', payload);
    return data.data;
  },

  getOrders: async (params?: { status?: string; page?: number; limit?: number }) => {
    const { data } = await axiosInstance.get('/orders', { params });
    return data as PaginatedResponse<any>;
  },

  getOrder: async (id: string) => {
    const { data } = await axiosInstance.get(`/orders/${id}`);
    return data.data;
  },

  updateOrderStatus: async (id: string, status: string) => {
    const { data } = await axiosInstance.patch(`/orders/${id}/status`, { status });
    return data.data;
  },

  // ── Portfolio ──────────────────────────────────────────────
  getPortfolio: async (userId: string) => {
    const { data } = await axiosInstance.get(`/portfolio/${userId}`);
    return data.data as Array<any>;
  },

  createPortfolioItem: async (payload: { title: string; description?: string; projectUrl?: string }) => {
    const { data } = await axiosInstance.post('/portfolio', payload);
    return data.data;
  },

  updatePortfolioItem: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await axiosInstance.patch(`/portfolio/${id}`, payload);
    return data.data;
  },

  deletePortfolioItem: async (id: string) => {
    const { data } = await axiosInstance.delete(`/portfolio/${id}`);
    return data.data;
  },

  uploadPortfolioImages: async (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const { data } = await axiosInstance.post(`/portfolio/${id}/images`, formData);
    return data.data as Array<{ id: string; url: string }>;
  },

  // ── Conversations & Messaging ──────────────────────────────
  getConversations: async () => {
    const { data } = await axiosInstance.get('/conversations');
    return data.data as Conversation[];
  },

  createConversation: async (orderId: string) => {
    const { data } = await axiosInstance.post('/conversations', { orderId });
    return data.data;
  },

  getMessages: async (conversationId: string, params?: { page?: number; limit?: number }) => {
    const { data } = await axiosInstance.get(`/conversations/${conversationId}/messages`, { params });
    return data as PaginatedResponse<Message>;
  },

  // ── Dashboard ──────────────────────────────────────────────
  getSellerDashboard: async () => {
    const { data } = await axiosInstance.get('/dashboard/seller');
    return data.data;
  },

  getBuyerDashboard: async () => {
    const { data } = await axiosInstance.get('/dashboard/buyer');
    return data.data;
  },

  // ── Posts (Feed) ───────────────────────────────────────────
  getPosts: async () => {
    const { data } = await axiosInstance.get('/posts');
    return data.data as Post[];
  },

  createPost: async (payload: { content: string; image?: File }) => {
    const formData = new FormData();
    formData.append('content', payload.content);
    if (payload.image) {
      formData.append('image', payload.image);
    }
    const { data } = await axiosInstance.post('/posts', formData);
    return data.data as Post;
  },

  toggleLike: async (postId: string) => {
    const { data } = await axiosInstance.post(`/posts/${postId}/like`);
    return data.data as { liked: boolean };
  },

  getPostComments: async (postId: string) => {
    const { data } = await axiosInstance.get(`/posts/${postId}/comments`);
    return data.data as PostComment[];
  },

  addPostComment: async (postId: string, content: string) => {
    const { data } = await axiosInstance.post(`/posts/${postId}/comments`, { content });
    return data.data as PostComment;
  },

  // ── Actor Specialization ───────────────────────────────────
  getActors: async (params?: { page?: number; limit?: number; q?: string; location?: string }) => {
    const { data } = await axiosInstance.get('/actor', { params });
    return data as PaginatedResponse<ActorProfile>;
  },

  getActorProfileByUsername: async (username: string) => {
    const { data } = await axiosInstance.get(`/actor/u/${username}`);
    return data.data as ActorProfile;
  },

  getActorProfile: async (userId: string) => {
    const { data } = await axiosInstance.get(`/actor/${userId}`);
    return data.data as ActorProfile;
  },

  upsertActorProfile: async (payload: { availabilityStatus?: string }) => {
    const { data } = await axiosInstance.post('/actor/me', payload);
    return data.data as ActorProfile;
  },

  addFilmCredit: async (payload: { tmdbMovieId: number; title: string; releaseYear?: number; posterUrl?: string; roleName: string }) => {
    const { data } = await axiosInstance.post('/actor/me/credits', payload);
    return data.data as FilmCredit;
  },

  deleteFilmCredit: async (creditId: string) => {
    const { data } = await axiosInstance.delete(`/actor/me/credits/${creditId}`);
    return data.data;
  },

  // ── Payments & Premium ─────────────────────────────────────
  createPaymentOrder: async (payload: { amount: number; currency?: string; paymentType: 'SUBSCRIPTION' | 'ORDER_ESCROW'; relatedId?: string }) => {
    const { data } = await axiosInstance.post('/payments/create-order', payload);
    return data.data; // { paymentId, razorpayOrder, key }
  },

  verifyPayment: async (payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; paymentId: string; plan?: string }) => {
    const { data } = await axiosInstance.post('/payments/verify', payload);
    return data.data; // { success, payment }
  },

  // ── Admin ──────────────────────────────────────────────────
  getAdminStats: async () => {
    const { data } = await axiosInstance.get('/admin/stats');
    return data.data;
  },

  suspendUser: async (userId: string, suspended: boolean) => {
    const { data } = await axiosInstance.patch(`/admin/users/${userId}/suspend`, { suspended });
    return data.data;
  },

  // ── Movies Proxy ───────────────────────────────────────────
  searchMovies: async (query: string) => {
    const { data } = await axiosInstance.get('/movies/search', { params: { q: query } });
    return data.data;
  },
};
