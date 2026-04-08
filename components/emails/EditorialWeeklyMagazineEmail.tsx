import type { EditorialBulletinPayload } from "@/app/actions/bulletin-generator";
import type {
  WeeklyEspooCaseHeader,
  WeeklyParliamentBillHeader,
} from "@/components/emails/WeeklyBulletin";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

const fontUi =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontSerif = "'Playfair Display', Georgia, 'Times New Roman', serif";

const colors = {
  bg: "#0f172a",
  card: "#1e293b",
  cardBorder: "#334155",
  text: "#f1f5f9",
  muted: "#94a3b8",
  cite: "#64748b",
  accent: "#38bdf8",
  accentMuted: "#0ea5e9",
  warn: "#fbbf24",
  warnBg: "rgba(251, 191, 36, 0.12)",
};

export type EditorialWeeklyMagazineEmailProps = {
  issueDate: string;
  periodLabel: string;
  bulletin: EditorialBulletinPayload;
  baseUrl: string;
  parliamentBillHeaders: WeeklyParliamentBillHeader[];
  espooCaseHeaders: WeeklyEspooCaseHeader[];
};

function stanceLabelFi(s: "pro" | "contra" | "mixed"): string {
  if (s === "pro") return "Myötävaikutus";
  if (s === "contra") return "Vastainen";
  return "Ehdollinen / sekava";
}

function stanceColor(s: "pro" | "contra" | "mixed"): string {
  if (s === "pro") return "#34d399";
  if (s === "contra") return "#f87171";
  return "#fbbf24";
}

function renderCitationInline(
  body: string,
  sources: { title: string; url: string }[],
): React.ReactNode[] {
  const parts = body.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[(\d+)\]$/);
    if (!m) return part;
    const n = parseInt(m[1], 10);
    const src = sources[n - 1];
    if (!src) return part;
    return (
      <Link
        key={`cite-${i}`}
        href={src.url}
        title={src.title}
        style={{
          color: colors.cite,
          fontSize: "16px",
          lineHeight: "1.65",
          textDecoration: "underline",
          textUnderlineOffset: "3px",
          fontWeight: 500,
        }}
      >
        [{n}]
      </Link>
    );
  });
}

const cardStyle = {
  backgroundColor: colors.card,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: "12px",
  padding: "24px 20px",
  marginBottom: "20px",
};

const ctaButton = {
  display: "block" as const,
  backgroundColor: colors.accentMuted,
  color: "#0f172a",
  fontWeight: 700,
  fontSize: "15px",
  lineHeight: "1.25",
  padding: "14px 20px",
  minHeight: "44px",
  borderRadius: "10px",
  textAlign: "center" as const,
  textDecoration: "none",
  fontFamily: fontUi,
  boxSizing: "border-box" as const,
};

const ctaDesc = {
  margin: "0 0 12px",
  color: colors.muted,
  fontSize: "14px",
  lineHeight: "1.55",
  fontFamily: fontUi,
};

export default function EditorialWeeklyMagazineEmail({
  issueDate,
  periodLabel,
  bulletin,
  baseUrl,
  parliamentBillHeaders,
  espooCaseHeaders,
}: EditorialWeeklyMagazineEmailProps) {
  const src = bulletin.citationSources;
  const safeBase = baseUrl.replace(/\/$/, "");

  const ctaMp = `${safeBase}/?view=workspace`;
  const ctaResearcher = `${safeBase}/dashboard/researcher`;
  const ctaArena = `${safeBase}/arena`;

  return (
    <Html>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Preview>
        Omatase × Eduskuntavahti — viikkolehti {issueDate}.{" "}
        {bulletin.leadStory.dek.slice(0, 120)}
      </Preview>
      <Body style={{ margin: 0, backgroundColor: colors.bg }}>
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "28px 20px 40px",
            fontFamily: fontUi,
          }}
        >
          <Section style={{ textAlign: "center", marginBottom: "28px" }}>
            <Text
              style={{
                margin: "0 0 6px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase" as const,
                color: colors.muted,
              }}
            >
              Viikkolehti
            </Text>
            <Heading
              as="h1"
              style={{
                margin: "0 0 8px",
                fontFamily: fontSerif,
                fontSize: "34px",
                lineHeight: "1.15",
                fontWeight: 700,
                color: colors.text,
              }}
            >
              Omatase
            </Heading>
            <Text
              style={{
                margin: 0,
                fontSize: "14px",
                color: colors.accent,
                fontWeight: 600,
              }}
            >
              Eduskuntavahti
            </Text>
            <Text
              style={{
                margin: "12px 0 0",
                fontSize: "13px",
                color: colors.muted,
              }}
            >
              {issueDate}
              {" · "}
              {periodLabel}
            </Text>
          </Section>

          {bulletin.lobbyTraceDemoMode ? (
            <Section
              style={{
                ...cardStyle,
                backgroundColor: colors.warnBg,
                borderColor: "rgba(251, 191, 36, 0.35)",
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontSize: "13px",
                  lineHeight: "1.55",
                  color: "#fde68a",
                  fontFamily: fontUi,
                }}
              >
                <strong>Alpha / mock:</strong> Lobbausjäljitys käyttää
                kehitysympäristön mock-signaaleja (
                <code style={{ fontSize: "12px" }}>LOBBY_TRACE_USE_MOCK</code>
                ). Tuotantodataan siirryttäessä rajoitus poistuu.
              </Text>
            </Section>
          ) : null}

          <Section style={cardStyle}>
            <Text
              style={{
                margin: "0 0 8px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase" as const,
                color: colors.accent,
              }}
            >
              Pääjuttu
            </Text>
            <Heading
              as="h2"
              style={{
                margin: "0 0 10px",
                fontFamily: fontSerif,
                fontSize: "26px",
                lineHeight: "1.2",
                fontWeight: 700,
                color: colors.text,
              }}
            >
              {bulletin.leadStory.headline}
            </Heading>
            <Text
              style={{
                margin: "0 0 16px",
                fontSize: "16px",
                lineHeight: "1.5",
                color: colors.muted,
                fontStyle: "italic",
              }}
            >
              {bulletin.leadStory.dek}
            </Text>
            <Text
              style={{
                margin: 0,
                fontSize: "16px",
                lineHeight: "1.65",
                color: colors.text,
                whiteSpace: "pre-line" as const,
              }}
            >
              {renderCitationInline(bulletin.leadStory.body, src)}
            </Text>
          </Section>

          <Section style={cardStyle}>
            <Text
              style={{
                margin: "0 0 8px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase" as const,
                color: colors.accent,
              }}
            >
              Lobbarit valokeilassa
            </Text>
            <Heading
              as="h2"
              style={{
                margin: "0 0 12px",
                fontFamily: fontSerif,
                fontSize: "22px",
                lineHeight: "1.25",
                fontWeight: 700,
                color: colors.text,
              }}
            >
              {bulletin.lobbySpotlight.headline}
            </Heading>
            <Text
              style={{
                margin: "0 0 20px",
                fontSize: "15px",
                lineHeight: "1.6",
                color: colors.text,
              }}
            >
              {bulletin.lobbySpotlight.body}
            </Text>
            {bulletin.lobbySpotlight.topLobbyists.map((row, idx) => (
              <Section
                key={`${row.organization}-${idx}`}
                style={{
                  borderTop: `1px solid ${colors.cardBorder}`,
                  paddingTop: "16px",
                  marginTop: idx === 0 ? 0 : "16px",
                }}
              >
                <Text
                  style={{
                    margin: "0 0 6px",
                    fontSize: "17px",
                    fontWeight: 700,
                    color: colors.text,
                  }}
                >
                  {row.organization}
                </Text>
                <Text style={{ margin: "0 0 8px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "999px",
                      backgroundColor: `${stanceColor(row.stance)}22`,
                      color: stanceColor(row.stance),
                      marginRight: "8px",
                    }}
                  >
                    {stanceLabelFi(row.stance)}
                  </span>
                  {row.conflictIndicator ? (
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: "999px",
                        backgroundColor: "rgba(251, 191, 36, 0.2)",
                        color: colors.warn,
                      }}
                    >
                      Mahdollinen sidonnaisuus / eturistiriita
                    </span>
                  ) : null}
                </Text>
                {row.conflictNote ? (
                  <Text
                    style={{
                      margin: "0 0 8px",
                      fontSize: "13px",
                      lineHeight: "1.5",
                      color: colors.muted,
                    }}
                  >
                    {row.conflictNote}
                  </Text>
                ) : null}
                <Text
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    lineHeight: "1.6",
                    color: colors.text,
                  }}
                >
                  {row.summary}
                </Text>
              </Section>
            ))}
          </Section>

          <Section style={cardStyle}>
            <Text
              style={{
                margin: "0 0 8px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase" as const,
                color: colors.accent,
              }}
            >
              Pähkinänkuoressa
            </Text>
            <Heading
              as="h2"
              style={{
                margin: "0 0 12px",
                fontFamily: fontSerif,
                fontSize: "22px",
                lineHeight: "1.25",
                fontWeight: 700,
                color: colors.text,
              }}
            >
              {bulletin.nutshell.headline}
            </Heading>
            <Text
              style={{
                margin: 0,
                fontSize: "15px",
                lineHeight: "1.6",
                color: colors.text,
              }}
            >
              {bulletin.nutshell.body}
            </Text>
          </Section>

          {(parliamentBillHeaders.length > 0 ||
            espooCaseHeaders.length > 0) && (
            <Section style={cardStyle}>
              <Heading
                as="h2"
                style={{
                  margin: "0 0 14px",
                  fontFamily: fontSerif,
                  fontSize: "20px",
                  fontWeight: 700,
                  color: colors.text,
                }}
              >
                Viikon rekisteri
              </Heading>
              {parliamentBillHeaders.length > 0 ? (
                <>
                  <Text
                    style={{
                      margin: "0 0 8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: colors.muted,
                      textTransform: "uppercase" as const,
                    }}
                  >
                    Eduskunta
                  </Text>
                  {parliamentBillHeaders.slice(0, 12).map((b) => (
                    <Text
                      key={b.title + b.dateLabel}
                      style={{
                        margin: "0 0 8px",
                        fontSize: "13px",
                        lineHeight: "1.5",
                        color: colors.text,
                      }}
                    >
                      {b.url ? (
                        <Link
                          href={b.url}
                          style={{ color: colors.accent, fontWeight: 600 }}
                        >
                          {b.title}
                        </Link>
                      ) : (
                        <span style={{ fontWeight: 600 }}>{b.title}</span>
                      )}
                      <span style={{ color: colors.muted }}>
                        {" "}
                        · {b.dateLabel}
                      </span>
                    </Text>
                  ))}
                </>
              ) : null}
              {espooCaseHeaders.length > 0 ? (
                <>
                  <Text
                    style={{
                      margin: "16px 0 8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: colors.muted,
                      textTransform: "uppercase" as const,
                    }}
                  >
                    Espoo
                  </Text>
                  {espooCaseHeaders.slice(0, 12).map((c) => (
                    <Text
                      key={c.title + c.dateLabel}
                      style={{
                        margin: "0 0 8px",
                        fontSize: "13px",
                        lineHeight: "1.5",
                        color: colors.text,
                      }}
                    >
                      {c.url ? (
                        <Link
                          href={c.url}
                          style={{ color: colors.accent, fontWeight: 600 }}
                        >
                          {c.title}
                        </Link>
                      ) : (
                        <span style={{ fontWeight: 600 }}>{c.title}</span>
                      )}
                      <span style={{ color: colors.muted }}>
                        {" "}
                        · {c.dateLabel}
                      </span>
                    </Text>
                  ))}
                </>
              ) : null}
            </Section>
          )}

          <Section style={cardStyle}>
            <Heading
              as="h2"
              style={{
                margin: "0 0 16px",
                fontFamily: fontSerif,
                fontSize: "20px",
                fontWeight: 700,
                color: colors.text,
              }}
            >
              Tutki palvelua
            </Heading>

            <Text style={ctaDesc}>
              <strong style={{ color: colors.text }}>MP DNA</strong> — Katso,
              miten kansanedustajasi linjaa päätösten kanssa.
            </Text>
            <Link href={ctaMp} style={ctaButton}>
              Tarkista edustajasi linja
            </Link>

            <Hr
              style={{
                borderColor: colors.cardBorder,
                margin: "24px 0",
              }}
            />

            <Text style={ctaDesc}>
              <strong style={{ color: colors.text }}>Tutkijan työpöytä</strong>{" "}
              — Vie raakadata analyysiin (CSV / JSON).
            </Text>
            <Link href={ctaResearcher} style={ctaButton}>
              Vie data analyysiä varten
            </Link>

            <Hr
              style={{
                borderColor: colors.cardBorder,
                margin: "24px 0",
              }}
            />

            <Text style={ctaDesc}>
              <strong style={{ color: colors.text }}>Kansalaisareena</strong> —
              Osallistu väittelyyn ja vertaa näkemyksiä.
            </Text>
            <Link href={ctaArena} style={ctaButton}>
              Liity väittelyyn
            </Link>
          </Section>

          <Section
            style={{
              padding: "8px 8px 0",
            }}
          >
            <Text
              style={{
                margin: "0 0 12px",
                fontSize: "12px",
                lineHeight: "1.55",
                color: colors.muted,
              }}
            >
              Omatase tarjoaa läpinäkyvän ikkunan lainsäädäntöön ja
              vaikuttamiseen. Viikkolehti koostuu automaattisesta
              toimituksellisesta synteesistä; lähteet on merkitty
              inline-viitteillä.
            </Text>
            <Text
              style={{
                margin: "0 0 8px",
                fontSize: "12px",
                color: colors.muted,
              }}
            >
              <Link
                href="{{unsubscribe_url}}"
                style={{
                  color: colors.accent,
                  textDecoration: "underline",
                  fontWeight: 700,
                }}
              >
                Lopeta tilaus
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
