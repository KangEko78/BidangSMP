const paths: Record<string, string> = {
  home: "M3 10.8 12 3l9 7.8v9.4a1 1 0 0 1-1 1h-5.2v-6.4H9.2v6.4H4a1 1 0 0 1-1-1z",
  document: "M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7",
  grid: "M4 4h16v16H4zM4 9h16M9 9v11M15 9v11",
  report: "M14 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10zM14 3v7h7M8 15h8M8 18h5",
  chart: "M4 20V5m0 15h17M8 16v-5m5 5V7m5 9V4",
  chat: "M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5a9 9 0 0 1-.9-4A8.5 8.5 0 1 1 21 11.5Z",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  chevron: "m8 10 4 4 4-4",
  refresh: "M20 7v5h-5M4 17v-5h5M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3",
  download: "M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4",
  shield: "M12 3 20 6v5.5c0 4.6-3.1 7.8-8 9.5-4.9-1.7-8-4.9-8-9.5V6zM8.5 12l2.2 2.2 4.8-5",
  clock: "M12 8v4l2.5 2.5M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  plus: "M12 5v14M5 12h14",
  check: "m5 12 4 4L19 6",
};

export function Icon({ name, size = 18, className = "" }: { name: string; size?: number; className?: string }) {
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name] || paths.document} /></svg>;
}
