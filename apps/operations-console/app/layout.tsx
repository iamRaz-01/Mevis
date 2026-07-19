import React from "react";
import "./global.css";
import { Providers } from "./providers";

export const metadata = {
  title: "MEVIS Platform Operations Console",
  description: "Administrative Site Reliability & System Health Platform Console",
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
