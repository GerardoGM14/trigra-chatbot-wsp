// Dispara `trackPageView` en cada cambio de ruta. Se monta en App una sola vez.
// Si Firebase no está configurado (dev sin VITE_FIREBASE_*), el hook no hace
// nada útil — el track interno descarta silenciosamente.

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../lib/firebase.js";

export function useAnalytics() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    trackPageView(pathname + search);
  }, [pathname, search]);
}
