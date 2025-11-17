import type { Metadata } from "next";
import { Inter, Unbounded } from "next/font/google";
import "./globals.css";
import GlobalSettingsButton from "@/components/GlobalSettingsButton";
import { ThemeProvider } from "@/providers/theme-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Isekai",
  description: "Isekai world builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${unbounded.variable} antialiased`}>
        <ThemeProvider>
          {children}
          <GlobalSettingsButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
