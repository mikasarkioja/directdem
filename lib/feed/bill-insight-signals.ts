import type { Bill } from "@/lib/types";

/** Heuristinen läpimenomalli (istumajakauma politicalReality) + lobby-indeksi feed-korteille. */
export function computeBillInsightSignals(bill: Bill): {
  passageProbabilityPercent: number;
  lobbyInfluenceIndex: number;
} {
  const totalSeats =
    bill.politicalReality?.reduce((sum, p) => sum + p.seats, 0) || 0;
  const forSeats =
    bill.politicalReality
      ?.filter((p) => p.position === "for")
      .reduce((sum, p) => sum + p.seats, 0) || 0;
  const politicalPassPercent =
    totalSeats > 0 ? Math.round((forSeats / totalSeats) * 100) : 50;
  const passageProbabilityPercent = Math.max(
    5,
    Math.min(95, politicalPassPercent),
  );
  const lobbyInfluenceIndex = Math.max(
    0,
    Math.min(
      100,
      Math.round(100 - Math.abs(50 - passageProbabilityPercent) * 1.5),
    ),
  );
  return { passageProbabilityPercent, lobbyInfluenceIndex };
}
