import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Compass, Calendar, Anchor, MapPin, ArrowRight } from "lucide-react";

export default function ExpeditionsPage() {
  const expeditions = [
    {
      id: "isea-43",
      name: "43rd Indian Scientific Expedition to Antarctica (43-ISEA)",
      leader: "National Centre for Polar and Ocean Research",
      vessel: "MV Vasiliy Golovnin",
      season: "2023 - 2024",
      status: "COMPLETED" as const,
      base: "Bharati & Maitri Stations",
      objectives: "Glacial mass balance, paleoclimate ice-core retrieval, upper atmospheric physics, and microplastic quantification."
    },
    {
      id: "arctic-winter-1",
      name: "1st Indian Winter Arctic Scientific Expedition",
      leader: "NCPOR / MoES",
      vessel: "Air-lifted Svalbard Deployment",
      season: "December 2023 - January 2024",
      status: "COMPLETED" as const,
      base: "Himadri Station, Ny-Ålesund",
      objectives: "First historical Indian year-round scientific observation in the high Arctic polar night."
    },
    {
      id: "so-expedition-12",
      name: "12th Indian Southern Ocean Expedition",
      leader: "Ocean Sciences Group, NCPOR",
      vessel: "ORV Sagar Nidhi",
      season: "2024 - 2025",
      status: "ACTIVE" as const,
      base: "Sub-Antarctic & Polar Fronts",
      objectives: "Biogeochemical cycling, carbon sequestration, and Southern Ocean hydrothermal plume mapping."
    },
    {
      id: "himansh-himalaya-8",
      name: "8th Cryosphere Field Campaign (Chandra Basin)",
      leader: "Glaciology Division, NCPOR",
      vessel: "High-Altitude Terrestrial Convoy",
      season: "Summer 2024",
      status: "ACTIVE" as const,
      base: "Himansh Station, Spiti Valley",
      objectives: "Chhota Shigri & Samudra Tapu glacier ablation stakes, ground-penetrating radar, and automated weather calibration."
    }
  ];

  return (
    <div className="min-h-screen bg-vistaar-bg pb-16">
      <PageHeader
        title="Indian Scientific Expeditions"
        subtitle="Chronicle of India's polar explorations across the Antarctic, Arctic, Southern Ocean, and Himalayan Third Pole."
        badge="NCPOR National Missions"
        breadcrumbs={[{ label: "Expeditions" }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {expeditions.map((exp) => (
            <div
              key={exp.id}
              className="bg-white rounded-xl border border-vistaar-border p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-semibold text-vistaar-scientific flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    {exp.id.toUpperCase()}
                  </span>
                  <StatusIndicator
                    status={exp.status === "ACTIVE" ? "success" : "neutral"}
                    label={exp.status === "ACTIVE" ? "Operational" : "Archived / Concluded"}
                    pulse={exp.status === "ACTIVE"}
                  />
                </div>

                <h3 className="text-lg font-bold text-vistaar-text leading-snug">
                  {exp.name}
                </h3>
                <p className="text-xs text-vistaar-muted mt-2 line-clamp-2">
                  {exp.objectives}
                </p>

                <div className="mt-4 pt-4 border-t border-vistaar-border/60 grid grid-cols-2 gap-3 text-xs text-vistaar-muted">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-vistaar-primary" />
                    <span>{exp.season}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Anchor className="w-3.5 h-3.5 text-vistaar-primary" />
                    <span className="truncate">{exp.vessel}</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-vistaar-primary" />
                    <span>{exp.base}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-vistaar-border/60 flex items-center justify-between">
                <span className="text-xs text-vistaar-muted">Lead: {exp.leader}</span>
                <Link
                  href="/datasets"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-vistaar-primary hover:underline"
                >
                  <span>Explore Telemetry</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
