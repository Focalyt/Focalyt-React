import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { B2CProfile, B2CReEnquiry } from '../../services/b2cApi';

const PINK = '#fc567b';

type Props = {
  visible: boolean;
  profile: B2CProfile | null;
  courseName?: string;
  reEnquiries?: B2CReEnquiry[];
  loading?: boolean;
  onClose: () => void;
};

function fmtDateTime(s?: string) {
  if (!s) return 'N/A';
  const d = new Date(s);
  if (isNaN(d.getTime())) return 'N/A';
  const datePart = d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timePart = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
}

function sourceLabel(item: B2CReEnquiry) {
  const raw = item.source?.trim();
  if (raw) return raw;
  return 'ReApply';
}

function HistoryRow({
  sno,
  date,
  course,
  center,
  source,
}: {
  sno: number;
  date: string;
  course: string;
  center: string;
  source: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.cellSno]}>{sno}</Text>
      <Text style={[styles.cell, styles.cellDate]} numberOfLines={2}>
        {date}
      </Text>
      <Text style={[styles.cell, styles.cellCourse]} numberOfLines={2}>
        {course}
      </Text>
      <Text style={[styles.cell, styles.cellCenter]} numberOfLines={1}>
        {center}
      </Text>
      <View style={styles.sourceBadge}>
        <Text style={styles.sourceBadgeText} numberOfLines={2}>
          {source}
        </Text>
      </View>
    </View>
  );
}

export function B2CReapplyModal({
  visible,
  profile,
  courseName,
  reEnquiries = [],
  loading = false,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const displayCourse =
    courseName || profile?._course?.name || 'This course';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {profile?._candidate?.name || 'Candidate'}
              </Text>
              <Text style={styles.subtitle}>ReApply History</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.hint}>
            Jab candidate <Text style={styles.hintStrong}>{displayCourse}</Text>{' '}
            par dubara apply karta hai — khud se ya digital leads se — woh
            attempts yahan dikhte hain.
          </Text>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={PINK} />
              <Text style={styles.muted}>Loading reapply history…</Text>
            </View>
          ) : reEnquiries.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.muted}>
                Is course par abhi koi reapply record nahi hai.
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View style={[styles.row, styles.headerRow]}>
                  <Text style={[styles.headerCell, styles.cellSno]}>S.No</Text>
                  <Text style={[styles.headerCell, styles.cellDate]}>
                    Date & Time
                  </Text>
                  <Text style={[styles.headerCell, styles.cellCourse]}>
                    Course
                  </Text>
                  <Text style={[styles.headerCell, styles.cellCenter]}>
                    Center
                  </Text>
                  <Text style={[styles.headerCell, styles.cellSource]}>
                    Source
                  </Text>
                </View>
                <ScrollView
                  style={styles.tableBody}
                  showsVerticalScrollIndicator={false}
                >
                  {reEnquiries.map((item, index) => {
                    const applied = item.appliedCourse || {};
                    return (
                      <HistoryRow
                        key={`reapply-${item._id || index}`}
                        sno={index + 1}
                        date={fmtDateTime(item.reEnquireDate || item.createdAt)}
                        course={item.course?.name || applied._course?.name || displayCourse}
                        center={applied._center?.name || profile?._center?.name || 'N/A'}
                        source={sourceLabel(item)}
                      />
                    );
                  })}
                </ScrollView>
              </View>
            </ScrollView>
          )}

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '88%',
    minHeight: '40%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  close: { fontSize: 18, color: '#64748b', paddingHorizontal: 4 },
  hint: { color: '#64748b', fontSize: 12, marginBottom: 12, lineHeight: 18 },
  hintStrong: { color: '#0f172a', fontWeight: '800' },
  center: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  muted: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  tableBody: { maxHeight: 360 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 6,
  },
  headerRow: {
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  headerCell: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  cell: { fontSize: 11, color: '#0f172a' },
  cellSno: { width: 36 },
  cellDate: { width: 132 },
  cellCourse: { width: 110 },
  cellCenter: { width: 88 },
  cellSource: { width: 110 },
  sourceBadge: {
    width: 110,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: '#fef3c7',
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78350f',
    textAlign: 'center',
  },
  closeBtn: {
    marginTop: 14,
    backgroundColor: '#64748b',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontWeight: '800' },
});
