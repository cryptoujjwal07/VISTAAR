"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MountainLogo } from "@/components/ui/MountainLogo";
import { ROLE_PORTAL_MAP } from "@/components/layout/AuthGate";

export function Footer() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const syncUser = () => {
      if (typeof window === "undefined") return;
      const savedToken = localStorage.getItem("vistaar_token");
      const savedUser = localStorage.getItem("vistaar_user");
      if (savedToken && savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
          return;
        } catch {
          setCurrentUser(null);
        }
      }
      setCurrentUser(null);
    };

    syncUser();
    window.addEventListener("vistaar-auth-changed", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("vistaar-auth-changed", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  if (!currentUser) {
    return null;
  }

  const roleSpec = ROLE_PORTAL_MAP[currentUser.role] || ROLE_PORTAL_MAP.PUBLIC_USER;

  return (
    <footer className="w-full border-t border-sky-200/80 ice-glass py-8 text-sm text-vistaar-muted">
      <div className="w-full px-4 sm:px-6 lg:px-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-2.5">
          <div className="flex items-center space-x-2.5">
            <MountainLogo size="sm" />
            <span className="font-extrabold text-vistaar-text text-base">VISTAAR • विस्तार</span>
          </div>
          <p className="text-xs leading-relaxed">
            National Polar Science Outreach, Knowledge Repository and Media Dissemination Portal for NCPOR and the Ministry of Earth Sciences, Government of India.
          </p>
          <p className="text-xs text-vistaar-muted font-mono">
            Signed in as: {currentUser.name || currentUser.email} ({currentUser.role})
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-vistaar-text mb-2.5 text-xs uppercase tracking-wider">
            Your Authorized Role Workspaces ({currentUser.role})
          </h4>
          <ul className="grid grid-cols-2 gap-2 text-xs">
            {roleSpec.navLinks.map((lnk) => (
              <li key={lnk.href}>
                <Link href={lnk.href} className="hover:text-vistaar-primary font-semibold">
                  {lnk.label} ({lnk.href})
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-vistaar-text mb-2.5 text-xs uppercase tracking-wider">
            Data Provenance & Governance
          </h4>
          <p className="text-xs leading-relaxed">
            Role-Based Access Control (RBAC) enforced. Every scientific claim retains deterministic provenance to NPDC observation records and SHA-256 dataset registries.
          </p>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 mt-6 pt-4 border-t border-sky-200/60 flex flex-col sm:flex-row justify-between items-center text-xs">
        <p>© 2026 National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences. All rights reserved.</p>
        <p className="mt-2 sm:mt-0 font-medium text-vistaar-scientific">Active Role Workspace: {roleSpec.title}</p>
      </div>
    </footer>
  );
}
