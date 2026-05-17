import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { Colors } from '../theme';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

interface IndustrialCardProps {
  children: React.ReactNode;
  indicatorColor?: string;
  onPress?: () => void;
  className?: string;
}

export const IndustrialCard: React.FC<IndustrialCardProps> = ({
  children,
  indicatorColor,
  onPress,
  className = ""
}) => {
  const Container = onPress ? StyledTouchableOpacity : StyledView;

  return (
    <Container 
      onPress={onPress}
      className={`bg-white border-2 rounded-lg relative overflow-hidden ${className}`}
      style={{ borderColor: Colors.outlineVariant }}
    >
      {indicatorColor && (
        <StyledView 
          className="absolute left-0 top-0 bottom-0 w-1" 
          style={{ backgroundColor: indicatorColor }} 
        />
      )}
      <StyledView className={`${indicatorColor ? 'pl-4' : 'p-4'}`}>
        {children}
      </StyledView>
    </Container>
  );
};
