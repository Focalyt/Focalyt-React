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
  B2BFollowupBucket,
  B2BFollowupDashboardCounts,
  B2BLead,
  B2BStatusCount,
  fetchB2BApprovalCounts,
  fetchB2BLeads,
  fetchB2BStatusCounts,
  getLeadDocumentsBucket,
} from '../../services/b2bApi';
import { college } from '../../theme/college';
import { B2BAddLeadModal } from './B2BAddLeadModal';
import {
  B2BCycleFilters,
  B2BCycleFiltersState,
  EMPTY_CYCLE_FILTERS,
} from './B2BCycleFilters';
import { B2BLeadCard } from './B2BLeadCard';
import { B2BFollowupModal } from './B2BFollowupModal';
import { B2BLeadDocumentsModal } from './B2BLeadDocumentsModal';
import { B2BLeadHistoryModal } from './B2BLeadHistoryModal';
import { B2BInstituteWebModal } from './B2BInstituteWebModal';
import { B2BReferLeadModal } from './B2BReferLeadModal';
import { B2BStatusChangeModal } from './B2BStatusChangeModal';
import { B2BCrossSaleModal } from './B2BCrossSaleModal';
import { b2bLrpAddUrl, b2bLrpViewUrl } from '../../services/collegeApi';

function getLeadGroupRootId(lead: B2BLead): string {
  return String(lead.crossSaleRootId || lead.parentLeadId || lead._id || '');
}

function phoneDigitsOnly(raw: string | number | undefined): string {
  if (raw == null || raw === '') return '';
  return String(raw).replace(/[^\d]/g, '');
}

/** Dialer: 10-digit local number (no 91 prefix). */
function normalizeDialNumber(raw: string | number | undefined): string {
  let digits = phoneDigitsOnly(raw);
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

/** WhatsApp requires country code without + */
function normalizeWhatsAppNumber(raw: string | number | undefined): string {
  let digits = phoneDigitsOnly(raw);
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  return digits;
}

async function dialNumber(raw: string | number | undefined) {
  const digits = normalizeDialNumber(raw);
  if (digits.length < 10) {
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
  const digits = normalizeWhatsAppNumber(raw);
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

const PERF_ORDER = ['HOT', 'WARM', 'COLD', 'PROSPECT'];

function isCycleFiltersActive(c: B2BCycleFiltersState): boolean {
  return !!(
    c.b2bDepartment ||
    c.b2bProject ||
    c.typeOfB2B ||
    c.leadOwner
  );
}

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
  const [cycleFilters, setCycleFilters] =
    React.useState<B2BCycleFiltersState>(EMPTY_CYCLE_FILTERS);
  const [followUpCallBucket, setFollowUpCallBucket] = React.useState<
    B2BFollowupBucket | ''
  >('');
  const [followUpVisitBucket, setFollowUpVisitBucket] = React.useState<
    B2BFollowupBucket | ''
  >('');
  const [followupDashboardCounts, setFollowupDashboardCounts] =
    React.useState<B2BFollowupDashboardCounts>({
      call: { done: 0, planned: 0, missed: 0 },
      visit: { done: 0, planned: 0, missed: 0 },
    });

  const cycleListParams = React.useCallback(
    (
      status?: string | null,
      search?: string,
      approval?: B2BApprovalStatus | null,
      cycle?: B2BCycleFiltersState,
      followup?: {
        followUpCallBucket?: B2BFollowupBucket | '';
        followUpVisitBucket?: B2BFollowupBucket | '';
      },
    ) => {
      const c = cycle ?? cycleFilters;
      const f = followup ?? {
        followUpCallBucket,
        followUpVisitBucket,
      };
      return {
        b2bDepartment: c.b2bDepartment || undefined,
        b2bProject: c.b2bProject || undefined,
        typeOfB2B: c.typeOfB2B || undefined,
        leadOwner: c.leadOwner || undefined,
        search: search || undefined,
        status: status || undefined,
        approvalStatus: approval || undefined,
        followUpCallBucket: f.followUpCallBucket || undefined,
        followUpVisitBucket: f.followUpVisitBucket || undefined,
      };
    },
    [cycleFilters, followUpCallBucket, followUpVisitBucket],
  );

  const [counts, setCounts] = React.useState<{
    total: number;
    list: B2BStatusCount[];
  }>({ total: 0, list: [] });
  const [approvalCounts, setApprovalCounts] = React.useState<B2BApprovalCounts>(
    { total: 0, approved: 0, pending: 0, rejected: 0 },
  );
  const [approvalLoading, setApprovalLoading] = React.useState(false);

  const [leads, setLeads] = React.useState<B2BLead[]>([]);
  const [crossSaleCache, setCrossSaleCache] = React.useState<
    Record<string, B2BLead[]>
  >({});
  const [activeProjectByGroup, setActiveProjectByGroup] = React.useState<
    Record<string, string>
  >({});
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [followupLead, setFollowupLead] = React.useState<B2BLead | null>(null);
  const [followupType, setFollowupType] =
    React.useState<'Call' | 'Visit'>('Call');
  const [statusLead, setStatusLead] = React.useState<B2BLead | null>(null);
  const [historyLead, setHistoryLead] = React.useState<B2BLead | null>(null);
  const [crossSaleLead, setCrossSaleLead] = React.useState<B2BLead | null>(null);
  const [documentsLead, setDocumentsLead] = React.useState<B2BLead | null>(null);
  const [referLead, setReferLead] = React.useState<B2BLead | null>(null);
  const [instituteWeb, setInstituteWeb] = React.useState<{
    title: string;
    url: string | null;
  } | null>(null);
  const [showAddLead, setShowAddLead] = React.useState(false);

  const leadDisplayGroups = React.useMemo(() => {
    const byRoot = new Map<string, B2BLead[]>();
    for (const l of leads) {
      const rootId = getLeadGroupRootId(l);
      const arr = byRoot.get(rootId) || [];
      arr.push(l);
      byRoot.set(rootId, arr);
    }
    return Array.from(byRoot.entries()).map(([rootId, members]) => {
      const cached = crossSaleCache[rootId];
      const merged = cached?.length ? cached : members;
      const unique = [
        ...new Map(merged.map(m => [String(m._id), m])).values(),
      ];
      const sorted = unique.sort((a, b) => {
        const aPrimary = !a.parentLeadId;
        const bPrimary = !b.parentLeadId;
        if (aPrimary !== bPrimary) return aPrimary ? -1 : 1;
        return (
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
      });
      return { rootId, leads: sorted };
    });
  }, [leads, crossSaleCache]);

  const loadCounts = React.useCallback(
    async (
      cycleOverride?: B2BCycleFiltersState,
      followupOverride?: {
        followUpCallBucket?: B2BFollowupBucket | '';
        followUpVisitBucket?: B2BFollowupBucket | '';
      },
    ) => {
      if (!token) return;
      try {
        const res = await fetchB2BStatusCounts(
          token,
          cycleListParams(
            statusFilter,
            appliedSearch,
            approvalFilter,
            cycleOverride,
            followupOverride,
          ),
        );
        if (res.ok) {
          setCounts({ total: res.totalLeads, list: res.statusCounts });
          setFollowupDashboardCounts(res.followupDashboardCounts);
        }
      } catch {
        // silent
      }
    },
    [token, cycleListParams, statusFilter, appliedSearch, approvalFilter],
  );

  const loadApprovalCounts = React.useCallback(
    async (
      statusOverride?: string | null,
      searchOverride?: string,
      cycleOverride?: B2BCycleFiltersState,
      followupOverride?: {
        followUpCallBucket?: B2BFollowupBucket | '';
        followUpVisitBucket?: B2BFollowupBucket | '';
      },
    ) => {
      if (!token) return;
      setApprovalLoading(true);
      try {
        const res = await fetchB2BApprovalCounts(
          token,
          cycleListParams(
            statusOverride ?? statusFilter,
            searchOverride ?? appliedSearch,
            approvalFilter,
            cycleOverride,
            followupOverride,
          ),
        );
        if (res.ok) setApprovalCounts(res.counts);
      } finally {
        setApprovalLoading(false);
      }
    },
    [token, statusFilter, appliedSearch, approvalFilter, cycleListParams],
  );

  const loadLeads = React.useCallback(
    async (
      mode: 'first' | 'refresh' | 'more',
      pageOverride?: number,
      statusOverride?: string | null,
      searchOverride?: string,
      approvalOverride?: B2BApprovalStatus | null,
      cycleOverride?: B2BCycleFiltersState,
      followupOverride?: {
        followUpCallBucket?: B2BFollowupBucket | '';
        followUpVisitBucket?: B2BFollowupBucket | '';
      },
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
      const cycle = cycleOverride ?? cycleFilters;
      const listParams = cycleListParams(
        status,
        q,
        approval,
        cycle,
        followupOverride,
      );

      if (mode === 'first') setLoading(true);
      else if (mode === 'refresh') setRefreshing(true);
      else setLoadingMore(true);

      setError(null);
      try {
        const res = await fetchB2BLeads(token, {
          page: targetPage,
          limit: 20,
          ...listParams,
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
    [token, page, statusFilter, appliedSearch, approvalFilter, cycleFilters, cycleListParams],
  );

  const reloadWithFilters = React.useCallback(
    (
      status: string | null,
      search: string,
      approval: B2BApprovalStatus | null,
      cycle: B2BCycleFiltersState,
      followup: {
        followUpCallBucket: B2BFollowupBucket | '';
        followUpVisitBucket: B2BFollowupBucket | '';
      },
    ) => {
      loadCounts(cycle, followup);
      loadApprovalCounts(status, search, cycle, followup);
      loadLeads('first', 1, status, search, approval, cycle, followup);
    },
    [loadCounts, loadApprovalCounts, loadLeads],
  );

  const onCycleFiltersChange = (next: B2BCycleFiltersState) => {
    setCycleFilters(next);
    reloadWithFilters(statusFilter, appliedSearch, approvalFilter, next, {
      followUpCallBucket,
      followUpVisitBucket,
    });
  };

  const onFollowupDashClick = (
    type: 'Call' | 'Visit',
    bucket: B2BFollowupBucket,
  ) => {
    const isVisit = type === 'Visit';
    const current = isVisit ? followUpVisitBucket : followUpCallBucket;
    const togglingOff = current === bucket;

    let nextCall = followUpCallBucket;
    let nextVisit = followUpVisitBucket;
    if (isVisit) {
      nextVisit = togglingOff ? '' : bucket;
      if (!togglingOff) nextCall = '';
    } else {
      nextCall = togglingOff ? '' : bucket;
      if (!togglingOff) nextVisit = '';
    }

    setFollowUpCallBucket(nextCall);
    setFollowUpVisitBucket(nextVisit);

    const nextStatus = togglingOff ? statusFilter : null;
    const nextApproval = togglingOff ? approvalFilter : null;
    if (!togglingOff) {
      setStatusFilter(null);
      setApprovalFilter(null);
    }
    reloadWithFilters(nextStatus, appliedSearch, nextApproval, cycleFilters, {
      followUpCallBucket: nextCall,
      followUpVisitBucket: nextVisit,
    });
  };

  React.useEffect(() => {
    loadCounts();
    loadApprovalCounts(null, '');
    loadLeads('first', 1, null, '', null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onSelectStatus = (id: string | null) => {
    setStatusFilter(id);
    loadLeads('first', 1, id, appliedSearch, approvalFilter, cycleFilters, {
      followUpCallBucket,
      followUpVisitBucket,
    });
  };

  const onSelectApproval = (status: B2BApprovalStatus | null) => {
    const next = approvalFilter === status ? null : status;
    setApprovalFilter(next);
    loadLeads('first', 1, statusFilter, appliedSearch, next, cycleFilters, {
      followUpCallBucket,
      followUpVisitBucket,
    });
  };

  const onSubmitSearch = () => {
    setAppliedSearch(search);
    loadApprovalCounts(statusFilter, search, cycleFilters, {
      followUpCallBucket,
      followUpVisitBucket,
    });
    loadLeads('first', 1, statusFilter, search, approvalFilter, cycleFilters, {
      followUpCallBucket,
      followUpVisitBucket,
    });
  };

  const hasAnyActiveFilters = React.useMemo(
    () =>
      !!appliedSearch ||
      !!statusFilter ||
      !!approvalFilter ||
      !!followUpCallBucket ||
      !!followUpVisitBucket ||
      isCycleFiltersActive(cycleFilters),
    [
      appliedSearch,
      statusFilter,
      approvalFilter,
      followUpCallBucket,
      followUpVisitBucket,
      cycleFilters,
    ],
  );

  const activeStatusName = React.useMemo(() => {
    if (!statusFilter) return null;
    const found = counts.list.find(
      s => s.statusId && String(s.statusId) === String(statusFilter),
    );
    return found?.statusName || 'Selected';
  }, [statusFilter, counts.list]);

  const showAllLeads = () => {
    const clearedCycle = { ...EMPTY_CYCLE_FILTERS };
    const clearedFollowup = {
      followUpCallBucket: '' as const,
      followUpVisitBucket: '' as const,
    };
    setSearch('');
    setAppliedSearch('');
    setStatusFilter(null);
    setApprovalFilter(null);
    setCycleFilters(clearedCycle);
    setFollowUpCallBucket('');
    setFollowUpVisitBucket('');
    reloadWithFilters(null, '', null, clearedCycle, clearedFollowup);
  };

  const dashboardCounts = React.useMemo(() => {
    const docs = { done: 0, pending: 0 };
    for (const lead of leads) {
      const db = getLeadDocumentsBucket(lead);
      if (db) docs[db] += 1;
    }
    return {
      call: followupDashboardCounts.call,
      visit: followupDashboardCounts.visit,
      docs,
    };
  }, [leads, followupDashboardCounts]);

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

      <B2BCycleFilters
        token={token}
        value={cycleFilters}
        onChange={onCycleFiltersChange}
      />

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
          {(
            [
              { bucket: 'done' as const, label: 'Done' },
              { bucket: 'planned' as const, label: 'Planned' },
              { bucket: 'missed' as const, label: 'Missed' },
            ] as const
          ).map(row => (
            <SmallStat
              key={row.bucket}
              label={row.label}
              value={dashboardCounts.call[row.bucket]}
              bg="#12b3ff"
              selected={followUpCallBucket === row.bucket}
              onPress={() => onFollowupDashClick('Call', row.bucket)}
            />
          ))}
        </View>
      </Section>

      <Section label="Followup Visit">
        <View style={styles.tripleCards}>
          {(
            [
              { bucket: 'done' as const, label: 'Done' },
              { bucket: 'planned' as const, label: 'Planned' },
              { bucket: 'missed' as const, label: 'Missed' },
            ] as const
          ).map(row => (
            <SmallStat
              key={row.bucket}
              label={row.label}
              value={dashboardCounts.visit[row.bucket]}
              bg="#4b5563"
              selected={followUpVisitBucket === row.bucket}
              onPress={() => onFollowupDashClick('Visit', row.bucket)}
            />
          ))}
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

      {hasAnyActiveFilters ? (
        <View style={styles.filtersActiveBar}>
          <Text style={styles.filtersActiveLabel}>Filters active</Text>
          <View style={styles.filtersActiveBadges}>
            {appliedSearch ? (
              <Text style={styles.filterBadge}>Search: {appliedSearch}</Text>
            ) : null}
            {isCycleFiltersActive(cycleFilters) ? (
              <Text style={styles.filterBadge}>Cycle filters</Text>
            ) : null}
            {followUpCallBucket ? (
              <Text style={styles.filterBadge}>
                Call: {followUpCallBucket}
              </Text>
            ) : null}
            {followUpVisitBucket ? (
              <Text style={styles.filterBadge}>
                Visit: {followUpVisitBucket}
              </Text>
            ) : null}
            {statusFilter ? (
              <Text style={styles.filterBadge}>
                Status: {activeStatusName}
              </Text>
            ) : null}
            {approvalFilter ? (
              <Text style={styles.filterBadge}>
                Approval: {approvalFilter}
              </Text>
            ) : null}
          </View>
          <Pressable style={styles.showAllBtn} onPress={showAllLeads}>
            <Text style={styles.showAllBtnText}>Show all leads</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.listHeaderBar}>
        <Text style={styles.listHeaderTitle}>
          Leads
          {approvalFilter ? ` · ${approvalFilter}` : ''}
          {followUpCallBucket
            ? ` · Call: ${followUpCallBucket}`
            : followUpVisitBucket
              ? ` · Visit: ${followUpVisitBucket}`
              : ''}
        </Text>
        <Text style={styles.listHeaderSub}>{totalAfterFilter} total</Text>
      </View>

      {error ? <Text style={styles.errorBox}>{error}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.screenPad}>
          {ListHeader}
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={college.primary} />
            <Text style={styles.loadingText}>Loading leads…</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={leadDisplayGroups}
          keyExtractor={g => g.rootId}
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
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item: group }) => {
            const activeId = activeProjectByGroup[group.rootId];
            const activeLead =
              group.leads.find(l => String(l._id) === String(activeId)) ||
              group.leads.find(l => !l.parentLeadId) ||
              group.leads[0];
            const activeLeadId = activeLead?._id;

            return (
              <View style={styles.groupWrap}>
                {activeLead ? (
                  <B2BLeadCard
                    lead={activeLead}
                    groupLeads={group.leads}
                    onSelectGroupLead={leadId =>
                      setActiveProjectByGroup(prev => ({
                        ...prev,
                        [group.rootId]: leadId,
                      }))
                    }
              onDial={dialNumber}
              onWhatsApp={openWhatsApp}
              onFollowup={type => {
                setFollowupType(type);
                setFollowupLead(activeLead);
              }}
              onStatusChange={() => setStatusLead(activeLead)}
              onHistory={() => setHistoryLead(activeLead)}
              onCrossSale={() => setCrossSaleLead(activeLead)}
              onDocuments={() => setDocumentsLead(activeLead)}
              onReferLead={() => setReferLead(activeLead)}
              onAddReport={() =>
                setInstituteWeb({
                  title: 'Add Lead Report',
                  url: b2bLrpAddUrl(activeLeadId),
                })
              }
              onViewReport={() =>
                setInstituteWeb({
                  title: 'View Lead Report',
                  url: b2bLrpViewUrl(activeLeadId),
                })
              }
                  />
                ) : null}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyMsg}>
                {hasAnyActiveFilters
                  ? 'No leads match your filters.'
                  : 'No leads found.'}
              </Text>
              {hasAnyActiveFilters ? (
                <Pressable style={styles.showAllBtn} onPress={showAllLeads}>
                  <Text style={styles.showAllBtnText}>Show all leads</Text>
                </Pressable>
              ) : null}
            </View>
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
        initialType={followupType}
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

      <B2BCrossSaleModal
        visible={!!crossSaleLead}
        lead={crossSaleLead}
        onClose={() => setCrossSaleLead(null)}
        onSaved={() => {
          loadCounts();
          loadApprovalCounts();
          loadLeads('refresh', 1);
        }}
      />

      <B2BLeadDocumentsModal
        visible={!!documentsLead}
        lead={documentsLead}
        onClose={() => setDocumentsLead(null)}
      />

      <B2BReferLeadModal
        visible={!!referLead}
        lead={referLead}
        onClose={() => setReferLead(null)}
        onSaved={() => {
          loadLeads('refresh', 1);
        }}
      />

      <B2BInstituteWebModal
        visible={!!instituteWeb}
        title={instituteWeb?.title ?? ''}
        url={instituteWeb?.url ?? null}
        user={user}
        onClose={() => setInstituteWeb(null)}
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
  selected,
  onPress,
}: {
  label: string;
  value: number;
  bg: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const inner = (
    <>
      <Text style={styles.smallStatLabel}>{label}</Text>
      <View style={styles.smallStatDivider} />
      <Text style={styles.smallStatValue}>
        {String(value).padStart(2, '0')}
      </Text>
    </>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.smallStat,
          { backgroundColor: bg },
          selected && styles.smallStatSelected,
        ]}
      >
        {inner}
      </Pressable>
    );
  }
  return (
    <View style={[styles.smallStat, { backgroundColor: bg }]}>{inner}</View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  screenPad: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchRow: {
    flexDirection: 'row',
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
  smallStatSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
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

  filtersActiveBar: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fff5f7',
    borderWidth: 1,
    borderColor: 'rgba(250, 85, 121, 0.25)',
    gap: 8,
  },
  filtersActiveLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: college.textMuted,
  },
  filtersActiveBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: college.text,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  showAllBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  showAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
  },

  listHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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
  groupWrap: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    fontSize: 12,
  },
  emptyWrap: { alignItems: 'center', paddingVertical: 24, gap: 12 },
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
