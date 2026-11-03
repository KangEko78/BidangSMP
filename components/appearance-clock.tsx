"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function jakartaTime(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const hour = read("hour");
  const minute = read("minute");
  const second = read("second");
  return {
    hour,
    minute,
    second,
    digital: new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).format(date),
    date: new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date),
  };
}

export function AppearanceClock() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("helpdesk-smp-theme");
    const initial: Theme = saved === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = initial;
    setTheme(initial);
  }, []);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("helpdesk-smp-theme", next);
    setTheme(next);
  }

  const time = now ? jakartaTime(now) : null;
  const hourAngle = time ? ((time.hour % 12) + time.minute / 60) * 30 : 0;
  const minuteAngle = time ? (time.minute + time.second / 60) * 6 : 0;
  const secondAngle = time ? time.second * 6 : 0;

  return (
    <div className="topbar-tools">
      <div className="clock-widget" aria-label={time ? `Waktu Banyuwangi ${time.digital}` : "Jam Banyuwangi"}>
        <div className="analog-clock" aria-hidden="true">
          <svg viewBox="0 0 48 48">
            <circle className="clock-ring" cx="24" cy="24" r="21" />
            <path className="clock-ticks" d="M24 5v3M43 24h-3M24 43v-3M5 24h3" />
            <line className="clock-hand hour-hand" x1="24" y1="24" x2="24" y2="13.5" transform={`rotate(${hourAngle} 24 24)`} />
            <line className="clock-hand minute-hand" x1="24" y1="24" x2="24" y2="9" transform={`rotate(${minuteAngle} 24 24)`} />
            <line className="clock-hand second-hand" x1="24" y1="27" x2="24" y2="8" transform={`rotate(${secondAngle} 24 24)`} />
            <circle className="clock-pin" cx="24" cy="24" r="1.8" />
          </svg>
        </div>
        <div className="clock-copy">
          <b>{time?.digital ?? "--:--:--"} <span>WIB</span></b>
          <small>{time?.date ?? "Banyuwangi, Indonesia"}</small>
        </div>
      </div>
      <button
        className="theme-toggle"
        type="button"
        onClick={toggleTheme}
        aria-label={`Aktifkan mode ${theme === "dark" ? "terang" : "gelap"}`}
        title={`Aktifkan mode ${theme === "dark" ? "terang" : "gelap"}`}
      >
        {theme === "dark" ? (
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.3 15.4A8.5 8.5 0 0 1 8.6 3.7 8.5 8.5 0 1 0 20.3 15.4Z" /></svg>
        )}
        <span>{theme === "dark" ? "Terang" : "Gelap"}</span>
      </button>
    </div>
  );
}

