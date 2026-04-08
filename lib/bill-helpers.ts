/**
 * Bill-utilityt — ei keinotekoista pulse-/puoluedataa.
 * Yhteisöjakaumat: `citizen_reactions` + aggregate (bills-supabase).
 * Puoluejakaumat: kytketään tulevaan äänestys-/istuntodataan.
 */

import type { Bill } from "@/lib/types";

export function emptyPoliticalReality(): Bill["politicalReality"] {
  return [];
}
