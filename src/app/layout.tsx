import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kalisto ERP",
  description: "Sistema modular de administración empresarial.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
