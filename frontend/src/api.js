const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
const ACCESS_TOKEN_KEY = "duedoh-info-access-token";
const REFRESH_TOKEN_KEY = "duedoh-info-refresh-token";
const SESSION_EMAIL_KEY = "duedoh-info-session-email";
let refreshPromise = null;

function messageFrom(payload, fallback) {
  return payload?.message || payload?.response?.message || payload?.error || fallback;
}

function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(SESSION_EMAIL_KEY);
}

function storeTokens(payload) {
  if (payload?.access_token) localStorage.setItem(ACCESS_TOKEN_KEY, payload.access_token);
  if (payload?.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, payload.refresh_token);
}

async function refreshSession() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new Error("Your session has expired.");
  if (!refreshPromise) {
    refreshPromise = (async () => {
      let response;
      try {
        response = await fetch(`${API_BASE}/v1/auth/token/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${refreshToken}` },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch {
        throw new Error("We could not renew your session. Please check your connection and try again.");
      }
      const text = await response.text();
      let payload = null;
      try { payload = text ? JSON.parse(text) : null; } catch { payload = { message: text }; }
      if (!response.ok || !payload?.access_token) {
        clearSession();
        const error = new Error(messageFrom(payload, "Your session has expired. Please verify your email again."));
        error.status = response.status || 401;
        throw error;
      }
      storeTokens(payload);
      return payload;
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

async function request(path, options = {}, canRefresh = true) {
  const bodyIsForm = options.body instanceof FormData;
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const headers = new Headers(options.headers || {});
  if (!bodyIsForm) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error("We could not reach Duedoh right now. Please check your connection and try again.");
  }
  if (response.status === 401 && canRefresh && localStorage.getItem(REFRESH_TOKEN_KEY)) {
    await refreshSession();
    return request(path, options, false);
  }
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = { message: text }; }
  if (!response.ok) {
    const error = new Error(messageFrom(payload, "Something went wrong. Please try again."));
    error.status = response.status;
    error.fields = payload?.errors || {};
    throw error;
  }
  return payload;
}

function data(payload) { return payload?.data || payload?.response || payload || {}; }

export const api = {
  sessionEmail: () => localStorage.getItem(SESSION_EMAIL_KEY) || "",
  hasSession: (email = "") => {
    const hasToken = Boolean(localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY));
    const sessionEmail = localStorage.getItem(SESSION_EMAIL_KEY);
    return hasToken && (!email || !sessionEmail || sessionEmail === email.trim().toLowerCase());
  },
  clearSession,
  requestOtp: (email) => request("/v1/auth/request-otp", {
    method: "POST", body: JSON.stringify({ email: email.trim().toLowerCase() }),
  }).then(data),
  verifyOtp: async ({ email, otp, fullName }) => {
    const response = await request("/v1/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim(), full_name: fullName.trim(), register_as: "dude" }),
    });
    storeTokens(response);
    localStorage.setItem(SESSION_EMAIL_KEY, email.trim().toLowerCase());
    return data(response);
  },
  cities: () => request("/v1/cities").then((response) => {
    const result = data(response);
    return result.items || result.cities || (Array.isArray(result) ? result : []);
  }),
  tierOptions: () => request("/v1/dude/onboarding/tier-options").then(data),
  saveProfile: (body) => request("/v1/dude/onboarding/profile", { method: "POST", body: JSON.stringify(body) }).then(data),
  saveTier: (body) => request("/v1/dude/onboarding/tier", { method: "POST", body: JSON.stringify(body) }).then(data),
  saveVehicle: (body) => request("/v1/dude/onboarding/vehicle", { method: "POST", body: JSON.stringify(body) }).then(data),
  saveAvailability: (body) => request("/v1/dude/onboarding/availability", { method: "POST", body: JSON.stringify(body) }).then(data),
  uploadDocuments: (body) => request("/v1/dude/onboarding/documents", { method: "POST", body }).then(data),
  saveBank: (body) => request("/v1/dude/onboarding/bank-details", { method: "POST", body: JSON.stringify(body) }).then(data),
  applicationStatus: () => request("/v1/dude/onboarding/application-status").then(data),
};
