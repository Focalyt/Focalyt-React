import React from 'react';
import {
  ActivityIndicator,
  Alert,
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
  B2COption,
  createB2CLead,
  fetchB2CFilterOptions,
} from '../../services/b2cApi';
import { college } from '../../theme/college';
import { B2BFilterSelect } from '../b2b/B2BFilterSelect';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

function toOptions(items: B2COption[]) {
  return items.map(i => ({ value: i._id, label: i.name || '—' }));
}

export function B2CAddLeadModal({ visible, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const token = user?.token ?? '';

  const [courses, setCourses] = React.useState<B2COption[]>([]);
  const [centers, setCenters] = React.useState<B2COption[]>([]);
  const [counselors, setCounselors] = React.useState<B2COption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [courseId, setCourseId] = React.useState('');
  const [centerId, setCenterId] = React.useState('');
  const [counselorId, setCounselorId] = React.useState('');
  const [name, setName] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [whatsapp, setWhatsapp] = React.useState('');
  const [sex, setSex] = React.useState('');
  const [dob, setDob] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [qualification, setQualification] = React.useState('');

  React.useEffect(() => {
    if (!visible || !token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchB2CFilterOptions(token);
        if (cancelled || !res.ok) return;
        setCourses(res.courses);
        setCenters(res.centers);
        setCounselors(res.counselors);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, token]);

  React.useEffect(() => {
    if (visible) {
      setCourseId('');
      setCenterId('');
      setCounselorId('');
      setName('');
      setMobile('');
      setWhatsapp('');
      setSex('');
      setDob('');
      setEmail('');
      setQualification('');
      setError(null);
      setSaving(false);
    }
  }, [visible]);

  const onSave = async () => {
    const errors: string[] = [];
    if (!courseId) errors.push('Course select karo');
    if (!centerId) errors.push('Center select karo');
    if (!counselorId) errors.push('Counselor select karo');
    if (!name.trim()) errors.push('Name required');
    if (!/^\d{10}$/.test(mobile.trim())) errors.push('Mobile 10 digits hona chahiye');
    if (!/^\d{10}$/.test(whatsapp.trim())) errors.push('WhatsApp 10 digits hona chahiye');
    if (!sex) errors.push('Gender select karo');
    if (!dob.trim()) errors.push('DOB required (YYYY-MM-DD)');
    if (!qualification.trim()) errors.push('Qualification required');
    if (errors.length) {
      setError(errors.join('\n'));
      return;
    }
    if (!token) return setError('Login required');

    let dobIso = dob.trim();
    const parsed = new Date(dobIso);
    if (!isNaN(parsed.getTime())) dobIso = parsed.toISOString();

    setSaving(true);
    setError(null);
    try {
      const res = await createB2CLead(token, {
        courseId,
        centerId,
        counselorId,
        registeredBy: counselorId,
        candidateData: {
          name: name.trim(),
          mobile: mobile.trim(),
          whatsapp: whatsapp.trim(),
          sex,
          dob: dobIso,
          email: email.trim() || undefined,
          highestQualification: qualification.trim(),
        },
      });
      if (res.ok) {
        Alert.alert('Success', 'Lead added successfully');
        onSaved?.();
        onClose();
      } else {
        setError(res.message || 'Failed to add lead');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}
          onPress={e => e.stopPropagation()}
        >
          <Text style={styles.title}>Add Lead</Text>

          {loading ? (
            <ActivityIndicator color={PINK} style={{ marginVertical: 24 }} />
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.filtersRow}>
                <B2BFilterSelect
                  label="Course"
                  value={courseId}
                  options={toOptions(courses)}
                  onChange={setCourseId}
                />
                <B2BFilterSelect
                  label="Center"
                  value={centerId}
                  options={toOptions(centers)}
                  onChange={setCenterId}
                />
                <B2BFilterSelect
                  label="Counselor"
                  value={counselorId}
                  options={toOptions(counselors)}
                  onChange={setCounselorId}
                />
              </View>

              <Text style={styles.label}>Name *</Text>
              <TextInput value={name} onChangeText={setName} style={styles.input} />

              <Text style={styles.label}>Mobile *</Text>
              <TextInput
                value={mobile}
                onChangeText={setMobile}
                style={styles.input}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text style={styles.label}>WhatsApp *</Text>
              <TextInput
                value={whatsapp}
                onChangeText={setWhatsapp}
                style={styles.input}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text style={styles.label}>Gender *</Text>
              <View style={styles.genderRow}>
                {(['Male', 'Female', 'Other'] as const).map(g => (
                  <Pressable
                    key={g}
                    onPress={() => setSex(g)}
                    style={[styles.genderBtn, sex === g && styles.genderBtnActive]}
                  >
                    <Text style={[styles.genderText, sex === g && styles.genderTextActive]}>
                      {g}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>DOB (YYYY-MM-DD) *</Text>
              <TextInput value={dob} onChangeText={setDob} style={styles.input} placeholder="2000-01-15" />

              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Highest Qualification *</Text>
              <TextInput value={qualification} onChangeText={setQualification} style={styles.input} />
            </ScrollView>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={onSave} disabled={saving || loading}>
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveText}>Add Lead</Text>
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
    maxHeight: '92%',
  },
  title: { fontSize: 18, fontWeight: '700', color: college.text, marginBottom: 12 },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
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
  genderRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  genderBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: PINK,
    alignItems: 'center',
  },
  genderBtnActive: { backgroundColor: PINK },
  genderText: { fontWeight: '600', color: PINK, fontSize: 13 },
  genderTextActive: { color: '#fff' },
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
