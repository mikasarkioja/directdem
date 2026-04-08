import pdfParse from "pdf-parse";
import { normalizeOrganization } from "@/lib/lobby/org-normalize";

export type PdfAuthorInspection = {
  authorField: string | null;
  creatorField: string | null;
  producerField: string | null;
  titleField: string | null;
  expectedOrganization: string;
  authorMismatch: boolean;
};

function pickInfoString(info: unknown, keys: string[]): string | null {
  if (!info || typeof info !== "object") return null;
  const o = info as Record<string, unknown>;
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/**
 * Vertaa PDF:n Author/Creator-kenttiä odotettuun organisaatioon (esim. lausunnon allekirjoittaja).
 * Tulos on kevyt heuristiikka: mismatch ≠ väärinkäytös.
 */
export async function inspectPdfAuthorVsOrganization(
  pdfBuffer: Buffer,
  expectedOrganization: string,
): Promise<PdfAuthorInspection> {
  const parsed = await pdfParse(pdfBuffer);
  const info = parsed.info as Record<string, unknown> | undefined;

  const authorField = pickInfoString(info, ["Author", "author"]);
  const creatorField = pickInfoString(info, [
    "Creator",
    "creator",
    "CreatedBy",
    "createdBy",
  ]);
  const producerField = pickInfoString(info, ["Producer", "producer"]);
  const titleField = pickInfoString(info, ["Title", "title"]);

  const exp = normalizeOrganization(expectedOrganization);
  const candidates = [authorField, creatorField]
    .filter((x): x is string => !!x)
    .map(normalizeOrganization);

  const authorMismatch =
    exp.length > 0 &&
    candidates.length > 0 &&
    !candidates.some((c) => c.includes(exp) || exp.includes(c) || c === exp);

  return {
    authorField,
    creatorField,
    producerField,
    titleField,
    expectedOrganization,
    authorMismatch,
  };
}

export async function fetchAndInspectPdfAuthorVsOrganization(
  pdfUrl: string,
  expectedOrganization: string,
): Promise<PdfAuthorInspection & { ok: boolean; error?: string }> {
  try {
    const res = await fetch(pdfUrl, {
      headers: {
        Accept: "application/pdf,*/*",
        "User-Agent":
          "DirectDem-LobbyTrace/1.0 (+https://github.com/eduskunta/avoindata.eduskunta.fi)",
      },
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `HTTP ${res.status}`,
        authorField: null,
        creatorField: null,
        producerField: null,
        titleField: null,
        expectedOrganization,
        authorMismatch: false,
      };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const inspected = await inspectPdfAuthorVsOrganization(
      buf,
      expectedOrganization,
    );
    return { ok: true, ...inspected };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return {
      ok: false,
      error: msg,
      authorField: null,
      creatorField: null,
      producerField: null,
      titleField: null,
      expectedOrganization,
      authorMismatch: false,
    };
  }
}
