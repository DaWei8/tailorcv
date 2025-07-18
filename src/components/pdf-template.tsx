
import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Link,
  StyleSheet,
} from '@react-pdf/renderer';
import { ResumeData } from './resume-data';



// Define styles for the PDF document
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 30,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#333',
  },
  section: {
    marginBottom: 15,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#222',
  },
  headline: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  contactInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  contactText: {
    marginHorizontal: 5,
    color: '#666',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    marginHorizontal: 5,
  },
  heading: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
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
    fontSize: 9,
    marginBottom: 5,
    lineHeight: 1.4,
  },
  listItem: {
    fontSize: 9,
    marginLeft: 10,
    marginBottom: 2,
  },
  // Styles for Skills and Languages (simple list)
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  tag: {
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginRight: 5,
    marginBottom: 5,
    fontSize: 8,
  },
});

// Helper to format date ranges
const formatDateRange = (start?: string, end?: string) => {
  const startDate = start ? new Date(start).getFullYear() : '';
  const endDate = end ? new Date(end).getFullYear() : 'Present';
  return startDate && endDate ? `${startDate} - ${endDate}` : '';
};

// Main Resume PDF Component
interface ResumePDFProps {
  data: ResumeData;
}

const ResumePDF: React.FC<ResumePDFProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header Section (Profile) */}
      <View style={styles.header}>
        <Text style={styles.name}>{data.profile.full_name}</Text>
        <Text style={styles.headline}>{data.profile.headline}</Text>
        <View style={styles.contactInfo}>
          {data.profile.city && data.profile.country && (
            <Text style={styles.contactText}>{data.profile.city}, {data.profile.country}</Text>
          )}
          {data.profile.phone && (
            <Text style={styles.contactText}>{data.profile.phone}</Text>
          )}
          {data.profile.linkedin_url && (
            <Link src={data.profile.linkedin_url} style={styles.link}>
              LinkedIn
            </Link>
          )}
          {data.profile.website_url && (
            <Link src={data.profile.website_url} style={styles.link}>
              Website
            </Link>
          )}
        </View>
      </View>

      {/* Summary */}
      {data.profile.summary && (
        <View style={styles.section}>
          <Text style={styles.heading}>Summary</Text>
          <Text style={styles.description}>{data.profile.summary}</Text>
        </View>
      )}

      {/* Experience */}
      {data.experiences && data.experiences.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.heading}>Experience</Text>
          {data.experiences.map((exp, index) => (
            <View key={index} style={{ marginBottom: 10 }}>
              <Text style={styles.subHeading}>{exp.job_title} at {exp.company}</Text>
              {exp.location && <Text style={styles.dateRange}>{exp.location}</Text>}
              <Text style={styles.dateRange}>{formatDateRange(exp.start_date, exp.end_date)}</Text>
              {exp.description && <Text style={styles.description}>{exp.description}</Text>}
              {exp.achievements && exp.achievements.length > 0 && (
                <View>
                  {exp.achievements.map((achievement, i) => (
                    <Text key={i} style={styles.listItem}>• {achievement}</Text>
                  ))}
                </View>
              )}
              {exp.skills && exp.skills.length > 0 && (
                <View style={styles.tagContainer}>
                  {exp.skills.map((skill, i) => (
                    <Text key={i} style={styles.tag}>{skill}</Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.heading}>Education</Text>
          {data.education.map((edu, index) => (
            <View key={index} style={{ marginBottom: 10 }}>
              <Text style={styles.subHeading}>{edu.degree} in {edu.field}</Text>
              <Text style={styles.description}>{edu.school}</Text>
              <Text style={styles.dateRange}>{formatDateRange(edu.start_date, edu.end_date)}</Text>
              {edu.gpa && <Text style={styles.description}>GPA: {edu.gpa.toFixed(2)}</Text>}
              {edu.description && <Text style={styles.description}>{edu.description}</Text>}
            </View>
          ))}
        </View>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.heading}>Skills</Text>
          <View style={styles.tagContainer}>
            {data.skills.map((skill, index) => (
              <Text key={index} style={styles.tag}>{skill.skill} ({skill.level})</Text>
            ))}
          </View>
        </View>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.heading}>Certifications</Text>
          {data.certifications.map((cert, index) => (
            <View key={index} style={{ marginBottom: 10 }}>
              <Text style={styles.subHeading}>{cert.name}</Text>
              <Text style={styles.description}>Issuer: {cert.issuer}</Text>
              <Text style={styles.dateRange}>
                Issued: {cert.issue_date ? new Date(cert.issue_date).getFullYear() : 'N/A'}
                {cert.expiry_date && ` | Expires: ${new Date(cert.expiry_date).getFullYear()}`}
              </Text>
              {cert.credential_url && (
                <Link src={cert.credential_url} style={styles.link}>View Credential</Link>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Languages */}
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
);

export default ResumePDF;