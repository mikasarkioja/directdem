"use client";

import ResearcherWorkspace from "@/components/researcher/ResearcherWorkspace";
import type { UserProfile } from "@/lib/types";

/** Raskas legacy-tutkijashelli yhden linssin alla (päättäjäanalytiikka, aikajanat, vienti). */
export default function LensIntegratedModules({
  user,
}: {
  user: UserProfile | null;
}) {
  const plan = user?.plan_type || "free";
  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-slate-600">
        Integroidut analyysimoduulit (muistiinpanot, lobbari-scorecard,
        puoluekuri, erillisvienti) säilyvät tässä näkymässä siirtymävaiheessa.
        Uusi{" "}
        <strong className="font-semibold text-slate-800">
          Aineiston vienti
        </strong>{" "}
        -linssi keskittää taulukkomuotoisen CSV/JSON-viennin.
      </p>
      <ResearcherWorkspace userPlan={plan} researcherProfile={user} />
    </div>
  );
}
