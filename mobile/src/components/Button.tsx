import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { styled } from 'nativewind';
import { Colors } from '../theme';

const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledText = styled(Text);
const StyledView = styled(View);

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'error';
  icon?: string;
  fullWidth?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  onPress, 
  variant = 'primary', 
  icon, 
  fullWidth = true,
  className = ""
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'secondary':
        return { 
          bg: 'bg-secondary-container', 
          text: 'text-on-secondary-container', 
          border: 'border-secondary' 
        };
      case 'outline':
        return { 
          bg: 'bg-transparent', 
          text: 'text-on-surface-variant', 
          border: 'border-outline' 
        };
      case 'error':
        return { 
          bg: 'bg-error-container', 
          text: 'text-on-error-container', 
          border: 'border-error' 
        };
      default:
        return { 
          bg: 'bg-primary', 
          text: 'text-white', 
          border: 'border-primary' 
        };
    }
  };

  const styles = getStyles();

  return (
    <StyledTouchableOpacity 
      onPress={onPress}
      className={`${fullWidth ? 'w-full' : 'w-auto'} h-14 flex-row items-center justify-center rounded-lg border-2 active:scale-[0.98] transition-all ${styles.bg} ${styles.border} ${className}`}
      style={{ gap: 8 }}
    >
      <StyledText className={`text-base font-bold uppercase ${styles.text}`}>
        {label}
      </StyledText>
      {icon && <StyledText className={`text-xl ${styles.text}`}>{icon}</StyledText>}
    </StyledTouchableOpacity>
  );
};
