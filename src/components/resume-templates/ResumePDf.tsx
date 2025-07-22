
import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Link,
  StyleSheet,
} from '@react-pdf/renderer';
import { ResumeData } from '@/lib/schemas';



// Define styles for the PDF document
const styles = StyleSheet.create({
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 30,
    fontFamily: 'Poppins',
    fontSize: 11,
    color: '#333',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 10,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  headline: {
    fontSize: 9,
    color: '#555',
  },
  contactInfo: {
    flexDirection: 'row',
    fontSize: 9,
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  contactText: {
    fontSize: 9,
    marginHorizontal: 5,
    color: '#666',
  },
  link: {
    fontSize: 9,
    color: '#007bff',
    textDecoration: 'none',
    marginHorizontal: 5,
  },
  heading: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderBottomStyle: 'solid',
    color: '#444',
  },
  subHeading: {
    fontSize: 10,
    fontWeight: 'semibold',
    marginBottom: 3,
  },
  dateRange: {
    fontSize: 9,
    color: '#777',
    marginBottom: 2,
  },
  description: {
    fontSize: 10,
    marginBottom: 2,
    lineHeight: 1.6,
  },
  listItem: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#666',
    marginTop: 2,
  },
  // Styles for Skills and Languages (simple list)
  tagContainer: {
    display: "flex",
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 5,
  },
  tag: {
    backgroundColor: '#dce4eb',
    borderRadius: 4,
    paddingRight: 6,
    paddingLeft: 6,
    paddingTop: 2,
    paddingBottom: 2,
    textAlign: 'center',
    fontSize: 9,
  },
});

// Helper to format date ranges
// const formatDateRange = (start?: string, end?: string) => {
//   const startDate = start ? new Date(start).getFullYear() : '';
//   const endDate = end ? new Date(end).getFullYear() : 'Present';
//   return startDate && endDate ? `${startDate} - ${endDate}` : '';
// };

// Main Resume PDF Component
interface ResumePDFProps {
  data: ResumeData;
}

const ResumePDF: React.FC<ResumePDFProps> = ({ data }) => {

  if (!data) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text>Loading resume data...</Text>
          </View>
        </Page>
      </Document>
    );
  }
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{data.name}</Text>
          <Text style={styles.headline}>{data.headline}</Text>
          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            {data.location && (
              <Text style={styles.contactText}>{data.location}</Text>
            )}
            {data.phone && (
              <Text style={styles.contactText}>{data.phone}</Text>
            )}
            {data.links.linkedin && (
              <Link src={data.links.linkedin} style={styles.link}>
                LinkedIn
              </Link>
            )}
            {data.links.portfolio && (
              <Link src={data.links.portfolio} style={styles.link}>
                Website
              </Link>
            )}
          </View>
        </View>

        {data.summary && (
          <View style={styles.section}>
            <Text style={styles.heading}>Summary</Text>
            <Text style={styles.description}>{data.summary}</Text>
          </View>
        )}

        {/* Experience  */}

        {data.experience && data.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Experience</Text>
            {data.experience.map((exp, index) => (
              <View key={index} style={{ marginBottom: 10 }}>
                <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }} >
                  <Text style={styles.subHeading}>{exp.title}</Text>
                  <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end' }} >
                    <Text style={styles.subHeading}>{exp.company} - {exp.location}</Text>
                    {exp.location && <Text style={styles.dateRange}>{exp.duration}</Text>}
                  </View>
                </View>
                <View style={{ display: "flex", flexDirection: "column" }} >
                  {exp.responsibilities && exp.responsibilities.length > 0 && <View style={{
                    display: 'flex',
                    flexDirection: 'column',
                  }} >{exp.responsibilities.map((responsibility, i) => {
                    return <Text key={i} style={styles.listItem}>• {responsibility}</Text>;
                  })}</View>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Education  */}
        {data.education && data.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Education</Text>
            {data.education.map((edu, index) => (
              <View key={index} style={{ marginBottom: 10, display: 'flex', flexDirection: 'column' }}>
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }} >
                  <View style={{ display: 'flex', flexDirection: 'column', }}>
                    <Text style={styles.subHeading}>{edu.degree} in {edu.field} </Text>
                    {edu.gpa && <Text style={styles.description}>GPA: {edu.gpa.toFixed(2)}</Text>}
                  </View>
                  <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Text style={styles.description}>{edu.institution}</Text>
                    <Text style={styles.dateRange}>{edu.duration}</Text>
                  </View>
                </View>
                {edu.description && <Text style={styles.description}>{edu.description}</Text>}
              </View>
            ))}
          </View>
        )}
        {/* Skills  */}
        {data.skills && data.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Skills</Text>
            <View style={styles.tagContainer}>
              {data.skills.map((skill, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={{ color: 'black' }} >{skill.skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Certifications  */}
        {data.certifications && data.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Certifications</Text>
            {data.certifications.map((cert, index) => (
              <View key={index} style={{ marginBottom: 10, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={styles.subHeading}>{cert.name}</Text>
                <View style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-end" }} >
                  <Text style={styles.description}>Issued by: {cert.issuer}</Text>
                  <Text style={styles.dateRange}>
                    Issued: {cert.issue_date ? new Date(cert.issue_date).getFullYear() : 'N/A'}
                    {cert.expiry_date && ` | Expires: ${new Date(cert.expiry_date).getFullYear()}`}
                  </Text>
                </View>
                {cert.credential_url && (
                  <Link src={cert.credential_url} style={styles.link}>View Credential</Link>
                )}
              </View>
            ))}
          </View>
        )}

        {data.languages && data.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Languages</Text>
            <View style={styles.tagContainer}>
              {data.languages.map((lang, index) => (
                <Text key={index} style={styles.tag}>{lang.language} ({lang.level})</Text>
              ))}
            </View>
          </View>
        )}

      </Page>
    </Document>
  )

};

export default ResumePDF;