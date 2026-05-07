import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import {
  B2BCalendarEvent,
  fetchB2BCalendarEvents,
} from '../../services/b2bApi';
import { college } from '../../theme/college';

type RangeMode = 'today' | 'week' | 'month';

function rangeFor(mode: RangeMode) {
  const now = new Date();
  if (mode === 'today') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
    };
  }
  if (mode === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59);
    return { start, end };
  }
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
  };
}

function fmtDateTime(ev: B2BCalendarEvent) {
  const iso = ev.start?.dateTime || ev.start?.date;
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

export function B2BFollowUpTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const token = user?.token ?? '';

  const [mode, setMode] = React.useState<RangeMode>('today');
  const [events, setEvents] = React.useState<B2BCalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [info, setInfo] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (refresh = false) => {
      if (!token) {
        setInfo('Login required');
        return;
      }
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setInfo(null);
      try {
        const res = await fetchB2BCalendarEvents(
          token,
          (user as Record<string, unknown>) || {},
          rangeFor(mode),
        );
        if (res.ok) {
          setEvents(res.events);
          if (res.events.length === 0) {
            setInfo('No follow-ups in this range.');
          }
        } else {
          setEvents([]);
          setInfo(res.message || 'Could not load follow-ups.');
        }
      } catch (e) {
        setEvents([]);
        setInfo(e instanceof Error ? e.message : 'Network error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, user, mode],
  );

  React.useEffect(() => {
    load(false);
  }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>B2B Follow-up Calendar</Text>
        <Text style={styles.sub}>
          Google Calendar par schedule kiye gaye B2B follow-ups.
        </Text>
        <View style={styles.modeRow}>
          {(['today', 'week', 'month'] as RangeMode[]).map(m => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[styles.modeChip, mode === m && styles.modeChipActive]}
            >
              <Text
                style={[
                  styles.modeChipText,
                  mode === m && styles.modeChipTextActive,
                ]}
              >
                {m === 'today' ? 'Today' : m === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={college.primary} />
          <Text style={styles.loadingText}>Loading events…</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item, idx) => item.id || String(idx)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 24 + insets.bottom },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={[college.primary]}
            />
          }
          renderItem={({ item }) => <EventRow event={item} />}
          ListEmptyComponent={
            <Text style={styles.emptyMsg}>{info || 'No events.'}</Text>
          }
          ListHeaderComponent={
            info && events.length > 0 ? (
              <Text style={styles.infoBox}>{info}</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

function EventRow({ event }: { event: B2BCalendarEvent }) {
  return (
    <View style={styles.eventCard}>
      <Text style={styles.eventTitle}>{event.summary || 'Untitled'}</Text>
      <Text style={styles.eventTime}>{fmtDateTime(event)}</Text>
      {event.location ? (
        <Text style={styles.eventMeta}>📍 {event.location}</Text>
      ) : null}
      {event.description ? (
        <Text style={styles.eventDesc} numberOfLines={3}>
          {event.description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '700', color: college.text },
  sub: {
    fontSize: 12,
    color: college.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  modeRow: { flexDirection: 'row', gap: 6 },
  modeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: college.border,
  },
  modeChipActive: {
    backgroundColor: college.primary,
    borderColor: college.primary,
  },
  modeChipText: { fontSize: 12, color: college.text, fontWeight: '500' },
  modeChipTextActive: { color: '#fff', fontWeight: '700' },
  loadingWrap: { paddingVertical: 30, alignItems: 'center' },
  loadingText: { marginTop: 8, color: college.textMuted },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    elevation: 1,
  },
  eventTitle: { fontSize: 14, fontWeight: '700', color: college.text },
  eventTime: { fontSize: 12, color: college.textMuted, marginTop: 2 },
  eventMeta: { fontSize: 12, color: college.textMuted, marginTop: 4 },
  eventDesc: { fontSize: 12, color: college.text, marginTop: 6 },
  emptyMsg: {
    color: college.textMuted,
    fontSize: 13,
    paddingVertical: 16,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontSize: 12,
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
});
