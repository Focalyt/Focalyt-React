import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import {
  B2BFullStatus,
  B2BSubStatus,
  fetchB2BStatuses,
  updateB2BLeadStatus,
} from '../../services/b2bApi';
import { college } from '../../theme/college';

type LeadLike = {
  _id: string;
  businessName?: string;
  concernPersonName?: string;
  status?: { _id?: string; title?: string; name?: string };
};

type Props = {
  visible: boolean;
  lead: LeadLike | null;
  onClose: () => void;
  onSaved?: () => void;
};

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function toYmd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function offsetYmd(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return toYmd(d);
}

function isValidYmd(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isValidHm(s: string) {
  if (!/^\d{1,2}:\d{2}$/.test(s)) return false;
  const [h, m] = s.split(':').map(n => parseInt(n, 10));
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export function B2BStatusChangeModal({
  visible,
  lead,
  onClose,
  onSaved,
}: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const token = user?.token ?? '';

  const [statuses, setStatuses] = React.useState<B2BFullStatus[]>([]);
  const [loadingStatuses, setLoadingStatuses] = React.useState(false);
  const [statusId, setStatusId] = React.useState<string>('');
  const [subStatusId, setSubStatusId] = React.useState<string>('');
  const [remarks, setRemarks] = React.useState('');
  const [followUpDate, setFollowUpDate] = React.useState('');
  const [followUpTime, setFollowUpTime] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectedStatus = React.useMemo<B2BFullStatus | undefined>(
    () => statuses.find(s => s._id === statusId),
    [statuses, statusId],
  );
  const subOptions: B2BSubStatus[] = React.useMemo(
    () => selectedStatus?.substatuses ?? [],
    [selectedStatus],
  );
  const selectedSub = React.useMemo<B2BSubStatus | undefined>(
    () => subOptions.find(s => s._id === subStatusId),
    [subOptions, subStatusId],
  );

  React.useEffect(() => {
    if (!visible) return;
    setRemarks('');
    setSubStatusId('');
    setError(null);
    setSaving(false);
    setStatusId(lead?.status?._id || '');
    setFollowUpDate('');
    setFollowUpTime('');
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoadingStatuses(true);
      try {
        const res = await fetchB2BStatuses(token);
        if (cancelled) return;
        if (res.ok) setStatuses(res.items);
      } finally {
        if (!cancelled) setLoadingStatuses(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, token, lead?.status?._id]);

  const onSelectStatus = (id: string) => {
    setStatusId(id);
    setSubStatusId('');
    setFollowUpDate('');
    setFollowUpTime('');
  };

  const onSave = async () => {
    if (!lead) return;
    if (!token) return setError('Login required');
    if (!statusId) return setError('Status select karo');

    if (selectedSub?.hasFollowup) {
      if (!isValidYmd(followUpDate))
        return setError('Follow-up date YYYY-MM-DD format me hona chahiye');
      if (!isValidHm(followUpTime))
        return setError('Follow-up time HH:MM (24h) format me hona chahiye');
    }
    if (selectedSub?.hasRemarks && !remarks.trim()) {
      return setError('Iss sub-status ke liye remarks compulsory hain');
    }

    setSaving(true);
    setError(null);
    try {
      const res = await updateB2BLeadStatus(token, lead._id, {
        status: statusId,
        subStatus: subStatusId || undefined,
        remarks: remarks.trim() || undefined,
        followUpDate: selectedSub?.hasFollowup ? followUpDate : undefined,
        followUpTime: selectedSub?.hasFollowup
          ? followUpTime.length === 4
            ? `0${followUpTime}`
            : followUpTime
          : undefined,
      });
      if (res.ok) {
        onSaved?.();
        onClose();
      } else {
        setError(res.message || 'Failed to update status');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setSaving(false);
    }
  };

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
              <Text style={styles.title}>Change Status</Text>
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

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.fieldLabel}>Status</Text>
            {loadingStatuses ? (
              <ActivityIndicator color={college.primary} />
            ) : statuses.length === 0 ? (
              <Text style={styles.muted}>No statuses available</Text>
            ) : (
              <View style={styles.chipsWrap}>
                {statuses.map(s => {
                  const active = statusId === s._id;
                  return (
                    <Pressable
                      key={s._id}
                      onPress={() => onSelectStatus(s._id)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {s.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {subOptions.length > 0 ? (
              <>
                <Text style={styles.fieldLabel}>Sub-Status</Text>
                <View style={styles.chipsWrap}>
                  {subOptions.map(s => {
                    const active = subStatusId === s._id;
                    return (
                      <Pressable
                        key={s._id}
                        onPress={() => setSubStatusId(s._id)}
                        style={[
                          styles.subChip,
                          active && styles.subChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.subChipText,
                            active && styles.subChipTextActive,
                          ]}
                        >
                          {s.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            {selectedSub?.hasFollowup ? (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Follow-up Date</Text>
                  <TextInput
                    value={followUpDate}
                    onChangeText={setFollowUpDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={college.icon}
                    style={styles.input}
                  />
                  <View style={styles.quickRow}>
                    {[0, 1, 2, 3, 7].map(d => {
                      const ymd = offsetYmd(d);
                      const active = followUpDate === ymd;
                      return (
                        <Pressable
                          key={d}
                          onPress={() => setFollowUpDate(ymd)}
                          style={[styles.quick, active && styles.quickActive]}
                        >
                          <Text
                            style={[
                              styles.quickText,
                              active && styles.quickTextActive,
                            ]}
                          >
                            {d === 0 ? 'Today' : d === 1 ? 'Tom' : `+${d}d`}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Follow-up Time</Text>
                  <TextInput
                    value={followUpTime}
                    onChangeText={setFollowUpTime}
                    placeholder="HH:MM"
                    placeholderTextColor={college.icon}
                    style={styles.input}
                    keyboardType="numbers-and-punctuation"
                  />
                  <View style={styles.quickRow}>
                    {['10:00', '12:00', '15:00', '17:00'].map(t => {
                      const active = followUpTime === t;
                      return (
                        <Pressable
                          key={t}
                          onPress={() => setFollowUpTime(t)}
                          style={[styles.quick, active && styles.quickActive]}
                        >
                          <Text
                            style={[
                              styles.quickText,
                              active && styles.quickTextActive,
                            ]}
                          >
                            {t}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>
              Remarks{selectedSub?.hasRemarks ? ' *' : ' (optional)'}
            </Text>
            <TextInput
              value={remarks}
              onChangeText={setRemarks}
              placeholder="What happened in this conversation?"
              placeholderTextColor={college.icon}
              style={[styles.input, styles.textarea]}
              multiline
              numberOfLines={3}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.btnGhost]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnPrimary, saving && { opacity: 0.7 }]}
              onPress={onSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnPrimaryText}>Save Status</Text>
              )}
            </Pressable>
          </View>
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
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: '800', color: college.text },
  subtitle: { fontSize: 12, color: college.textMuted, marginTop: 2 },
  close: { fontSize: 18, color: college.textMuted, paddingHorizontal: 4 },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: college.textMuted,
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: college.border,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: college.primary, borderColor: college.primary },
  chipText: { fontSize: 12, color: college.text, fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  subChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: college.border,
    backgroundColor: '#fff',
  },
  subChipActive: {
    backgroundColor: '#eef2ff',
    borderColor: college.primary,
  },
  subChipText: { fontSize: 12, color: college.text, fontWeight: '500' },
  subChipTextActive: { color: college.primary, fontWeight: '700' },

  row: { flexDirection: 'row', gap: 10 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: college.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: college.text,
  },
  textarea: { minHeight: 64, textAlignVertical: 'top' },

  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  quick: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: college.border,
  },
  quickActive: {
    backgroundColor: college.primary,
    borderColor: college.primary,
  },
  quickText: { fontSize: 10, color: college.text, fontWeight: '600' },
  quickTextActive: { color: '#fff' },

  muted: { color: college.textMuted, fontSize: 12 },

  error: {
    marginTop: 12,
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 6,
    fontSize: 12,
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: college.primary },
  btnPrimaryText: { color: '#fff', fontWeight: '800' },
  btnGhost: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: college.border,
  },
  btnGhostText: { color: college.text, fontWeight: '700' },
});
