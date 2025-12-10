import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Data Confessional",
  description: "Where your data goes to tell the truth",
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


