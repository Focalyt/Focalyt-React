import React from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import {
  B2BLead,
  B2BLeadDocument,
  fetchB2BLeadCategoryById,
  fetchB2BLeadDocuments,
} from '../../services/b2bApi';
import { college } from '../../theme/college';

type Props = {
  visible: boolean;
  lead: B2BLead | null;
  onClose: () => void;
};

function leadCategoryId(lead: B2BLead): string {
  const c = lead.leadCategory;
  if (!c) return '';
  if (typeof c === 'string') return c;
  return c._id || '';
}

export function B2BLeadDocumentsModal({ visible, lead, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const token = user?.token ?? '';

  const [documents, setDocuments] = React.useState<B2BLeadDocument[]>([]);
  const [requiredNames, setRequiredNames] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!visible || !lead || !token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setDocuments([]);
      setRequiredNames([]);
      try {
        const catId = leadCategoryId(lead);
        const tasks: Promise<void>[] = [];
        if (catId) {
          tasks.push(
            (async () => {
              const catRes = await fetchB2BLeadCategoryById(token, catId);
              if (!cancelled && catRes.ok) {
                setRequiredNames(
                  catRes.documents
                    .map(d => String(d.name || '').trim())
                    .filter(Boolean),
                );
              }
            })(),
          );
        }
        const docRes = await fetchB2BLeadDocuments(token, lead._id);
        if (cancelled) return;
        if (docRes.ok) setDocuments(docRes.documents);
        else setError(docRes.message || 'Failed to load documents');
        await Promise.all(tasks);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, lead, token]);

  const openDoc = async (url?: string) => {
    if (!url?.trim()) return;
    try {
      await Linking.openURL(url);
    } catch {
      setError('Could not open document link.');
    }
  };

  const title =
    lead?.businessName || lead?.concernPersonName || 'Lead';

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
              <Text style={styles.title}>Documents</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {title}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator
              color={college.primary}
              style={{ marginVertical: 24 }}
            />
          ) : (
            <ScrollView style={styles.list}>
              {requiredNames.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Required</Text>
                  {requiredNames.map(name => (
                    <Text key={name} style={styles.requiredItem}>
                      • {name}
                    </Text>
                  ))}
                </View>
              ) : null}

              {documents.length === 0 ? (
                <Text style={styles.empty}>No documents uploaded yet.</Text>
              ) : (
                documents.map((doc, i) => (
                  <Pressable
                    key={doc._id || `doc-${i}`}
                    style={styles.docRow}
                    onPress={() => openDoc(doc.url)}
                    disabled={!doc.url}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docName} numberOfLines={2}>
                        {doc.name || 'Document'}
                      </Text>
                      <Text style={styles.docStatus}>
                        {doc.status || '—'}
                      </Text>
                    </View>
                    {doc.url ? (
                      <Text style={styles.openLink}>Open</Text>
                    ) : null}
                  </Pressable>
                ))
              )}
            </ScrollView>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
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
    maxHeight: '80%',
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
  list: {
    maxHeight: 360,
  },
  section: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  requiredItem: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  empty: {
    textAlign: 'center',
    color: '#94a3b8',
    paddingVertical: 20,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  docName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  docStatus: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  openLink: {
    fontSize: 13,
    fontWeight: '800',
    color: college.primary,
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    marginTop: 8,
  },
});
