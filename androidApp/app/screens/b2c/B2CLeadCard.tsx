import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import {
  B2CProfile,
  getKycDocProgress,
  getProfileApprovalStatus,
  getProfileFollowupBucket,
  getProfileFollowupDateLabel,
  getProfileSubStatusTitle,
  markB2CKycDone,
} from '../../services/b2cApi';
import { B2CLeadDetailsPanel } from './B2CLeadDetailsPanel';

type Props = {
  profile: B2CProfile;
  /** Cross-sale course profiles — course tabs render inside the card */
  groupProfiles?: B2CProfile[];
  onSelectGroupProfile?: (id: string) => void;
  onStatusChange: () => void;
  onFollowup: (type: 'Call' | 'Visit') => void;
  onDial: (raw: string | number | undefined) => void;
  onWhatsApp: (raw: string | number | undefined) => void;
  onCrossSale?: () => void;
  onReapply?: () => void;
  onHistory?: () => void;
  onRefresh?: () => void;
};

const PINK = '#fc567b';

function courseTabLabel(p: B2CProfile): string {
  const name = p._course?.name;
  if (typeof name === 'string' && name.trim() && name.trim() !== '—') {
    return name.trim();
  }
  return 'Course';
}

function approvalColors(status: 'approved' | 'pending' | 'rejected') {
  if (status === 'approved') {
    return { bg: '#10b981', border: '#059669', label: 'APPROVED' };
  }
  if (status === 'rejected') {
    return { bg: '#ef4444', border: '#dc2626', label: 'REJECTED' };
  }
  return { bg: '#f59e0b', border: '#d97706', label: 'PENDING' };
}

function DashStat({
  label,
  value,
  bg,
}: {
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <View style={[styles.dashStat, { backgroundColor: bg }]}>
      <Text style={styles.dashStatLabel} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
      <View style={styles.dashStatLine} />
      <Text style={styles.dashStatVal}>{String(value).padStart(2, '0')}</Text>
    </View>
  );
}

function FollowupSection({
  title,
  profile,
  type,
  onEdit,
  stats,
  containerStyle,
}: {
  title: string;
  profile: B2CProfile;
  type?: 'Call' | 'Visit';
  onEdit?: () => void;
  stats: { label: string; value: number; bg: string }[];
  containerStyle?: object;
}) {
  const dateLabel =
    type != null ? getProfileFollowupDateLabel(profile, type) : null;

  return (
    <View style={[styles.followSection, containerStyle]}>
      <View style={styles.followSectionHead}>
        <Text style={styles.followSectionTitle}>{title}</Text>
        {onEdit ? (
          <Pressable onPress={onEdit} style={styles.followEdit} hitSlop={8}>
            <Icon name="pen" size={10} color="#fff" solid />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.dashStatRow}>
        {stats.map(s => (
          <DashStat
            key={s.label}
            label={s.label}
            value={s.value}
            bg={s.bg}
          />
        ))}
      </View>
      {dateLabel != null ? (
        <View style={styles.followDateRow}>
          <Text style={styles.followDateLabel}>Next Follow-up Date:</Text>
          <Text style={styles.followDateVal} numberOfLines={1}>
            {dateLabel}
          </Text>
        </View>
      ) : (
        <View style={styles.followDateSpacer} />
      )}
    </View>
  );
}

function KycSection({
  profile,
  onEdit,
  onMarkDone,
  marking,
}: {
  profile: B2CProfile;
  onEdit: () => void;
  onMarkDone: () => void;
  marking: boolean;
}) {
  const kp = getKycDocProgress(profile);
  const isDone = profile.kyc === true;

  return (
    <View style={styles.followSection}>
      <View style={styles.followSectionHead}>
        <Text style={styles.followSectionTitle}>KYC</Text>
        <Pressable onPress={onEdit} style={styles.followEdit} hitSlop={8}>
          <Icon name="pen" size={10} color="#fff" solid />
        </Pressable>
      </View>
      <View style={styles.dashStatRow}>
        <DashStat label="Verified" value={kp.verified} bg="#10b981" />
        <DashStat label="Pending" value={kp.pending} bg="#f59e0b" />
        <DashStat label="Rejected" value={kp.rejected} bg="#ef4444" />
      </View>
      <View style={styles.kycActionRow}>
        {!isDone ? (
          <Pressable
            style={[styles.kycBtn, marking && styles.kycBtnDisabled]}
            onPress={onMarkDone}
            disabled={marking}
          >
            {marking ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.kycBtnText}>Mark KYC Done</Text>
            )}
          </Pressable>
        ) : (
          <View style={styles.kycDoneBadge}>
            <Text style={styles.kycDoneText}>KYC Done</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function LeadActionMenu({
  visible,
  onClose,
  onFollowupCall,
  onFollowupVisit,
  onPreVerification,
  onHistory,
  onCrossSale,
}: {
  visible: boolean;
  onClose: () => void;
  onFollowupCall: () => void;
  onFollowupVisit: () => void;
  onPreVerification: () => void;
  onHistory?: () => void;
  onCrossSale?: () => void;
}) {
  const insets = useSafeAreaInsets();

  const items = [
    {
      key: 'followup-call',
      icon: 'phone',
      iconColor: '#f59e0b',
      label: 'Set Followup (Call)',
      onPress: onFollowupCall,
    },
    {
      key: 'followup-visit',
      icon: 'map-marker-alt',
      iconColor: '#f59e0b',
      label: 'Set Followup (Visit)',
      onPress: onFollowupVisit,
    },
    {
      key: 'pre-verification',
      icon: 'clipboard-check',
      iconColor: PINK,
      label: 'Add Pre Verification',
      onPress: onPreVerification,
    },
    ...(onCrossSale
      ? [
          {
            key: 'cross-sale',
            icon: 'plus-circle',
            iconColor: PINK,
            label: 'Cross Sale',
            onPress: onCrossSale,
          },
        ]
      : []),
    ...(onHistory
      ? [
          {
            key: 'history',
            icon: 'history',
            iconColor: '#64748b',
            label: 'History List',
            onPress: onHistory,
          },
        ]
      : []),
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={menuStyles.backdrop} onPress={onClose}>
        <Pressable
          style={[menuStyles.sheet, { paddingBottom: 12 + insets.bottom }]}
          onPress={e => e.stopPropagation()}
        >
          <View style={menuStyles.header}>
            <Text style={menuStyles.title}>Lead Action</Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={menuStyles.closeBtn}
              accessibilityLabel="Close menu"
            >
              <Text style={menuStyles.closeText}>✕</Text>
            </Pressable>
          </View>

          <View style={menuStyles.list}>
            {items.map(item => (
              <Pressable
                key={item.key}
                style={menuStyles.item}
                onPress={() => {
                  onClose();
                  item.onPress();
                }}
              >
                <View style={menuStyles.itemIcon}>
                  <Icon name={item.icon} size={14} color={item.iconColor} solid />
                </View>
                <Text style={menuStyles.itemLabel}>{item.label}</Text>
                <Icon name="chevron-right" size={12} color="#94a3b8" />
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function B2CLeadCard({
  profile,
  groupProfiles,
  onSelectGroupProfile,
  onStatusChange,
  onFollowup,
  onDial,
  onWhatsApp,
  onCrossSale,
  onReapply,
  onHistory,
  onRefresh,
}: Props) {
  const { user } = useAuth();
  const token = user?.token ?? '';
  const [expanded, setExpanded] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);
  const [kycMarking, setKycMarking] = React.useState(false);
  const [actionMenuOpen, setActionMenuOpen] = React.useState(false);
  const [localKycDone, setLocalKycDone] = React.useState(profile.kyc === true);

  React.useEffect(() => {
    setLocalKycDone(profile.kyc === true);
  }, [profile._id, profile.kyc]);

  const displayProfile = React.useMemo(
    () => ({ ...profile, kyc: localKycDone || profile.kyc }),
    [profile, localKycDone],
  );

  const openExpanded = (tab = 0) => {
    setActiveTab(tab);
    setExpanded(true);
  };

  const handleMarkKycDone = async () => {
    if (!token) {
      Alert.alert('Login required');
      return;
    }
    Alert.alert(
      'Mark KYC Done',
      'All mandatory documents must be verified. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setKycMarking(true);
            try {
              const res = await markB2CKycDone(token, profile._id);
              if (res.ok) {
                setLocalKycDone(true);
                onRefresh?.();
                Alert.alert('Success', 'KYC marked as done.');
              } else {
                Alert.alert('Failed', res.message || 'Could not mark KYC done');
              }
            } finally {
              setKycMarking(false);
            }
          },
        },
      ],
    );
  };

  const candidateName = profile._candidate?.name || '—';
  const mobile = profile._candidate?.mobile;
  const wa = profile._candidate?.whatsapp || profile._candidate?.mobile;
  const statusTitle = profile._leadStatus?.title || 'No Status';
  const subStatusTitle = getProfileSubStatusTitle(profile) || '—';
  const approval = getProfileApprovalStatus(profile);
  const appr = approvalColors(approval);

  const callBucket = getProfileFollowupBucket(displayProfile, 'Call');
  const visitBucket = getProfileFollowupBucket(displayProfile, 'Visit');

  const tabProfiles =
    groupProfiles && groupProfiles.length > 1 ? groupProfiles : [profile];
  const multiGroup = tabProfiles.length > 1;

  return (
    <View style={styles.card}>
      <View style={styles.courseTabs}>
        {onReapply ? (
          <Pressable
            style={styles.reapplyBtn}
            onPress={onReapply}
            accessibilityLabel="ReApply history"
          >
            <Text style={styles.reapplyBtnText}>ReApply</Text>
          </Pressable>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.courseTabsScrollView}
          contentContainerStyle={styles.courseTabsScroll}
        >
          {tabProfiles.map(p => {
            const selected = String(p._id) === String(profile._id);
            return (
              <Pressable
                key={p._id}
                onPress={() => {
                  if (multiGroup && onSelectGroupProfile) {
                    onSelectGroupProfile(String(p._id));
                  }
                }}
                disabled={!multiGroup}
                style={[
                  styles.courseTab,
                  multiGroup && !selected && styles.courseTabInactive,
                  multiGroup && selected && styles.courseTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.courseTabText,
                    multiGroup && !selected && styles.courseTabTextInactive,
                  ]}
                  numberOfLines={1}
                >
                  {courseTabLabel(p)}
                </Text>
              </Pressable>
            );
          })}
          {onCrossSale ? (
            <Pressable
              style={styles.crossSaleChip}
              onPress={onCrossSale}
              accessibilityLabel="Add cross sale"
            >
              <Text style={styles.crossSaleChipText} numberOfLines={1}>
                + Cross Sale
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>

        <Pressable
          style={styles.menuBtn}
          onPress={() => setActionMenuOpen(true)}
          accessibilityLabel="More actions"
        >
          <Icon name="ellipsis-v" size={14} color={PINK} solid />
        </Pressable>
      </View>

      <View style={styles.header}>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.iconCircleBtn}
            onPress={() => {
              if (expanded) {
                setExpanded(false);
              } else {
                openExpanded(0);
              }
            }}
            accessibilityLabel={expanded ? 'Collapse details' : 'Expand details'}
          >
            <Icon
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={13}
              color={PINK}
              solid
            />
          </Pressable>
        </View>

        <View style={styles.tagsWrap}>
          <Pressable style={styles.tagsLeft} onPress={onStatusChange}>
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText} numberOfLines={1}>
                {statusTitle}
              </Text>
              <Icon name="pen" size={8} color="#fff" solid />
            </View>
            <View style={styles.tagPillOutline}>
              <Text style={styles.tagPillOutlineText} numberOfLines={1}>
                {subStatusTitle}
              </Text>
            </View>
          </Pressable>
          <View
            style={[
              styles.tagPillApproval,
              { backgroundColor: appr.bg, borderColor: appr.border },
            ]}
          >
            <Text style={styles.tagApprovalLabel}>Approval</Text>
            <Text style={styles.tagApprovalText}>{appr.label}</Text>
          </View>
        </View>

        <View style={styles.namePanel}>
          <View style={styles.nameRow}>
            <View style={styles.avatarCircle}>
              <Icon name="user" size={16} color={PINK} solid />
            </View>
            <View style={styles.nameCol}>
              <Text style={styles.personName} numberOfLines={1}>
                {candidateName}
              </Text>
            </View>
          </View>
          <View style={styles.contactRow}>
            <Pressable
              style={styles.contactItem}
              onPress={() => mobile && onDial(mobile)}
              disabled={!mobile}
              accessibilityLabel="Call"
            >
              <View style={[styles.iconActionBtn, styles.phoneIconBtn]}>
                <Icon name="phone" size={14} color="#fff" solid />
              </View>
              <Text style={styles.phoneText} numberOfLines={1}>
                {mobile ? String(mobile) : '—'}
              </Text>
            </Pressable>
            {wa ? (
              <Pressable
                style={styles.contactItem}
                onPress={() => onWhatsApp(wa)}
                accessibilityLabel="WhatsApp"
              >
                <View style={[styles.iconActionBtn, styles.waIconBtn]}>
                  <Icon name="whatsapp" size={15} color="#fff" brand />
                </View>
                <Text style={styles.waNumber} numberOfLines={1}>
                  {profile._candidate?.whatsapp
                    ? String(profile._candidate.whatsapp)
                    : String(mobile)}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.followupPairRow}>
          <FollowupSection
            title="Followup Calling"
            profile={displayProfile}
            type="Call"
            onEdit={() => onFollowup('Call')}
            stats={[
              {
                label: 'Done',
                value: callBucket === 'done' ? 1 : 0,
                bg: '#12b3ff',
              },
              {
                label: 'Planned',
                value: callBucket === 'planned' ? 1 : 0,
                bg: '#f59e0b',
              },
              {
                label: 'Missed',
                value: callBucket === 'missed' ? 1 : 0,
                bg: '#7c3d14',
              },
            ]}
          />
          <FollowupSection
            title="Followup Visit"
            profile={displayProfile}
            type="Visit"
            onEdit={() => onFollowup('Visit')}
            stats={[
              {
                label: 'Done',
                value: visitBucket === 'done' ? 1 : 0,
                bg: '#4b5563',
              },
              {
                label: 'Planned',
                value: visitBucket === 'planned' ? 1 : 0,
                bg: '#4b5563',
              },
              {
                label: 'Missed',
                value: visitBucket === 'missed' ? 1 : 0,
                bg: '#7c3d14',
              },
            ]}
          />
        </View>
        <KycSection
          profile={displayProfile}
          onEdit={() => openExpanded(4)}
          onMarkDone={handleMarkKycDone}
          marking={kycMarking}
        />
      </View>

      {expanded && token ? (
        <B2CLeadDetailsPanel
          token={token}
          profile={displayProfile}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      ) : null}

      <LeadActionMenu
        visible={actionMenuOpen}
        onClose={() => setActionMenuOpen(false)}
        onFollowupCall={() => onFollowup('Call')}
        onFollowupVisit={() => onFollowup('Visit')}
        onPreVerification={() => openExpanded(5)}
        onHistory={onHistory}
        onCrossSale={onCrossSale}
      />
    </View>
  );
}

const glass = {
  backgroundColor: 'rgba(255,255,255,0.12)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.28)',
  borderRadius: 12,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  courseTabs: {
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff9fb',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
    minHeight: 44,
  },
  reapplyBtn: {
    position: 'absolute',
    top: 6,
    left: 12,
    zIndex: 2,
    backgroundColor: '#10b981',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  reapplyBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  courseTabsScrollView: {
    flex: 1,
    marginLeft: 72,
    marginRight: 36,
  },
  courseTabsScroll: {
    gap: 8,
    alignItems: 'center',
    paddingRight: 4,
  },
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(252, 86, 123, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseTab: {
    maxWidth: 180,
    backgroundColor: PINK,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  courseTabActive: {
    backgroundColor: PINK,
    borderWidth: 1,
    borderColor: PINK,
  },
  courseTabInactive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(252, 86, 123, 0.35)',
  },
  courseTabText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  courseTabTextInactive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  crossSaleChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: PINK,
  },
  crossSaleChipText: {
    color: PINK,
    fontWeight: '900',
    fontSize: 12,
  },
  header: {
    backgroundColor: PINK,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 4,
    position: 'relative',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
    paddingRight: 44,
  },
  tagsLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    minWidth: 0,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    maxWidth: 120,
  },
  tagPillOutline: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    maxWidth: '100%',
  },
  tagPillOutlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
    maxWidth: 110,
  },
  tagPillApproval: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    alignItems: 'center',
    flexShrink: 0,
  },
  tagApprovalLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.4,
  },
  tagApprovalText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerActions: {
    position: 'absolute',
    top: 6,
    right: 10,
    flexDirection: 'row',
    gap: 4,
    zIndex: 2,
  },
  iconCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  namePanel: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 9,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff1f4',
    borderWidth: 2,
    borderColor: '#fecdd3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
  },
  personName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 19,
    textTransform: 'capitalize',
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    marginTop: 3,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: '46%',
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneIconBtn: {
    backgroundColor: '#10b981',
  },
  waIconBtn: {
    backgroundColor: '#25D366',
  },
  phoneText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '800',
    color: '#047857',
  },
  waNumber: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '800',
    color: '#15803d',
  },
  followupPairRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  followSection: {
    ...glass,
    flex: 1,
    minWidth: 0,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 6,
  },
  followSectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  followSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
    backgroundColor: 'rgba(252,86,123,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  followEdit: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashStatRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dashStat: {
    flex: 1,
    minHeight: 44,
    borderRadius: 7,
    paddingVertical: 4,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    width: '100%',
  },
  dashStatLine: {
    width: '60%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginVertical: 4,
  },
  dashStatVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fff',
  },
  followDateRow: {
    marginTop: 6,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.22)',
  },
  followDateLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.85)',
  },
  followDateVal: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    marginTop: 1,
  },
  followDateSpacer: {
    height: 4,
  },
  kycActionRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  kycBtn: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  kycBtnDisabled: { opacity: 0.7 },
  kycBtnText: {
    color: PINK,
    fontWeight: '800',
    fontSize: 12,
  },
  kycDoneBadge: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  kycDoneText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
});

const menuStyles = StyleSheet.create({
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { flex: 1, fontSize: 16, fontWeight: '800', color: '#0f172a' },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 18, color: '#64748b' },
  list: { gap: 4, paddingBottom: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff9fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0f172a' },
});
