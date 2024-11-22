import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Readathon 2024! at Yu Ming Charter School",
  description: "Read, pledge and win!",
  icons: [
    {
      rel: "icon",
      url: "https://yumingschool.org/wp-content/uploads/fbrfg/favicon-32x32.png",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#ac211d] to-[#15162c] text-white">
          {children}
        </main>
      </body>
    </html>
  );
}
