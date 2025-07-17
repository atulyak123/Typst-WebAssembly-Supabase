export const metadata = {
  title: "Typst Playground",
};

import { AuthProvider } from "@/context/auth-context";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>   <AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}