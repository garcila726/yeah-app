"use client";
import { useEffect } from "react";

export default function PwaInstaller() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("✅ Service Worker registrado"))
        .catch((err) => console.error("❌ Error al registrar SW:", err));
    }
  }, []);

  return null;
}
