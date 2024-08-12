import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar"; // Assuming Navbar is in this location

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cureva AI",
  description: "Cureva AI - Your Healthcare Assistant, AI-powered, 24/7, 365 days a year. If you need help, we are here for you. Ask ai for help get a home remedy to cure your symptoms. ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}