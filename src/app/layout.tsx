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
              position="top-right"
              toastOptions={{
                className: "glass-card",
                style: {
                  background: 'rgba(26, 18, 50, 0.9)',
                  border: '1px solid rgba(58, 12, 163, 0.3)',
                  color: '#F0ECF4',
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
