import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { styled } from 'nativewind';
import { Colors } from '../theme';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);

interface InputFieldProps {
  label?: string;
  placeholder?: string;
  icon?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  className?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  icon,
  value,
  onChangeText,
  secureTextEntry,
  multiline,
  numberOfLines,
  className = ""
}) => {
  return (
    <StyledView className={`w-full ${className}`} style={{ gap: 4 }}>
      {label && (
        <StyledText className="text-xs font-bold uppercase px-1" style={{ color: Colors.onSurfaceVariant }}>
          {label}
        </StyledText>
      )}
      <StyledView className="relative flex-row items-center">
        {icon && (
          <StyledText className="absolute left-4 z-10 text-lg" style={{ color: Colors.onSurfaceVariant }}>
            {icon}
          </StyledText>
        )}
        <StyledTextInput
          className={`w-full bg-white border-2 rounded-lg text-sm ${icon ? 'pl-12' : 'px-4'} ${multiline ? 'p-4' : 'h-14'}`}
          style={{ borderColor: Colors.outline, color: Colors.onSurface }}
          placeholder={placeholder}
          placeholderTextColor={Colors.outlineVariant}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </StyledView>
    </StyledView>
  );
};
