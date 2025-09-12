import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  className?: string;
}

export const Input: React.FC<InputProps> = ({ style, className, ...props }) => {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor="#9ca3af"
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#f9fafb',
    backgroundColor: '#1f2937',
    minHeight: 40,
  },
});
