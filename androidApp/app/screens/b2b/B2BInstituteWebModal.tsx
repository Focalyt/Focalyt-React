import React from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import type { AuthUser } from '../../auth/authTypes';
import { getWebAppBaseSafe } from '../../services/collegeApi';
import { college } from '../../theme/college';

const EXTERNAL_LINK_PREFIXES = ['tel:', 'mailto:', 'whatsapp:', 'sms:'];

function hostFromUrl(raw: string): string | null {
  try {
    return new URL(raw).host;
  } catch {
    return null;
  }
}

function isAllowedInWebView(url: string, portalHost: string | null): boolean {
  if (url === 'about:blank') return true;
  if (EXTERNAL_LINK_PREFIXES.some(p => url.startsWith(p))) return false;
  if (url.startsWith('intent://')) return false;

  const host = hostFromUrl(url);
  if (!host) return true;
  if (portalHost && host === portalHost) return true;

  // LRP uses Google Places autocomplete inside the WebView.
  const allowedThirdParty = [
    'google.com',
    'googleapis.com',
    'gstatic.com',
    'googleusercontent.com',
  ];
  return allowedThirdParty.some(
    suffix => host === suffix || host.endsWith(`.${suffix}`),
  );
}

type Props = {
  visible: boolean;
  title: string;
  url: string | null;
  user: AuthUser | null;
  onClose: () => void;
};

function buildSessionInjection(user: AuthUser): string {
  const stored = JSON.stringify({
    _id: user._id,
    name: user.name,
    role: user.role,
    email: user.email,
    mobile: user.mobile,
    token: user.token,
    collegeName: user.collegeName,
    collegeId: user.collegeId,
    isDefaultAdmin: user.isDefaultAdmin,
    permissions: user.permissions,
    googleAuthToken: user.googleAuthToken,
  });
  return `
    (function() {
      try {
        sessionStorage.setItem('user', ${JSON.stringify(stored)});
      } catch (e) {}
    })();
    true;
  `;
}

export function B2BInstituteWebModal({
  visible,
  title,
  url,
  user,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = React.useState(true);
  const webRef = React.useRef<WebView>(null);
  const webBase = getWebAppBaseSafe();
  const portalHost = React.useMemo(
    () => (webBase ? hostFromUrl(webBase) : null),
    [webBase],
  );

  const injectScript =
    user?.token != null && user.token !== ''
      ? buildSessionInjection(user)
      : undefined;

  const configError =
    !webBase || !url
      ? 'Web app URL not configured. Set WEB_APP_URL in androidApp/.env (e.g. https://focalyt.com, without /api).'
      : !user?.token
        ? 'Login session missing. Please sign in again.'
        : null;

  React.useEffect(() => {
    if (visible) setLoading(true);
  }, [visible, url]);

  const onShouldStartLoadWithRequest = React.useCallback(
    (request: { url: string }) => {
      const nextUrl = request.url;
      if (EXTERNAL_LINK_PREFIXES.some(p => nextUrl.startsWith(p))) {
        Linking.openURL(nextUrl).catch(() => {});
        return false;
      }
      return isAllowedInWebView(nextUrl, portalHost);
    },
    [portalHost],
  );

  const onNavigationStateChange = React.useCallback(
    (nav: WebViewNavigation) => {
      if (nav.loading) return;
      const nextUrl = nav.url;
      if (!nextUrl || isAllowedInWebView(nextUrl, portalHost)) return;
      if (EXTERNAL_LINK_PREFIXES.some(p => nextUrl.startsWith(p))) {
        Linking.openURL(nextUrl).catch(() => {});
      }
      webRef.current?.goBack();
    },
    [portalHost],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        {configError ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{configError}</Text>
            <Pressable style={styles.errorBtn} onPress={onClose}>
              <Text style={styles.errorBtnText}>Close</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.webWrap}>
            {loading ? (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={college.primary} />
              </View>
            ) : null}
            <WebView
              ref={webRef}
              source={{ uri: url! }}
              injectedJavaScriptBeforeContentLoaded={injectScript}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={() => setLoading(false)}
              onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
              onNavigationStateChange={onNavigationStateChange}
              setSupportMultipleWindows={false}
              javaScriptEnabled
              domStorageEnabled
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              allowsBackForwardNavigationGestures
              startInLoadingState={false}
              style={styles.webview}
              {...(Platform.OS === 'android'
                ? { setBuiltInZoomControls: false, setDisplayZoomControls: false }
                : {})}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#64748b',
    lineHeight: 20,
  },
  webWrap: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loader: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    zIndex: 2,
  },
  errorWrap: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  errorBtn: {
    backgroundColor: college.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  errorBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
