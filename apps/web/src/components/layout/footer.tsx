import Link from "next/link";
import { MountainLogo } from "@/components/ui/MountainLogo";

export function Footer() {
  return (
    <footer className="w-full border-t border-sky-200/80 ice-glass py-10 text-sm text-vistaar-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center space-x-2.5">
            <MountainLogo size="sm" />
            <span className="font-extrabold text-vistaar-text text-base">VISTAAR • विस्तार</span>
          </div>
          <p className="text-xs leading-relaxed">
            National Polar Science Outreach, Knowledge Repository and Media Dissemination Portal, engineered for NCPOR and the Ministry of Earth Sciences, Government of India.
          </p>
          <p className="text-xs text-vistaar-muted font-mono">
            Smart India Hackathon • Problem Statement 26063
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-vistaar-text mb-3 text-xs uppercase tracking-wider">Polar Observatories</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/stations?id=bharati" className="hover:text-vistaar-primary">Bharati Station (Larsemann Hills)</Link></li>
            <li><Link href="/stations?id=maitri" className="hover:text-vistaar-primary">Maitri Station (Schirmacher Oasis)</Link></li>
            <li><Link href="/stations?id=himadri" className="hover:text-vistaar-primary">Himadri Arctic Base (Ny-Ålesund)</Link></li>
            <li><Link href="/stations?id=himansh" className="hover:text-vistaar-primary">Himansh Station (Himalayan Third Pole)</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-vistaar-text mb-3 text-xs uppercase tracking-wider">Outreach & Data</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/datasets" className="hover:text-vistaar-primary">National Polar Data Centre (NPDC)</Link></li>
            <li><Link href="/weather" className="hover:text-vistaar-primary">Weather & Climate Intelligence</Link></li>
            <li><Link href="/education" className="hover:text-vistaar-primary">Class 8–12 Classroom Studio</Link></li>
            <li><Link href="/media" className="hover:text-vistaar-primary">Journalist Press Kits & Media</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-vistaar-text mb-3 text-xs uppercase tracking-wider">Institutional Governance</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/workspace" className="hover:text-vistaar-primary">Scientific Review Workspace</Link></li>
            <li><Link href="/admin" className="hover:text-vistaar-primary">Security & Audit Console</Link></li>
            <li className="pt-2 text-[11px] text-vistaar-muted">
              Authoritative real data only. Every scientific claim retains deterministic provenance to NPDC observation records.
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-vistaar-border/60 flex flex-col sm:flex-row justify-between items-center text-xs">
        <p>© 2026 National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences. All rights reserved.</p>
        <p className="mt-2 sm:mt-0 font-medium text-vistaar-scientific">Designed for Indian Polar Science Dissemination</p>
      </div>
    </footer>
  );
}
