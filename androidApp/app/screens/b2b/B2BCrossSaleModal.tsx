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
  B2BLead,
  B2BOption,
  B2BSubStatus,
  createB2BCrossSale,
  fetchB2BCrossSales,
  fetchB2BDepartments,
  fetchB2BProjects,
  fetchB2BStatuses,
  fetchB2BTypes,
  fetchB2BUsers,
} from '../../services/b2bApi';
import { college } from '../../theme/college';

type Props = {
  visible: boolean;
  lead: B2BLead | null;
  onClose: () => void;
  onSaved?: () => void;
};

type FormState = {
  b2bDepartment: string;
  b2bProject: string;
  typeOfB2B: string;
  leadOwner: string;
  leadStatus: string;
  leadSubStatus: string;
  remark: string;
};

const EMPTY: FormState = {
  b2bDepartment: '',
  b2bProject: '',
  typeOfB2B: '',
  leadOwner: '',
  leadStatus: '',
  leadSubStatus: '',
  remark: '',
};

function pickName(o: { name?: string } | null | undefined) {
  return o?.name || '—';
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

function Chips({
  options,
  value,
  onChange,
  disabled,
  emptyHint,
}: {
  options: B2BOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  emptyHint?: string;
}) {
  if (disabled) {
    return (
      <View style={[styles.chipsWrap, { opacity: 0.6 }]}>
        <Text style={styles.muted}>{emptyHint || 'Select above first'}</Text>
      </View>
    );
  }
  if (!options.length) {
    return (
      <View style={styles.chipsWrap}>
        <Text style={styles.muted}>{emptyHint || 'No options'}</Text>
      </View>
    );
  }
  return (
    <View style={styles.chipsWrap}>
      {options.map(o => {
        const active = value === o._id;
        return (
          <Pressable
            key={o._id}
            onPress={() => onChange(o._id)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {o.name || '—'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function B2BCrossSaleModal({ visible, lead, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const token = user?.token ?? '';

  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [departments, setDepartments] = React.useState<B2BOption[]>([]);
  const [projects, setProjects] = React.useState<B2BOption[]>([]);
  const [types, setTypes] = React.useState<B2BOption[]>([]);
  const [users, setUsers] = React.useState<B2BOption[]>([]);
  const [statuses, setStatuses] = React.useState<B2BFullStatus[]>([]);
  const [groupLeads, setGroupLeads] = React.useState<B2BLead[]>([]);

  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const selectedStatus = React.useMemo(
    () => statuses.find(s => s._id === form.leadStatus),
    [statuses, form.leadStatus],
  );
  const subOptions: B2BSubStatus[] = React.useMemo(
    () => selectedStatus?.substatuses ?? [],
    [selectedStatus],
  );

  const projectOptions = React.useMemo(() => {
    if (!form.b2bDepartment) return projects;
    return projects.filter(
      p => !p.department || String(p.department) === String(form.b2bDepartment),
    );
  }, [projects, form.b2bDepartment]);

  const typeOptions = React.useMemo(() => {
    if (!form.b2bDepartment) return types;
    return types.filter(
      t => !t.department || String(t.department) === String(form.b2bDepartment),
    );
  }, [types, form.b2bDepartment]);

  const refreshGroup = React.useCallback(async () => {
    if (!token || !lead?._id) return;
    const res = await fetchB2BCrossSales(token, lead._id);
    if (res.ok) {
      setGroupLeads(Array.isArray(res.leads) ? res.leads : []);
    }
  }, [token, lead?._id]);

  React.useEffect(() => {
    if (!visible) return;
    setError(null);
    setSaving(false);
    setGroupLeads([]);
    setForm({
      ...EMPTY,
      typeOfB2B: (lead?.typeOfB2B as any)?._id || (lead?.typeOfB2B as any) || '',
      leadOwner: (lead?.leadOwner as any)?._id || '',
    });

    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [
          deptRes,
          projRes,
          typeRes,
          userRes,
          statusRes,
          crossRes,
        ] = await Promise.all([
          fetchB2BDepartments(token),
          fetchB2BProjects(token),
          fetchB2BTypes(token),
          fetchB2BUsers(token),
          fetchB2BStatuses(token),
          lead?._id ? fetchB2BCrossSales(token, lead._id) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        if (deptRes.ok) setDepartments(deptRes.items);
        if (projRes.ok) setProjects(projRes.items);
        if (typeRes.ok) setTypes(typeRes.items);
        if (userRes.ok) setUsers(userRes.items);
        if (statusRes.ok) setStatuses(statusRes.items);
        if (crossRes && crossRes.ok) {
          setGroupLeads(Array.isArray(crossRes.leads) ? crossRes.leads : []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, token, lead?._id]);

  React.useEffect(() => {
    if (!visible || !token || !form.b2bDepartment) return;
    let cancelled = false;
    (async () => {
      const [projRes, typeRes] = await Promise.all([
        fetchB2BProjects(token, form.b2bDepartment),
        fetchB2BTypes(token, form.b2bDepartment),
      ]);
      if (cancelled) return;
      if (projRes.ok) setProjects(projRes.items);
      if (typeRes.ok) setTypes(typeRes.items);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, token, form.b2bDepartment]);

  const onCreate = async () => {
    if (!lead?._id) return;
    if (!token) return setError('Login required');
    if (!form.b2bDepartment) return setError('B2B department select karo');
    if (!form.b2bProject) return setError('B2B project select karo');
    if (!form.typeOfB2B) return setError('B2B type select karo');
    if (!form.leadOwner) return setError('Counsellor select karo');
    if (!form.leadStatus) return setError('Status select karo');
    if (!form.leadSubStatus) return setError('Sub-status select karo');

    setSaving(true);
    setError(null);
    try {
      const res = await createB2BCrossSale(token, lead._id, {
        b2bDepartment: form.b2bDepartment,
        b2bProject: form.b2bProject,
        typeOfB2B: form.typeOfB2B,
        leadOwner: form.leadOwner || undefined,
        status: form.leadStatus || undefined,
        subStatus: form.leadSubStatus || undefined,
        remark: form.remark.trim() || undefined,
      });
      if (res.ok) {
        await refreshGroup();
        onSaved?.();
        onClose();
      } else {
        setError(res.message || 'Failed to create cross-sale');
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
              <Text style={styles.title}>Cross Sale</Text>
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
              <Text style={styles.muted}>Loading…</Text>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {groupLeads.length ? (
                <View style={styles.groupBox}>
                  <Text style={styles.groupTitle}>Existing Projects</Text>
                  {groupLeads.slice(0, 6).map(l => (
                    <View key={l._id} style={styles.groupRow}>
                      <Text style={styles.groupRowText} numberOfLines={1}>
                        {pickName(
                          typeof l.b2bProject === 'object'
                            ? (l.b2bProject as any)
                            : null,
                        )}
                      </Text>
                      <Text style={styles.groupRowSub} numberOfLines={1}>
                        {l.status?.title || l.status?.name || '—'}
                      </Text>
                    </View>
                  ))}
                  {groupLeads.length > 6 ? (
                    <Text style={styles.muted}>
                      +{groupLeads.length - 6} more
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <Label text="B2B Department *" />
              <Chips
                options={departments}
                value={form.b2bDepartment}
                onChange={v =>
                  setForm(prev => ({
                    ...prev,
                    b2bDepartment: v,
                    b2bProject: '',
                    typeOfB2B: '',
                  }))
                }
                emptyHint="No departments — add from web settings"
              />

              <Label text="B2B Project *" />
              <Chips
                options={projectOptions}
                value={form.b2bProject}
                onChange={v => set('b2bProject', v)}
                disabled={!form.b2bDepartment}
                emptyHint={
                  form.b2bDepartment
                    ? 'No projects in this department'
                    : 'Select department first'
                }
              />

              <Label text="B2B Type *" />
              <Chips
                options={typeOptions}
                value={form.typeOfB2B}
                onChange={v => set('typeOfB2B', v)}
                disabled={!form.b2bDepartment}
                emptyHint={
                  form.b2bDepartment
                    ? 'No types in this department'
                    : 'Select department first'
                }
              />

              <Label text="Counsellor *" />
              <Chips
                options={users}
                value={form.leadOwner}
                onChange={v => set('leadOwner', v)}
                emptyHint="No counsellors"
              />

              <Label text="Status *" />
              <View style={styles.chipsWrap}>
                {statuses.map(s => {
                  const active = form.leadStatus === s._id;
                  return (
                    <Pressable
                      key={s._id}
                      onPress={() =>
                        setForm(prev => ({
                          ...prev,
                          leadStatus: s._id,
                          leadSubStatus: '',
                        }))
                      }
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

              {subOptions.length ? (
                <>
                  <Label text="Sub-Status *" />
                  <View style={styles.chipsWrap}>
                    {subOptions.map(s => {
                      const active = form.leadSubStatus === s._id;
                      return (
                        <Pressable
                          key={s._id}
                          onPress={() => set('leadSubStatus', s._id)}
                          style={[styles.subChip, active && styles.subChipActive]}
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

              <Label text="Remark" />
              <TextInput
                value={form.remark}
                onChangeText={t => set('remark', t)}
                placeholder="Optional"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                multiline
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                style={[styles.primaryBtn, saving && { opacity: 0.7 }]}
                disabled={saving}
                onPress={onCreate}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Add Cross Sale</Text>
                )}
              </Pressable>
              <View style={{ height: 16 }} />
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
    maxHeight: '92%',
    minHeight: '45%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: college.border,
    marginBottom: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '800', color: college.text },
  subtitle: { fontSize: 12, color: college.textMuted, marginTop: 2 },
  close: { fontSize: 18, color: college.textMuted, paddingHorizontal: 4 },
  center: { alignItems: 'center', paddingVertical: 18, gap: 8 },
  muted: { color: college.textMuted, fontSize: 12 },
  error: { color: '#ef4444', marginTop: 10, fontWeight: '600' },

  label: {
    marginTop: 12,
    marginBottom: 6,
    color: college.text,
    fontWeight: '700',
    fontSize: 12,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: college.primary,
    borderColor: college.primary,
  },
  chipText: { color: '#0f172a', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  subChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  subChipActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0284c7',
  },
  subChipText: { color: '#0f172a', fontSize: 12, fontWeight: '700' },
  subChipTextActive: { color: '#fff' },

  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 46,
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: college.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800' },

  groupBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#f8fafc',
    marginBottom: 6,
  },
  groupTitle: { fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  groupRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 3 },
  groupRowText: { flex: 1, color: '#0f172a', fontWeight: '700', fontSize: 12 },
  groupRowSub: { color: '#64748b', fontSize: 12, maxWidth: 120 },
});

