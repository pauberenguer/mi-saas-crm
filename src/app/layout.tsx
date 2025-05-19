// File: src/app/layout.tsx
import "./globals.css";
import { ReactNode, Suspense } from "react";
import { Metadata } from "next";
import LayoutClientRuntime from "./LayoutClientRuntime";

export const metadata: Metadata = {
  title: "Mi CRM",
  description: "CRM personalizado con notificaciones",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-background text-foreground">
        <Suspense fallback={null}>
          <LayoutClientRuntime>{children}</LayoutClientRuntime>
        </Suspense>
      </body>
    </html>
  );
}
