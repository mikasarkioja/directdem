import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register a font for better look if needed, but standard fonts work too
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
  page: {
    padding: 60,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 40,
    borderBottom: 2,
    borderBottomColor: '#0f172a',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: -1,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 5,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#0f172a',
    borderLeft: 4,
    borderLeftColor: '#f97316',
    paddingLeft: 10,
    marginBottom: 15,
  },
  text: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 1.6,
    textAlign: 'justify',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
  },
  metaItem: {
    width: '50%',
    marginBottom: 10,
  },
  metaLabel: {
    fontSize: 8,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  metaValue: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 60,
    right: 60,
    fontSize: 8,
    textAlign: 'center',
    color: '#94a3b8',
    borderTop: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: 8,
    color: '#94a3b8',
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 20,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
    padding: 5,
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 5,
  },
  tableCellHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableCell: {
    fontSize: 8,
  }
});

interface PDFReportProps {
  data: any;
  summary: string;
}

export const MPFingerprintReport: React.FC<PDFReportProps> = ({ data, summary }) => {
  const { mp, timestamp, lobbyistMeetings, correlations } = data;
  const date = new Date(timestamp).toLocaleDateString('fi-FI');

  return (
    <Document title={`Poliittinen Sormenjälki - ${mp.first_name} ${mp.last_name}`}>
      {/* Page 1: Introduction & AI Analysis */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Poliittinen Sormenjälki</Text>
          <Text style={styles.subtitle}>DirectDem Researcher Insights | Syväanalyysi</Text>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Edustaja</Text>
            <Text style={styles.metaValue}>{mp.first_name} {mp.last_name}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Puolue</Text>
            <Text style={styles.metaValue}>{mp.party}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Vaalipiiri</Text>
            <Text style={styles.metaValue}>{mp.constituency || 'Tuntematon'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Raportin päiväys</Text>
            <Text style={styles.metaValue}>{date}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tekoälyavusteinen Syväanalyysi</Text>
          <Text style={styles.text}>{summary}</Text>
        </View>

        <View style={styles.footer}>
          <Text>Tämä raportti on generoitu DirectDem Researcher -alustalla. Analyysi perustuu julkisiin rekistereihin ja AI-korrelaatiolaskentaan.</Text>
        </View>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>

      {/* Page 2: Lobbying & Correlations */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sidonnaisuus- ja lobbausdata</Text>
          <Text style={styles.text}>Yhteenveto edustajan viimeisimmistä tapaamisista ja niiden mahdollisista vaikutuksista poliittiseen toimintaan.</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Päivä</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Organisaatio</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Aihe</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Vaikutusarvio</Text></View>
          </View>
          {lobbyistMeetings.slice(0, 10).map((m: any, i: number) => (
            <View style={styles.tableRow} key={i}>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{m.meeting_date || m.date}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{m.organization || m.name}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{m.topic}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>Analysoitu</Text></View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI-Korrelaatiohavainnot</Text>
          {correlations && correlations.length > 0 ? correlations.map((c: any, i: number) => (
            <View key={i} style={{ marginBottom: 10, padding: 10, backgroundColor: '#f8fafc', borderRadius: 5 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#f97316' }}>Significance Score: {c.significance_score}%</Text>
              <Text style={styles.text}>{c.correlation_reasoning}</Text>
            </View>
          )) : <Text style={styles.text}>Ei merkittäviä korrelaatioita havaittu nykyisellä datalla.</Text>}
        </View>

        <View style={styles.footer}>
          <Text>Luottamuksellinen Tutkimusraportti - DirectDem Insights</Text>
        </View>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
};

