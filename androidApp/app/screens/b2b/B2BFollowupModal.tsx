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
import { createB2BLeadFollowup } from '../../services/b2bApi';
import { getGoogleEmail, isGoogleConnected } from '../../services/googleAuth';
import { college } from '../../theme/college';
import { B2BGoogleConnectModal } from './B2BGoogleConnectModal';

type FollowUpType = 'Call' | 'Visit';

type LeadLike = {
  _id: string;
  businessName?: string;
  concernPersonName?: string;
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

function labelForOffset(days: number) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 0) return `${-days}d ago`;
  return `+${days}d`;
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

export function B2BFollowupModal({ visible, lead, onClose, onSaved }: Props) {
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
      setType('Call');
      setDate(offsetYmd(1));
      setTime('11:00');
      setRemarks('');
      setError(null);
      setSaving(false);
      setAddToCalendar(false);
    }
  }, [visible]);

  const onSave = async () => {
    if (!lead) return;
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
    setSaving(true);
    setError(null);
    try {
      const res = await createB2BLeadFollowup(token, lead._id, {
        followUpType: type,
        scheduledDate: date,
        scheduledTime: time.length === 4 ? `0${time}` : time,
        description:
          type === 'Visit' ? 'Follow-up visit' : 'Follow-up call',
        remarks,
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
          <Text style={styles.title}>Schedule Follow-up</Text>
          {lead ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {lead.businessName || lead.concernPersonName || 'Lead'}
            </Text>
          ) : null}

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {(['Call', 'Visit'] as FollowUpType[]).map(t => (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  style={[
                    styles.typeBtn,
                    type === t && styles.typeBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      type === t && styles.typeBtnTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={college.icon}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.quickRow}>
              {DATE_QUICK.map(d => {
                const ymd = offsetYmd(d);
                const active = date === ymd;
                return (
                  <Pressable
                    key={d}
                    onPress={() => setDate(ymd)}
                    style={[styles.quick, active && styles.quickActive]}
                  >
                    <Text
                      style={[
                        styles.quickText,
                        active && styles.quickTextActive,
                      ]}
                    >
                      {labelForOffset(d)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Time</Text>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="HH:MM (24h)"
              placeholderTextColor={college.icon}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="numbers-and-punctuation"
            />
            <View style={styles.quickRow}>
              {TIME_QUICK.map(t => {
                const active = time === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setTime(t)}
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

            <Text style={styles.fieldLabel}>Remarks (optional)</Text>
            <TextInput
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Notes / context for next touchpoint"
              placeholderTextColor={college.icon}
              style={[styles.input, styles.textarea]}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.fieldLabel}>Google Calendar</Text>
            {googleConnected ? (
              <Pressable
                onPress={() => setAddToCalendar(v => !v)}
                style={styles.calRow}
              >
                <View
                  style={[
                    styles.calCheck,
                    addToCalendar && styles.calCheckOn,
                  ]}
                >
                  {addToCalendar ? (
                    <Text style={styles.calCheckMark}>✓</Text>
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.calLabel}>
                    Add this follow-up to Google Calendar
                  </Text>
                  <Text style={styles.calMuted} numberOfLines={1}>
                    {googleEmail
                      ? `Connected: ${googleEmail}`
                      : `Connected as ${user?.email || user?.name || 'Google user'}`}
                  </Text>
                </View>
              </Pressable>
            ) : (
              <Pressable
                style={styles.connectBtn}
                onPress={() => setShowGoogleConnect(true)}
              >
                <Text style={styles.connectBtnText}>
                  🗓  Connect Google Calendar
                </Text>
              </Pressable>
            )}

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
                <Text style={styles.btnPrimaryText}>Save Follow-up</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>

      <B2BGoogleConnectModal
        visible={showGoogleConnect}
        onClose={() => setShowGoogleConnect(false)}
        onConnected={() => setAddToCalendar(true)}
      />
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
  title: { fontSize: 16, fontWeight: '800', color: college.text },
  subtitle: { fontSize: 12, color: college.textMuted, marginTop: 2, marginBottom: 8 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: college.textMuted,
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: college.border,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: college.primary,
    borderColor: college.primary,
  },
  typeBtnText: { color: college.text, fontWeight: '700', fontSize: 13 },
  typeBtnTextActive: { color: '#fff' },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: college.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: college.text,
  },
  textarea: { minHeight: 72, textAlignVertical: 'top' },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  quick: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: college.border,
  },
  quickActive: {
    backgroundColor: college.primary,
    borderColor: college.primary,
  },
  quickText: { fontSize: 11, color: college.text, fontWeight: '600' },
  quickTextActive: { color: '#fff' },

  error: {
    marginTop: 10,
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

  calRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: college.border,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  calCheck: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: college.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calCheckOn: { backgroundColor: college.primary },
  calCheckMark: { color: '#fff', fontWeight: '900', fontSize: 12 },
  calLabel: { fontSize: 13, fontWeight: '700', color: college.text },
  calMuted: { fontSize: 11, color: college.textMuted, marginTop: 2 },

  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: college.primary,
  },
  connectBtnText: {
    color: college.primary,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
