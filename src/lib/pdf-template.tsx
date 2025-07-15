import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

interface ResumeData {
  basics?: { name?: string; label?: string };
  work?: Array<{
    position: string;
    name: string;
    startDate: string;
    endDate?: string;
    summary?: string;
  }>;
}

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11, fontFamily: "Helvetica" },
  section: { marginBottom: 10 },
  title: { fontSize: 18, marginBottom: 8 },
});

export default function ResumePDF({ data }: { data: ResumeData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>{data.basics?.name ?? ""}</Text>
          <Text>{data.basics?.label ?? ""}</Text>
        </View>
        {data.work?.map((w, i) => (
          <View key={i} style={styles.section}>
            <Text>
              {w.position} at {w.name} ({w.startDate} – {w.endDate ?? "Present"})
            </Text>
            <Text>{w.summary ?? ""}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}