import React from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing, BorderRadius } from '../theme';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);

const SplashScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <StyledView className="flex-1 items-center justify-center px-4 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <StyledView 
          className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] border-2 opacity-10 rotate-12"
          style={{ borderColor: Colors.outline }}
        />
        <StyledView 
          className="absolute bottom-[-5%] left-[-5%] w-[60%] h-[60%] border-2 opacity-10 -rotate-6"
          style={{ borderColor: Colors.outlineVariant }}
        />

        {/* Center Cluster */}
        <StyledView className="z-10 items-center w-full max-w-sm" style={{ gap: Spacing.stackLg }}>
          <StyledView 
            className="p-2 bg-white rounded-xl shadow-md border-2"
            style={{ borderColor: Colors.outlineVariant }}
          >
            <StyledImage 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaYOdm7C03OURaeVUlKpGDPxZCkX7fQmdwSuJ0HS9jSALyFu9DZ5cy5tLRaec_O_Hr7w6atPnhEvIFkCFRtvwQ6yuRZO13xF43RrO-Ovjti1o3NJkggeURoqtjnRnWFanGNsjwg77JqLEyDq-l741AKBzD1gBJcWtVNOOTv8B9mKGslq15i3sf-8ehno5ifOpKhQTjPsxWHbWJs60_HvZIBasmA6WDs9AfCkQc7P5IdAdZKDKiIr_U4akx33-LfrAaWl_IN0mB2g' }}
              className="w-48 h-48"
              resizeMode="contain"
            />
          </StyledView>

          <StyledView className="items-center" style={{ gap: 8 }}>
            <StyledText className="text-3xl font-bold uppercase tracking-tight" style={{ color: Colors.primary }}>
              HSE Platform
            </StyledText>
            <StyledView className="flex-row items-center" style={{ gap: 8 }}>
              <StyledText style={{ color: Colors.onSurfaceVariant }}>🛡️</StyledText>
              <StyledText className="text-sm font-semibold uppercase" style={{ color: Colors.onSurfaceVariant }}>
                Operational Safety & Compliance
              </StyledText>
            </StyledView>
          </StyledView>

          <StyledView 
            className="flex-row items-center px-4 py-2 rounded-full border"
            style={{ backgroundColor: Colors.surfaceContainerHigh, borderColor: Colors.outlineVariant, marginTop: Spacing.stackMd }}
          >
            <StyledText className="mr-2" style={{ color: Colors.primary }}>🔒</StyledText>
            <StyledText className="text-xs font-bold uppercase" style={{ color: Colors.onSurface }}>
              Secure Enterprise Login
            </StyledText>
          </StyledView>
        </StyledView>

        {/* Interaction Area */}
        <StyledView className="absolute bottom-10 left-0 right-0 px-4 items-center" style={{ gap: Spacing.stackLg }}>
          <StyledTouchableOpacity 
            className="w-full h-12 flex-row items-center justify-center rounded-lg shadow-lg active:scale-95 transition-transform"
            style={{ backgroundColor: Colors.primary, gap: Spacing.stackMd }}
            onPress={() => navigation?.navigate('Login')}
          >
            <StyledText className="text-lg font-bold text-white uppercase">GET STARTED</StyledText>
            <StyledText className="text-white text-xl">➡️</StyledText>
          </StyledTouchableOpacity>

          <StyledView className="w-full items-center border-t pt-4" style={{ borderColor: Colors.outlineVariant, gap: 8 }}>
            <StyledText className="text-xs uppercase tracking-widest" style={{ color: Colors.onSurfaceVariant }}>
              Version v2.4.1
            </StyledText>
            <StyledView className="flex-row" style={{ gap: 16 }}>
              <StyledText className="text-xs font-bold uppercase" style={{ color: Colors.outline }}>PRIVACY</StyledText>
              <StyledText className="text-xs font-bold uppercase" style={{ color: Colors.outline }}>TERMS</StyledText>
            </StyledView>
          </StyledView>
        </StyledView>

        {/* Side Accent Bars */}
        <StyledView className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: Colors.secondaryContainer }} />
        <StyledView className="absolute top-0 right-0 w-2 h-full" style={{ backgroundColor: Colors.primary }} />
      </StyledView>
    </SafeAreaView>
  );
};

export default SplashScreen;
