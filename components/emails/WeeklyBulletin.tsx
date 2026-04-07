import React from "react";
import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
  Link,
} from "@react-email/components";

export interface WeeklyPrediction {
  title: string;
  probability: number;
  trend: string;
}

export interface LobbyistHit {
  title: string;
  similarity: number;
  actor: string;
}

export interface EspooUpdate {
  title: string;
  category: string;
  description: string;
}

export interface DemocracyDeficit {
  title: string;
  percentage: number;
}

/** Factual index rows (not from AI) — Eduskunta `bills` in the reporting window. */
export interface WeeklyParliamentBillHeader {
  parliamentId: string;
  title: string;
  dateLabel: string;
  url?: string | null;
}

/** Factual index rows — Espoo `municipal_cases` in the reporting window. */
export interface WeeklyEspooCaseHeader {
  title: string;
  dateLabel: string;
  url?: string | null;
}

export interface WeeklyBulletinEmailProps {
  issueDate: string;
  parliamentData: {
    summary: string;
    predictions: WeeklyPrediction[];
    lobbyistHits: LobbyistHit[];
    deficitIndicator?: DemocracyDeficit;
    /** All legislative bill titles from the last week (Eduskunta). */
    weeklyBillHeaders?: WeeklyParliamentBillHeader[];
  };
  espooData: {
    summary: string;
    updates: EspooUpdate[];
    deficitIndicator?: DemocracyDeficit;
    /** All municipal case titles from the last week (Espoo). */
    weeklyCaseHeaders?: WeeklyEspooCaseHeader[];
  };
}

function probabilityColor(value: number): string {
  if (value > 50) return "#15803d";
  if (value < 50) return "#dc2626";
  return "#334155";
}

export default function WeeklyBulletin({
  issueDate,
  parliamentData,
  espooData,
}: WeeklyBulletinEmailProps) {
  const parliamentHeaders = parliamentData.weeklyBillHeaders ?? [];
  const espooHeaders = espooData.weeklyCaseHeaders ?? [];
  return (
    <Html>
      <Head />
      <Preview>DirectDem Viikkobulletiini - Issue 1</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading as="h1" style={styles.headerTitle}>
              DirectDem - Viikkobulletiini
            </Heading>
            <Text style={styles.headerDate}>{issueDate}</Text>
          </Section>

          <Section style={styles.contentWrap}>
            <Heading as="h2" style={styles.sectionTitle}>
              🏛️ Eduskunta
            </Heading>
            <Text style={styles.paragraph}>{parliamentData.summary}</Text>

            <Heading as="h3" style={styles.subSectionTitle}>
              Viikon lainsäädännölliset esitykset (Eduskunta)
            </Heading>
            {parliamentHeaders.length === 0 ? (
              <Text style={styles.paragraph}>
                Ei uusia tai päivitettyjä esityksiä raportointijaksolla
                (viimeiset 7 päivää).
              </Text>
            ) : (
              <Section style={styles.headerIndexBox}>
                {parliamentHeaders.map((row, idx) => (
                  <Text key={`bill-h-${idx}`} style={styles.headerIndexLine}>
                    {row.url ? (
                      <Link href={row.url} style={styles.headerIndexLink}>
                        <strong style={{ color: "#0f172a" }}>
                          {row.parliamentId}
                        </strong>
                        {" — "}
                        {row.title}
                      </Link>
                    ) : (
                      <>
                        <strong style={{ color: "#0f172a" }}>
                          {row.parliamentId}
                        </strong>
                        {" — "}
                        {row.title}
                      </>
                    )}
                    {row.dateLabel ? (
                      <span style={styles.headerIndexMeta}>
                        {" "}
                        ({row.dateLabel})
                      </span>
                    ) : null}
                  </Text>
                ))}
              </Section>
            )}

            <Heading as="h3" style={styles.subSectionTitle}>
              Viikon ennusteet
            </Heading>
            {parliamentData.predictions.length === 0 ? (
              <Text style={styles.paragraph}>
                Ei uusia ennusteita tälle viikolle.
              </Text>
            ) : (
              parliamentData.predictions.map((item, idx) => (
                <Section key={`pred-${idx}`} style={styles.listItem}>
                  <Row>
                    <Column>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                    </Column>
                    <Column align="right">
                      <Text
                        style={{
                          ...styles.probability,
                          color: probabilityColor(item.probability),
                        }}
                      >
                        {item.probability} %
                      </Text>
                    </Column>
                  </Row>
                  <Text style={styles.subtleText}>
                    Trendisuunta: {item.trend}
                  </Text>
                </Section>
              ))
            )}

            <Hr style={styles.hr} />

            <Heading as="h2" style={styles.sectionTitle}>
              Lobbaus-tutka
            </Heading>
            {parliamentData.lobbyistHits.length === 0 ? (
              <Text style={styles.paragraph}>
                Ei merkittäviä osumia tällä viikolla.
              </Text>
            ) : (
              parliamentData.lobbyistHits.map((hit, idx) => (
                <Section key={`hit-${idx}`} style={styles.lobbyCard}>
                  <Text style={styles.itemTitle}>{hit.title}</Text>
                  <Text style={styles.paragraph}>Toimija: {hit.actor}</Text>
                  <Text style={styles.similarityText}>
                    Samankaltaisuus: {Math.round(hit.similarity)} %
                  </Text>
                </Section>
              ))
            )}

            {parliamentData.deficitIndicator && (
              <Section style={styles.alertBox}>
                <Text style={styles.alertTitle}>
                  🚩 {parliamentData.deficitIndicator.title}
                </Text>
                <Text style={styles.alertPercentage}>
                  {Math.round(parliamentData.deficitIndicator.percentage)} %
                </Text>
                <Text style={styles.paragraph}>
                  Mitä suurempi prosentti, sitä suurempi ero ennusteiden ja
                  varjo-äänten välillä.
                </Text>
              </Section>
            )}
          </Section>

          <Section style={styles.espooWrap}>
            <Heading as="h2" style={styles.sectionTitle}>
              📍 Espoo
            </Heading>
            <Text style={styles.paragraph}>{espooData.summary}</Text>

            <Heading as="h3" style={styles.subSectionTitle}>
              Viikon esitykset (Espoo)
            </Heading>
            {espooHeaders.length === 0 ? (
              <Text style={styles.paragraph}>
                Ei uusia esityksiä raportointijaksolla (viimeiset 7 päivää).
              </Text>
            ) : (
              <Section style={styles.headerIndexBoxEspoo}>
                {espooHeaders.map((row, idx) => (
                  <Text key={`espoo-h-${idx}`} style={styles.headerIndexLine}>
                    {row.url ? (
                      <Link href={row.url} style={styles.headerIndexLink}>
                        {row.title}
                      </Link>
                    ) : (
                      row.title
                    )}
                    {row.dateLabel ? (
                      <span style={styles.headerIndexMeta}>
                        {" "}
                        ({row.dateLabel})
                      </span>
                    ) : null}
                  </Text>
                ))}
              </Section>
            )}

            <Heading as="h3" style={styles.subSectionTitle}>
              Espoo-vahti
            </Heading>
            {espooData.updates.length === 0 ? (
              <Text style={styles.paragraph}>
                Ei uusia poimintoja Espoosta tällä viikolla.
              </Text>
            ) : (
              espooData.updates.map((update, idx) => (
                <Section key={`espoo-${idx}`} style={styles.listItem}>
                  <Text style={styles.badge}>
                    {update.category.toUpperCase()}
                  </Text>
                  <Text style={styles.itemTitle}>{update.title}</Text>
                  <Text style={styles.paragraph}>{update.description}</Text>
                </Section>
              ))
            )}
            {espooData.deficitIndicator && (
              <Section style={styles.alertBox}>
                <Text style={styles.alertTitle}>
                  🚩 {espooData.deficitIndicator.title}
                </Text>
                <Text style={styles.alertPercentage}>
                  {Math.round(espooData.deficitIndicator.percentage)} %
                </Text>
                <Text style={styles.paragraph}>
                  Vaje-indikaattori näyttää mahdollisen eron alueellisen
                  päätöksenteon ja asukassignaalien välillä.
                </Text>
              </Section>
            )}
          </Section>

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Omatase-tilillä keräät XP:tä osallistumalla arvioihin, seuraamalla
              päätöksiä ja tekemällä vertailuja viikko viikolta.
            </Text>
            <Text style={styles.footerText}>
              <Link href="{{unsubscribe_url}}" style={styles.unsubscribeLink}>
                Peruuta tilaus
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    margin: 0,
    padding: "20px 10px",
    backgroundColor: "#f4f6f8",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "640px",
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    overflow: "hidden",
    margin: "0 auto",
  },
  header: {
    backgroundColor: "#0f172a",
    padding: "24px 28px",
  },
  headerTitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: "24px",
    lineHeight: "1.2",
  },
  headerDate: {
    margin: "8px 0 0",
    color: "#dbeafe",
    fontSize: "14px",
  },
  contentWrap: {
    padding: "24px 28px",
  },
  espooWrap: {
    padding: "24px 28px",
    backgroundColor: "#f0fdf4",
    borderTop: "1px solid #dcfce7",
  },
  sectionTitle: {
    margin: "0 0 12px",
    color: "#1d4ed8",
    fontSize: "20px",
    lineHeight: "1.3",
  },
  subSectionTitle: {
    margin: "0 0 10px",
    color: "#1d4ed8",
    fontSize: "16px",
    lineHeight: "1.3",
  },
  listItem: {
    marginBottom: "14px",
    paddingBottom: "10px",
  },
  itemTitle: {
    margin: "0 0 6px",
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: "700",
  },
  subtleText: {
    margin: 0,
    color: "#475569",
    fontSize: "13px",
  },
  paragraph: {
    margin: "0 0 10px",
    color: "#1e293b",
    fontSize: "14px",
    lineHeight: "1.6",
  },
  probability: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "800",
  },
  lobbyCard: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "10px",
  },
  similarityText: {
    margin: "0",
    color: "#dc2626",
    fontSize: "14px",
    fontWeight: "700",
  },
  badge: {
    display: "inline-block",
    margin: "0 0 8px",
    backgroundColor: "#dbeafe",
    color: "#1e3a8a",
    borderRadius: "999px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.02em",
  },
  alertBox: {
    backgroundColor: "#fff1f2",
    borderLeft: "5px solid #dc2626",
    borderRadius: "6px",
    padding: "14px 14px 8px",
  },
  alertTitle: {
    margin: "0 0 4px",
    color: "#9f1239",
    fontSize: "15px",
    fontWeight: "700",
  },
  alertPercentage: {
    margin: "0 0 8px",
    color: "#dc2626",
    fontSize: "32px",
    fontWeight: "800",
    lineHeight: "1",
  },
  hr: {
    borderColor: "#e2e8f0",
    margin: "18px 0",
  },
  footer: {
    backgroundColor: "#e2e8f0",
    padding: "16px 28px",
  },
  footerText: {
    margin: "0 0 8px",
    color: "#334155",
    fontSize: "12px",
    lineHeight: "1.5",
  },
  unsubscribeLink: {
    color: "#1d4ed8",
    textDecoration: "underline",
    fontWeight: "700",
  },
  headerIndexBox: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "12px 14px",
    marginBottom: "16px",
  },
  headerIndexBoxEspoo: {
    backgroundColor: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: "8px",
    padding: "12px 14px",
    marginBottom: "16px",
  },
  headerIndexLine: {
    margin: "0 0 8px",
    color: "#334155",
    fontSize: "13px",
    lineHeight: "1.55",
  },
  headerIndexLink: {
    color: "#1d4ed8",
    textDecoration: "none",
    fontWeight: "600",
  },
  headerIndexMeta: {
    color: "#64748b",
    fontWeight: "400",
  },
} as const;
