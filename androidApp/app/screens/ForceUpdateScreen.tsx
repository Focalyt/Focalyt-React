import React from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppVersionCheck } from '../services/appVersionApi';
import { APP_VERSION_CODE, APP_VERSION_NAME } from '../config/appVersion';
import { college } from '../theme/college';

type Props = {
  info: AppVersionCheck;
  checking?: boolean;
  onRecheck?: () => void;
};

function fmtSize(bytes?: number) {
  if (!bytes || bytes <= 0) return '';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ForceUpdateScreen({ info, checking, onRecheck }: Props) {
  const insets = useSafeAreaInsets();

  const onDownload = async () => {
    const url = info.downloadUrl;
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      // ignore
    }
  };

  return (
    <View
      style={[
        styles.page,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.icon}>⬆️</Text>
        <Text style={styles.title}>Update required</Text>
        <Text style={styles.sub}>
          App use karne ke liye naya version install karna zaroori hai.
        </Text>

        <View style={styles.box}>
          <Row label="Your version" value={`${APP_VERSION_NAME} (${APP_VERSION_CODE})`} />
          <Row
            label="Latest version"
            value={`${info.versionName || '—'} (${info.latestVersionCode})`}
            highlight
          />
          {info.fileSizeBytes ? (
            <Row label="Download size" value={fmtSize(info.fileSizeBytes)} />
          ) : null}
        </View>

        {info.releaseNotes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>What&apos;s new</Text>
            <Text style={styles.notesBody}>{info.releaseNotes}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.primaryBtn, !info.downloadUrl && styles.btnDisabled]}
          onPress={onDownload}
          disabled={!info.downloadUrl}
        >
          <Text style={styles.primaryBtnText}>Download & install update</Text>
        </Pressable>

        <Text style={styles.hint}>
          APK download hone ke baad install karo. Agar prompt aaye to &quot;Install
          unknown apps&quot; allow karo, phir app dubara kholo.
        </Text>

        {onRecheck ? (
          <Pressable
            style={styles.secondaryBtn}
            onPress={onRecheck}
            disabled={checking}
          >
            {checking ? (
              <ActivityIndicator color={college.primary} />
            ) : (
              <Text style={styles.secondaryBtnText}>Check again</Text>
            )}
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHi]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: college.pageBg,
    paddingHorizontal: 24,
  },
  scroll: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  icon: { fontSize: 48, marginBottom: 12 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: college.text,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    color: college.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
  },
  box: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: college.border,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  rowLabel: { fontSize: 13, color: college.textMuted, flex: 1 },
  rowValue: { fontSize: 13, fontWeight: '600', color: college.text },
  rowValueHi: { color: college.primary, fontWeight: '800' },
  notesBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: college.border,
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: college.text,
    marginBottom: 6,
  },
  notesBody: { fontSize: 13, color: college.textMuted, lineHeight: 19 },
  primaryBtn: {
    width: '100%',
    backgroundColor: college.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  hint: {
    fontSize: 12,
    color: college.textMuted,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 18,
  },
  secondaryBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  secondaryBtnText: {
    color: college.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
