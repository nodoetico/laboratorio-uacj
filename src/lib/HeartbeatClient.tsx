"use client";

import { useEffect } from "react";

export default function HeartbeatClient() {
  useEffect(() => {
    const enviar = () => {
      fetch("/api/auth/heartbeat", { method: "POST" }).catch(() => {});
    };
    enviar();
    const intervalo = setInterval(enviar, 2 * 60 * 1000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") enviar();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return null;
}
