/**
 * Enterprise API Client for Tanti Interiors StudioOS
 * 
 * Centralized, type-safe API client with:
 * - Automatic response normalization (handles both array and envelope formats)
 * - Consistent error handling
 * - Request/response type safety
 * - Retry logic for transient failures
 * - Request deduplication via AbortController
 */

// ==========================================
// TYPES
// ==========================================

/** Standard API envelope response */
interface ApiEnvelope<T> {
  data?: T;
  error?: string;
  details?: unknown;
  total?: number;
  clients?: T;
  projects?: T;
  quotes?: T;
  messages?: T;
  events?: T;
}

/** API Error with status code */
export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Request configuration */
interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
}

// ==========================================
// CONFIGURATION
// ==========================================

const DEFAULT_TIMEOUT = 15000;
const DEFAULT_RETRIES = 1;
const RETRY_DELAYS = [500, 1000, 2000];

// ==========================================
// UTILITIES
// ==========================================

/**
 * Extract an array from an API response, handling both:
 * - Direct array: `[...]`
 * - Envelope: `{ clients: [...], total: N }` or `{ data: [...] }`
 */
export function extractArray<T>(response: unknown, key?: string): T[] {
  if (Array.isArray(response)) return response as T[];
  
  if (response && typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    
    // If a specific key is provided, use it
    if (key && Array.isArray(obj[key])) return obj[key] as T[];
    
    // Try common envelope keys in order of priority
    const arrayKeys = ['data', 'clients', 'projects', 'quotes', 'messages', 'events', 'items', 'results'];
    for (const k of arrayKeys) {
      if (Array.isArray(obj[k])) return obj[k] as T[];
    }
  }
  
  return [];
}

/**
 * Extract a single object from an API response
 */
export function extractObject<T>(response: unknown): T | null {
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    const obj = response as Record<string, unknown>;
    if (obj.error) return null;
    return response as T;
  }
  return null;
}

// ==========================================
// CORE CLIENT
// ==========================================

// Active request tracking for deduplication
const activeRequests = new Map<string, AbortController>();

function getRequestKey(url: string, method: string, body?: unknown): string {
  return `${method}:${url}:${body ? JSON.stringify(body) : ''}`;
}

/**
 * Core fetch wrapper with enterprise features
 */
async function apiFetch<T>(
  url: string,
  method: string = 'GET',
  options: RequestOptions = {},
): Promise<T> {
  const {
    body,
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    headers: customHeaders,
    signal: externalSignal,
    ...fetchOptions
  } = options;

  // Request deduplication for GET requests
  const requestKey = method === 'GET' ? getRequestKey(url, method) : '';
  
  if (method === 'GET' && activeRequests.has(requestKey)) {
    const existing = activeRequests.get(requestKey)!;
    // If there's an active identical request, abort it and start fresh
    existing.abort();
  }

  const controller = new AbortController();
  if (method === 'GET') activeRequests.set(requestKey, controller);

  // Link external signal if provided
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort());
  }

  // Timeout
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((customHeaders as Record<string, string>) || {}),
  };

  // Get auth token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('tanti-auth-token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    method,
    headers,
    signal: controller.signal,
    ...fetchOptions,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, config);

      // Clean up
      if (method === 'GET') activeRequests.delete(requestKey);
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: unknown;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: response.statusText };
        }

        const errorMessage = (errorData as Record<string, unknown>)?.error as string || response.statusText;
        
        throw new ApiError(
          errorMessage,
          response.status,
          (errorData as Record<string, unknown>)?.code as string,
          (errorData as Record<string, unknown>)?.details,
        );
      }

      const data = await response.json();
      return data as T;

    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on auth errors or client errors
      if (error instanceof ApiError && error.status < 500) {
        if (method === 'GET') activeRequests.delete(requestKey);
        clearTimeout(timeoutId);
        throw error;
      }

      // Don't retry on abort
      if (error instanceof DOMException && error.name === 'AbortError') {
        if (method === 'GET') activeRequests.delete(requestKey);
        clearTimeout(timeoutId);
        throw new ApiError('Request was cancelled', 499);
      }

      // Retry with exponential backoff
      if (attempt < retries) {
        const delay = RETRY_DELAYS[attempt] || 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  if (method === 'GET') activeRequests.delete(requestKey);
  clearTimeout(timeoutId);
  
  throw lastError || new ApiError('Request failed', 500);
}

// ==========================================
// CONVENIENCE METHODS
// ==========================================

/**
 * GET request that auto-extracts arrays from envelope responses
 */
export async function apiGetArray<T>(url: string, key?: string, options?: RequestOptions): Promise<T[]> {
  const response = await apiFetch<unknown>(url, 'GET', options);
  return extractArray<T>(response, key);
}

/**
 * GET request that returns raw response
 */
export async function apiGet<T>(url: string, options?: RequestOptions): Promise<T> {
  return apiFetch<T>(url, 'GET', options);
}

/**
 * POST request
 */
export async function apiPost<T>(url: string, body: unknown, options?: RequestOptions): Promise<T> {
  return apiFetch<T>(url, 'POST', { ...options, body });
}

/**
 * PUT request
 */
export async function apiPut<T>(url: string, body: unknown, options?: RequestOptions): Promise<T> {
  return apiFetch<T>(url, 'PUT', { ...options, body });
}

/**
 * PATCH request
 */
export async function apiPatch<T>(url: string, body: unknown, options?: RequestOptions): Promise<T> {
  return apiFetch<T>(url, 'PATCH', { ...options, body });
}

/**
 * DELETE request
 */
export async function apiDelete<T = void>(url: string, options?: RequestOptions): Promise<T> {
  return apiFetch<T>(url, 'DELETE', options);
}

// ==========================================
// DOMAIN-SPECIFIC HELPERS
// ==========================================

export const api = {
  // Clients
  clients: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiGetArray<Client>(`/api/clients${qs}`, 'clients');
    },
    get: (id: string) => apiGet<Client>(`/api/clients/${id}`),
    create: (data: unknown) => apiPost<Client>('/api/clients', data),
    update: (id: string, data: unknown) => apiPut<Client>(`/api/clients/${id}`, data),
    delete: (id: string) => apiDelete(`/api/clients/${id}`),
  },
  // Projects
  projects: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiGetArray<Project>(`/api/projects${qs}`);
    },
    get: (id: string) => apiGet<Project>(`/api/projects/${id}`),
    create: (data: unknown) => apiPost<Project>('/api/projects', data),
    update: (id: string, data: unknown) => apiPut<Project>(`/api/projects/${id}`, data),
    delete: (id: string) => apiDelete(`/api/projects/${id}`),
  },
  // Quotes
  quotes: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiGetArray<Quote>(`/api/quotes${qs}`);
    },
    get: (id: string) => apiGet<Quote>(`/api/quotes/${id}`),
    create: (data: unknown) => apiPost<Quote>('/api/quotes', data),
    update: (id: string, data: unknown) => apiPut<Quote>(`/api/quotes/${id}`, data),
  },
  // Messages
  messages: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiGetArray<Message>(`/api/messages${qs}`, 'messages');
    },
    update: (id: string, data: unknown) => apiPut(`/api/messages/${id}`, data),
  },
  // Tasks
  tasks: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiGetArray<Task>(`/api/tasks${qs}`);
    },
    create: (data: unknown) => apiPost<Task>('/api/tasks', data),
    update: (id: string, data: unknown) => apiPut<Task>(`/api/tasks/${id}`, data),
  },
  // Suppliers
  suppliers: {
    list: () => apiGetArray<Supplier>('/api/suppliers'),
    create: (data: unknown) => apiPost<Supplier>('/api/suppliers', data),
    update: (id: string, data: unknown) => apiPut<Supplier>(`/api/suppliers/${id}`, data),
  },
  // Expenses
  expenses: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiGetArray<Expense>(`/api/expenses${qs}`);
    },
    summary: () => apiGet<ExpenseSummary>('/api/expenses/summary'),
    create: (data: unknown) => apiPost<Expense>('/api/expenses', data),
    update: (id: string, data: unknown) => apiPut<Expense>(`/api/expenses/${id}`, data),
  },
  // Knowledge Base
  knowledge: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiGetArray<KnowledgeEntry>(`/api/knowledge${qs}`);
    },
    get: (id: string) => apiGet<KnowledgeEntry>(`/api/knowledge/${id}`),
    create: (data: unknown) => apiPost<KnowledgeEntry>('/api/knowledge', data),
    update: (id: string, data: unknown) => apiPut<KnowledgeEntry>(`/api/knowledge/${id}`, data),
    delete: (id: string) => apiDelete(`/api/knowledge/${id}`),
  },
  // Mood Boards
  moodboards: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiGetArray<MoodBoard>(`/api/moodboards${qs}`);
    },
    get: (id: string) => apiGet<MoodBoard>(`/api/moodboards/${id}`),
    create: (data: unknown) => apiPost<MoodBoard>('/api/moodboards', data),
    update: (id: string, data: unknown) => apiPut<MoodBoard>(`/api/moodboards/${id}`, data),
    delete: (id: string) => apiDelete(`/api/moodboards/${id}`),
  },
  // Calendar
  calendar: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiGetArray<CalendarEvent>(`/api/calendar${qs}`, 'events');
    },
    create: (data: unknown) => apiPost<CalendarEvent>('/api/calendar', data),
    update: (id: string, data: unknown) => apiPut<CalendarEvent>(`/api/calendar/${id}`, data),
    delete: (id: string) => apiDelete(`/api/calendar/${id}`),
  },
  // Activities
  activities: {
    list: () => apiGetArray<Activity>('/api/activities'),
  },
  // Auth
  auth: {
    login: (data: { email: string; password: string }) => apiPost<AuthResponse>('/api/auth/login', data),
    register: (data: { email: string; password: string; name: string }) => apiPost<AuthResponse>('/api/auth/register', data),
    session: () => apiGet<AuthResponse>('/api/auth/session'),
    logout: () => apiPost<void>('/api/auth/logout', {}),
    updateAiKey: (data: { aiApiKey: string }) => apiPut<AuthResponse>('/api/auth/ai-key', data),
  },
} as const;

// ==========================================
// DOMAIN TYPES (simplified for client use)
// ==========================================

interface Client { id: string; name: string; email: string; [key: string]: unknown }
interface Project { id: string; name: string; status: string; [key: string]: unknown }
interface Quote { id: string; title: string; [key: string]: unknown }
interface Message { id: string; content: string; [key: string]: unknown }
interface Task { id: string; title: string; [key: string]: unknown }
interface Supplier { id: string; name: string; [key: string]: unknown }
interface Expense { id: string; description: string; amount: number; [key: string]: unknown }
interface ExpenseSummary { total: number; pending: number; paid: number; [key: string]: unknown }
interface KnowledgeEntry { id: string; title: string; [key: string]: unknown }
interface MoodBoard { id: string; title: string; [key: string]: unknown }
interface CalendarEvent { id: string; title: string; [key: string]: unknown }
interface Activity { id: string; type: string; description: string; [key: string]: unknown }

interface AuthResponse {
  user: { id: string; email: string; name: string; role: string; aiApiKey?: string };
  token: string;
}
