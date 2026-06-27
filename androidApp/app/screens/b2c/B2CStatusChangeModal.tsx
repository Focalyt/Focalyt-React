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
  B2CFullStatus,
  B2CProfile,
  B2CSubStatus,
  fetchB2CStatuses,
  fetchB2CSubStatuses,
  updateB2CLeadStatus,
} from '../../services/b2cApi';
import { college } from '../../theme/college';

type Props = {
  visible: boolean;
  profile: B2CProfile | null;
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

export function B2CStatusChangeModal({
  visible,
  profile,
  onClose,
  onSaved,
}: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const token = user?.token ?? '';

  const [statuses, setStatuses] = React.useState<B2CFullStatus[]>([]);
  const [subStatuses, setSubStatuses] = React.useState<B2CSubStatus[]>([]);
  const [loadingStatuses, setLoadingStatuses] = React.useState(false);
  const [loadingSub, setLoadingSub] = React.useState(false);
  const [statusId, setStatusId] = React.useState('');
  const [subStatusId, setSubStatusId] = React.useState('');
  const [remarks, setRemarks] = React.useState('');
  const [followUpDate, setFollowUpDate] = React.useState('');
  const [followUpTime, setFollowUpTime] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectedSub = React.useMemo(
    () => subStatuses.find(s => s._id === subStatusId),
    [subStatuses, subStatusId],
  );

  React.useEffect(() => {
    if (!visible) return;
    setRemarks('');
    setSubStatusId('');
    setError(null);
    setSaving(false);
    setStatusId(profile?._leadStatus?._id || '');
    setFollowUpDate('');
    setFollowUpTime('');
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoadingStatuses(true);
      try {
        const res = await fetchB2CStatuses(token);
        if (!cancelled && res.ok) setStatuses(res.items);
      } finally {
        if (!cancelled) setLoadingStatuses(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, token, profile?._leadStatus?._id]);

  React.useEffect(() => {
    if (!visible || !token || !statusId) {
      setSubStatuses([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingSub(true);
      try {
        const res = await fetchB2CSubStatuses(token, statusId);
        if (!cancelled && res.ok) setSubStatuses(res.items);
      } finally {
        if (!cancelled) setLoadingSub(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, token, statusId]);

  const onSelectStatus = (id: string) => {
    setStatusId(id);
    setSubStatusId('');
    setFollowUpDate('');
    setFollowUpTime('');
  };

  const onSave = async () => {
    if (!profile) return;
    if (!token) return setError('Login required');
    if (!statusId) return setError('Status select karo');

    if (selectedSub?.hasFollowup) {
      if (!isValidYmd(followUpDate))
        return setError('Follow-up date YYYY-MM-DD format me hona chahiye');
      if (!isValidHm(followUpTime))
        return setError('Follow-up time HH:MM format me hona chahiye');
    }
    if (selectedSub?.hasRemarks && !remarks.trim()) {
      return setError('Iss sub-status ke liye remarks compulsory hain');
    }

    let followupIso: string | null = null;
    if (selectedSub?.hasFollowup && followUpDate && followUpTime) {
      const hm = followUpTime.length === 4 ? `0${followUpTime}` : followUpTime;
      followupIso = new Date(`${followUpDate}T${hm}`).toISOString();
    }

    setSaving(true);
    setError(null);
    try {
      const res = await updateB2CLeadStatus(token, profile._id, {
        _leadStatus: statusId,
        _leadSubStatus: subStatusId || null,
        followup: followupIso,
        remarks: remarks.trim() || undefined,
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

  const candidateName = profile?._candidate?.name || 'Candidate';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}
          onPress={e => e.stopPropagation()}
        >
          <Text style={styles.title}>Change Status</Text>
          <Text style={styles.subtitle}>{candidateName}</Text>

          {loadingStatuses ? (
            <ActivityIndicator color="#fc567b" style={{ marginVertical: 16 }} />
          ) : (
            <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Lead Status</Text>
              <View style={styles.chipsWrap}>
                {statuses.map(s => (
                  <Pressable
                    key={s._id}
                    onPress={() => onSelectStatus(s._id)}
                    style={[styles.chip, statusId === s._id && styles.chipActive]}
                  >
                    <Text
                      style={[styles.chipText, statusId === s._id && styles.chipTextActive]}
                      numberOfLines={1}
                    >
                      {s.title}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {statusId ? (
                <>
                  <Text style={styles.label}>Sub Status</Text>
                  {loadingSub ? (
                    <ActivityIndicator color="#fc567b" size="small" />
                  ) : (
                    <View style={styles.chipsWrap}>
                      {subStatuses.map(s => (
                        <Pressable
                          key={s._id}
                          onPress={() => setSubStatusId(s._id)}
                          style={[
                            styles.chip,
                            subStatusId === s._id && styles.chipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              subStatusId === s._id && styles.chipTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {s.title}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </>
              ) : null}

              {selectedSub?.hasFollowup ? (
                <>
                  <Text style={styles.label}>Follow-up Date</Text>
                  <TextInput
                    value={followUpDate}
                    onChangeText={setFollowUpDate}
                    style={styles.input}
                    placeholder={offsetYmd(1)}
                  />
                  <Text style={styles.label}>Follow-up Time</Text>
                  <TextInput
                    value={followUpTime}
                    onChangeText={setFollowUpTime}
                    style={styles.input}
                    placeholder="11:00"
                  />
                </>
              ) : null}

              <Text style={styles.label}>
                Remarks{selectedSub?.hasRemarks ? ' *' : ''}
              </Text>
              <TextInput
                value={remarks}
                onChangeText={setRemarks}
                style={[styles.input, styles.textArea]}
                multiline
                placeholder="Status change notes"
              />
            </ScrollView>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={onSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveText}>Update</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const PINK = '#fc567b';

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '88%',
  },
  scroll: { maxHeight: 360 },
  title: { fontSize: 18, fontWeight: '700', color: college.text },
  subtitle: { fontSize: 14, color: college.textMuted, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: college.textMuted, marginTop: 10 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: PINK,
    maxWidth: '100%',
  },
  chipActive: { backgroundColor: PINK },
  chipText: { fontSize: 12, fontWeight: '600', color: PINK },
  chipTextActive: { color: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: college.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    fontSize: 14,
    color: college.text,
  },
  textArea: { minHeight: 64, textAlignVertical: 'top' },
  error: { color: college.error, marginTop: 8, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: college.border,
    alignItems: 'center',
  },
  cancelText: { fontWeight: '600', color: college.textMuted },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: PINK,
    alignItems: 'center',
  },
  saveText: { fontWeight: '700', color: '#fff' },
});
