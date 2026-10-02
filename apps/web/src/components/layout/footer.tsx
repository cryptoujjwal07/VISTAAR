"use client";

import Link from "next/link";
import { MountainLogo } from "@/components/ui/MountainLogo";
import { ShieldCheck, Database, Globe2, Compass } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-sky-200/90 ice-glass mt-20 pt-16 pb-12 text-slate-600">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand & Attribution */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center space-x-3">
            <MountainLogo size="lg" />
            <div>
              <span className="font-black text-slate-900 text-2xl tracking-tight">VISTAAR • विस्तार</span>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Integrated Polar Science Intelligence & Outreach Portal
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md">
            National platform for the National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences, Government of India. Dedicated to advancing research across Antarctica, the Arctic, and the Himalayas.
          </p>
          <div className="flex items-center space-x-2 text-xs font-mono text-sky-800 bg-sky-50/80 border border-sky-200/80 px-3 py-1.5 rounded-xl w-fit">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Calibrated Telemetry • Deterministic NPDC Provenance</span>
          </div>
        </div>

        {/* Quick Explorations */}
        <div className="space-y-3">
          <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
            Explore Cryosphere
          </h4>
          <ul className="space-y-2 text-sm font-semibold">
            <li>
              <Link href="/stations" className="hover:text-sky-700 transition-colors">
                Four Polar Observatories
              </Link>
            </li>
            <li>
              <Link href="/weather" className="hover:text-sky-700 transition-colors">
                Live Station Weather Telemetry
              </Link>
            </li>
            <li>
              <Link href="/expeditions" className="hover:text-sky-700 transition-colors">
                Scientific Expeditions Catalog
              </Link>
            </li>
            <li>
              <Link href="/datasets" className="hover:text-sky-700 transition-colors">
                NPDC Data Repositories
              </Link>
            </li>
          </ul>
        </div>

        {/* Outreach & Education */}
        <div className="space-y-3">
          <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
            Education & Media
          </h4>
          <ul className="space-y-2 text-sm font-semibold">
            <li>
              <Link href="/education" className="hover:text-sky-700 transition-colors">
                NCERT Polar Classroom (Class 8–12)
              </Link>
            </li>
            <li>
              <Link href="/research" className="hover:text-sky-700 transition-colors">
                Verified Scientific Bulletins
              </Link>
            </li>
            <li>
              <Link href="/media" className="hover:text-sky-700 transition-colors">
                Official Press Kits & Media
              </Link>
            </li>
            <li>
              <Link href="/explore" className="hover:text-sky-700 transition-colors">
                Polar Semantic Knowledge Search
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-sky-200/80 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 font-medium gap-3">
        <p>© 2026 National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences, Govt. of India.</p>
        <p className="font-bold text-sky-800">Smart India Hackathon • Problem Statement 26063</p>
      </div>
    </footer>
  );
}
