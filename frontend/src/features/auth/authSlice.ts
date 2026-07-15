import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { apiClient } from "../../api/client";
import type { Role, User } from "../../types";

interface AuthState {
  user: User | null;
  token: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("manuflow_token"),
  status: "idle",
  error: null,
};

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  role: Role;
  company_name?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

export const login = createAsyncThunk<AuthResponse, LoginPayload, { rejectValue: string }>(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<AuthResponse>("/auth/login/", payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.non_field_errors?.[0] || "Login failed");
    }
  }
);

export const register = createAsyncThunk<AuthResponse, RegisterPayload, { rejectValue: string }>(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<AuthResponse>("/auth/register/", payload);
      return data;
    } catch (err: any) {
      const detail = err.response?.data;
      const message = detail ? Object.values(detail).flat().join(" ") : "Registration failed";
      return rejectWithValue(message);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk<User>("auth/fetchCurrentUser", async () => {
  const { data } = await apiClient.get<User>("/auth/me/");
  return data;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem("manuflow_token");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("manuflow_token", action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Login failed";
      })
      .addCase(register.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("manuflow_token", action.payload.token);
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Registration failed";
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
