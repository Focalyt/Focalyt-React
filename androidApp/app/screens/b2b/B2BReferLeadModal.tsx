import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { B2BLead, B2BOption, fetchB2BUsers, referB2BLead } from '../../services/b2bApi';
import { college } from '../../theme/college';

type Props = {
  visible: boolean;
  lead: B2BLead | null;
  onClose: () => void;
  onSaved?: () => void;
};

export function B2BReferLeadModal({
  visible,
  lead,
  onClose,
  onSaved,
}: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const token = user?.token ?? '';

  const [counsellors, setCounsellors] = React.useState<B2BOption[]>([]);
  const [loadingList, setLoadingList] = React.useState(false);
  const [counselorId, setCounselorId] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!visible || !token) return;
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      setError(null);
      setCounselorId('');
      try {
        const res = await fetchB2BUsers(token);
        if (cancelled) return;
        if (res.ok) {
          setCounsellors(res.items);
          if (res.items.length === 0) {
            setError('No counsellors available for B2B refer.');
          }
        } else {
          setError(res.message || 'Failed to load counsellors');
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Network error');
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, token]);

  const submit = async () => {
    if (!lead?._id) return;
    if (!counselorId) {
      Alert.alert('Select counsellor', 'Please choose a counsellor to refer.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await referB2BLead(token, lead._id, counselorId);
      if (res.ok) {
        Alert.alert('Success', res.message || 'Lead referred successfully.');
        onClose();
        onSaved?.();
      } else {
        setError(res.message || 'Failed to refer lead');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const leadLabel =
    lead?.businessName || lead?.concernPersonName || 'Unknown';

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
                Refer Lead {leadLabel} to Counselor
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          {loadingList ? (
            <ActivityIndicator
              color={college.primary}
              style={{ marginVertical: 24 }}
            />
          ) : (
            <>
              <Text style={styles.fieldLabel}>
                Select Counselor<Text style={styles.req}>*</Text>
              </Text>
              <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
                {counsellors.length === 0 ? (
                  <Text style={styles.empty}>No counsellors found.</Text>
                ) : (
                  counsellors.map(c => {
                    const selected = counselorId === c._id;
                    return (
                      <Pressable
                        key={c._id}
                        style={[
                          styles.option,
                          selected && styles.optionSelected,
                        ]}
                        onPress={() => setCounselorId(c._id)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selected && styles.optionTextSelected,
                          ]}
                        >
                          {c.name || '—'}
                        </Text>
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.footer}>
            <Pressable
              style={styles.closeFooterBtn}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.closeFooterText}>CLOSE</Text>
            </Pressable>
            <Pressable
              style={[
                styles.submit,
                (saving || loadingList || !counselorId) && styles.submitDisabled,
              ]}
              onPress={submit}
              disabled={saving || loadingList || !counselorId}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>REFER LEAD</Text>
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
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '78%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  close: {
    fontSize: 22,
    color: '#64748b',
    lineHeight: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  req: {
    color: '#dc2626',
  },
  list: {
    maxHeight: 280,
    marginBottom: 8,
  },
  empty: {
    textAlign: 'center',
    color: '#94a3b8',
    paddingVertical: 20,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  optionSelected: {
    borderColor: college.primary,
    backgroundColor: '#eff6ff',
  },
  optionText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
  },
  optionTextSelected: {
    color: college.primary,
    fontWeight: '800',
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  closeFooterBtn: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  closeFooterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  submit: {
    backgroundColor: college.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    minWidth: 120,
  },
  submitDisabled: {
    opacity: 0.55,
  },
  submitText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.4,
  },
});
