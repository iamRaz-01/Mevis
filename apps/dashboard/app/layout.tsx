import React from "react";
import "./global.css";
import { Providers } from "./providers";

export const metadata = {
  title: "MEVIS Operations Command Platform",
  description: "Standardized operations and intelligence platform for volunteer management",
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
