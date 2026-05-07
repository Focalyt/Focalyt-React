import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { college } from '../theme/college';

type Props = {
  title: string;
  onMenuPress?: () => void;
  onBackPress?: () => void;
  rightSlot?: React.ReactNode;
};

export function AppHeader({
  title,
  onMenuPress,
  onBackPress,
  rightSlot,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        { paddingTop: insets.top + 4, height: 56 + insets.top },
      ]}
    >
      {onBackPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBackPress}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
      ) : onMenuPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          onPress={onMenuPress}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <View style={styles.bun} />
          <View style={[styles.bun, styles.bunMid]} />
          <View style={styles.bun} />
        </Pressable>
      ) : null}

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.rightSlot}>{rightSlot}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: college.tabBorder,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  backText: {
    fontSize: 28,
    color: college.primary,
    fontWeight: '600',
    lineHeight: 30,
    marginTop: -2,
  },
  bun: {
    width: 18,
    height: 2,
    borderRadius: 1.5,
    backgroundColor: college.text,
    marginVertical: 2,
  },
  bunMid: {
    width: 14,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: college.text,
  },
  rightSlot: {
    minWidth: 36,
    alignItems: 'flex-end',
  },
});
