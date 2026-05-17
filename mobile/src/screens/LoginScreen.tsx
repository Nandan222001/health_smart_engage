import React, { useState } from 'react';
import { View, Text, Image, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors } from '../theme';
import { Button, InputField } from '../components';
import { useAuth } from '../hooks/useAuth';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();

  const handleLogin = () => {
    login(email, password, () => navigation?.navigate('SiteSelection'));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <StyledView className="flex-1 items-center justify-center p-4 relative overflow-hidden">
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
            <StyledView className="w-full bg-white border-2 p-6 shadow-sm" style={{ borderColor: Colors.outlineVariant }}>
              <StyledView className="mb-6">
                <StyledText className="text-2xl font-semibold mb-2" style={{ color: Colors.onSurface }}>
                  Sign In
                </StyledText>
                <StyledText className="text-sm" style={{ color: Colors.onSurfaceVariant }}>
                  Use your corporate account to continue.
                </StyledText>
              </StyledView>

              <InputField 
                label="Corporate Email"
                placeholder="e.g. j.doe@company.com"
                icon="✉️"
                value={email}
                onChangeText={setEmail}
                className="mb-4"
              />

              <InputField 
                label="Password"
                placeholder="••••••••"
                icon="🔒"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                className="mb-6"
              />

              {error && <StyledText className="text-error text-xs mb-4">{error}</StyledText>}

              <Button 
                label={loading ? "Signing In..." : "Sign In"}
                onPress={handleLogin}
                icon="🚪"
              />

              {/* SSO Hint */}
              <StyledView className="mt-6 pt-6 border-t border-[#c3c6d6]">
                <StyledView className="flex-row items-center justify-center py-3 px-4 bg-[#f3f4f6] border border-[#c3c6d6] opacity-60" style={{ gap: 12 }}>
                  <StyledView className="w-5 h-5 bg-white items-center justify-center">
                    <StyledText className="text-[10px]">🏢</StyledText>
                  </StyledView>
                  <StyledText className="text-sm font-semibold" style={{ color: Colors.onSurfaceVariant }}>
                    Signed in as Enterprise User
                  </StyledText>
                </StyledView>
              </StyledView>
            </StyledView>
          </StyledView>
        </StyledView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;
