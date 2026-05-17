import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView, ScrollView, TextInput, StyleSheet } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing, BorderRadius } from '../theme';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);
const StyledTextInput = styled(TextInput);

const PermitScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* TopAppBar */}
      <StyledView 
        className="flex-row justify-between items-center w-full px-4 h-14 bg-white border-b-2 z-50"
        style={{ borderColor: Colors.outlineVariant }}
      >
        <StyledView className="flex-row items-center" style={{ gap: Spacing.stackSm }}>
          <StyledTouchableOpacity 
            className="w-10 h-10 items-center justify-center rounded-lg"
            onPress={() => navigation?.goBack()}
          >
            <StyledText className="text-xl" style={{ color: Colors.primary }}>←</StyledText>
          </StyledTouchableOpacity>
          <StyledText className="text-xl font-bold" style={{ color: Colors.primary }}>HSE FieldSafe</StyledText>
        </StyledView>
        <StyledView className="w-10 h-10 rounded-full bg-[#edeef0] border overflow-hidden" style={{ borderColor: Colors.outlineVariant }}>
          <StyledImage 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCv4BSFuoDqaaev9gdjozLAJActq-qjFf6MzozzwLpnBmvthSOofKBmqlG7RJbr0f7nCq19mafI7gYOPC0HEqF66Lwz2eXilJTcmeq9am1VxjDwBX-obZTj4Nz6elK8JO6EjutwMbEkojN6mVR9YB10bBKIZJecZGvKsoW5HhHm1o2MoP9YCQcuhk1bWX3s1ANcpa6oxXKAgBlrLFTbAIXFRG2KK2liSyp0U_mCdnUz4nJJH8UhQVLl9o3RT3UNVLGWsUpG95fsXg' }}
            className="w-full h-full"
          />
        </StyledView>
      </StyledView>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <StyledView className="px-4 pt-6" style={{ gap: Spacing.stackLg }}>
          {/* Page Title */}
          <StyledView>
            <StyledText className="text-xl font-bold" style={{ color: Colors.onSurface }}>New Permit Request</StyledText>
            <StyledText className="text-sm" style={{ color: Colors.onSurfaceVariant }}>Complete all required safety fields below.</StyledText>
          </StyledView>

          {/* Asset Lookup */}
          <StyledView style={{ gap: Spacing.stackSm }}>
            <StyledText className="text-xs font-bold uppercase tracking-wider" style={{ color: Colors.onSurface }}>Asset Identification</StyledText>
            <StyledView className="relative">
              <StyledText className="absolute left-4 top-4 z-10" style={{ color: Colors.outline }}>🔍</StyledText>
              <StyledTextInput 
                className="w-full h-14 pl-12 pr-12 border-2 bg-white text-sm"
                style={{ borderColor: Colors.outline, color: Colors.onSurface }}
                placeholder="Search Asset or Scan QR"
                placeholderTextColor={Colors.outlineVariant}
              />
              <StyledTouchableOpacity className="absolute right-4 top-4">
                <StyledText className="text-xl" style={{ color: Colors.primary }}>📷</StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          </StyledView>

          {/* Controls Checklist */}
          <StyledView style={{ gap: Spacing.stackMd }}>
            <StyledView className="flex-row justify-between items-center">
              <StyledText className="text-xs font-bold uppercase tracking-wider" style={{ color: Colors.onSurface }}>Controls Checklist</StyledText>
              <StyledView className="bg-[#fed000] px-2 py-0.5 rounded-full">
                <StyledText className="text-[8px] font-bold" style={{ color: Colors.onSecondaryContainer }}>REQUIRED</StyledText>
              </StyledView>
            </StyledView>
            <StyledView style={{ gap: 8 }}>
              <ChecklistItem title="LOTO Verified" description="Lock Out Tag Out procedures confirmed" />
              <ChecklistItem title="PPE Inspected" description="Standard arc-flash and impact gear ready" />
              <ChecklistItem title="Ventilation Active" description="Confined space airflow monitoring started" />
              <ChecklistItem title="Fire Watch Stationed" description="Personnel with extinguisher present" />
            </StyledView>
          </StyledView>

          {/* Signature Section */}
          <StyledView style={{ gap: Spacing.stackSm }}>
            <StyledText className="text-xs font-bold uppercase tracking-wider" style={{ color: Colors.onSurface }}>Authorization Signature</StyledText>
            <StyledView className="w-full h-40 bg-white border-2 border-dashed items-center justify-center relative" style={{ borderColor: Colors.outline }}>
              {/* Grid pattern background placeholder */}
              <StyledView className="absolute inset-0 opacity-10 bg-slate-200" pointerEvents="none" />
              <StyledText className="text-lg font-bold opacity-30" style={{ color: Colors.outlineVariant }}>Sign Here</StyledText>
              <StyledTouchableOpacity className="absolute bottom-2 right-2 p-2 bg-[#edeef0] rounded-full">
                <StyledText className="text-sm">🔄</StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          </StyledView>

          {/* Hazard Warning */}
          <StyledView className="p-4 rounded-lg flex-row border-l-4" style={{ backgroundColor: Colors.errorContainer, borderLeftColor: Colors.error, gap: 16 }}>
            <StyledText className="text-xl">⚠️</StyledText>
            <StyledView className="flex-1">
              <StyledText className="text-sm font-bold" style={{ color: Colors.onErrorContainer }}>CRITICAL STEP</StyledText>
              <StyledText className="text-xs" style={{ color: Colors.onErrorContainer }}>Permit will be valid for 8 hours only. Renewal required for extended shifts.</StyledText>
            </StyledView>
          </StyledView>
        </StyledView>
      </ScrollView>

      {/* Bottom Nav Placeholder */}
      <StyledView 
        className="absolute bottom-0 left-0 w-full flex-row justify-around items-center px-4 py-2 bg-white border-t-2 z-50"
        style={{ borderColor: Colors.outlineVariant }}
      >
        <NavItem icon="📊" label="Dashboard" />
        <NavItem icon="⚠️" label="Incidents" />
        <NavItem icon="📋" label="Sites" active />
        <NavItem icon="⚙️" label="Settings" />
      </StyledView>
    </SafeAreaView>
  );
};

// Sub-components
const ChecklistItem = ({ title, description }: any) => {
  const [checked, setChecked] = useState(false);
  return (
    <StyledTouchableOpacity 
      onPress={() => setChecked(!checked)}
      className="flex-row items-center p-4 border"
      style={{ backgroundColor: checked ? '#fed00033' : '#edeef0', borderColor: Colors.outlineVariant, gap: 16 }}
    >
      <StyledView 
        className="w-6 h-6 border-2 items-center justify-center"
        style={{ borderColor: Colors.outline, backgroundColor: checked ? Colors.primary : 'transparent' }}
      >
        {checked && <StyledText className="text-white text-[10px]">✓</StyledText>}
      </StyledView>
      <StyledView className="flex-1">
        <StyledText className="text-base font-bold" style={{ color: Colors.onSurface }}>{title}</StyledText>
        <StyledText className="text-xs" style={{ color: Colors.onSurfaceVariant }}>{description}</StyledText>
      </StyledView>
    </StyledTouchableOpacity>
  );
};

const NavItem = ({ icon, label, active = false }: any) => (
  <StyledTouchableOpacity 
    className={`flex-col items-center justify-center px-4 py-1 rounded-lg ${active ? 'bg-[#fed000]' : ''}`}
  >
    <StyledText className="text-xl">{icon}</StyledText>
    <StyledText className="text-[10px] font-bold">{label}</StyledText>
  </StyledTouchableOpacity>
);

export default PermitScreen;
