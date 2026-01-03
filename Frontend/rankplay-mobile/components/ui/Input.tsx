/**
 * RankPlay Input Component
 * Professional styled text input
 */
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Colors, BorderRadius, FontSizes, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  secureTextEntry,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = secureTextEntry !== undefined;
  const showPassword = isPassword && isPasswordVisible;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? Colors.primary[600] : Colors.neutral[400]}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || isPassword) && styles.inputWithRightIcon,
          ]}
          placeholderTextColor={Colors.neutral[400]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIcon}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={Colors.neutral[400]}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !isPassword && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
            disabled={!onRightIconPress}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={Colors.neutral[400]}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.neutral[700],
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputContainerFocused: {
    borderColor: Colors.primary[600],
    backgroundColor: '#FFFFFF',
  },
  inputContainerError: {
    borderColor: Colors.accent.error,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSizes.lg,
    color: Colors.neutral[900],
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  leftIcon: {
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  rightIcon: {
    padding: Spacing.md,
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: Colors.accent.error,
    marginTop: Spacing.xs,
  },
});

export default Input;
