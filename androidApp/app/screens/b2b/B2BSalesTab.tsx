import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import {
  B2BLead,
  B2BStatusCount,
  fetchB2BLeads,
  fetchB2BStatusCounts,
} from '../../services/b2bApi';
import { college } from '../../theme/college';

function fmtDate(s?: string) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
}

export function B2BSalesTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const token = user?.token ?? '';

  const [search, setSearch] = React.useState('');
  const [appliedSearch, setAppliedSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null);
  const [counts, setCounts] = React.useState<{
    total: number;
    list: B2BStatusCount[];
  }>({ total: 0, list: [] });
  const [leads, setLeads] = React.useState<B2BLead[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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

  const loadLeads = React.useCallback(
    async (
      mode: 'first' | 'refresh' | 'more',
      pageOverride?: number,
      statusOverride?: string | null,
      searchOverride?: string,
    ) => {
      if (!token) {
        setError('Login required');
        return;
      }
      const targetPage = pageOverride ?? (mode === 'more' ? page + 1 : 1);
      const status =
        statusOverride !== undefined ? statusOverride : statusFilter;
      const q = searchOverride !== undefined ? searchOverride : appliedSearch;

      if (mode === 'first') setLoading(true);
      else if (mode === 'refresh') setRefreshing(true);
      else setLoadingMore(true);

      setError(null);
      try {
        const res = await fetchB2BLeads(token, {
          page: targetPage,
          status: status || undefined,
          search: q || undefined,
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
    [token, page, statusFilter, appliedSearch],
  );

  React.useEffect(() => {
    loadCounts();
    loadLeads('first', 1, null, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onSelectStatus = (id: string | null) => {
    setStatusFilter(id);
    loadLeads('first', 1, id, appliedSearch);
  };

  const onSubmitSearch = () => {
    setAppliedSearch(search);
    loadLeads('first', 1, statusFilter, search);
  };

  return (
    <View style={styles.container}>
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

      <View style={styles.chipsWrap}>
        <StatusChip
          label={`Total · ${counts.total}`}
          active={!statusFilter}
          onPress={() => onSelectStatus(null)}
        />
        {counts.list.map(s => (
          <StatusChip
            key={s._id || s.name}
            label={`${s.name || 'Status'} · ${s.count ?? 0}`}
            active={statusFilter === s._id}
            color={s.color}
            onPress={() => onSelectStatus(s._id || null)}
          />
        ))}
      </View>

      {error ? <Text style={styles.errorBox}>{error}</Text> : null}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={college.primary} />
          <Text style={styles.loadingText}>Loading leads…</Text>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={item => item._id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 24 + insets.bottom },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                loadCounts();
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
          renderItem={({ item }) => <LeadRow lead={item} />}
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
    </View>
  );
}

function StatusChip({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color?: string;
  onPress: () => void;
}) {
  const accent = color || college.primary;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && { backgroundColor: accent, borderColor: accent },
      ]}
    >
      {!active ? (
        <View style={[styles.chipDot, { backgroundColor: accent }]} />
      ) : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function LeadRow({ lead }: { lead: B2BLead }) {
  const statusName =
    lead.status?.title || lead.status?.name || 'Untouch Lead';
  return (
    <View style={styles.leadCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.leadTitle}>
          {lead.businessName || lead.concernPersonName || '—'}
        </Text>
        <Text style={styles.leadSub}>
          {lead.concernPersonName || '—'}
          {lead.designation ? ` · ${lead.designation}` : ''}
        </Text>
        {lead.mobile ? (
          <Text style={styles.leadMeta}>📞 {String(lead.mobile)}</Text>
        ) : null}
        {lead.email ? <Text style={styles.leadMeta}>✉ {lead.email}</Text> : null}
        {lead.leadCategory?.name ? (
          <Text style={styles.leadMeta}>{lead.leadCategory.name}</Text>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText} numberOfLines={1}>
            {statusName}
          </Text>
        </View>
        <Text style={styles.leadDate}>{fmtDate(lead.createdAt)}</Text>
      </View>
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
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: college.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: { fontSize: 12, color: college.text, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  loadingWrap: { paddingVertical: 30, alignItems: 'center' },
  loadingText: { marginTop: 8, color: college.textMuted },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  leadCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    elevation: 1,
  },
  leadTitle: { fontSize: 14, fontWeight: '700', color: college.text },
  leadSub: { fontSize: 12, color: college.textMuted, marginTop: 2 },
  leadMeta: { fontSize: 11, color: college.textMuted, marginTop: 2 },
  leadDate: { fontSize: 11, color: college.textMuted, marginTop: 4 },
  statusBadge: {
    backgroundColor: college.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    maxWidth: 130,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
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
});
