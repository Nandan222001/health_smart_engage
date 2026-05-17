import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing, BorderRadius } from '../theme';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);
const StyledTextInput = styled(TextInput);

const LoginScreen = ({ navigation }: any) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <StyledView className="flex-1 items-center justify-center p-4 relative overflow-hidden">
          {/* Subtle Grid Pattern Placeholder */}
          <StyledView className="absolute inset-0 opacity-10" pointerEvents="none">
             {/* Radial gradient background is hard in RN without libs, so using a tint */}
             <StyledView className="w-full h-full bg-slate-200" />
          </StyledView>

          <StyledView className="w-full max-w-[440px] z-10 items-center">
            {/* Identity Header */}
            <StyledView className="mb-6 items-center">
              <StyledImage 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaYOdm7C03OURaeVUlKpGDPxZCkX7fQmdwSuJ0HS9jSALyFu9DZ5cy5tLRaec_O_Hr7w6atPnhEvIFkCFRtvwQ6yuRZO13xF43RrO-Ovjti1o3NJkggeURoqtjnRnWFanGNsjwg77JqLEyDq-l741AKBzD1gBJcWtVNOOTv8B9mKGslq15i3sf-8ehno5ifOpKhQTjPsxWHbWJs60_HvZIBasmA6WDs9AfCkQc7P5IdAdZKDKiIr_U4akx33-LfrAaWl_IN0mB2g' }}
                className="h-24 w-48 mb-4"
                resizeMode="contain"
              />
              <StyledText className="text-3xl font-bold tracking-tight" style={{ color: Colors.primary }}>
                HSE Platform
              </StyledText>
            </StyledView>

            {/* Auth Card */}
            <StyledView 
              className="w-full bg-white border-2 p-6 shadow-sm"
              style={{ borderColor: Colors.outlineVariant }}
            >
              <StyledView className="mb-6">
                <StyledText className="text-2xl font-semibold mb-2" style={{ color: Colors.onSurface }}>
                  Sign In
                </StyledText>
                <StyledText className="text-sm" style={{ color: Colors.onSurfaceVariant }}>
                  Use your corporate account to continue.
                </StyledText>
              </StyledView>

              {/* Email Input */}
              <StyledView className="mb-4">
                <StyledText className="text-sm font-semibold mb-1 px-1" style={{ color: Colors.onSurfaceVariant }}>
                  Corporate Email
                </StyledText>
                <StyledView className="relative flex-row items-center">
                  <StyledText className="absolute left-4 z-10" style={{ color: Colors.onSurfaceVariant }}>✉️</StyledText>
                  <StyledTextInput 
                    className="w-full h-14 pl-12 pr-4 bg-[#f3f4f6] border-2 border-[#c3c6d6] text-on-surface"
                    placeholder="e.g. j.doe@company.com"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    keyboardType="email-address"
                  />
                </StyledView>
              </StyledView>

              {/* Password Input */}
              <StyledView className="mb-6">
                <StyledView className="flex-row justify-between items-center px-1 mb-1">
                  <StyledText className="text-sm font-semibold" style={{ color: Colors.onSurfaceVariant }}>
                    Password
                  </StyledText>
                  <StyledTouchableOpacity>
                    <StyledText className="text-sm font-semibold" style={{ color: Colors.primary }}>
                      Forgot password?
                    </StyledText>
                  </StyledTouchableOpacity>
                </StyledView>
                <StyledView className="relative flex-row items-center">
                  <StyledText className="absolute left-4 z-10" style={{ color: Colors.onSurfaceVariant }}>🔒</StyledText>
                  <StyledTextInput 
                    className="w-full h-14 pl-12 pr-12 bg-[#f3f4f6] border-2 border-[#c3c6d6] text-on-surface"
                    placeholder="••••••••"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    secureTextEntry={!showPassword}
                  />
                  <StyledTouchableOpacity 
                    className="absolute right-4"
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <StyledText style={{ color: Colors.onSurfaceVariant }}>{showPassword ? '👁️' : '🕶️'}</StyledText>
                  </StyledTouchableOpacity>
                </StyledView>
              </StyledView>

              {/* Submit Action */}
              <StyledTouchableOpacity 
                className="w-full h-14 items-center justify-center flex-row rounded-none border-b-4 active:scale-[0.98] transition-all"
                style={{ backgroundColor: Colors.primary, borderColor: Colors.primaryContainer, gap: 8 }}
                onPress={() => navigation?.navigate('SiteSelection')}
              >
                <StyledText className="text-sm font-bold text-white uppercase">Sign In</StyledText>
                <StyledText className="text-white">🚪</StyledText>
              </StyledTouchableOpacity>

              {/* SSO Hint */}
              <StyledView className="mt-6 pt-6 border-t border-[#c3c6d6]">
                <StyledView 
                  className="flex-row items-center justify-center py-3 px-4 bg-[#f3f4f6] border border-[#c3c6d6] opacity-60"
                  style={{ gap: 12 }}
                >
                  <StyledView className="w-5 h-5 bg-white items-center justify-center">
                    <StyledText className="text-[10px]">🏢</StyledText>
                  </StyledView>
                  <StyledText className="text-sm font-semibold" style={{ color: Colors.onSurfaceVariant }}>
                    Signed in as Enterprise User
                  </StyledText>
                </StyledView>
              </StyledView>
            </StyledView>

            {/* Footer */}
            <StyledView className="mt-6 items-center px-3">
              <StyledView className="flex-row items-center justify-center mb-2" style={{ gap: 8 }}>
                <StyledText className="text-lg" style={{ color: Colors.onSurfaceVariant }}>🛡️</StyledText>
                <StyledText className="text-xs font-bold uppercase tracking-widest" style={{ color: Colors.onSurfaceVariant }}>
                  Secure Industrial Node
                </StyledText>
              </StyledView>
              <StyledText className="text-xs text-center leading-relaxed" style={{ color: Colors.outline }}>
                Your organization manages this secure login. Unauthorized access is strictly prohibited and subject to site policy.
              </StyledText>
            </StyledView>
          </StyledView>

          {/* Decorative Corner Brackets */}
          <StyledView className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 opacity-30" style={{ borderColor: Colors.outlineVariant }} />
          <StyledView className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 opacity-30" style={{ borderColor: Colors.outlineVariant }} />
          <StyledView className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 opacity-30" style={{ borderColor: Colors.outlineVariant }} />
          <StyledView className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 opacity-30" style={{ borderColor: Colors.outlineVariant }} />
        </StyledView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;
