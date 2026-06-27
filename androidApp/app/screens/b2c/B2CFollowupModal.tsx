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
import { B2CProfile, createB2CFollowup } from '../../services/b2cApi';
import { getGoogleEmail, isGoogleConnected } from '../../services/googleAuth';
import { college } from '../../theme/college';
import { B2BGoogleConnectModal } from '../b2b/B2BGoogleConnectModal';

type FollowUpType = 'Call' | 'Visit';

type Props = {
  visible: boolean;
  profile: B2CProfile | null;
  initialType?: FollowUpType;
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

const DATE_QUICK = [0, 1, 2, 3, 7];
const TIME_QUICK = ['09:30', '11:00', '12:30', '14:00', '16:00', '17:30'];

function isValidYmd(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isValidHm(s: string) {
  if (!/^\d{1,2}:\d{2}$/.test(s)) return false;
  const [h, m] = s.split(':').map(n => parseInt(n, 10));
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export function B2CFollowupModal({
  visible,
  profile,
  initialType = 'Call',
  onClose,
  onSaved,
}: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const token = user?.token ?? '';
  const googleConnected = isGoogleConnected(user);
  const googleEmail = getGoogleEmail(user);

  const [type, setType] = React.useState<FollowUpType>('Call');
  const [date, setDate] = React.useState<string>(offsetYmd(1));
  const [time, setTime] = React.useState<string>('11:00');
  const [remarks, setRemarks] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [addToCalendar, setAddToCalendar] = React.useState(false);
  const [showGoogleConnect, setShowGoogleConnect] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setType(initialType);
      setDate(offsetYmd(1));
      setTime('11:00');
      setRemarks('');
      setError(null);
      setSaving(false);
      setAddToCalendar(false);
    }
  }, [visible, initialType]);

  const onSave = async () => {
    if (!profile) return;
    if (!remarks.trim()) {
      setError('Remarks required');
      return;
    }
    if (!isValidYmd(date)) {
      setError('Date format YYYY-MM-DD me hona chahiye');
      return;
    }
    if (!isValidHm(time)) {
      setError('Time format HH:MM (24h) me hona chahiye');
      return;
    }
    if (!token) {
      setError('Login required');
      return;
    }
    const hm = time.length === 4 ? `0${time}` : time;
    const followupDateIso = new Date(`${date}T${hm}`).toISOString();
    if (isNaN(new Date(followupDateIso).getTime())) {
      setError('Invalid date/time');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await createB2CFollowup(token, profile, {
        followUpType: type,
        followupDateIso,
        remarks: remarks.trim(),
        googleCalendarEvent: googleConnected && addToCalendar,
      });
      if (res.ok) {
        onSaved?.();
        onClose();
      } else {
        setError(res.message || 'Failed to save follow-up');
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
          <Text style={styles.title}>Set Follow-up</Text>
          <Text style={styles.subtitle}>{candidateName}</Text>

          <View style={styles.typeRow}>
            {(['Call', 'Visit'] as const).map(t => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[styles.typeBtn, type === t && styles.typeBtnActive]}
              >
                <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            style={styles.input}
            placeholder="2026-06-25"
            autoCapitalize="none"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}>
            {DATE_QUICK.map(d => (
              <Pressable key={d} style={styles.chip} onPress={() => setDate(offsetYmd(d))}>
                <Text style={styles.chipText}>{d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `+${d}d`}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.label}>Time (HH:MM)</Text>
          <TextInput value={time} onChangeText={setTime} style={styles.input} placeholder="11:00" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}>
            {TIME_QUICK.map(t => (
              <Pressable key={t} style={styles.chip} onPress={() => setTime(t)}>
                <Text style={styles.chipText}>{t}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.label}>Remarks *</Text>
          <TextInput
            value={remarks}
            onChangeText={setRemarks}
            style={[styles.input, styles.textArea]}
            multiline
            placeholder="Follow-up notes"
          />

          {googleConnected ? (
            <Pressable style={styles.calRow} onPress={() => setAddToCalendar(v => !v)}>
              <View style={[styles.checkbox, addToCalendar && styles.checkboxOn]} />
              <Text style={styles.calText}>Add to Google Calendar ({googleEmail})</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setShowGoogleConnect(true)}>
              <Text style={styles.link}>Connect Google Calendar</Text>
            </Pressable>
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
                <Text style={styles.saveText}>Save</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>

      <B2BGoogleConnectModal
        visible={showGoogleConnect}
        onClose={() => setShowGoogleConnect(false)}
      />
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
    maxHeight: '90%',
  },
  title: { fontSize: 18, fontWeight: '700', color: college.text },
  subtitle: { fontSize: 14, color: college.textMuted, marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: PINK,
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: PINK },
  typeBtnText: { fontWeight: '600', color: PINK },
  typeBtnTextActive: { color: '#fff' },
  label: { fontSize: 12, fontWeight: '600', color: college.textMuted, marginTop: 8 },
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
  textArea: { minHeight: 72, textAlignVertical: 'top' },
  quickRow: { marginTop: 6, marginBottom: 4 },
  chip: {
    backgroundColor: '#fce7ef',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 6,
  },
  chipText: { fontSize: 12, color: PINK, fontWeight: '600' },
  calRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: college.border,
  },
  checkboxOn: { backgroundColor: PINK, borderColor: PINK },
  calText: { fontSize: 13, color: college.text, flex: 1 },
  link: { color: PINK, marginTop: 12, fontWeight: '600' },
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
