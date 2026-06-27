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
  B2CApprovalCounts,
  B2CCrmFilter,
  B2CFollowupBucket,
  B2CFollowupDashboardCounts,
  B2CProfile,
  B2CReEnquiry,
  B2CStatusTemplate,
  fetchB2CCrmCounts,
  fetchB2CFollowupCounts,
  fetchB2CStatuses,
  fetchB2CProfiles,
  fetchB2CCrossSales,
  fetchB2CReapplyHistory,
  getProfileFollowupBucket,
  getProfileGroupRootId,
} from '../../services/b2cApi';
import { college } from '../../theme/college';
import { B2CAddLeadModal } from './B2CAddLeadModal';
import {
  B2CCycleFilters,
  B2CCycleFiltersState,
  EMPTY_B2C_CYCLE_FILTERS,
} from './B2CCycleFilters';
import { B2CCrossSaleModal } from './B2CCrossSaleModal';
import { B2CFollowupModal } from './B2CFollowupModal';
import { B2CLeadCard } from './B2CLeadCard';
import { B2CLeadHistoryModal } from './B2CLeadHistoryModal';
import { B2CReapplyModal } from './B2CReapplyModal';
import { B2CStatusChangeModal } from './B2CStatusChangeModal';

const PINK = '#fc567b';

function phoneDigitsOnly(raw: string | number | undefined): string {
  if (raw == null || raw === '') return '';
  return String(raw).replace(/[^\d]/g, '');
}

function normalizeDialNumber(raw: string | number | undefined): string {
  let digits = phoneDigitsOnly(raw);
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

function normalizeWhatsAppNumber(raw: string | number | undefined): string {
  let digits = phoneDigitsOnly(raw);
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

async function dialNumber(raw: string | number | undefined) {
  const digits = normalizeDialNumber(raw);
  if (digits.length < 10) {
    Alert.alert('Invalid number', 'Mobile number missing.');
    return;
  }
  try {
    await Linking.openURL(`tel:${digits}`);
  } catch (err) {
    Alert.alert(
      'Could not place call',
      err instanceof Error ? err.message : 'Dialer not available.',
    );
  }
}

async function openWhatsApp(raw: string | number | undefined) {
  const digits = normalizeWhatsAppNumber(raw);
  if (!digits) {
    Alert.alert('Invalid number', 'WhatsApp number missing.');
    return;
  }
  try {
    await Linking.openURL(`whatsapp://send?phone=${digits}`);
  } catch {
    try {
      await Linking.openURL(`https://wa.me/${digits}`);
    } catch (err) {
      Alert.alert(
        'Could not open WhatsApp',
        err instanceof Error ? err.message : 'Install WhatsApp or check number.',
      );
    }
  }
}

function isCycleFiltersActive(c: B2CCycleFiltersState): boolean {
  return !!(c.department || c.project || c.center || c.course || c.batch);
}

export function B2CSalesTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const token = user?.token ?? '';
  const userId = user?._id ?? '';

  const [search, setSearch] = React.useState('');
  const [appliedSearch, setAppliedSearch] = React.useState('');
  const [leadStatusFilter, setLeadStatusFilter] = React.useState<string | null>(null);
  const [approvalFilter, setApprovalFilter] = React.useState<string | null>(null);
  const [followupCallBucket, setFollowupCallBucket] = React.useState<B2CFollowupBucket | ''>('');
  const [followupVisitBucket, setFollowupVisitBucket] = React.useState<B2CFollowupBucket | ''>('');
  const [leadViewTab, setLeadViewTab] = React.useState<'all' | 'myRefer'>('all');
  const [cycleFilters, setCycleFilters] =
    React.useState<B2CCycleFiltersState>(EMPTY_B2C_CYCLE_FILTERS);

  const statusTemplatesRef = React.useRef<B2CStatusTemplate[]>([]);
  const [crmFilters, setCrmFilters] = React.useState<B2CCrmFilter[]>([]);
  const [approvalCounts, setApprovalCounts] = React.useState<B2CApprovalCounts>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [followupDashboardCounts, setFollowupDashboardCounts] =
    React.useState<B2CFollowupDashboardCounts>({
      call: { done: 0, planned: 0, missed: 0 },
      visit: { done: 0, planned: 0, missed: 0 },
    });

  const [profiles, setProfiles] = React.useState<B2CProfile[]>([]);
  const [crossSaleCache, setCrossSaleCache] = React.useState<
    Record<string, B2CProfile[]>
  >({});
  const [reapplyHistoryCache, setReapplyHistoryCache] = React.useState<
    Record<string, { courseName?: string; reEnquiries: B2CReEnquiry[] }>
  >({});
  const [activeCourseByGroup, setActiveCourseByGroup] = React.useState<
    Record<string, string>
  >({});
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [followupProfile, setFollowupProfile] = React.useState<B2CProfile | null>(null);
  const [followupType, setFollowupType] = React.useState<'Call' | 'Visit'>('Call');
  const [statusProfile, setStatusProfile] = React.useState<B2CProfile | null>(null);
  const [crossSaleProfile, setCrossSaleProfile] = React.useState<B2CProfile | null>(null);
  const [historyProfile, setHistoryProfile] = React.useState<B2CProfile | null>(null);
  const [reapplyProfile, setReapplyProfile] = React.useState<B2CProfile | null>(null);
  const [reapplyLoading, setReapplyLoading] = React.useState(false);
  const [showAddLead, setShowAddLead] = React.useState(false);

  const fetchCrossSaleGroup = React.useCallback(
    async (profile: B2CProfile) => {
      if (!profile?._id || !token) return;
      const rootId = getProfileGroupRootId(profile);
      if (!rootId) return;
      try {
        const res = await fetchB2CCrossSales(token, profile._id);
        if (res.ok) {
          const cacheKey = res.rootId || rootId;
          setCrossSaleCache(prev => ({
            ...prev,
            [cacheKey]: res.leads,
            [rootId]: res.leads,
            [profile._id]: res.leads,
          }));
        }
      } catch {
        /* ignore */
      }
    },
    [token],
  );

  const openReapplyModal = React.useCallback(
    async (profile: B2CProfile) => {
      setReapplyProfile(profile);
      setReapplyLoading(true);
      try {
        const res = await fetchB2CReapplyHistory(token, profile._id);
        if (res.ok) {
          setReapplyHistoryCache(prev => ({
            ...prev,
            [profile._id]: {
              courseName: res.courseName,
              reEnquiries: res.reEnquiries,
            },
          }));
        }
      } finally {
        setReapplyLoading(false);
      }
    },
    [token],
  );

  const listParams = React.useCallback(
    (
      status?: string | null,
      search?: string,
      approval?: string | null,
      cycle?: B2CCycleFiltersState,
      callBucket?: B2CFollowupBucket | '',
      viewTab?: 'all' | 'myRefer',
    ) => ({
      name: search || undefined,
      leadStatus: status && status !== 'all' ? status : undefined,
      approvalStatus: approval ? approval.toUpperCase() : undefined,
      followupStatus: callBucket || undefined,
      registeredByMe:
        (viewTab ?? leadViewTab) === 'myRefer' && userId ? userId : undefined,
      cycle: cycle ?? cycleFilters,
    }),
    [cycleFilters, leadViewTab, userId],
  );

  const displayedProfiles = React.useMemo(() => {
    if (!followupVisitBucket) return profiles;
    return profiles.filter(
      p => getProfileFollowupBucket(p, 'Visit') === followupVisitBucket,
    );
  }, [profiles, followupVisitBucket]);

  const profileDisplayGroups = React.useMemo(() => {
    const byRoot = new Map<string, B2CProfile[]>();
    for (const p of displayedProfiles) {
      const rootId = getProfileGroupRootId(p);
      const arr = byRoot.get(rootId) || [];
      arr.push(p);
      byRoot.set(rootId, arr);
    }
    return Array.from(byRoot.entries()).map(([rootId, members]) => {
      const cached = crossSaleCache[rootId];
      const merged = cached?.length ? cached : members;
      const listById = new Map(members.map(m => [String(m._id), m]));
      const unique = [
        ...new Map(merged.map(m => [String(m._id), m])).values(),
      ].map(p => {
        const fromList = listById.get(String(p._id));
        if (!fromList) return p;
        return {
          ...p,
          selectedSubstatus: fromList.selectedSubstatus ?? p.selectedSubstatus,
          _leadSubStatus: fromList._leadSubStatus ?? p._leadSubStatus,
          _leadStatus: {
            ...p._leadStatus,
            ...fromList._leadStatus,
            substatuses:
              fromList._leadStatus?.substatuses ??
              p._leadStatus?.substatuses,
          },
        };
      });
      const sorted = [...unique].sort((a, b) => {
        const aPrimary = !a.parentAppliedCourseId;
        const bPrimary = !b.parentAppliedCourseId;
        if (aPrimary !== bPrimary) return aPrimary ? -1 : 1;
        return (
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
      });
      return { rootId, profiles: sorted };
    });
  }, [displayedProfiles, crossSaleCache]);

  React.useEffect(() => {
    if (!displayedProfiles.length || !token) return;
    const rootIds = [
      ...new Set(displayedProfiles.map(p => getProfileGroupRootId(p)).filter(Boolean)),
    ];
    rootIds.forEach(rootId => {
      if (crossSaleCache[rootId]) return;
      const sample = displayedProfiles.find(
        p => getProfileGroupRootId(p) === rootId,
      );
      if (sample) fetchCrossSaleGroup(sample);
    });
  }, [displayedProfiles, token, crossSaleCache, fetchCrossSaleGroup]);

  const loadCounts = React.useCallback(
    async (cycle?: B2CCycleFiltersState, search?: string) => {
      if (!token) return;
      try {
        const params = listParams(
          leadStatusFilter,
          search ?? appliedSearch,
          approvalFilter,
          cycle,
          followupCallBucket,
        );
        const [crmRes, fuRes] = await Promise.all([
          fetchB2CCrmCounts(token, params, statusTemplatesRef.current),
          fetchB2CFollowupCounts(token, cycle ?? cycleFilters),
        ]);
        if (crmRes.ok) {
          setCrmFilters(crmRes.crmFilters);
          setApprovalCounts(crmRes.approvalCounts);
        }
        if (fuRes.ok) setFollowupDashboardCounts(fuRes.counts);
      } catch {
        // silent
      }
    },
    [
      token,
      listParams,
      leadStatusFilter,
      appliedSearch,
      approvalFilter,
      followupCallBucket,
      cycleFilters,
    ],
  );

  const loadProfiles = React.useCallback(
    async (
      mode: 'first' | 'refresh' | 'more',
      pageOverride?: number,
      overrides?: {
        status?: string | null;
        search?: string;
        approval?: string | null;
        cycle?: B2CCycleFiltersState;
        callBucket?: B2CFollowupBucket | '';
        viewTab?: 'all' | 'myRefer';
      },
    ) => {
      if (!token) {
        setError('Login required');
        return;
      }
      const targetPage = pageOverride ?? (mode === 'more' ? page + 1 : 1);
      const status = overrides?.status !== undefined ? overrides.status : leadStatusFilter;
      const q = overrides?.search !== undefined ? overrides.search : appliedSearch;
      const approval =
        overrides?.approval !== undefined ? overrides.approval : approvalFilter;
      const cycle = overrides?.cycle ?? cycleFilters;
      const callBucket =
        overrides?.callBucket !== undefined ? overrides.callBucket : followupCallBucket;
      const viewTab = overrides?.viewTab ?? leadViewTab;

      if (mode === 'first') setLoading(true);
      else if (mode === 'refresh') setRefreshing(true);
      else setLoadingMore(true);

      setError(null);
      try {
        const res = await fetchB2CProfiles(token, {
          page: targetPage,
          limit: 20,
          ...listParams(status, q, approval, cycle, callBucket, viewTab),
        });
        if (res.ok) {
          setTotalPages(res.totalPages);
          setPage(targetPage);
          setProfiles(prev =>
            mode === 'more' ? [...prev, ...res.profiles] : res.profiles,
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
    [
      token,
      page,
      leadStatusFilter,
      appliedSearch,
      approvalFilter,
      cycleFilters,
      followupCallBucket,
      leadViewTab,
      listParams,
    ],
  );

  const reloadAll = React.useCallback(
    (
      status: string | null,
      search: string,
      approval: string | null,
      cycle: B2CCycleFiltersState,
      callBucket: B2CFollowupBucket | '',
      visitBucket: B2CFollowupBucket | '',
      viewTab: 'all' | 'myRefer',
    ) => {
      loadCounts(cycle, search);
      loadProfiles('first', 1, {
        status,
        search,
        approval,
        cycle,
        callBucket,
        viewTab,
      });
    },
    [loadCounts, loadProfiles],
  );

  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      const statusRes = await fetchB2CStatuses(token);
      if (cancelled) return;
      if (statusRes.ok) {
        statusTemplatesRef.current = statusRes.items.map(s => ({
          _id: s._id,
          title: s.title,
          milestone: s.milestone,
        }));
      }
      loadCounts();
      loadProfiles('first', 1);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const performanceFilters = React.useMemo(
    () => crmFilters.filter(f => f._id && f._id !== 'all'),
    [crmFilters],
  );

  const performanceTotal = React.useMemo(() => {
    const all = crmFilters.find(f => f._id === 'all');
    return all?.count ?? approvalCounts.total;
  }, [crmFilters, approvalCounts.total]);

  const totalAfterFilter = React.useMemo(() => {
    if (followupVisitBucket) return displayedProfiles.length;
    if (!approvalFilter) {
      if (leadStatusFilter && leadStatusFilter !== 'all') {
        const found = crmFilters.find(f => f._id === leadStatusFilter);
        return found?.count ?? profiles.length;
      }
      return performanceTotal;
    }
    if (approvalFilter === 'approved') return approvalCounts.approved;
    if (approvalFilter === 'pending') return approvalCounts.pending;
    if (approvalFilter === 'rejected') return approvalCounts.rejected;
    return performanceTotal;
  }, [
    approvalFilter,
    approvalCounts,
    leadStatusFilter,
    crmFilters,
    profiles.length,
    performanceTotal,
    followupVisitBucket,
    displayedProfiles.length,
  ]);

  const hasAnyActiveFilters = React.useMemo(
    () =>
      !!appliedSearch ||
      !!leadStatusFilter ||
      !!approvalFilter ||
      !!followupCallBucket ||
      !!followupVisitBucket ||
      isCycleFiltersActive(cycleFilters) ||
      leadViewTab === 'myRefer',
    [
      appliedSearch,
      leadStatusFilter,
      approvalFilter,
      followupCallBucket,
      followupVisitBucket,
      cycleFilters,
      leadViewTab,
    ],
  );

  const onSubmitSearch = () => {
    setAppliedSearch(search);
    reloadAll(
      leadStatusFilter,
      search,
      approvalFilter,
      cycleFilters,
      followupCallBucket,
      followupVisitBucket,
      leadViewTab,
    );
  };

  const showAllLeads = () => {
    const clearedCycle = { ...EMPTY_B2C_CYCLE_FILTERS };
    setSearch('');
    setAppliedSearch('');
    setLeadStatusFilter(null);
    setApprovalFilter(null);
    setFollowupCallBucket('');
    setFollowupVisitBucket('');
    setCycleFilters(clearedCycle);
    setLeadViewTab('all');
    reloadAll(null, '', null, clearedCycle, '', '', 'all');
  };

  const onCycleFiltersChange = (next: B2CCycleFiltersState) => {
    setCycleFilters(next);
    reloadAll(
      leadStatusFilter,
      appliedSearch,
      approvalFilter,
      next,
      followupCallBucket,
      followupVisitBucket,
      leadViewTab,
    );
  };

  const onSelectPerformance = (id: string | null) => {
    setApprovalFilter(null);
    setFollowupCallBucket('');
    setFollowupVisitBucket('');
    setLeadStatusFilter(id);
    reloadAll(id, appliedSearch, null, cycleFilters, '', '', leadViewTab);
  };

  const onSelectApproval = (approval: string | null) => {
    const next = approvalFilter === approval ? null : approval;
    setApprovalFilter(next);
    setLeadStatusFilter(null);
    setFollowupCallBucket('');
    setFollowupVisitBucket('');
    reloadAll(null, appliedSearch, next, cycleFilters, '', '', leadViewTab);
  };

  const onFollowupDashClick = (type: 'Call' | 'Visit', bucket: B2CFollowupBucket) => {
    const isVisit = type === 'Visit';
    const current = isVisit ? followupVisitBucket : followupCallBucket;
    const togglingOff = current === bucket;

    let nextCall = followupCallBucket;
    let nextVisit = followupVisitBucket;
    if (isVisit) {
      nextVisit = togglingOff ? '' : bucket;
      if (!togglingOff) nextCall = '';
    } else {
      nextCall = togglingOff ? '' : bucket;
      if (!togglingOff) nextVisit = '';
    }

    setFollowupCallBucket(nextCall);
    setFollowupVisitBucket(nextVisit);
    setApprovalFilter(null);
    setLeadStatusFilter(null);

    reloadAll(
      null,
      appliedSearch,
      null,
      cycleFilters,
      nextCall,
      nextVisit,
      leadViewTab,
    );
  };

  const onLeadViewTab = (tab: 'all' | 'myRefer') => {
    setLeadViewTab(tab);
    reloadAll(
      leadStatusFilter,
      appliedSearch,
      approvalFilter,
      cycleFilters,
      followupCallBucket,
      followupVisitBucket,
      tab,
    );
  };

  const ListHeader = (
    <View>
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search name / mobile"
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

      <B2CCycleFilters
        token={token}
        value={cycleFilters}
        onChange={onCycleFiltersChange}
      />

      <Section label="My Leads">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          <PerfChip
            label="All Leads"
            active={leadViewTab === 'all'}
            onPress={() => onLeadViewTab('all')}
          />
          <PerfChip
            label="My Referred"
            active={leadViewTab === 'myRefer'}
            onPress={() => onLeadViewTab('myRefer')}
          />
        </ScrollView>
      </Section>

      <Section label="Lead Approval">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {(
            [
              { key: 'total', label: 'Total', value: approvalCounts.total, bg: '#5b4fc9', approval: null },
              { key: 'approved', label: 'Approved', value: approvalCounts.approved, bg: '#10b981', approval: 'approved' },
              { key: 'pending', label: 'Pending', value: approvalCounts.pending, bg: '#f59e0b', approval: 'pending' },
              { key: 'rejected', label: 'Rejected', value: approvalCounts.rejected, bg: '#ef4444', approval: 'rejected' },
            ] as const
          ).map(row => (
            <Pressable
              key={row.key}
              onPress={() => onSelectApproval(row.approval)}
              style={[
                styles.statCard,
                { backgroundColor: row.bg },
                approvalFilter === row.approval && styles.statCardSelected,
              ]}
            >
              <Text style={styles.statLabel}>{row.label}</Text>
              <View style={styles.statDivider} />
              <Text style={styles.statValue}>{String(row.value).padStart(2, '0')}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Section>

      <Section label="Performance">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <PerfChip
            label={`All (${performanceTotal})`}
            active={!leadStatusFilter}
            onPress={() => onSelectPerformance(null)}
          />
          {performanceFilters.map(f => (
            <PerfChip
              key={f._id}
              label={`${(f.name || 'Status').toUpperCase()} (${f.count ?? 0})`}
              active={leadStatusFilter === f._id}
              onPress={() => onSelectPerformance(f._id)}
            />
          ))}
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
              value={followupDashboardCounts.call[row.bucket]}
              bg="#12b3ff"
              selected={followupCallBucket === row.bucket}
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
              value={followupDashboardCounts.visit[row.bucket]}
              bg="#4b5563"
              selected={followupVisitBucket === row.bucket}
              onPress={() => onFollowupDashClick('Visit', row.bucket)}
            />
          ))}
        </View>
      </Section>

      {hasAnyActiveFilters ? (
        <View style={styles.filtersActiveBar}>
          <Text style={styles.filtersActiveLabel}>Filters active</Text>
          <Pressable style={styles.showAllBtn} onPress={showAllLeads}>
            <Text style={styles.showAllBtnText}>Show all leads</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.listHeaderBar}>
        <Text style={styles.listHeaderTitle}>Admission Leads</Text>
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
            <ActivityIndicator color={PINK} />
            <Text style={styles.loadingText}>Loading leads…</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={profileDisplayGroups}
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
                loadProfiles('refresh', 1);
              }}
              colors={[PINK]}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (!loadingMore && !followupVisitBucket && page < totalPages) {
              loadProfiles('more');
            }
          }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item: group }) => {
            const activeId = activeCourseByGroup[group.rootId];
            const activeProfile =
              group.profiles.find(p => String(p._id) === String(activeId)) ||
              group.profiles[0];

            return (
              <View style={styles.groupWrap}>
                {activeProfile ? (
                  <B2CLeadCard
                    profile={activeProfile}
                    groupProfiles={group.profiles}
                    onSelectGroupProfile={id =>
                      setActiveCourseByGroup(prev => ({
                        ...prev,
                        [group.rootId]: id,
                      }))
                    }
                    onDial={dialNumber}
                    onWhatsApp={openWhatsApp}
                    onFollowup={type => {
                      setFollowupType(type);
                      setFollowupProfile(activeProfile);
                    }}
                    onStatusChange={() => setStatusProfile(activeProfile)}
                    onCrossSale={() => setCrossSaleProfile(activeProfile)}
                    onReapply={() => openReapplyModal(activeProfile)}
                    onHistory={() => setHistoryProfile(activeProfile)}
                    onRefresh={() => {
                      loadCounts();
                      loadProfiles('refresh', 1);
                    }}
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
                  : 'No admission leads found.'}
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
                <ActivityIndicator color={PINK} />
              </View>
            ) : null
          }
        />
      )}

      <B2CFollowupModal
        visible={!!followupProfile}
        profile={followupProfile}
        initialType={followupType}
        onClose={() => setFollowupProfile(null)}
        onSaved={() => {
          loadCounts();
          loadProfiles('refresh', 1);
        }}
      />

      <B2CStatusChangeModal
        visible={!!statusProfile}
        profile={statusProfile}
        onClose={() => setStatusProfile(null)}
        onSaved={() => {
          loadCounts();
          loadProfiles('refresh', 1);
        }}
      />

      <B2CAddLeadModal
        visible={showAddLead}
        onClose={() => setShowAddLead(false)}
        onSaved={() => {
          loadCounts();
          loadProfiles('refresh', 1);
        }}
      />

      <B2CCrossSaleModal
        visible={!!crossSaleProfile}
        profile={crossSaleProfile}
        groupProfiles={
          crossSaleProfile
            ? profileDisplayGroups.find(
                g =>
                  g.rootId === getProfileGroupRootId(crossSaleProfile),
              )?.profiles
            : undefined
        }
        onClose={() => setCrossSaleProfile(null)}
        onSaved={(newProfile, rootId) => {
          setCrossSaleCache(prev => {
            const existing = prev[rootId] || [];
            const merged = [...existing, newProfile].filter(
              (l, i, arr) =>
                arr.findIndex(x => String(x._id) === String(l._id)) === i,
            );
            return { ...prev, [rootId]: merged };
          });
          setActiveCourseByGroup(prev => ({
            ...prev,
            [rootId]: String(newProfile._id),
          }));
          loadCounts();
          loadProfiles('refresh', 1);
          if (crossSaleProfile) {
            fetchCrossSaleGroup(crossSaleProfile);
          }
        }}
      />

      <B2CLeadHistoryModal
        visible={!!historyProfile}
        profile={historyProfile}
        onClose={() => setHistoryProfile(null)}
      />

      <B2CReapplyModal
        visible={!!reapplyProfile}
        profile={reapplyProfile}
        loading={reapplyLoading}
        courseName={
          reapplyProfile
            ? reapplyHistoryCache[reapplyProfile._id]?.courseName
            : undefined
        }
        reEnquiries={
          reapplyProfile
            ? reapplyHistoryCache[reapplyProfile._id]?.reEnquiries || []
            : []
        }
        onClose={() => setReapplyProfile(null)}
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

function Section({ label, children }: { label: string; children: React.ReactNode }) {
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
      style={[styles.perfChip, active ? styles.perfChipActive : styles.perfChipIdle]}
    >
      <Text style={[styles.perfChipText, active ? styles.perfChipTextActive : styles.perfChipTextIdle]}>
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
      <Text style={styles.smallStatValue}>{String(value).padStart(2, '0')}</Text>
    </>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.smallStat, { backgroundColor: bg }, selected && styles.smallStatSelected]}
      >
        {inner}
      </Pressable>
    );
  }
  return <View style={[styles.smallStat, { backgroundColor: bg }]}>{inner}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  screenPad: { flex: 1, paddingHorizontal: 16 },
  searchRow: { flexDirection: 'row', paddingTop: 12, paddingBottom: 6, gap: 8, paddingHorizontal: 16 },
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
    backgroundColor: PINK,
    paddingHorizontal: 14,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  section: { paddingHorizontal: 16, marginTop: 10 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: college.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  hScroll: { gap: 8, paddingRight: 16 },
  chipsRow: { gap: 8, paddingRight: 16 },
  statCard: {
    minWidth: 72,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statCardSelected: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#fff' },
  statDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.35)', width: '80%', marginVertical: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
  perfChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  perfChipActive: { backgroundColor: PINK, borderColor: PINK },
  perfChipIdle: { backgroundColor: '#fff', borderColor: PINK },
  perfChipText: { fontSize: 12, fontWeight: '700' },
  perfChipTextActive: { color: '#fff' },
  perfChipTextIdle: { color: PINK },
  tripleCards: { flexDirection: 'row', gap: 6 },
  smallStat: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  smallStatSelected: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.65)' },
  smallStatLabel: { fontSize: 10, fontWeight: '700', color: '#fff' },
  smallStatDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.35)', width: '70%', marginVertical: 3 },
  smallStatValue: { fontSize: 14, fontWeight: '800', color: '#fff' },
  filtersActiveBar: {
    marginHorizontal: 16,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff5f7',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  filtersActiveLabel: { fontSize: 12, fontWeight: '600', color: PINK },
  showAllBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PINK,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  showAllBtnText: { color: PINK, fontWeight: '700', fontSize: 12 },
  listHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  listHeaderTitle: { fontSize: 16, fontWeight: '800', color: college.text },
  listHeaderSub: { fontSize: 13, color: college.textMuted },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    color: college.error,
    fontSize: 13,
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
  },
  listContent: { paddingHorizontal: 16 },
  groupWrap: {},
  loadingWrap: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  loadingText: { color: college.textMuted, fontSize: 14 },
  emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyMsg: { color: college.textMuted, fontSize: 14, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PINK,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },
  fabLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
