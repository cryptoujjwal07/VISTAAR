"use client";

import Link from "next/link";
import { Compass, Calendar, MapPin, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ExplorePage() {
  const expeditions = [
    {
      id: "exp_isea_43",
      title: "43rd Indian Scientific Expedition to Antarctica (ISEA)",
      dates: "2023 – 2024",
      region: "Antarctica (Larsemann Hills & Schirmacher Oasis)",
      stations: ["Bharati", "Maitri"],
      objective: "Atmospheric profiling using HATPRO radiometers, ice core drilling for paleoclimate reconstruction, and geomagnetic storm studies.",
      datasetCount: "12 NPDC Streams"
    },
    {
      id: "exp_arctic_summer",
      title: "Indian Arctic Expedition at Ny-Ålesund",
      dates: "2023 Summer & Winter Phase",
      region: "Arctic (Svalbard, 79° N)",
      stations: ["Himadri"],
      objective: "Investigation of Arctic aerosol distribution, teleconnections between Arctic warming and Indian monsoon variability.",
      datasetCount: "8 NPDC Streams"
    },
    {
      id: "exp_himalaya_cryo",
      title: "Chandra Basin Glaciological Monitoring Campaign",
      dates: "2022 – Ongoing",
      region: "Western Himalayas (Third Pole, 4080m)",
      stations: ["Himansh"],
      objective: "Long-term monitoring of benchmark glaciers (Batal, Samudra Tapu, Sutri Dhaka) to gauge snow mass loss and freshwater runoff.",
      datasetCount: "5 NPDC Streams"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-vistaar-border pb-6">
        <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-vistaar-primary uppercase tracking-wide mb-1">
          <Compass className="w-4 h-4" />
          <span>National Scientific Expeditions</span>
        </div>
        <h1 className="text-3xl font-extrabold text-vistaar-text">
          Indian Polar Explorations & Expeditions
        </h1>
        <p className="text-sm text-vistaar-muted mt-1">
          Four decades of persistent national research voyages across Antarctica, the Arctic Ocean, and the Himalayan glaciated third pole.
        </p>
      </div>

      <div className="space-y-6">
        {expeditions.map((exp) => (
          <Card key={exp.id} className="hover:border-vistaar-primary/40 transition-colors">
            <CardHeader className="p-6 border-b border-vistaar-border bg-white flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Badge variant="scientific">{exp.region}</Badge>
                  <span className="text-xs font-mono text-vistaar-muted">{exp.dates}</span>
                </div>
                <CardTitle className="text-lg font-bold">{exp.title}</CardTitle>
              </div>
              <Badge variant="outline">{exp.datasetCount}</Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-xs text-vistaar-text leading-relaxed">
                {exp.objective}
              </p>
              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-vistaar-muted font-mono">
                  Operational Bases: <strong className="text-vistaar-text">{exp.stations.join(", ")}</strong>
                </span>
                <Link href="/weather">
                  <Button size="sm" variant="outline" className="flex items-center space-x-1 text-xs">
                    <span>View Expedition Weather</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
