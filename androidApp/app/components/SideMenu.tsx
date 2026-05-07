import React from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { college } from '../theme/college';

export type SideMenuItem = {
  id: string;
  label: string;
  hint?: string;
  accent?: string;
  onPress?: () => void;
  children?: SideMenuItem[];
  defaultExpanded?: boolean;
};

export type SideMenuSection = {
  title?: string;
  items: SideMenuItem[];
};

type Props = {
  visible: boolean;
  onClose: () => void;
  header?: { title: string; subtitle?: string };
  sections: SideMenuSection[];
};

export function SideMenu({ visible, onClose, header, sections }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const drawerWidth = Math.min(300, Math.round(width * 0.82));

  const slide = React.useRef(new Animated.Value(-drawerWidth)).current;
  const fade = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slide, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slide, {
          toValue: -drawerWidth,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slide, fade, drawerWidth]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          {
            width: drawerWidth,
            paddingTop: insets.top + 8,
            transform: [{ translateX: slide }],
          },
        ]}
      >
        {header ? (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{header.title}</Text>
            {header.subtitle ? (
              <Text style={styles.headerSub}>{header.subtitle}</Text>
            ) : null}
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section, idx) => (
            <View key={idx} style={styles.section}>
              {section.title ? (
                <Text style={styles.sectionTitle}>{section.title}</Text>
              ) : null}
              {section.items.map(item => (
                <MenuItemRow key={item.id} item={item} onClose={onClose} />
              ))}
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function MenuItemRow({
  item,
  onClose,
  depth = 0,
}: {
  item: SideMenuItem;
  onClose: () => void;
  depth?: number;
}) {
  const hasChildren = !!(item.children && item.children.length > 0);
  const [expanded, setExpanded] = React.useState(!!item.defaultExpanded);

  const handlePress = () => {
    if (hasChildren) {
      setExpanded(prev => !prev);
      return;
    }
    if (item.onPress) {
      onClose();
      setTimeout(item.onPress, 120);
    }
  };

  return (
    <View>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.itemRow,
          depth > 0 && styles.itemRowChild,
          pressed && styles.itemRowPressed,
        ]}
      >
        <View
          style={[
            styles.itemAccent,
            depth > 0 && styles.itemAccentChild,
            { backgroundColor: item.accent || college.primary },
          ]}
        />
        <View style={styles.itemTextWrap}>
          <Text
            style={[
              styles.itemLabel,
              depth > 0 && styles.itemLabelChild,
            ]}
          >
            {item.label}
          </Text>
          {item.hint ? (
            <Text style={styles.itemHint}>{item.hint}</Text>
          ) : null}
        </View>
        <Text style={styles.chev}>
          {hasChildren ? (expanded ? '⌄' : '›') : '›'}
        </Text>
      </Pressable>

      {hasChildren && expanded ? (
        <View style={styles.childWrap}>
          {item.children!.map(child => (
            <MenuItemRow
              key={child.id}
              item={child}
              onClose={onClose}
              depth={depth + 1}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdropPress: { flex: 1 },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#fff',
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 4, height: 0 },
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: college.tabBorder,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: college.text,
  },
  headerSub: {
    fontSize: 12,
    color: college.textMuted,
    marginTop: 2,
  },
  section: {
    paddingVertical: 6,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    fontSize: 11,
    fontWeight: '700',
    color: college.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  itemRowChild: {
    paddingLeft: 36,
    paddingVertical: 10,
  },
  itemRowPressed: {
    backgroundColor: '#f3f4f6',
  },
  itemAccent: {
    width: 4,
    height: 28,
    borderRadius: 2,
  },
  itemAccentChild: {
    width: 3,
    height: 22,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: college.text,
  },
  itemLabelChild: {
    fontSize: 13,
    fontWeight: '500',
  },
  itemHint: {
    fontSize: 11,
    color: college.textMuted,
    marginTop: 2,
  },
  chev: {
    color: college.textMuted,
    fontSize: 20,
    paddingHorizontal: 4,
  },
  childWrap: {
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: college.tabBorder,
  },
});
