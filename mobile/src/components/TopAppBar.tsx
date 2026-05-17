import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing } from '../theme';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);

interface TopAppBarProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  showProfile?: boolean;
  profileUri?: string;
  showNotifications?: boolean;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  showBack = false,
  onBack,
  showProfile = true,
  profileUri = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCv4BSFuoDqaaev9gdjozLAJActq-qjFf6MzozzwLpnBmvthSOofKBmqlG7RJbr0f7nCq19mafI7gYOPC0HEqF66Lwz2eXilJTcmeq9am1VxjDwBX-obZTj4Nz6elK8JO6EjutwMbEkojN6mVR9YB10bBKIZJecZGvKsoW5HhHm1o2MoP9YCQcuhk1bWX3s1ANcpa6oxXKAgBlrLFTbAIXFRG2KK2liSyp0U_mCdnUz4nJJH8UhQVLl9o3RT3UNVLGWsUpG95fsXg',
  showNotifications = true
}) => {
  return (
    <StyledView 
      className="flex-row justify-between items-center w-full px-4 h-14 bg-white border-b-2 z-50"
      style={{ borderColor: Colors.outlineVariant }}
    >
      <StyledView className="flex-row items-center" style={{ gap: Spacing.stackSm }}>
        {showBack ? (
          <StyledTouchableOpacity className="w-10 h-10 items-center justify-center rounded-lg" onPress={onBack}>
            <StyledText className="text-xl" style={{ color: Colors.primary }}>←</StyledText>
          </StyledTouchableOpacity>
        ) : (
          <StyledTouchableOpacity className="w-10 h-10 items-center justify-center rounded-lg">
            <StyledText className="text-xl" style={{ color: Colors.primary }}>☰</StyledText>
          </StyledTouchableOpacity>
        )}
        <StyledText className="text-xl font-bold" style={{ color: Colors.primary }}>{title}</StyledText>
      </StyledView>

      <StyledView className="flex-row items-center" style={{ gap: 16 }}>
        {showNotifications && (
          <StyledTouchableOpacity className="w-10 h-10 items-center justify-center">
            <StyledText className="text-xl" style={{ color: Colors.primary }}>🔔</StyledText>
          </StyledTouchableOpacity>
        )}
        {showProfile && (
          <StyledView className="w-10 h-10 rounded-full bg-[#edeef0] border overflow-hidden" style={{ borderColor: Colors.outlineVariant }}>
            <StyledImage source={{ uri: profileUri }} className="w-full h-full" />
          </StyledView>
        )}
      </StyledView>
    </StyledView>
  );
};
