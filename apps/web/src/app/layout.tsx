import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  metadataBase: new URL("https://vistaar.ncpor.res.in"),
  title: {
    default: "VISTAAR (विस्तार) — Integrated Polar Science Outreach & Knowledge Repository",
    template: "%s | VISTAAR — NCPOR / Ministry of Earth Sciences",
  },
  description:
    "Official Indian Polar Science Outreach, Knowledge Repository and Media Dissemination Platform for the National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences, Government of India.",
  keywords: [
    "NCPOR",
    "Ministry of Earth Sciences",
    "VISTAAR",
    "Maitri",
    "Bharati",
    "Himadri",
    "Himansh",
    "IndARC",
    "National Polar Data Centre",
    "NPDC",
    "Indian Scientific Expedition to Antarctica",
  ],
  openGraph: {
    title: "VISTAAR (विस्तार) — NCPOR Polar Science Knowledge & Outreach Portal",
    description:
      "Explore verified scientific datasets, expedition bulletins, polar weather intelligence, and NCERT classroom modules across Antarctica, the Arctic, and the Himalayas.",
    url: "https://vistaar.ncpor.res.in",
    siteName: "VISTAAR — NCPOR / MoES",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VISTAAR (विस्तार) — Indian Polar Science Portal (NCPOR / MoES)",
    description:
      "Verified telemetry, expedition research, and educational modules from Maitri, Bharati, Himadri, and Himansh.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-vistaar-bg text-vistaar-text antialiased selection:bg-blue-100 selection:text-vistaar-text">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-vistaar-primary focus:font-semibold focus:border-2 focus:border-vistaar-primary focus:rounded-md focus:shadow-md"
        >
          Skip to main scientific content
        </a>
        <ToastProvider>
          <Navbar />
          <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
