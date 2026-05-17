import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { Colors } from '../theme';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

interface NavItem {
  icon: string;
  label: string;
  onPress?: () => void;
  active?: boolean;
}

interface BottomNavBarProps {
  items: NavItem[];
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ items }) => {
  return (
    <StyledView 
      className="absolute bottom-0 left-0 w-full flex-row justify-around items-center px-4 py-2 bg-white border-t-2 z-50"
      style={{ borderColor: Colors.outlineVariant }}
    >
      {items.map((item, index) => (
        <StyledTouchableOpacity 
          key={index}
          className={`flex-col items-center justify-center px-4 py-1 rounded-lg ${item.active ? 'bg-[#fed000]' : ''}`}
          onPress={item.onPress}
        >
          <StyledText className="text-xl">{item.icon}</StyledText>
          <StyledText className="text-[10px] font-bold" style={{ color: Colors.onSurface }}>
            {item.label}
          </StyledText>
        </StyledTouchableOpacity>
      ))}
    </StyledView>
  );
};
