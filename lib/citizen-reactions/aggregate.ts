export type ReactionType = "support" | "oppose" | "neutral";

export type CitizenPulseAggregate = {
  support: number;
  oppose: number;
  neutral: number;
  total: number;
  /** 0–100: kannattaa osuus (vain support+oppose nimittäjässä) */
  forPercent: number | null;
};

export function emptyAggregate(): CitizenPulseAggregate {
  return {
    support: 0,
    oppose: 0,
    neutral: 0,
    total: 0,
    forPercent: null,
  };
}

export function rowsToAggregate(
  rows: { reaction_type: string }[],
): CitizenPulseAggregate {
  let support = 0;
  let oppose = 0;
  let neutral = 0;
  for (const r of rows) {
    if (r.reaction_type === "support") support++;
    else if (r.reaction_type === "oppose") oppose++;
    else neutral++;
  }
  const denom = support + oppose;
  const forPercent =
    denom === 0 ? null : Math.round((support / denom) * 1000) / 10;
  return {
    support,
    oppose,
    neutral,
    total: rows.length,
    forPercent,
  };
}

/** MP:n puolueen linja → arvio äänestyskannasta (0–100, suunta myötäiseen) */
export function mpPredictedForPercent(
  mpParty: string | null | undefined,
  politicalReality: { party: string; position: string; seats: number }[],
): number {
  if (!mpParty?.trim() || !politicalReality?.length) return 50;
  const row = politicalReality.find(
    (p) => p.party.trim().toLowerCase() === mpParty.trim().toLowerCase(),
  );
  if (!row) return 50;
  if (row.position === "for") return 74;
  if (row.position === "against") return 26;
  return 50;
}
