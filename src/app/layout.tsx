import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { DynamicIsland } from "@/components/ui/DynamicIsland";

import "./globals.css";

export const metadata: Metadata = {
  title: "Kalisto ERP",
  description: "Sistema modular de administración empresarial.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider>
          <CommandPalette />
          <DynamicIsland />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
