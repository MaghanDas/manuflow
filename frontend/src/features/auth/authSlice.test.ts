import authReducer, { login, logout, register } from "./authSlice";

describe("authSlice", () => {
  const initialState = {
    user: null,
    token: null,
    status: "idle" as const,
    error: null,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it("returns the initial state", () => {
    expect(authReducer(undefined, { type: "@@INIT" })).toMatchObject({ user: null });
  });

  it("sets user and token on login.fulfilled", () => {
    const user = { id: 1, username: "alice", email: "a@x.com", role: "CLIENT" as const, company_name: "", first_name: "", last_name: "" };
    const action = { type: login.fulfilled.type, payload: { token: "abc123", user } };
    const state = authReducer(initialState, action);
    expect(state.user).toEqual(user);
    expect(state.token).toBe("abc123");
    expect(localStorage.getItem("manuflow_token")).toBe("abc123");
  });

  it("stores an error message on login.rejected", () => {
    const action = { type: login.rejected.type, payload: "Invalid credentials." };
    const state = authReducer(initialState, action);
    expect(state.status).toBe("failed");
    expect(state.error).toBe("Invalid credentials.");
  });

  it("clears user/token on logout", () => {
    localStorage.setItem("manuflow_token", "abc123");
    const loggedInState = { ...initialState, token: "abc123", user: { id: 1 } as any };
    const state = authReducer(loggedInState, logout());
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(localStorage.getItem("manuflow_token")).toBeNull();
  });

  it("sets user and token on register.fulfilled", () => {
    const user = { id: 2, username: "bob", email: "b@x.com", role: "OPERATOR" as const, company_name: "", first_name: "", last_name: "" };
    const action = { type: register.fulfilled.type, payload: { token: "xyz", user } };
    const state = authReducer(initialState, action);
    expect(state.user?.username).toBe("bob");
    expect(state.token).toBe("xyz");
  });
});
