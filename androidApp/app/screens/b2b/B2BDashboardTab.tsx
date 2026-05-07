import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import {
  B2BDashboardData,
  B2BPeriod,
  fetchB2BDashboard,
} from '../../services/b2bApi';
import { college } from '../../theme/college';

const PERIODS: { id: B2BPeriod; label: string }[] = [
  { id: 'last7', label: 'Last 7 Days' },
  { id: 'last30', label: 'Last 30 Days' },
  { id: 'last90', label: 'Last 90 Days' },
];

function fmtINR(n: number | undefined) {
  if (typeof n !== 'number' || !isFinite(n)) return '\u20B90';
  return `\u20B9${n.toLocaleString('en-IN')}`;
}

function fmtDate(s?: string) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
}

export function B2BDashboardTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const token = user?.token ?? '';

  const [period, setPeriod] = React.useState<B2BPeriod>('last30');
  const [data, setData] = React.useState<B2BDashboardData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (mode: 'first' | 'refresh' = 'first') => {
      if (!token) {
        setError('Login required');
        return;
      }
      if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await fetchB2BDashboard(token, period);
        if (res.ok && res.data) {
          setData(res.data);
        } else {
          setError(res.message || 'Failed to load dashboard');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Network error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, period],
  );

  React.useEffect(() => {
    load('first');
  }, [load]);

  const overview = data?.overview;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: 32 + insets.bottom },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load('refresh')}
          colors={[college.primary]}
        />
      }
    >
      <Text style={styles.sectionTitle}>B2B Dashboard</Text>
      <Text style={styles.sectionSub}>
        Comprehensive analytics for your B2B lead management
      </Text>

      <View style={styles.periodRow}>
        {PERIODS.map(p => {
          const active = period === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => setPeriod(p.id)}
              style={[styles.periodChip, active && styles.periodChipActive]}
            >
              <Text
                style={[
                  styles.periodChipText,
                  active && styles.periodChipTextActive,
                ]}
              >
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.errorBox}>{error}</Text> : null}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={college.primary} />
          <Text style={styles.loadingText}>Loading dashboard…</Text>
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            <KpiCard
              label="Total Leads"
              value={overview?.totalLeads ?? 0}
              hint="All time"
              accent={college.primary}
            />
            <KpiCard
              label="Active Leads"
              value={overview?.activeLeads ?? 0}
              hint="In pipeline"
              accent={'#10b981'}
            />
            <KpiCard
              label="Converted"
              value={overview?.convertedLeads ?? 0}
              hint="Success rate"
              accent={'#f59e0b'}
            />
            <KpiCard
              label="Pending Followups"
              value={overview?.pendingFollowups ?? 0}
              hint="Need attention"
              accent={'#ef4444'}
            />
          </View>

          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={styles.revenueValue}>
              {fmtINR(overview?.totalRevenue)}
            </Text>
            <Text style={styles.revenueHint}>From converted leads</Text>
          </View>

          <Text style={styles.h3}>Recent Leads</Text>
          {data?.recentLeads?.length ? (
            data.recentLeads.slice(0, 8).map((lead, i) => (
              <View key={i} style={styles.leadCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.leadTitle}>
                    {lead.businessName || lead.concernPersonName || '—'}
                  </Text>
                  {lead.concernPersonName ? (
                    <Text style={styles.leadSub}>
                      {lead.concernPersonName}
                      {lead.designation ? ` · ${lead.designation}` : ''}
                    </Text>
                  ) : null}
                  {lead.leadCategory ? (
                    <Text style={styles.leadMeta}>{lead.leadCategory}</Text>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <StatusBadge status={lead.status} />
                  <Text style={styles.leadDate}>{fmtDate(lead.createdAt)}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyMsg}>No recent leads.</Text>
          )}

          <Text style={styles.h3}>Upcoming Followups</Text>
          {data?.upcomingFollowups?.length ? (
            data.upcomingFollowups.slice(0, 8).map((fu, i) => (
              <View key={i} style={styles.followupCard}>
                <View style={styles.followupTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leadTitle}>
                      {fu.businessName || '—'}
                    </Text>
                    <Text style={styles.leadSub}>
                      {fu.concernPersonName || '—'}
                    </Text>
                    <Text style={styles.leadMeta}>{String(fu.mobile ?? '')}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.leadDate}>
                      {fmtDate(fu.scheduledDate)}
                    </Text>
                    <PriorityBadge priority={fu.priority} />
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyMsg}>No upcoming followups.</Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number;
  hint?: string;
  accent: string;
}) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color: accent }]}>{value}</Text>
      {hint ? <Text style={styles.kpiHint}>{hint}</Text> : null}
    </View>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const lc = status.toLowerCase();
  const bg =
    lc.includes('convert')
      ? '#10b981'
      : lc.includes('active')
        ? '#3b82f6'
        : lc.includes('pending')
          ? '#f59e0b'
          : '#9ca3af';
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.badgeText}>{status}</Text>
    </View>
  );
}

function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority) return null;
  const bg =
    priority === 'High'
      ? '#ef4444'
      : priority === 'Medium'
        ? '#f59e0b'
        : '#10b981';
  return (
    <View style={[styles.badge, { backgroundColor: bg, marginTop: 4 }]}>
      <Text style={styles.badgeText}>{priority}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: college.text,
  },
  sectionSub: {
    fontSize: 13,
    color: college.textMuted,
    marginTop: 4,
    marginBottom: 12,
  },
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: college.border,
  },
  periodChipActive: {
    backgroundColor: college.primary,
    borderColor: college.primary,
  },
  periodChipText: { fontSize: 12, color: college.text, fontWeight: '500' },
  periodChipTextActive: { color: '#fff', fontWeight: '700' },
  loadingWrap: { paddingVertical: 30, alignItems: 'center' },
  loadingText: { marginTop: 8, color: college.textMuted },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  kpiCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  kpiLabel: { fontSize: 12, color: college.textMuted, marginBottom: 4 },
  kpiValue: { fontSize: 22, fontWeight: '800' },
  kpiHint: { fontSize: 11, color: college.textMuted, marginTop: 2 },
  revenueCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    marginBottom: 16,
    elevation: 1,
  },
  revenueLabel: { fontSize: 13, color: college.textMuted },
  revenueValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10b981',
    marginVertical: 2,
  },
  revenueHint: { fontSize: 12, color: college.textMuted },
  h3: {
    fontSize: 16,
    fontWeight: '700',
    color: college.text,
    marginTop: 16,
    marginBottom: 8,
  },
  leadCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    elevation: 1,
  },
  leadTitle: { fontSize: 14, fontWeight: '700', color: college.text },
  leadSub: { fontSize: 12, color: college.textMuted, marginTop: 2 },
  leadMeta: { fontSize: 11, color: college.textMuted, marginTop: 2 },
  leadDate: { fontSize: 11, color: college.textMuted },
  followupCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  followupTopRow: { flexDirection: 'row', gap: 8 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-end',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  errorBox: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 12,
  },
  emptyMsg: {
    color: college.textMuted,
    fontSize: 13,
    paddingVertical: 8,
  },
});
