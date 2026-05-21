// Inicialización de Firebase para Hosting + Analytics.
//
// Decisiones intencionales:
//   · Init perezoso: si falta cualquier variable VITE_FIREBASE_*, devolvemos
//     null silenciosamente. Útil para entornos de dev sin Firebase configurado
//     y para tests, donde no queremos que la app crashee al arrancar.
//   · Analytics solo en producción + solo si el navegador lo soporta (algunos
//     navegadores con privacidad agresiva bloquean gtag). `isSupported()` lo
//     verifica antes de inicializar.
//   · No commiteamos las claves: viven en `.env.local`. El archivo
//     `.env.example` documenta qué variables se esperan.

import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsSupported, logEvent } from "firebase/analytics";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Si falta alguna variable obligatoria, no inicializamos. El resto del app sigue
// funcionando con normalidad (los mocks no dependen de Firebase).
const hasMinimumConfig = config.apiKey && config.projectId && config.appId;

export const firebaseApp = hasMinimumConfig ? initializeApp(config) : null;

// Singleton del analytics — se inicializa una sola vez y se reutiliza para
// cada llamada a trackPageView/trackEvent.
let analyticsInstance = null;
let analyticsReady = null;

async function ensureAnalytics() {
  if (analyticsInstance) return analyticsInstance;
  if (!firebaseApp || !config.measurementId) return null;

  // En dev no contaminamos las métricas con nuestras propias visitas. Solo
  // activamos analytics en producción.
  if (import.meta.env.MODE !== "production") return null;

  // `analyticsSupported()` chequea que el navegador permita gtag (algunos
  // bloqueadores de privacidad lo deshabilitan).
  const supported = await analyticsSupported();
  if (!supported) return null;

  analyticsInstance = getAnalytics(firebaseApp);
  return analyticsInstance;
}

// Devuelve una promesa que resuelve cuando analytics está listo (o nunca lo
// estará, si la config no permite). Útil para hacer "fire and forget".
export function getAnalyticsAsync() {
  if (!analyticsReady) analyticsReady = ensureAnalytics();
  return analyticsReady;
}

// Tracker de cambios de ruta. Lo llama el RouteProgressBar (o cualquier otro
// listener) cada vez que el pathname cambia. Si analytics no está disponible,
// el evento se descarta silenciosamente.
export async function trackPageView(path) {
  const analytics = await getAnalyticsAsync();
  if (!analytics) return;
  logEvent(analytics, "page_view", {
    page_path: path,
    page_location: window.location.href,
  });
}

// Eventos custom (login, campaña enviada, etc.). Se conectarán cuando el
// backend esté integrado.
export async function trackEvent(name, params) {
  const analytics = await getAnalyticsAsync();
  if (!analytics) return;
  logEvent(analytics, name, params);
}
