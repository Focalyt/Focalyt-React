import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import {
  B2BApprovalCounts,
  B2BApprovalStatus,
  B2BLead,
  B2BStatusCount,
  fetchB2BApprovalCounts,
  fetchB2BLeads,
  fetchB2BStatusCounts,
  getLeadDocumentsBucket,
  getLeadFollowupBucket,
} from '../../services/b2bApi';
import { college } from '../../theme/college';
import { B2BAddLeadModal } from './B2BAddLeadModal';
import { B2BFollowupModal } from './B2BFollowupModal';
import { B2BLeadHistoryModal } from './B2BLeadHistoryModal';
import { B2BStatusChangeModal } from './B2BStatusChangeModal';

function fmtDate(s?: string) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
}

function normalizePhoneDigits(raw: string | number | undefined): string {
  if (raw == null || raw === '') return '';
  let digits = String(raw).replace(/[^\d]/g, '');
  if (digits.length === 10) digits = `91${digits}`;
  else if (digits.length === 11 && digits.startsWith('0')) {
    digits = `91${digits.slice(1)}`;
  }
  return digits;
}

async function dialNumber(raw: string | number | undefined) {
  const digits = normalizePhoneDigits(raw);
  if (!digits) {
    Alert.alert('Invalid number', 'Mobile number missing.');
    return;
  }
  const url = `tel:${digits}`;
  try {
    await Linking.openURL(url);
  } catch (err) {
    Alert.alert(
      'Could not place call',
      err instanceof Error ? err.message : 'Is device par dialer nahi mila.',
    );
  }
}

async function openWhatsApp(raw: string | number | undefined) {
  const digits = normalizePhoneDigits(raw);
  if (!digits) {
    Alert.alert('Invalid number', 'WhatsApp number missing.');
    return;
  }
  const appUrl = `whatsapp://send?phone=${digits}`;
  const webUrl = `https://wa.me/${digits}`;
  try {
    await Linking.openURL(appUrl);
  } catch {
    try {
      await Linking.openURL(webUrl);
    } catch (err) {
      Alert.alert(
        'Could not open WhatsApp',
        err instanceof Error
          ? err.message
          : 'WhatsApp install karo ya number check karo.',
      );
    }
  }
}

function whatsappNumber(lead: B2BLead): string | number | undefined {
  return lead.whatsapp || lead.mobile;
}

const PERF_ORDER = ['HOT', 'WARM', 'COLD', 'PROSPECT'];

function sortPerf(list: B2BStatusCount[]): B2BStatusCount[] {
  const copy = [...list];
  copy.sort((a, b) => {
    const na = (a.statusName || '').toUpperCase();
    const nb = (b.statusName || '').toUpperCase();
    const ia = PERF_ORDER.indexOf(na);
    const ib = PERF_ORDER.indexOf(nb);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return copy;
}

export function B2BSalesTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const token = user?.token ?? '';

  const [search, setSearch] = React.useState('');
  const [appliedSearch, setAppliedSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null);
  const [approvalFilter, setApprovalFilter] =
    React.useState<B2BApprovalStatus | null>(null);

  const [counts, setCounts] = React.useState<{
    total: number;
    list: B2BStatusCount[];
  }>({ total: 0, list: [] });
  const [approvalCounts, setApprovalCounts] = React.useState<B2BApprovalCounts>(
    { total: 0, approved: 0, pending: 0, rejected: 0 },
  );
  const [approvalLoading, setApprovalLoading] = React.useState(false);

  const [leads, setLeads] = React.useState<B2BLead[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [followupLead, setFollowupLead] = React.useState<B2BLead | null>(null);
  const [statusLead, setStatusLead] = React.useState<B2BLead | null>(null);
  const [historyLead, setHistoryLead] = React.useState<B2BLead | null>(null);
  const [showAddLead, setShowAddLead] = React.useState(false);

  const loadCounts = React.useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetchB2BStatusCounts(token);
      if (res.ok) {
        setCounts({ total: res.totalLeads, list: res.statusCounts });
      }
    } catch {
      // silent
    }
  }, [token]);

  const loadApprovalCounts = React.useCallback(
    async (statusOverride?: string | null, searchOverride?: string) => {
      if (!token) return;
      setApprovalLoading(true);
      try {
        const res = await fetchB2BApprovalCounts(token, {
          status: (statusOverride ?? statusFilter) || undefined,
          search: (searchOverride ?? appliedSearch) || undefined,
        });
        if (res.ok) setApprovalCounts(res.counts);
      } finally {
        setApprovalLoading(false);
      }
    },
    [token, statusFilter, appliedSearch],
  );

  const loadLeads = React.useCallback(
    async (
      mode: 'first' | 'refresh' | 'more',
      pageOverride?: number,
      statusOverride?: string | null,
      searchOverride?: string,
      approvalOverride?: B2BApprovalStatus | null,
    ) => {
      if (!token) {
        setError('Login required');
        return;
      }
      const targetPage = pageOverride ?? (mode === 'more' ? page + 1 : 1);
      const status =
        statusOverride !== undefined ? statusOverride : statusFilter;
      const q = searchOverride !== undefined ? searchOverride : appliedSearch;
      const approval =
        approvalOverride !== undefined ? approvalOverride : approvalFilter;

      if (mode === 'first') setLoading(true);
      else if (mode === 'refresh') setRefreshing(true);
      else setLoadingMore(true);

      setError(null);
      try {
        const res = await fetchB2BLeads(token, {
          page: targetPage,
          status: status || undefined,
          search: q || undefined,
          approvalStatus: approval || undefined,
          limit: 20,
        });
        if (res.ok) {
          setTotalPages(res.totalPages);
          setPage(targetPage);
          setLeads(prev =>
            mode === 'more' ? [...prev, ...res.leads] : res.leads,
          );
        } else {
          setError(res.message || 'Failed to load leads');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Network error');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [token, page, statusFilter, appliedSearch, approvalFilter],
  );

  React.useEffect(() => {
    loadCounts();
    loadApprovalCounts(null, '');
    loadLeads('first', 1, null, '', null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onSelectStatus = (id: string | null) => {
    setStatusFilter(id);
    loadLeads('first', 1, id, appliedSearch, approvalFilter);
  };

  const onSelectApproval = (status: B2BApprovalStatus | null) => {
    const next = approvalFilter === status ? null : status;
    setApprovalFilter(next);
    loadLeads('first', 1, statusFilter, appliedSearch, next);
  };

  const onSubmitSearch = () => {
    setAppliedSearch(search);
    loadApprovalCounts(statusFilter, search);
    loadLeads('first', 1, statusFilter, search, approvalFilter);
  };

  const dashboardCounts = React.useMemo(() => {
    const result = {
      call: { done: 0, planned: 0, missed: 0 },
      visit: { done: 0, planned: 0, missed: 0 },
      docs: { done: 0, pending: 0 },
    };
    for (const lead of leads) {
      const cb = getLeadFollowupBucket(lead, 'Call');
      if (cb) result.call[cb] += 1;
      const vb = getLeadFollowupBucket(lead, 'Visit');
      if (vb) result.visit[vb] += 1;
      const db = getLeadDocumentsBucket(lead);
      if (db) result.docs[db] += 1;
    }
    return result;
  }, [leads]);

  const performance = React.useMemo(
    () => sortPerf(counts.list),
    [counts.list],
  );

  const totalAfterFilter = React.useMemo(() => {
    if (!approvalFilter) return counts.total;
    if (approvalFilter === 'APPROVED') return approvalCounts.approved;
    if (approvalFilter === 'PENDING') return approvalCounts.pending;
    if (approvalFilter === 'REJECTED') return approvalCounts.rejected;
    return counts.total;
  }, [approvalFilter, approvalCounts, counts.total]);

  const ListHeader = (
    <View>
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search business / person / mobile"
          placeholderTextColor={college.icon}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={onSubmitSearch}
          returnKeyType="search"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable style={styles.searchBtn} onPress={onSubmitSearch}>
          <Text style={styles.searchBtnText}>Go</Text>
        </Pressable>
      </View>

      <Section label="Lead Approval">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScroll}
        >
          {(
            [
              {
                key: 'total',
                label: 'Total',
                value: approvalCounts.total,
                bg: '#5b4fc9',
                approval: null as B2BApprovalStatus | null,
              },
              {
                key: 'approved',
                label: 'Approved',
                value: approvalCounts.approved,
                bg: '#10b981',
                approval: 'APPROVED' as B2BApprovalStatus,
              },
              {
                key: 'pending',
                label: 'Pending',
                value: approvalCounts.pending,
                bg: '#f59e0b',
                approval: 'PENDING' as B2BApprovalStatus,
              },
              {
                key: 'rejected',
                label: 'Rejected',
                value: approvalCounts.rejected,
                bg: '#ef4444',
                approval: 'REJECTED' as B2BApprovalStatus,
              },
            ] as const
          ).map(row => {
            const selected = approvalFilter === row.approval;
            return (
              <Pressable
                key={row.key}
                onPress={() => onSelectApproval(row.approval)}
                style={[
                  styles.statCard,
                  { backgroundColor: row.bg },
                  selected && styles.statCardSelected,
                  approvalLoading && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.statLabel}>{row.label}</Text>
                <View style={styles.statDivider} />
                <Text style={styles.statValue}>
                  {String(row.value).padStart(2, '0')}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Section>

      <Section label="Performance">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <PerfChip
            label={`All (${counts.total})`}
            active={!statusFilter}
            onPress={() => onSelectStatus(null)}
          />
          {performance.map((s, idx) => {
            const id = s.statusId ? String(s.statusId) : null;
            return (
              <PerfChip
                key={id || `${s.statusName || 'status'}-${idx}`}
                label={`${(s.statusName || 'Status').toUpperCase()} (${
                  s.count ?? 0
                })`}
                active={statusFilter === id}
                onPress={() => onSelectStatus(id)}
              />
            );
          })}
        </ScrollView>
      </Section>

      <Section label="Followup Calling">
        <View style={styles.tripleCards}>
          <SmallStat
            label="Done"
            value={dashboardCounts.call.done}
            bg="#e8a317"
          />
          <SmallStat
            label="Planned"
            value={dashboardCounts.call.planned}
            bg="#e8a317"
          />
          <SmallStat
            label="Missed"
            value={dashboardCounts.call.missed}
            bg="#e8a317"
          />
        </View>
      </Section>

      <Section label="Followup Visit">
        <View style={styles.tripleCards}>
          <SmallStat
            label="Done"
            value={dashboardCounts.visit.done}
            bg="#4b5563"
          />
          <SmallStat
            label="Planned"
            value={dashboardCounts.visit.planned}
            bg="#4b5563"
          />
          <SmallStat
            label="Missed"
            value={dashboardCounts.visit.missed}
            bg="#4b5563"
          />
        </View>
      </Section>

      <Section label="Documents">
        <View style={styles.tripleCards}>
          <SmallStat
            label="Done"
            value={dashboardCounts.docs.done}
            bg="#4b5563"
          />
          <SmallStat
            label="Pending"
            value={dashboardCounts.docs.pending}
            bg="#4b5563"
          />
        </View>
      </Section>

      <View style={styles.listHeaderBar}>
        <Text style={styles.listHeaderTitle}>
          Leads
          {approvalFilter ? ` · ${approvalFilter}` : ''}
        </Text>
        <Text style={styles.listHeaderSub}>{totalAfterFilter} total</Text>
      </View>

      {error ? <Text style={styles.errorBox}>{error}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <>
          {ListHeader}
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={college.primary} />
            <Text style={styles.loadingText}>Loading leads…</Text>
          </View>
        </>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={item => item._id}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 24 + insets.bottom },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                loadCounts();
                loadApprovalCounts();
                loadLeads('refresh', 1);
              }}
              colors={[college.primary]}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (!loadingMore && page < totalPages) {
              loadLeads('more');
            }
          }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <LeadRow
              lead={item}
              onFollowup={() => setFollowupLead(item)}
              onStatusChange={() => setStatusLead(item)}
              onHistory={() => setHistoryLead(item)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyMsg}>No leads found.</Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 12 }}>
                <ActivityIndicator color={college.primary} />
              </View>
            ) : null
          }
        />
      )}

      <B2BFollowupModal
        visible={!!followupLead}
        lead={followupLead}
        onClose={() => setFollowupLead(null)}
        onSaved={() => {
          loadLeads('refresh', 1);
        }}
      />

      <B2BStatusChangeModal
        visible={!!statusLead}
        lead={statusLead}
        onClose={() => setStatusLead(null)}
        onSaved={() => {
          loadCounts();
          loadApprovalCounts();
          loadLeads('refresh', 1);
        }}
      />

      <B2BLeadHistoryModal
        visible={!!historyLead}
        lead={historyLead}
        onClose={() => setHistoryLead(null)}
      />

      <B2BAddLeadModal
        visible={showAddLead}
        onClose={() => setShowAddLead(false)}
        onSaved={() => {
          loadCounts();
          loadApprovalCounts();
          loadLeads('refresh', 1);
        }}
      />

      <Pressable
        onPress={() => setShowAddLead(true)}
        style={[styles.fab, { bottom: 20 + insets.bottom }]}
        accessibilityRole="button"
        accessibilityLabel="Add lead"
      >
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabLabel}>Add Lead</Text>
      </Pressable>
    </View>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function PerfChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.perfChip,
        active ? styles.perfChipActive : styles.perfChipIdle,
      ]}
    >
      <Text
        style={[
          styles.perfChipText,
          active ? styles.perfChipTextActive : styles.perfChipTextIdle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SmallStat({
  label,
  value,
  bg,
}: {
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <View style={[styles.smallStat, { backgroundColor: bg }]}>
      <Text style={styles.smallStatLabel}>{label}</Text>
      <View style={styles.smallStatDivider} />
      <Text style={styles.smallStatValue}>
        {String(value).padStart(2, '0')}
      </Text>
    </View>
  );
}

function LeadRow({
  lead,
  onFollowup,
  onStatusChange,
  onHistory,
}: {
  lead: B2BLead;
  onFollowup: () => void;
  onStatusChange: () => void;
  onHistory: () => void;
}) {
  const statusName =
    lead.status?.title || lead.status?.name || 'Untouch Lead';
  const approval = lead.approval?.status?.toUpperCase();
  const approvalColor =
    approval === 'APPROVED'
      ? '#10b981'
      : approval === 'REJECTED'
        ? '#ef4444'
        : approval === 'PENDING'
          ? '#f59e0b'
          : null;

  const callBucket = getLeadFollowupBucket(lead, 'Call');
  const visitBucket = getLeadFollowupBucket(lead, 'Visit');
  const wa = whatsappNumber(lead);

  return (
    <View style={styles.leadCard}>
      <View style={styles.leadTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.leadTitle}>
            {lead.businessName || lead.concernPersonName || '—'}
          </Text>
          <Text style={styles.leadSub}>
            {lead.concernPersonName || '—'}
            {lead.designation ? ` · ${lead.designation}` : ''}
          </Text>
          {lead.mobile ? (
            <Pressable
              onPress={() => dialNumber(lead.mobile)}
              hitSlop={6}
              style={styles.phoneRow}
              accessibilityRole="button"
              accessibilityLabel={`Call ${lead.mobile}`}
            >
              <Text style={styles.phoneIcon}>📞</Text>
              <Text style={styles.phoneText}>{String(lead.mobile)}</Text>
            </Pressable>
          ) : null}
          {wa ? (
            <Pressable
              onPress={() => openWhatsApp(wa)}
              hitSlop={6}
              style={styles.phoneRow}
              accessibilityRole="button"
              accessibilityLabel={`WhatsApp ${wa}`}
            >
              <Text style={styles.phoneIcon}>💬</Text>
              <Text style={styles.waText}>
                {lead.whatsapp ? String(lead.whatsapp) : String(lead.mobile)}
              </Text>
            </Pressable>
          ) : null}
          {lead.email ? (
            <Text style={styles.leadMeta}>✉ {lead.email}</Text>
          ) : null}
          {lead.leadCategory?.name ? (
            <Text style={styles.leadMeta}>{lead.leadCategory.name}</Text>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Pressable onPress={onStatusChange} style={styles.statusBadge}>
            <Text style={styles.statusBadgeText} numberOfLines={1}>
              {statusName}
            </Text>
            <Text style={styles.statusBadgeCaret}> ▾</Text>
          </Pressable>
          {approvalColor ? (
            <View
              style={[styles.approvalBadge, { backgroundColor: approvalColor }]}
            >
              <Text style={styles.approvalBadgeText}>{approval}</Text>
            </View>
          ) : null}
          <Text style={styles.leadDate}>{fmtDate(lead.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.leadBottomRow}>
        <View style={styles.followupPills}>
          <FollowupPill type="Call" bucket={callBucket} />
          <FollowupPill type="Visit" bucket={visitBucket} />
        </View>
      </View>

      <View style={styles.actionBtns}>
        {lead.mobile ? (
          <Pressable
            onPress={() => dialNumber(lead.mobile)}
            style={styles.callBtn}
            accessibilityRole="button"
            accessibilityLabel={`Call ${lead.mobile}`}
          >
            <Text style={styles.callBtnText}>📞 Call</Text>
          </Pressable>
        ) : null}
        {wa ? (
          <Pressable
            onPress={() => openWhatsApp(wa)}
            style={styles.waBtn}
            accessibilityRole="button"
            accessibilityLabel={`WhatsApp ${wa}`}
          >
            <Text style={styles.waBtnText}>WhatsApp</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onHistory} style={styles.ghostBtn}>
          <Text style={styles.ghostBtnText}>History</Text>
        </Pressable>
        <Pressable onPress={onStatusChange} style={styles.ghostBtn}>
          <Text style={styles.ghostBtnText}>Status</Text>
        </Pressable>
        <Pressable onPress={onFollowup} style={styles.followupBtn}>
          <Text style={styles.followupBtnText}>+ Follow-up</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FollowupPill({
  type,
  bucket,
}: {
  type: 'Call' | 'Visit';
  bucket: 'done' | 'planned' | 'missed' | null;
}) {
  if (!bucket) {
    return (
      <View style={[styles.fuPill, styles.fuPillIdle]}>
        <Text style={styles.fuPillText}>{type}: —</Text>
      </View>
    );
  }
  const color =
    bucket === 'done'
      ? '#10b981'
      : bucket === 'planned'
        ? '#3b82f6'
        : '#ef4444';
  return (
    <View style={[styles.fuPill, { borderColor: color }]}>
      <View style={[styles.fuPillDot, { backgroundColor: color }]} />
      <Text style={[styles.fuPillText, { color }]}>
        {type}: {bucket}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: college.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: college.text,
  },
  searchBtn: {
    backgroundColor: college.primary,
    paddingHorizontal: 14,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  section: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 7,
    paddingTop: 14,
    paddingBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#fff',
    position: 'relative',
  },
  sectionLabel: {
    position: 'absolute',
    top: -9,
    left: 10,
    paddingHorizontal: 6,
    backgroundColor: '#fff',
    fontSize: 11,
    fontWeight: '700',
    color: college.textMuted,
    letterSpacing: 0.3,
  },

  hScroll: { gap: 8, paddingVertical: 2 },
  statCard: {
    width: 92,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  statCardSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  statLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statDivider: {
    height: 1,
    width: '70%',
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginVertical: 4,
  },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '800' },

  chipsRow: { gap: 6, paddingVertical: 2, alignItems: 'center' },
  perfChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  perfChipActive: { backgroundColor: 'rgb(250, 85, 121)' },
  perfChipIdle: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: 'rgb(250, 85, 121)',
  },
  perfChipText: { fontSize: 12, fontWeight: '700' },
  perfChipTextActive: { color: '#fff' },
  perfChipTextIdle: { color: 'rgb(250, 85, 121)' },

  tripleCards: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  smallStat: {
    flexGrow: 1,
    flexBasis: 56,
    minHeight: 56,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallStatLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  smallStatDivider: {
    height: 1,
    width: '70%',
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginVertical: 3,
  },
  smallStatValue: { color: '#fff', fontSize: 14, fontWeight: '800' },

  listHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  listHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: college.text,
  },
  listHeaderSub: { fontSize: 11, color: college.textMuted },

  loadingWrap: { paddingVertical: 30, alignItems: 'center' },
  loadingText: { marginTop: 8, color: college.textMuted },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  leadCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    elevation: 1,
    marginHorizontal: 0,
  },
  leadTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  leadBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
    gap: 8,
  },
  followupPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  fuPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  fuPillIdle: { borderColor: college.border },
  fuPillDot: { width: 6, height: 6, borderRadius: 3 },
  fuPillText: { fontSize: 10, fontWeight: '700', color: college.textMuted },
  followupBtn: {
    backgroundColor: college.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  followupBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  leadTitle: { fontSize: 14, fontWeight: '700', color: college.text },
  leadSub: { fontSize: 12, color: college.textMuted, marginTop: 2 },
  leadMeta: { fontSize: 11, color: college.textMuted, marginTop: 2 },
  leadDate: { fontSize: 11, color: college.textMuted, marginTop: 4 },
  statusBadge: {
    backgroundColor: college.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadgeCaret: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  actionBtns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  callBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#10b981',
  },
  callBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  phoneIcon: { fontSize: 11 },
  phoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    textDecorationLine: 'underline',
  },
  waText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#25D366',
    textDecorationLine: 'underline',
  },
  waBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#25D366',
  },
  waBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  ghostBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: college.primary,
    backgroundColor: '#fff',
  },
  ghostBtnText: {
    color: college.primary,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  approvalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: 4,
  },
  approvalBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: 8,
    borderRadius: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    fontSize: 12,
  },
  emptyMsg: {
    color: college.textMuted,
    fontSize: 13,
    paddingVertical: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    height: 52,
    paddingLeft: 14,
    paddingRight: 20,
    borderRadius: 26,
    backgroundColor: college.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 26,
    marginTop: -2,
  },
  fabLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
