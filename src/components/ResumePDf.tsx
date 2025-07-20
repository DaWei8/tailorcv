import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Link,
  StyleSheet,
} from '@react-pdf/renderer';
import { ResumeData } from './schemas';

// Define styles for the PDF document
const styles = StyleSheet.create({
  page: {
    display: 'flex',
    flexDirection: 'column',
    padding: 30,
    fontFamily: 'Helvetica', // Changed from 'Poppins' - use built-in fonts
    fontSize: 11,
    color: '#333',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 12,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold', // This should be 'bold' not 'semibold'
    color: '#222',
    marginBottom: 4,
  },
  headline: {
    fontSize: 10,
    color: '#555',
    marginBottom: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    fontSize: 9,
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  contactText: {
    fontSize: 9,
    color: '#666',
  },
  contactSeparator: {
    fontSize: 9,
    color: '#666',
  },
  link: {
    fontSize: 9,
    color: '#007bff',
    textDecoration: 'none',
  },
  heading: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderBottomStyle: 'solid',
    color: '#444',
    textTransform: 'uppercase',
  },
  subHeading: {
    fontSize: 11,
    fontWeight: 'bold', // Changed from 'semibold'
    marginBottom: 2,
    color: '#333',
  },
  company: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#555',
  },
  dateRange: {
    fontSize: 9,
    color: '#777',
    marginBottom: 4,
  },
  description: {
    fontSize: 10,
    marginBottom: 4,
    lineHeight: 1.4,
    color: '#444',
  },
  listItem: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#444',
    marginBottom: 2,
    paddingLeft: 8,
  },
  tagContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  tag: {
    backgroundColor: '#f0f4f8',
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 9,
    color: '#333',
  },
  rowBetween: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  experienceItem: {
    marginBottom: 12,
  },
  educationItem: {
    marginBottom: 10,
  },
  certificationItem: {
    marginBottom: 8,
  },
});

// Helper function to format contact info with separators
const renderContactInfo = (data: ResumeData) => {
  const contactItems = [];
  
  if (data.location) contactItems.push(data.location);
  if (data.phone) contactItems.push(data.phone);
  if (data.email) contactItems.push(data.email);
  
  return contactItems.map((item, index) => (
    <React.Fragment key={index}>
      <Text style={styles.contactText}>{item}</Text>
      {index < contactItems.length - 1 && (
        <Text style={styles.contactSeparator}> • </Text>
      )}
    </React.Fragment>
  ));
};

// Main Resume PDF Component
interface ResumePDFProps {
  data: ResumeData;
}

const ResumePDF: React.FC<ResumePDFProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{data.name}</Text>
        {data.headline && (
          <Text style={styles.headline}>{data.headline}</Text>
        )}
        
        {/* Contact Information */}
        <View style={styles.contactInfo}>
          {renderContactInfo(data)}
          {data.links?.linkedin && (
            <>
              <Text style={styles.contactSeparator}> • </Text>
              <Link src={data.links.linkedin} style={styles.link}>
                LinkedIn
              </Link>
            </>
          )}
          {data.links?.portfolio && (
            <>
              <Text style={styles.contactSeparator}> • </Text>
              <Link src={data.links.portfolio} style={styles.link}>
                Portfolio
              </Link>
            </>
          )}
        </View>
      </View>

      {/* Summary */}
      {data.summary && (
        <View style={styles.section}>
          <Text style={styles.heading}>Professional Summary</Text>
          <Text style={styles.description}>{data.summary}</Text>
        </View>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.heading}>Professional Experience</Text>
          {data.experience.map((exp, index) => (
            <View key={index} style={styles.experienceItem}>
              <View style={styles.rowBetween}>
                <View style={styles.column}>
                  <Text style={styles.subHeading}>{exp.title}</Text>
                  <Text style={styles.company}>{exp.company}</Text>
                </View>
                <View style={[styles.column, styles.alignRight]}>
                  {exp.location && (
                    <Text style={styles.description}>{exp.location}</Text>
                  )}
                  {exp.duration && (
                    <Text style={styles.dateRange}>{exp.duration}</Text>
                  )}
                </View>
              </View>
              
              {exp.responsibilities && exp.responsibilities.length > 0 && (
                <View style={styles.column}>
                  {exp.responsibilities.map((responsibility, i) => (
                    <Text key={i} style={styles.listItem}>
                      • {responsibility}
                    </Text>
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
            <View key={index} style={styles.educationItem}>
              <View style={styles.rowBetween}>
                <View style={styles.column}>
                  <Text style={styles.subHeading}>
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                  </Text>
                  {edu.gpa && (
                    <Text style={styles.description}>
                      GPA: {edu.gpa.toFixed(2)}
                    </Text>
                  )}
                </View>
                <View style={[styles.column, styles.alignRight]}>
                  <Text style={styles.company}>{edu.institution}</Text>
                  {edu.duration && (
                    <Text style={styles.dateRange}>{edu.duration}</Text>
                  )}
                </View>
              </View>
              {edu.description && (
                <Text style={styles.description}>{edu.description}</Text>
              )}
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
              <View key={index} style={styles.tag}>
                <Text>{skill.skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.heading}>Certifications</Text>
          {data.certifications.map((cert, index) => (
            <View key={index} style={styles.certificationItem}>
              <View style={styles.rowBetween}>
                <View style={styles.column}>
                  <Text style={styles.subHeading}>{cert.name}</Text>
                  <Text style={styles.description}>
                    Issued by: {cert.issuer}
                  </Text>
                </View>
                <View style={[styles.column, styles.alignRight]}>
                  <Text style={styles.dateRange}>
                    {cert.issue_date 
                      ? `Issued: ${new Date(cert.issue_date).getFullYear()}` 
                      : 'Issue date: N/A'}
                  </Text>
                  {cert.expiry_date && (
                    <Text style={styles.dateRange}>
                      Expires: {new Date(cert.expiry_date).getFullYear()}
                    </Text>
                  )}
                </View>
              </View>
              {cert.credential_url && (
                <Link src={cert.credential_url} style={styles.link}>
                  View Credential
                </Link>
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
              <View key={index} style={styles.tag}>
                <Text>{lang.language} ({lang.level})</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Page>
  </Document>
);

export default ResumePDF;