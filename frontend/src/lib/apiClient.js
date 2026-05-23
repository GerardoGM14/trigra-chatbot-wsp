// Cliente HTTP único. Todo el código que habla con el backend pasa por aquí.
//
// Características:
//   · Lee VITE_API_URL al arrancar; falla rápido si no está configurado.
//   · Adjunta el JWT automáticamente desde localStorage si existe.
//   · Centraliza el parseo de errores: lanza ApiError con { status, code, message, details }.
//   · Si recibe 401, dispara evento global `auth:expired` para que el AuthProvider
//     pueda hacer logout sin acoplarse a este módulo.
//   · NO usa fetch directamente desde los hooks — pasan por get/post/patch/delete.

const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";
const TOKEN_KEY = "wsp-control.token";

if (!BASE_URL) {
  console.warn(
    "[apiClient] VITE_API_URL no configurado — las llamadas al backend fallarán.",
  );
}

export class ApiError extends Error {
  constructor(status, payload) {
    const code = payload?.code ?? "UNKNOWN";
    const message = payload?.message ?? `HTTP ${status}`;
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = payload?.details;
  }
}

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* localStorage no disponible */
  }
}

export function clearToken() {
  setToken(null);
}

// Núcleo: hace la petición, parsea JSON, lanza ApiError en !ok.
async function request(method, path, { body, query, signal, headers = {} } = {}) {
  const url = new URL(BASE_URL + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const token = getToken();
  const finalHeaders = {
    "Accept": "application/json",
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...headers,
  };

  let res;
  try {
    res = await fetch(url.toString(), {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (networkErr) {
    // fetch lanza TypeError cuando no hay red, CORS bloquea, etc.
    throw new ApiError(0, {
      code: "NETWORK_ERROR",
      message: `No se pudo conectar con el servidor (${networkErr.message})`,
    });
  }

  // 401 → token expirado o inválido. Avisamos al provider de auth.
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent("auth:expired"));
  }

  // 204 No Content (DELETE típico) → devuelve null sin parsear.
  if (res.status === 204) return null;

  const text = await res.text();
  const payload = text ? safeJsonParse(text) : null;

  if (!res.ok) throw new ApiError(res.status, payload);
  return payload;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { code: "PARSE_ERROR", message: text };
  }
}

// API pública
export const api = {
  get: (path, opts) => request("GET", path, opts),
  post: (path, body, opts) => request("POST", path, { ...opts, body }),
  patch: (path, body, opts) => request("PATCH", path, { ...opts, body }),
  put: (path, body, opts) => request("PUT", path, { ...opts, body }),
  delete: (path, opts) => request("DELETE", path, opts),
};
