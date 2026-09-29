import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Shield, Database, Award, Landmark, Globe, CheckCircle2, ArrowRight } from "lucide-react";

export default function AboutPage() {
  const pillars = [
    {
      title: "Scientific Mandate",
      desc: "NCPOR coordinates and executes multidisciplinary research across the Polar Realms (Antarctica, Arctic, Southern Ocean, and the Himalayan Cryosphere).",
      icon: Award
    },
    {
      title: "National Polar Data Centre",
      desc: "NPDC serves as the permanent cryptographic repository for all Indian polar observation records, ensuring open access and global scientific interoperability.",
      icon: Database
    },
    {
      title: "Antarctic Treaty Governance",
      desc: "Operating in strict compliance with the Antarctic Treaty System, the Madrid Protocol on Environmental Protection, and the Indian Antarctic Act 2022.",
      icon: Shield
    },
    {
      title: "Knowledge Outreach (VISTAAR)",
      desc: "Connecting national telemetry to citizens, schools, universities, and international scientists through verifiable provenance and multi-track dissemination.",
      icon: Globe
    }
  ];

  return (
    <div className="min-h-screen bg-vistaar-bg pb-16">
      <PageHeader
        title="About VISTAAR & NCPOR"
        subtitle="National Polar Science Outreach, Knowledge Repository, and Media Dissemination Platform."
        badge="Ministry of Earth Sciences"
        breadcrumbs={[{ label: "About" }]}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Institutional Mission Box */}
        <div className="bg-white rounded-xl border border-vistaar-border p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-vistaar-primary flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-vistaar-text">NCPOR Institutional Mission</h2>
              <p className="text-xs text-vistaar-muted">Vasco da Gama, Goa, India</p>
            </div>
          </div>
          <p className="text-sm text-vistaar-text leading-relaxed">
            The <strong>National Centre for Polar and Ocean Research (NCPOR)</strong> is India&apos;s premier autonomous research and development institution responsible for the planning, coordination, and execution of polar and oceanic science programs under the <strong>Ministry of Earth Sciences (MoES)</strong>, Government of India.
          </p>
          <p className="text-sm text-vistaar-text leading-relaxed mt-3">
            <strong>VISTAAR (विस्तार)</strong> is the official digital knowledge dissemination and verification portal conceived under SIH Problem Statement 26063. It bridges the gap between raw, highly specialized telemetry stored at the National Polar Data Centre (NPDC) and the public, classrooms, press, and scientific community through deterministic cryptographic provenance and multi-track synthesis.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div key={idx} className="bg-white rounded-xl border border-vistaar-border p-6 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-vistaar-bg text-vistaar-primary flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-vistaar-text">{p.title}</h3>
                <p className="text-xs text-vistaar-muted mt-2 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Scientific Integrity Statement */}
        <div className="bg-white rounded-xl border border-vistaar-border p-6 shadow-xs border-l-4 border-l-vistaar-primary">
          <h3 className="text-sm font-bold text-vistaar-text flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-vistaar-success" />
            <span>Strict Scientific Integrity Guarantee</span>
          </h3>
          <p className="text-xs text-vistaar-muted mt-2 leading-relaxed">
            Every observation parameter rendered on VISTAAR (from Maitri katabatic winds to Himansh glaciological mass balances) is mathematically verified against raw, immutable NPDC sensor files using SHA-256 cryptographic hashes. VISTAAR never generates synthetic scientific measurements.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <Link
              href="/datasets"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-vistaar-primary text-white hover:bg-blue-700 transition-colors"
            >
              <span>Explore Real NPDC Datasets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/weather"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-vistaar-border bg-white text-vistaar-text hover:bg-slate-50 transition-colors"
            >
              <span>View Live Telemetry</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
