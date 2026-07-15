import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { apiClient } from "../../api/client";
import type { Material, Paginated } from "../../types";

interface MaterialsState {
  items: Material[];
  status: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: MaterialsState = {
  items: [],
  status: "idle",
};

export const fetchMaterials = createAsyncThunk<Material[]>("materials/fetch", async () => {
  const { data } = await apiClient.get<Paginated<Material> | Material[]>("/materials/", {
    params: { page_size: 100 },
  });
  return Array.isArray(data) ? data : data.results;
});

const materialsSlice = createSlice({
  name: "materials",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaterials.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMaterials.fulfilled, (state, action: PayloadAction<Material[]>) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchMaterials.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export default materialsSlice.reducer;
