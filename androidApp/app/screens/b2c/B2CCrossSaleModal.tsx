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
  B2COption,
  B2CProfile,
  B2CSubStatus,
  createB2CCrossSale,
  fetchB2CAllCourses,
  fetchB2CCourseCenters,
  fetchB2CCrossSales,
  fetchB2CFilterOptions,
  fetchB2CStatuses,
  getProfileGroupRootId,
} from '../../services/b2cApi';
import { B2BFilterSelect } from '../b2b/B2BFilterSelect';

const PINK = '#fc567b';

type Props = {
  visible: boolean;
  profile: B2CProfile | null;
  groupProfiles?: B2CProfile[];
  onClose: () => void;
  onSaved?: (newProfile: B2CProfile, rootId: string) => void;
};

type FormState = {
  course: string;
  center: string;
  counsellor: string;
  leadStatus: string;
  leadSubStatus: string;
  remark: string;
};

const EMPTY: FormState = {
  course: '',
  center: '',
  counsellor: '',
  leadStatus: '',
  leadSubStatus: '',
  remark: '',
};

function toOptions(items: B2COption[]) {
  return items.map(i => ({ value: i._id, label: i.name || '—' }));
}

function courseName(p: B2CProfile): string {
  const n = p._course?.name;
  return typeof n === 'string' && n.trim() ? n.trim() : 'Course';
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

export function B2CCrossSaleModal({
  visible,
  profile,
  groupProfiles,
  onClose,
  onSaved,
}: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const token = user?.token ?? '';
  const userId = user?._id ?? '';

  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [allCourses, setAllCourses] = React.useState<B2COption[]>([]);
  const [centers, setCenters] = React.useState<B2COption[]>([]);
  const [counselors, setCounselors] = React.useState<B2COption[]>([]);
  const [statuses, setStatuses] = React.useState<B2CFullStatus[]>([]);
  const [groupLeads, setGroupLeads] = React.useState<B2CProfile[]>([]);

  const [loading, setLoading] = React.useState(false);
  const [centersLoading, setCentersLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const takenCourseIds = React.useMemo(() => {
    const leads = groupLeads.length
      ? groupLeads
      : groupProfiles?.length
        ? groupProfiles
        : profile
          ? [profile]
          : [];
    return new Set(
      leads
        .map(l => String(l._course?._id || l._course || ''))
        .filter(Boolean),
    );
  }, [groupLeads, groupProfiles, profile]);

  const courseOptions = React.useMemo(
    () => allCourses.filter(c => !takenCourseIds.has(String(c._id))),
    [allCourses, takenCourseIds],
  );

  const selectedStatus = React.useMemo(
    () => statuses.find(s => s._id === form.leadStatus),
    [statuses, form.leadStatus],
  );
  const subOptions: B2CSubStatus[] = React.useMemo(
    () => selectedStatus?.substatuses ?? [],
    [selectedStatus],
  );

  const counselorOptions = React.useMemo(() => {
    const base = toOptions(counselors);
    if (userId && !base.some(o => o.value === userId)) {
      return [{ value: userId, label: user?.name || 'Me' }, ...base];
    }
    return base;
  }, [counselors, userId, user?.name]);

  React.useEffect(() => {
    if (!visible) return;
    setError(null);
    setSaving(false);
    setCenters([]);
    setGroupLeads([]);
    setForm({
      ...EMPTY,
      counsellor: userId || '',
    });

    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [filterRes, coursesRes, statusRes, crossRes] = await Promise.all([
          fetchB2CFilterOptions(token),
          fetchB2CAllCourses(token),
          fetchB2CStatuses(token),
          profile?._id
            ? fetchB2CCrossSales(token, profile._id)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        if (filterRes.ok) setCounselors(filterRes.counselors);
        if (coursesRes.ok && coursesRes.items.length) {
          setAllCourses(coursesRes.items);
        } else if (filterRes.ok) {
          setAllCourses(filterRes.courses);
        }
        if (statusRes.ok) setStatuses(statusRes.items);
        if (crossRes?.ok) {
          setGroupLeads(Array.isArray(crossRes.leads) ? crossRes.leads : []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, token, profile?._id, userId]);

  React.useEffect(() => {
    if (!visible || !token || !form.course) {
      setCenters([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setCentersLoading(true);
      try {
        const res = await fetchB2CCourseCenters(token, form.course);
        if (!cancelled && res.ok) setCenters(res.items);
      } finally {
        if (!cancelled) setCentersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, token, form.course]);

  const onCreate = async () => {
    if (!profile?._id) return;
    if (!token) return setError('Login required');
    if (!form.course) return setError('Course select karo');
    if (!form.center) return setError('Center select karo');
    if (!form.counsellor) return setError('Counsellor select karo');
    if (!form.leadStatus) return setError('Lead status select karo');
    if (!form.leadSubStatus) return setError('Sub-status select karo');

    setSaving(true);
    setError(null);
    try {
      const res = await createB2CCrossSale(token, profile._id, {
        course: form.course,
        center: form.center,
        leadStatus: form.leadStatus,
        leadSubStatus: form.leadSubStatus,
        counsellor: form.counsellor,
        remark: form.remark.trim() || undefined,
      });
      if (res.ok && res.profile) {
        const rootId = getProfileGroupRootId(profile);
        onSaved?.(res.profile, rootId);
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

  const candidateName = profile?._candidate?.name || 'Candidate';

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
              <Text style={styles.subtitle} numberOfLines={1}>
                {candidateName}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={PINK} />
              <Text style={styles.muted}>Loading…</Text>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.hint}>
                Same candidate will be registered for another course. Status,
                follow-ups, and counsellor stay separate per course.
              </Text>

              {groupLeads.length ? (
                <View style={styles.groupBox}>
                  <Text style={styles.groupTitle}>Existing Courses</Text>
                  {groupLeads.slice(0, 6).map(l => (
                    <View key={l._id} style={styles.groupRow}>
                      <Text style={styles.groupRowText} numberOfLines={1}>
                        {courseName(l)}
                      </Text>
                      <Text style={styles.groupRowSub} numberOfLines={1}>
                        {l._leadStatus?.title || '—'}
                      </Text>
                    </View>
                  ))}
                  {groupLeads.length > 6 ? (
                    <Text style={styles.muted}>+{groupLeads.length - 6} more</Text>
                  ) : null}
                </View>
              ) : null}

              <B2BFilterSelect
                label="Course *"
                value={form.course}
                options={toOptions(courseOptions)}
                onChange={v => {
                  setForm(prev => ({ ...prev, course: v, center: '' }));
                }}
                placeholder="Select course"
              />

              <B2BFilterSelect
                label="Center *"
                value={form.center}
                options={toOptions(centers)}
                onChange={v => set('center', v)}
                disabled={!form.course || centersLoading}
                placeholder={
                  centersLoading
                    ? 'Loading centers…'
                    : !form.course
                      ? 'Select course first'
                      : centers.length
                        ? 'Select center'
                        : 'No center for this course'
                }
              />

              <B2BFilterSelect
                label="Counsellor *"
                value={form.counsellor}
                options={counselorOptions}
                onChange={v => set('counsellor', v)}
                placeholder="Select counsellor"
              />

              <Label text="Lead Status *" />
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
                        style={[styles.chipText, active && styles.chipTextActive]}
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
    backgroundColor: '#e2e8f0',
    marginBottom: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  close: { fontSize: 18, color: '#64748b', paddingHorizontal: 4 },
  center: { alignItems: 'center', paddingVertical: 18, gap: 8 },
  muted: { color: '#64748b', fontSize: 12 },
  hint: { color: '#64748b', fontSize: 12, marginBottom: 10, lineHeight: 18 },
  error: { color: '#ef4444', marginTop: 10, fontWeight: '600' },

  label: {
    marginTop: 12,
    marginBottom: 6,
    color: '#0f172a',
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
    backgroundColor: PINK,
    borderColor: PINK,
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
    backgroundColor: PINK,
    borderColor: PINK,
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
    backgroundColor: PINK,
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
    backgroundColor: '#fff9fb',
    marginBottom: 6,
  },
  groupTitle: { fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  groupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 3,
  },
  groupRowText: { flex: 1, color: '#0f172a', fontWeight: '700', fontSize: 12 },
  groupRowSub: { color: '#64748b', fontSize: 12, maxWidth: 120 },
});
