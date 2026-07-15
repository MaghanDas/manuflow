// Jest-only stand-in for src/api/client.ts, which reads import.meta.env — a
// Vite/ESM construct that ts-jest (running under CommonJS) can't parse.
// Redirected here via the "(\\.\\./)+api/client$" entry in jest.config.cjs.
// Real thunks are exercised via reducer-level tests, not live HTTP calls,
// so a minimal stub is enough to satisfy the import.
export const API_BASE_URL = "http://localhost:8000/api";

export const apiClient = {
  get: async () => ({ data: null }),
  post: async () => ({ data: null }),
  put: async () => ({ data: null }),
  patch: async () => ({ data: null }),
  delete: async () => ({ data: null }),
};
