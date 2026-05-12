import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_URL } from '../utils/constants';

// ── Typed API Error ─────────────────────────────────────────────────────────
// Every rejected promise from `api` carries this shape so callers can
// branch on `errorCode` without inspecting raw status codes.
export interface ApiError {
  success: false;
  msg: string;
  errorCode:
    | 'UNAUTHORIZED'      // 401 — session expired / invalid token
    | 'FORBIDDEN'         // 403 — permission denied by server middleware
    | 'NOT_FOUND'         // 404
    | 'VALIDATION'        // 400
    | 'SERVER_ERROR'      // 5xx
    | 'NETWORK_ERROR';    // no response (offline / timeout)
  status?: number;
}

/** Extract a clean human-readable message from any thrown value */
export const parseApiError = (error: unknown): string => {
  if (!error || typeof error !== 'object') return 'An unexpected error occurred.';
  const e = error as Partial<ApiError> & { message?: string };

  if (e.errorCode === 'FORBIDDEN')    return e.msg || 'You do not have permission to perform this action.';
  if (e.errorCode === 'UNAUTHORIZED') return 'Your session has expired. Please sign in again.';
  if (e.errorCode === 'NETWORK_ERROR') return 'Server unreachable. Check your connection.';
  return e.msg || e.message || 'An unexpected error occurred.';
};

/** Returns true when the error is a 403 Permission Denied */
export const isPermissionError = (error: unknown): boolean =>
  (error as Partial<ApiError>)?.errorCode === 'FORBIDDEN';

// ── Axios Instance ──────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach bearer token ───────────────────────────────
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch { }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — normalize errors to ApiError ────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Network / timeout — no response from server
    if (!error.response) {
      return Promise.reject({
        success: false,
        msg: 'Server unreachable. Check your connection.',
        errorCode: 'NETWORK_ERROR',
      } satisfies ApiError);
    }

    const { status, data } = error.response;
    const serverMsg: string = data?.msg || data?.message || '';

    // Map HTTP status → errorCode
    let errorCode: ApiError['errorCode'] = 'SERVER_ERROR';
    if (status === 400) errorCode = 'VALIDATION';
    if (status === 401) errorCode = 'UNAUTHORIZED';
    if (status === 403) errorCode = 'FORBIDDEN';
    if (status === 404) errorCode = 'NOT_FOUND';
    if (status >= 500)  errorCode = 'SERVER_ERROR';

    // 401 — clear local session so the app re-routes to Login
    if (status === 401) {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    }

    const apiError: ApiError = {
      success: false,
      msg: serverMsg || defaultMessage(status),
      errorCode,
      status,
    };

    return Promise.reject(apiError);
  }
);

const defaultMessage = (status: number): string => {
  if (status === 400) return 'Invalid request. Please check your input.';
  if (status === 401) return 'Session expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource was not found.';
  if (status >= 500)  return 'A server error occurred. Please try again later.';
  return 'An unexpected error occurred.';
};

export default api;
