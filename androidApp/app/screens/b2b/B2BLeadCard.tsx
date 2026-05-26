import React from 'react';
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';
import {
  B2BApprovalStatus,
  B2BLead,
  getLeadB2bDepartmentName,
  getLeadB2bProjectName,
  getLeadDocumentsBucket,
  getLeadFollowupBucket,
  getLeadFollowupDateLabel,
  getLeadSubStatusTitle,
} from '../../services/b2bApi';

type Props = {
  lead: B2BLead;
  onStatusChange: () => void;
  onFollowup: (type: 'Call' | 'Visit') => void;
  onHistory: () => void;
  onDocuments: () => void;
  onAddReport: () => void;
  onViewReport: () => void;
  onReferLead: () => void;
  onDial: (raw: string | number | undefined) => void;
  onWhatsApp: (raw: string | number | undefined) => void;
};

const HEADER_BG = '#0b5ed7';
const PINK = 'rgb(250, 85, 121)';

function approvalColors(status: string) {
  const s = status.toUpperCase();
  if (s === 'APPROVED') {
    return { bg: '#10b981', border: '#059669' };
  }
  if (s === 'REJECTED') {
    return { bg: '#ef4444', border: '#dc2626' };
  }
  return { bg: '#f59e0b', border: '#d97706' };
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
  lead,
  type,
  onEdit,
  stats,
  containerStyle,
}: {
  title: string;
  lead: B2BLead;
  type?: 'Call' | 'Visit';
  onEdit?: () => void;
  stats: { label: string; value: number; bg: string }[];
  containerStyle?: object;
}) {
  const dateLabel =
    type != null ? getLeadFollowupDateLabel(lead, type) : null;

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

function LeadActionMenu({
  visible,
  onClose,
  onHistory,
}: {
  visible: boolean;
  onClose: () => void;
  onHistory: () => void;
}) {
  const insets = useSafeAreaInsets();

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
            <Pressable
              style={menuStyles.item}
              onPress={() => {
                onClose();
                onHistory();
              }}
            >
              <View style={menuStyles.itemIcon}>
                <Icon name="history" size={14} color={HEADER_BG} solid />
              </View>
              <Text style={menuStyles.itemLabel}>History</Text>
              <Icon name="chevron-right" size={12} color="#94a3b8" />
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function LeadQuickAction({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.quickActionBtn}
      onPress={onPress}
      accessibilityLabel={label}
    >
      <Icon name={icon} size={11} color="#fff" solid />
    </Pressable>
  );
}

export function B2BLeadCard({
  lead,
  onStatusChange,
  onFollowup,
  onHistory,
  onDocuments,
  onAddReport,
  onViewReport,
  onReferLead,
  onDial,
  onWhatsApp,
}: Props) {
  const [expanded, setExpanded] = React.useState(false);
  const [actionMenuOpen, setActionMenuOpen] = React.useState(false);

  const personName = lead.concernPersonName || '—';
  const businessName =
    lead.businessName &&
    lead.businessName !== lead.concernPersonName
      ? lead.businessName
      : '';
  const statusTitle =
    lead.status?.title || lead.status?.name || 'Untouch Lead';
  const subStatusTitle = getLeadSubStatusTitle(lead) || 'Untouch Lead';
  const approvalRaw = String(lead.approval?.status || 'PENDING').toUpperCase();
  const approval = (
    ['PENDING', 'APPROVED', 'REJECTED'].includes(approvalRaw)
      ? approvalRaw
      : 'PENDING'
  ) as B2BApprovalStatus;
  const appr = approvalColors(approval);
  const projectName = getLeadB2bProjectName(lead);
  const wa = lead.whatsapp || lead.mobile;

  const callBucket = getLeadFollowupBucket(lead, 'Call');
  const visitBucket = getLeadFollowupBucket(lead, 'Visit');
  const docBucket = getLeadDocumentsBucket(lead);

  const leadAgeDays = React.useMemo(() => {
    if (!lead.createdAt) return null;
    const d = new Date(lead.createdAt);
    if (isNaN(d.getTime())) return null;
    return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  }, [lead.createdAt]);

  return (
    <View style={styles.card}>
      {projectName !== '—' ? (
        <View style={styles.projectTabs}>
          <View style={styles.projectTab}>
            <Text style={styles.projectTabText} numberOfLines={1}>
              {projectName}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.header}>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.iconCircleBtn}
            onPress={() => setActionMenuOpen(true)}
            accessibilityLabel="Lead action menu"
          >
            <Icon name="ellipsis-v" size={13} color={HEADER_BG} solid />
          </Pressable>
          <Pressable
            style={styles.iconCircleBtn}
            onPress={() => setExpanded(v => !v)}
            accessibilityLabel={expanded ? 'Collapse details' : 'Expand details'}
          >
            <Icon
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={13}
              color={HEADER_BG}
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
            <Text style={styles.tagApprovalText}>{approval}</Text>
          </View>
        </View>

        <View style={styles.nameBlockRow}>
          <View style={[styles.topPanel, styles.namePanel, styles.namePanelMain]}>
            <View style={styles.nameRow}>
              <View style={styles.avatarCircle}>
                <Icon name="user" size={16} color={HEADER_BG} solid />
              </View>
              <View style={styles.nameCol}>
                <Text style={styles.personName} numberOfLines={1}>
                  {personName}
                </Text>
                {businessName ? (
                  <Text style={styles.businessName} numberOfLines={1}>
                    {businessName}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.contactRow}>
              <Pressable
                style={styles.contactItem}
                onPress={() => lead.mobile && onDial(lead.mobile)}
                disabled={!lead.mobile}
                accessibilityLabel="Call"
              >
                <View style={[styles.iconActionBtn, styles.phoneIconBtn]}>
                  <Icon name="phone" size={14} color="#fff" solid />
                </View>
                <Text style={styles.phoneText} numberOfLines={1}>
                  {lead.mobile ? String(lead.mobile) : '—'}
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
                    {lead.whatsapp
                      ? String(lead.whatsapp)
                      : String(lead.mobile)}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
          <View style={styles.metaPills}>
            <LeadQuickAction
              icon="share-alt"
              label="Refer Lead"
              onPress={onReferLead}
            />
            <LeadQuickAction
              icon="plus"
              label="Add Lead Report"
              onPress={onAddReport}
            />
            <LeadQuickAction
              icon="eye"
              label="View Lead Report"
              onPress={onViewReport}
            />
          </View>
        </View>

        <View style={styles.followupPairRow}>
          <FollowupSection
            title="Followup Calling"
            lead={lead}
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
            lead={lead}
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
        <FollowupSection
          title="Documents"
          lead={lead}
          onEdit={onDocuments}
          stats={[
            {
              label: 'Done',
              value: docBucket === 'done' ? 1 : 0,
              bg: '#4b5563',
            },
            {
              label: 'Pending',
              value: docBucket === 'pending' ? 1 : 0,
              bg: '#4b5563',
            },
          ]}
        />
      </View>

      {expanded ? (
        <View style={styles.metaPanel}>
          <Text style={styles.metaTitle}>Lead Detail</Text>
          <View style={styles.metaGrid}>
            <MetaItem
              label="Lead Age"
              value={
                leadAgeDays == null
                  ? '—'
                  : `${leadAgeDays} ${leadAgeDays === 1 ? 'day' : 'days'}`
              }
            />
            <MetaItem label="Lead Owner" value={lead.leadOwner?.name || '—'} />
            <MetaItem label="Added by" value={lead.leadAddedBy?.name || '—'} />
            <MetaItem
              label="B2B Department"
              value={getLeadB2bDepartmentName(lead)}
            />
            <MetaItem label="B2B Project" value={projectName} />
            <MetaItem
              label="Lead Source"
              value={lead.leadCategory?.name || '—'}
            />
            <MetaItem label="B2B Type" value={lead.typeOfB2B?.name || '—'} />
            {lead.email ? (
              <MetaItem
                label="Email"
                value={lead.email}
                onPress={() => Linking.openURL(`mailto:${lead.email}`)}
              />
            ) : null}
            {lead.city || lead.state ? (
              <MetaItem
                label="Location"
                value={[lead.city, lead.state].filter(Boolean).join(', ')}
              />
            ) : null}
          </View>
          <Pressable style={styles.historyBtn} onPress={onHistory}>
            <Icon name="history" size={12} color="#64748b" />
            <Text style={styles.historyBtnText}>History</Text>
          </Pressable>
        </View>
      ) : null}

      <LeadActionMenu
        visible={actionMenuOpen}
        onClose={() => setActionMenuOpen(false)}
        onHistory={onHistory}
      />
    </View>
  );
}

function MetaItem({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const inner = (
    <>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={2}>
        {value}
      </Text>
    </>
  );
  if (onPress) {
    return (
      <Pressable style={styles.metaItem} onPress={onPress}>
        {inner}
      </Pressable>
    );
  }
  return <View style={styles.metaItem}>{inner}</View>;
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
  projectTabs: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#fff9fb',
  },
  projectTab: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: PINK,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  projectTabText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  header: {
    backgroundColor: HEADER_BG,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 4,
    position: 'relative',
  },
  topPanel: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
    paddingRight: 76,
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
  nameBlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  namePanelMain: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  namePanel: {
    gap: 5,
    marginTop: 0,
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
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#bfdbfe',
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
  businessName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 1,
    lineHeight: 14,
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
  metaPills: {
    flexDirection: 'column',
    gap: 3,
    flexShrink: 0,
    justifyContent: 'center',
  },
  quickActionBtn: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: 'rgba(11,94,215,0.95)',
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
  metaPanel: {
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 14,
  },
  metaTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 10,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  historyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
});

const menuStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingHorizontal: 16,
    maxHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
    lineHeight: 18,
  },
  list: {
    gap: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
});
