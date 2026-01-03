"use client";

import { useState, useEffect } from "react";
import { fetchMunicipalCases } from "@/app/actions/municipal";
import type { MunicipalCase, UserProfile } from "@/lib/types";
import MunicipalDecisionCard from "./MunicipalDecisionCard";
import MunicipalCaseDetail from "./MunicipalCaseDetail";
import { Loader2, Info, Building2, MapPin } from "lucide-react";

interface MunicipalDashboardProps {
  user: UserProfile | null;
  initialMunicipality?: string;
}

export default function MunicipalDashboard({ user, initialMunicipality = "Espoo" }: MunicipalDashboardProps) {
  const [cases, setCases] = useState<MunicipalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [municipality, setMunicipality] = useState(initialMunicipality);
  const [selectedCase, setSelectedCase] = useState<MunicipalCase | null>(null);

  // ... existing useEffect ...

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* ... existing header and info ... */}

        {cases.length === 0 ? (
          /* ... existing empty state ... */
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((item) => (
              <MunicipalDecisionCard
                key={item.id}
                item={item}
                onClick={() => setSelectedCase(item)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedCase && (
        <MunicipalCaseDetail
          item={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
      )}
    </div>
  );
}

