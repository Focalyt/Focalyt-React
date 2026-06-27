import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  B2CCourseHistoryRow,
  B2CJobHistoryRow,
  B2CPreVerificationAnswer,
  B2CProfile,
  B2CUploadedDoc,
  buildProfileDocumentsList,
  fetchB2CCourseHistory,
  fetchB2CJobHistory,
  fetchB2CPreVerification,
  fetchB2CProfileDetails,
  getProfileLeadOwnerLabel,
} from '../../services/b2cApi';
import { college } from '../../theme/college';

export const B2C_DETAIL_TABS = [
  'Lead Details',
  'Profile',
  'Job History',
  'Course History',
  'Documents',
  'Pre Verification',
] as const;

export type B2CDetailTab = (typeof B2C_DETAIL_TABS)[number];

type Props = {
  token: string;
  profile: B2CProfile;
  activeTab: number;
  onTabChange: (index: number) => void;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'N/A'}</Text>
    </View>
  );
}

function formatDateTime(raw?: string): string {
  if (!raw) return 'N/A';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function docStatus(doc: B2CUploadedDoc): string {
  const latest = doc.uploads?.slice(-1)[0];
  if (latest?.status) return latest.status;
  if (doc.status) return doc.status;
  if (!doc.uploads?.length) return 'Not Uploaded';
  return 'Pending';
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === 'verified') return '#10b981';
  if (s === 'rejected') return '#ef4444';
  if (s === 'not uploaded') return '#94a3b8';
  return '#f59e0b';
}

function LeadDetailsTab({ profile }: { profile: B2CProfile }) {
  const leadAge = profile.createdAt
    ? `${Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / 86400000)} Days`
    : 'N/A';
  const modBy =
    profile.logs?.length && profile.logs[profile.logs.length - 1]?.user?.name
      ? profile.logs[profile.logs.length - 1]!.user!.name!
      : 'N/A';

  return (
    <ScrollView style={styles.tabScroll} nestedScrollEnabled>
      <View style={styles.infoCard}>
        <InfoRow label="LEAD AGE" value={leadAge} />
        <InfoRow label="PROJECT" value={profile._course?.projectName || 'N/A'} />
        <InfoRow label="LEAD MODIFICATION BY" value={modBy} />
        <InfoRow label="STATE" value={profile._candidate?.personalInfo?.currentAddress?.state || 'N/A'} />
        <InfoRow label="SECTOR" value={String(profile._course?.sectors || 'N/A')} />
        <InfoRow label="LEAD CREATION DATE" value={formatDateTime(profile.createdAt)} />
        <InfoRow label="COUNSELLOR" value={getProfileLeadOwnerLabel(profile)} />
        <InfoRow label="CITY" value={profile._candidate?.personalInfo?.currentAddress?.city || 'N/A'} />
        <InfoRow label="COURSE / JOB NAME" value={profile._course?.name || 'N/A'} />
        <InfoRow label="LEAD MODIFICATION DATE" value={formatDateTime(profile.updatedAt)} />
        <InfoRow label="LEAD OWNER" value={getProfileLeadOwnerLabel(profile)} />
        <InfoRow label="TYPE OF PROJECT" value={profile._course?.typeOfProject || 'N/A'} />
        <InfoRow label="BRANCH NAME" value={profile._center?.name || 'N/A'} />
        <InfoRow label="BATCH NAME" value={profile._course?.batchName || 'N/A'} />
        <InfoRow label="REMARKS" value={profile.remarks || 'N/A'} />
      </View>
    </ScrollView>
  );
}

function ProfileTab({ profile }: { profile: B2CProfile }) {
  const c = profile._candidate;
  return (
    <ScrollView style={styles.tabScroll} nestedScrollEnabled>
      <View style={styles.infoCard}>
        <Text style={styles.profileName}>{c?.name || 'N/A'}</Text>
        <Text style={styles.profileSub}>
          {c?.personalInfo?.professionalTitle || 'Professional Title'}
        </Text>
        <InfoRow label="Gender" value={c?.sex || 'N/A'} />
        <InfoRow label="Mobile" value={c?.mobile ? String(c.mobile) : 'N/A'} />
        <InfoRow label="Email" value={c?.email || 'N/A'} />
        <InfoRow
          label="DOB"
          value={
            c?.dob
              ? new Date(c.dob).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })
              : 'N/A'
          }
        />
        <InfoRow
          label="Current Address"
          value={c?.personalInfo?.currentAddress?.fullAddress || 'N/A'}
        />
        <InfoRow
          label="Permanent Address"
          value={c?.personalInfo?.permanentAddress?.fullAddress || 'N/A'}
        />
      </View>

      {c?.isExperienced === false ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Work Experience</Text>
          <Text style={styles.sectionBody}>Fresher — looking for opportunities</Text>
        </View>
      ) : c?.experiences?.length ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Work Experience</Text>
          {c.experiences.map((exp, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.listItemTitle}>{exp.jobTitle || 'Role'}</Text>
              <Text style={styles.listItemSub}>{exp.companyName || ''}</Text>
              {exp.jobDescription ? (
                <Text style={styles.sectionBody}>{exp.jobDescription}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {c?.qualifications?.length ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Education</Text>
          {c.qualifications.map((edu, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.listItemTitle}>
                {edu.education || edu.course || 'Qualification'}
              </Text>
              <Text style={styles.listItemSub}>
                {[edu.university, edu.passingYear].filter(Boolean).join(' · ')}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function HistoryTable({
  headers,
  rows,
  emptyText,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  emptyText: string;
}) {
  if (!rows.length) {
    return <Text style={styles.emptyText}>{emptyText}</Text>;
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={styles.tableHead}>
          {headers.map(h => (
            <Text key={h} style={styles.tableHeadCell}>
              {h}
            </Text>
          ))}
        </View>
        {rows.map((cells, ri) => (
          <View key={ri} style={styles.tableRow}>
            {cells.map((cell, ci) => (
              <View key={ci} style={styles.tableCell}>
                {typeof cell === 'string' ? (
                  <Text style={styles.tableCellText}>{cell}</Text>
                ) : (
                  cell
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function JobHistoryTab({
  rows,
  loading,
}: {
  rows: B2CJobHistoryRow[];
  loading: boolean;
}) {
  if (loading) return <ActivityIndicator color={PINK} style={{ marginTop: 16 }} />;
  return (
    <View style={styles.tabPad}>
      <HistoryTable
        headers={['S.No', 'Company', 'Position']}
        emptyText="No job history available"
        rows={rows.map((job, i) => [
          String(i + 1),
          job._job?.displayCompanyName || 'N/A',
          job._job?.title || 'N/A',
        ])}
      />
    </View>
  );
}

function CourseHistoryTab({
  rows,
  loading,
}: {
  rows: B2CCourseHistoryRow[];
  loading: boolean;
}) {
  if (loading) return <ActivityIndicator color={PINK} style={{ marginTop: 16 }} />;
  return (
    <View style={styles.tabPad}>
      <HistoryTable
        headers={['S.No', 'Applied', 'Course', 'Added By', 'Status']}
        emptyText="No course history available"
        rows={rows.map((course, i) => [
          String(i + 1),
          course.createdAt
            ? new Date(course.createdAt).toLocaleDateString('en-GB')
            : 'N/A',
          course._course?.name || 'N/A',
          course.registeredBy?.name || 'Self Registered',
          course._leadStatus?.title || '-',
        ])}
      />
    </View>
  );
}

function DocumentsTab({ profile }: { profile: B2CProfile }) {
  const docs = buildProfileDocumentsList(profile);
  const dc = profile.docCounts;
  if (!docs.length && !(dc?.totalRequired && dc.totalRequired > 0)) {
    return (
      <View style={styles.tabPad}>
        <Text style={styles.emptyText}>No documents required for this course.</Text>
      </View>
    );
  }
  return (
    <ScrollView style={styles.tabScroll} nestedScrollEnabled>
      {dc ? (
        <View style={styles.docStatsRow}>
          <DocStat label="Required" value={dc.totalRequired ?? docs.length} />
          <DocStat label="Uploaded" value={dc.uploadedCount ?? 0} />
          <DocStat label="Pending" value={(dc.pendingVerificationCount ?? 0) + (dc.notUploadedCount ?? 0)} />
          <DocStat label="Verified" value={dc.verifiedCount ?? 0} />
          <DocStat label="Rejected" value={dc.RejectedCount ?? 0} />
        </View>
      ) : null}
      {docs.map((doc, i) => {
        const st = docStatus(doc);
        return (
          <View key={doc._id || i} style={styles.docRow}>
            <Text style={styles.docName} numberOfLines={2}>
              {doc.Name || doc.name || 'Document'}
            </Text>
            <View style={[styles.docBadge, { backgroundColor: statusColor(st) }]}>
              <Text style={styles.docBadgeText}>{st}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function DocStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.docStat}>
      <Text style={styles.docStatVal}>{value}</Text>
      <Text style={styles.docStatLabel}>{label}</Text>
    </View>
  );
}

function PreVerificationTab({
  answers,
  loading,
}: {
  answers: B2CPreVerificationAnswer[];
  loading: boolean;
}) {
  if (loading) return <ActivityIndicator color={PINK} style={{ marginTop: 16 }} />;
  if (!answers.length) {
    return (
      <View style={styles.tabPad}>
        <Text style={styles.emptyText}>No pre-verification data found.</Text>
      </View>
    );
  }
  return (
    <ScrollView style={styles.tabScroll} nestedScrollEnabled>
      {answers.map((item, i) => (
        <View key={i} style={styles.qaRow}>
          <Text style={styles.qaQ}>
            {i + 1}. {item.question || 'Question'}
          </Text>
          <View
            style={[
              styles.qaBadge,
              {
                backgroundColor:
                  item.answer === 'Yes' || item.answer === 'Selected'
                    ? '#10b981'
                    : item.answer === 'No' || item.answer === 'Rejected'
                      ? '#ef4444'
                      : '#f59e0b',
              },
            ]}
          >
            <Text style={styles.qaBadgeText}>{item.answer || '—'}</Text>
          </View>
          {item.rejectionReason ? (
            <Text style={styles.qaReason}>Reason: {item.rejectionReason}</Text>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const PINK = '#fc567b';

export function B2CLeadDetailsPanel({
  token,
  profile,
  activeTab,
  onTabChange,
}: Props) {
  const [detail, setDetail] = React.useState<B2CProfile>(profile);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [courseHistory, setCourseHistory] = React.useState<B2CCourseHistoryRow[]>([]);
  const [jobHistory, setJobHistory] = React.useState<B2CJobHistoryRow[]>([]);
  const [preVerification, setPreVerification] = React.useState<B2CPreVerificationAnswer[]>([]);
  const [loadingCourse, setLoadingCourse] = React.useState(false);
  const [loadingJob, setLoadingJob] = React.useState(false);
  const [loadingPre, setLoadingPre] = React.useState(false);

  React.useEffect(() => {
    setDetail(profile);
  }, [profile._id]);

  React.useEffect(() => {
    if (!token || !profile._id) return;
    let cancelled = false;
    (async () => {
      setLoadingDetail(true);
      try {
        const res = await fetchB2CProfileDetails(token, profile._id);
        if (!cancelled && res.ok && res.profile) setDetail(res.profile);
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, profile._id]);

  React.useEffect(() => {
    const candidateId = detail._candidate?._id;
    if (!token || !candidateId) return;
    if (activeTab === 2 && !jobHistory.length && !loadingJob) {
      setLoadingJob(true);
      fetchB2CJobHistory(token, candidateId).then(res => {
        if (res.ok) setJobHistory(res.rows);
        setLoadingJob(false);
      });
    }
    if (activeTab === 3 && !courseHistory.length && !loadingCourse) {
      setLoadingCourse(true);
      fetchB2CCourseHistory(token, candidateId).then(res => {
        if (res.ok) setCourseHistory(res.rows);
        setLoadingCourse(false);
      });
    }
  }, [activeTab, token, detail._candidate?._id, jobHistory.length, courseHistory.length, loadingJob, loadingCourse]);

  React.useEffect(() => {
    if (activeTab !== 5 || !token || !detail._id) return;
    if (preVerification.length || loadingPre) return;
    setLoadingPre(true);
    fetchB2CPreVerification(token, detail._id).then(res => {
      if (res.ok) setPreVerification(res.answers);
      setLoadingPre(false);
    });
  }, [activeTab, token, detail._id, preVerification.length, loadingPre]);

  return (
    <View style={styles.panel}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
      >
        {B2C_DETAIL_TABS.map((tab, index) => {
          const active = activeTab === index;
          return (
            <Pressable
              key={tab}
              onPress={() => onTabChange(index)}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loadingDetail && activeTab !== 2 && activeTab !== 3 && activeTab !== 5 ? (
        <ActivityIndicator color={PINK} style={{ marginVertical: 16 }} />
      ) : null}

      {activeTab === 0 ? <LeadDetailsTab profile={detail} /> : null}
      {activeTab === 1 ? <ProfileTab profile={detail} /> : null}
      {activeTab === 2 ? (
        <JobHistoryTab rows={jobHistory} loading={loadingJob} />
      ) : null}
      {activeTab === 3 ? (
        <CourseHistoryTab rows={courseHistory} loading={loadingCourse} />
      ) : null}
      {activeTab === 4 ? <DocumentsTab profile={detail} /> : null}
      {activeTab === 5 ? (
        <PreVerificationTab answers={preVerification} loading={loadingPre} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    maxHeight: 420,
  },
  tabBar: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 6,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: 'rgba(252, 86, 123, 0.35)',
  },
  tabBtnActive: {
    backgroundColor: PINK,
    borderColor: PINK,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: PINK,
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  tabScroll: { maxHeight: 340 },
  tabPad: { padding: 12 },
  infoCard: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  profileSub: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  sectionBlock: {
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
  },
  sectionBody: { fontSize: 13, color: '#475569', lineHeight: 20 },
  listItem: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  listItemTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  listItemSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  tableHead: { flexDirection: 'row', backgroundColor: '#f1f5f9' },
  tableHeadCell: {
    width: 100,
    padding: 8,
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  tableCell: { width: 100, padding: 8, justifyContent: 'center' },
  tableCellText: { fontSize: 12, color: '#0f172a' },
  emptyText: {
    textAlign: 'center',
    color: college.textMuted,
    fontSize: 14,
    paddingVertical: 24,
  },
  docStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 10,
  },
  docStat: {
    flex: 1,
    minWidth: 56,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  docStatVal: { fontSize: 16, fontWeight: '800', color: PINK },
  docStatLabel: { fontSize: 9, fontWeight: '700', color: '#64748b', marginTop: 2 },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  docName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#0f172a' },
  docBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  docBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  qaRow: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  qaQ: { fontSize: 13, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  qaBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qaBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  qaReason: { marginTop: 8, fontSize: 12, color: '#64748b' },
});
