import React from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { college } from '../../theme/college';

export type FilterOption = { value: string; label: string };

type Props = {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function B2BFilterSelect({
  label,
  value,
  options,
  onChange,
  disabled,
  placeholder = 'All',
}: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = React.useState(false);

  const selectedLabel =
    options.find(o => o.value === value)?.label || placeholder;

  const allOptions: FilterOption[] = [
    { value: '', label: 'All' },
    ...options.filter(o => o.value !== ''),
  ];

  return (
    <>
      <View style={styles.wrap}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          style={[styles.select, disabled && styles.selectDisabled]}
          onPress={() => !disabled && setOpen(true)}
          disabled={disabled}
        >
          <Text style={styles.selectText} numberOfLines={1}>
            {selectedLabel}
          </Text>
          <Text style={styles.chevron}>▾</Text>
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: 12 + insets.bottom }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={allOptions}
              keyExtractor={item => item.value || '__all__'}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <Pressable
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        active && styles.optionTextActive,
                      ]}
                      numberOfLines={2}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 148, marginRight: 10 },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: college.textMuted,
    letterSpacing: 0.4,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: college.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 38,
  },
  selectDisabled: { opacity: 0.55, backgroundColor: '#f8f9fa' },
  selectText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: college.text,
    marginRight: 4,
  },
  chevron: { fontSize: 12, color: college.textMuted },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '55%',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: college.border,
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: college.text,
    marginBottom: 8,
  },
  list: { maxHeight: 320 },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: college.border,
  },
  optionActive: { backgroundColor: 'rgba(252, 43, 90, 0.08)' },
  optionText: { fontSize: 15, color: college.text },
  optionTextActive: { color: college.primary, fontWeight: '700' },
});
