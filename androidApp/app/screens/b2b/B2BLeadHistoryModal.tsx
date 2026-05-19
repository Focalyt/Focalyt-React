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
import { useAuth } from '../../auth/AuthContext';
import { B2BLeadLog, fetchB2BLeadLogs } from '../../services/b2bApi';
import { college } from '../../theme/college';

type LeadLike = {
  _id: string;
  businessName?: string;
  concernPersonName?: string;
};

type Props = {
  visible: boolean;
  lead: LeadLike | null;
  onClose: () => void;
};

function fmtTs(s?: string) {
  if (!s) return 'Unknown date';
  const d = new Date(s);
  if (isNaN(d.getTime())) return 'Unknown date';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function B2BLeadHistoryModal({ visible, lead, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const token = user?.token ?? '';

  const [logs, setLogs] = React.useState<B2BLeadLog[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!visible || !lead || !token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setLogs([]);
      try {
        const res = await fetchB2BLeadLogs(token, lead._id);
        if (cancelled) return;
        if (res.ok) {
          const sorted = [...res.logs].sort((a, b) => {
            const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return tb - ta;
          });
          setLogs(sorted);
        } else {
          setError(res.message || 'Failed to load history');
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, lead, token]);

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
              <Text style={styles.title}>Lead History</Text>
              {lead ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {lead.businessName || lead.concernPersonName || 'Lead'}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={college.primary} />
              <Text style={styles.muted}>Loading history…</Text>
            </View>
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : logs.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>No History Available</Text>
              <Text style={styles.muted}>
                Is lead par abhi tak koi action record nahi hua.
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.body}
            >
              {logs.map((log, i) => {
                const lastItem = i === logs.length - 1;
                const actions = (log.action || '')
                  .split(';')
                  .map(a => a.trim())
                  .filter(Boolean);
                return (
                  <View key={log._id || i} style={styles.item}>
                    <View style={styles.markerCol}>
                      <View style={styles.dot} />
                      {!lastItem ? <View style={styles.line} /> : null}
                    </View>
                    <View style={styles.card}>
                      <Text style={styles.ts}>{fmtTs(log.timestamp)}</Text>
                      <Text style={styles.user}>
                        Modified By: {log.user || 'Unknown User'}
                      </Text>
                      <Text style={styles.sectionLabel}>Action</Text>
                      {actions.length > 0 ? (
                        actions.map((a, idx) => (
                          <Text key={idx} style={styles.actionLine}>
                            • {a}
                          </Text>
                        ))
                      ) : (
                        <Text style={styles.muted}>No action specified</Text>
                      )}
                      {log.remarks ? (
                        <>
                          <Text style={styles.sectionLabel}>Remarks</Text>
                          <Text style={styles.remarks}>{log.remarks}</Text>
                        </>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
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
    maxHeight: '90%',
    minHeight: '40%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: college.border,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: '800', color: college.text },
  subtitle: { fontSize: 12, color: college.textMuted, marginTop: 2 },
  close: { fontSize: 18, color: college.textMuted, paddingHorizontal: 4 },

  body: { paddingBottom: 12 },

  item: { flexDirection: 'row', marginBottom: 12 },
  markerCol: {
    width: 18,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: college.primary,
    marginTop: 6,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#e9ecef',
    marginTop: 2,
  },
  card: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#eef0f3',
  },
  ts: {
    fontSize: 12,
    fontWeight: '700',
    color: college.text,
  },
  user: {
    fontSize: 11,
    color: college.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: college.text,
    marginTop: 6,
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  actionLine: {
    fontSize: 12,
    color: college.textMuted,
    lineHeight: 18,
  },
  remarks: {
    fontSize: 12,
    color: college.textMuted,
    lineHeight: 16,
  },

  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  muted: { color: college.textMuted, fontSize: 12, textAlign: 'center' },
  emptyTitle: {
    color: college.text,
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    marginTop: 8,
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 6,
    fontSize: 12,
  },
});
