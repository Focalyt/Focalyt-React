import React from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { college } from '../theme/college';

type IconName = 'user' | 'lock' | 'key';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  iconName: IconName;
  disabled?: boolean;
  showPasswordToggle?: boolean;
  passwordVisible?: boolean;
  onTogglePassword?: () => void;
} & Pick<
  TextInputProps,
  | 'keyboardType'
  | 'autoCapitalize'
  | 'autoCorrect'
  | 'textContentType'
  | 'returnKeyType'
  | 'onSubmitEditing'
  | 'maxLength'
  | 'secureTextEntry'
>;

export function CollegeInputField({
  value,
  onChangeText,
  placeholder,
  iconName,
  disabled,
  showPasswordToggle,
  passwordVisible,
  onTogglePassword,
  secureTextEntry,
  ...inputProps
}: Props) {
  const [focused, setFocused] = React.useState(false);

  return (
    <View
      style={[
        styles.wrap,
        focused && styles.wrapFocused,
        disabled && { backgroundColor: college.inputDisabledBg },
      ]}
    >
      <Icon
        name={iconName}
        size={14}
        color={college.icon}
        style={styles.leftIcon}
        solid
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={college.icon}
        editable={!disabled}
        secureTextEntry={secureTextEntry}
        style={[styles.input, disabled && { color: college.textMuted }]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...inputProps}
      />
      {showPasswordToggle ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
          onPress={onTogglePassword}
          style={styles.toggle}
          hitSlop={12}
        >
          <Icon
            name={passwordVisible ? 'eye-slash' : 'eye'}
            size={16}
            color={college.icon}
          />
        </Pressable>
      ) : (
        <View style={styles.toggleSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: college.border,
    borderRadius: 4,
    marginBottom: 15,
    minHeight: 46,
    paddingRight: 6,
    backgroundColor: college.cardBg,
  },
  wrapFocused: {
    borderColor: college.primary,
  },
  leftIcon: {
    marginLeft: 14,
    marginRight: 8,
    width: 18,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 8,
    fontSize: 14,
    color: college.text,
  },
  toggle: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  toggleSpacer: {
    width: 8,
  },
});
