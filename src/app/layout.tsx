import type { Metadata } from "next";
import { publicIdentity } from "@/lib/platform-identity";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export async function generateMetadata(): Promise<Metadata> {
  const {name,title,description} = await publicIdentity();
  return { title, description, applicationName: name, openGraph: {siteName:name,title,description}, twitter: {title,description} };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
