"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatearFechaCorta } from "@/lib/formatear";

type Notificacion = {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: Date;
};

export function NotificationBell({
  initialCount,
  initialNotifications,
}: {
  initialCount: number;
  initialNotifications: Notificacion[];
}) {
  const [open, setOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState(initialNotifications);
  const [noLeidas, setNoLeidas] = useState(initialCount);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarcarLeida(id: number, link?: string | null) {
    await fetch("/api/notificaciones/leer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setNoLeidas((prev) => Math.max(0, prev - 1));
    if (link) router.push(link);
    setOpen(false);
  }

  async function handleMarcarTodasLeidas() {
    await fetch("/api/notificaciones/leer-todas", { method: "POST" });
    setNotificaciones((prev) => prev.map((n) => ({ ...n, read: true })));
    setNoLeidas(0);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 transition-colors"
        aria-label="Notificaciones"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4.5 h-4.5 text-[10px] font-bold text-white bg-red-500 rounded-full min-w-[18px] min-h-[18px]">
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-zinc-200 z-50 max-h-96 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
            <h3 className="text-sm font-semibold text-zinc-900">Notificaciones</h3>
            {noLeidas > 0 && (
              <button
                onClick={handleMarcarTodasLeidas}
                className="text-xs text-blue-600 hover:underline"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notificaciones.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">Sin notificaciones</p>
            ) : (
              notificaciones.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleMarcarLeida(n.id, n.link)}
                  className={`w-full text-left px-4 py-3 border-b border-zinc-50 hover:bg-zinc-50 transition-colors ${
                    !n.read ? "bg-blue-50/60" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!n.read ? "font-semibold text-zinc-900" : "text-zinc-700"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-zinc-300 mt-1">{formatearFechaCorta(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
