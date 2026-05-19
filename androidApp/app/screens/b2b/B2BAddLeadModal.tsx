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
  B2BOption,
  createB2BLead,
  fetchB2BLeadCategories,
  fetchB2BTypes,
} from '../../services/b2bApi';
import { college } from '../../theme/college';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

type FormState = {
  leadCategory: string;
  typeOfB2B: string;
  businessName: string;
  concernPersonName: string;
  designation: string;
  mobile: string;
  email: string;
  whatsapp: string;
  city: string;
  state: string;
  address: string;
  remark: string;
};

const EMPTY: FormState = {
  leadCategory: '',
  typeOfB2B: '',
  businessName: '',
  concernPersonName: '',
  designation: '',
  mobile: '',
  email: '',
  whatsapp: '',
  city: '',
  state: '',
  address: '',
  remark: '',
};

function isValidMobile(m: string) {
  return /^[6-9]\d{9}$/.test(m.trim());
}

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

export function B2BAddLeadModal({ visible, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const token = user?.token ?? '';

  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [categories, setCategories] = React.useState<B2BOption[]>([]);
  const [types, setTypes] = React.useState<B2BOption[]>([]);
  const [loadingOpts, setLoadingOpts] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  React.useEffect(() => {
    if (!visible) return;
    setForm(EMPTY);
    setError(null);
    setSaving(false);
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoadingOpts(true);
      try {
        const [catRes, typeRes] = await Promise.all([
          fetchB2BLeadCategories(token),
          fetchB2BTypes(token),
        ]);
        if (cancelled) return;
        if (catRes.ok) setCategories(catRes.items);
        if (typeRes.ok) setTypes(typeRes.items);
      } finally {
        if (!cancelled) setLoadingOpts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, token]);

  const onSave = async () => {
    if (!token) {
      setError('Login required');
      return;
    }
    if (!form.leadCategory) return setError('Lead source select karo');
    if (!form.typeOfB2B) return setError('B2B type select karo');
    if (!form.businessName.trim()) return setError('Business name daalo');
    if (!form.concernPersonName.trim())
      return setError('Concern person ka naam daalo');
    if (!isValidMobile(form.mobile))
      return setError('10-digit valid mobile number daalo');
    if (form.email && !isValidEmail(form.email))
      return setError('Valid email daalo (ya khali chhodo)');
    if (form.whatsapp && !isValidMobile(form.whatsapp))
      return setError('Valid 10-digit WhatsApp number daalo');

    setSaving(true);
    setError(null);
    try {
      const res = await createB2BLead(token, {
        leadCategory: form.leadCategory,
        typeOfB2B: form.typeOfB2B,
        businessName: form.businessName.trim(),
        concernPersonName: form.concernPersonName.trim(),
        mobile: form.mobile.trim(),
        designation: form.designation.trim() || undefined,
        email: form.email.trim() || undefined,
        whatsapp: form.whatsapp.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        address: form.address.trim() || undefined,
        remark: form.remark.trim() || undefined,
      });
      if (res.ok) {
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { paddingBottom: 16 + insets.bottom, paddingTop: 8 + insets.top * 0.2 },
          ]}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Add Lead</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Label text="Lead Source *" />
            <PickerChips
              options={categories}
              value={form.leadCategory}
              onChange={v => set('leadCategory', v)}
              loading={loadingOpts}
            />

            <Label text="Type of B2B *" />
            <PickerChips
              options={types}
              value={form.typeOfB2B}
              onChange={v => set('typeOfB2B', v)}
              loading={loadingOpts}
            />

            <Label text="Business Name *" />
            <TextInput
              value={form.businessName}
              onChangeText={v => set('businessName', v)}
              placeholder="ABC Pvt Ltd"
              placeholderTextColor={college.icon}
              style={styles.input}
            />

            <Row>
              <Field style={{ flex: 1 }}>
                <Label text="Concern Person *" />
                <TextInput
                  value={form.concernPersonName}
                  onChangeText={v => set('concernPersonName', v)}
                  placeholder="Full name"
                  placeholderTextColor={college.icon}
                  style={styles.input}
                />
              </Field>
              <Field style={{ flex: 1 }}>
                <Label text="Designation" />
                <TextInput
                  value={form.designation}
                  onChangeText={v => set('designation', v)}
                  placeholder="HR / Owner"
                  placeholderTextColor={college.icon}
                  style={styles.input}
                />
              </Field>
            </Row>

            <Row>
              <Field style={{ flex: 1 }}>
                <Label text="Mobile *" />
                <TextInput
                  value={form.mobile}
                  onChangeText={v => set('mobile', v.replace(/[^0-9]/g, ''))}
                  placeholder="10-digit"
                  placeholderTextColor={college.icon}
                  style={styles.input}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </Field>
              <Field style={{ flex: 1 }}>
                <Label text="WhatsApp" />
                <TextInput
                  value={form.whatsapp}
                  onChangeText={v => set('whatsapp', v.replace(/[^0-9]/g, ''))}
                  placeholder="10-digit"
                  placeholderTextColor={college.icon}
                  style={styles.input}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </Field>
            </Row>

            <Label text="Email" />
            <TextInput
              value={form.email}
              onChangeText={v => set('email', v)}
              placeholder="name@company.com"
              placeholderTextColor={college.icon}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Row>
              <Field style={{ flex: 1 }}>
                <Label text="City" />
                <TextInput
                  value={form.city}
                  onChangeText={v => set('city', v)}
                  placeholder="Mumbai"
                  placeholderTextColor={college.icon}
                  style={styles.input}
                />
              </Field>
              <Field style={{ flex: 1 }}>
                <Label text="State" />
                <TextInput
                  value={form.state}
                  onChangeText={v => set('state', v)}
                  placeholder="Maharashtra"
                  placeholderTextColor={college.icon}
                  style={styles.input}
                />
              </Field>
            </Row>

            <Label text="Address" />
            <TextInput
              value={form.address}
              onChangeText={v => set('address', v)}
              placeholder="Street / area"
              placeholderTextColor={college.icon}
              style={styles.input}
            />

            <Label text="Remark" />
            <TextInput
              value={form.remark}
              onChangeText={v => set('remark', v)}
              placeholder="Initial notes"
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
                <Text style={styles.btnPrimaryText}>Save Lead</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

function Field({
  style,
  children,
}: {
  style?: object;
  children: React.ReactNode;
}) {
  return <View style={style}>{children}</View>;
}

function PickerChips({
  options,
  value,
  onChange,
  loading,
}: {
  options: B2BOption[];
  value: string;
  onChange: (v: string) => void;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <View style={styles.chipsLoading}>
        <ActivityIndicator color={college.primary} size="small" />
      </View>
    );
  }
  if (!options.length) {
    return <Text style={styles.muted}>No options available</Text>;
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsScroll}
    >
      {options.map(opt => {
        const active = value === opt._id;
        return (
          <Pressable
            key={opt._id}
            onPress={() => onChange(opt._id)}
            style={[styles.pickChip, active && styles.pickChipActive]}
          >
            <Text
              style={[
                styles.pickChipText,
                active && styles.pickChipTextActive,
              ]}
            >
              {opt.name || 'Option'}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '92%',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: '800', color: college.text },
  close: { fontSize: 18, color: college.textMuted, paddingHorizontal: 4 },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: college.textMuted,
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
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
  row: { flexDirection: 'row', gap: 10 },

  chipsScroll: { gap: 6, paddingVertical: 2 },
  chipsLoading: { paddingVertical: 10 },
  pickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: college.border,
    backgroundColor: '#fff',
  },
  pickChipActive: {
    backgroundColor: college.primary,
    borderColor: college.primary,
  },
  pickChipText: { fontSize: 12, color: college.text, fontWeight: '600' },
  pickChipTextActive: { color: '#fff', fontWeight: '700' },
  muted: { color: college.textMuted, fontSize: 12, paddingVertical: 6 },

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
