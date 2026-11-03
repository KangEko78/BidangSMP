import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Helpdesk TKA SMP | Banyuwangi",
  description: "Portal layanan Tes Kemampuan Akademik untuk satuan pendidikan jenjang SMP Kabupaten Banyuwangi.",
  applicationName: "Helpdesk TKA SMP Banyuwangi",
};

export const viewport: Viewport = {
  themeColor: "#07090c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
