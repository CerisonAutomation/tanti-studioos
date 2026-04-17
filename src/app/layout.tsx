import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  title: "Tanti Interiors StudioOS",
  description: "Premium Luxury Interior Design Studio Management Platform — Malta",
  keywords: ["Tanti Interiors", "Interior Design", "Malta", "Studio Management", "Luxury"],
  authors: [{ name: "Tanti Interiors" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="antialiased bg-background text-foreground font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <QueryProvider>
            {children}
            <Toaster
              theme="dark"
              position="bottom-right"
              toastOptions={{
                className: 'glass-strong border-border/30',
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
