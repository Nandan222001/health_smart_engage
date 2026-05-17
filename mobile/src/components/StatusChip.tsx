import React from 'react';
import { View, Text } from 'react-native';
import { styled } from 'nativewind';
import { Colors } from '../theme';

const StyledView = styled(View);
const StyledText = styled(Text);

interface StatusChipProps {
  label: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ 
  label, 
  variant = 'info',
  className = ""
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'success':
        return { bg: 'bg-[#2E7D32]', text: 'text-white' };
      case 'error':
        return { bg: 'bg-error-container', text: 'text-on-error-container' };
      case 'warning':
        return { bg: 'bg-secondary-container', text: 'text-on-secondary-container' };
      default:
        return { bg: 'bg-surface-container-high', text: 'text-on-surface' };
    }
  };

  const styles = getStyles();

  return (
    <StyledView className={`px-2 py-0.5 rounded-full border border-outline ${styles.bg} ${className}`}>
      <StyledText className={`text-[8px] font-bold uppercase ${styles.text}`}>
        {label}
      </StyledText>
    </StyledView>
  );
};
