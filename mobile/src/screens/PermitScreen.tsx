import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing } from '../theme';
import { TopAppBar, BottomNavBar, InputField, IndustrialCard } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);

const PermitScreen = ({ navigation }: any) => {
  const navItems = [
    { icon: '📊', label: 'Dashboard' },
    { icon: '⚠️', label: 'Incidents' },
    { icon: '📋', label: 'Sites', active: true },
    { icon: '⚙️', label: 'Settings' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <TopAppBar title="HSE FieldSafe" showBack onBack={() => navigation?.goBack()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <StyledView className="px-4 pt-6" style={{ gap: Spacing.stackLg }}>
          <StyledView>
            <StyledText className="text-xl font-bold" style={{ color: Colors.onSurface }}>New Permit Request</StyledText>
            <StyledText className="text-sm" style={{ color: Colors.onSurfaceVariant }}>Complete all required safety fields below.</StyledText>
          </StyledView>

          <InputField label="Asset Identification" placeholder="Search Asset or Scan QR" icon="🔍" />

          <StyledView style={{ gap: Spacing.stackMd }}>
            <StyledView className="flex-row justify-between items-center">
              <StyledText className="text-xs font-bold uppercase tracking-wider" style={{ color: Colors.onSurface }}>Controls Checklist</StyledText>
              <StyledView className="bg-[#fed000] px-2 py-0.5 rounded-full">
                <StyledText className="text-[8px] font-bold">REQUIRED</StyledText>
              </StyledView>
            </StyledView>
            <StyledView style={{ gap: 8 }}>
              <ChecklistItem title="LOTO Verified" description="Lock Out Tag Out procedures confirmed" />
              <ChecklistItem title="PPE Inspected" description="Standard arc-flash and impact gear ready" />
            </StyledView>
          </StyledView>

          <StyledView style={{ gap: Spacing.stackSm }}>
            <StyledText className="text-xs font-bold uppercase tracking-wider" style={{ color: Colors.onSurface }}>Authorization Signature</StyledText>
            <StyledView className="w-full h-40 bg-white border-2 border-dashed items-center justify-center relative" style={{ borderColor: Colors.outline }}>
              <StyledText className="text-lg font-bold opacity-30">Sign Here</StyledText>
            </StyledView>
          </StyledView>

          <StyledView className="p-4 rounded-lg flex-row border-l-4" style={{ backgroundColor: Colors.errorContainer, borderLeftColor: Colors.error, gap: 16 }}>
            <StyledText className="text-xl">⚠️</StyledText>
            <StyledView className="flex-1">
              <StyledText className="text-sm font-bold" style={{ color: Colors.onErrorContainer }}>CRITICAL STEP</StyledText>
              <StyledText className="text-xs" style={{ color: Colors.onErrorContainer }}>Permit will be valid for 8 hours only.</StyledText>
            </StyledView>
          </StyledView>
        </StyledView>
      </ScrollView>

      <BottomNavBar items={navItems} />
    </SafeAreaView>
  );
};

const ChecklistItem = ({ title, description }: any) => {
  const [checked, setChecked] = useState(false);
  const StyledTouchableOpacity = styled(TouchableOpacity);
  return (
    <StyledTouchableOpacity 
      onPress={() => setChecked(!checked)}
      className="flex-row items-center p-4 border"
      style={{ backgroundColor: checked ? '#fed00033' : '#edeef0', borderColor: Colors.outlineVariant, gap: 16 }}
    >
      <StyledView className="w-6 h-6 border-2 items-center justify-center" style={{ borderColor: Colors.outline, backgroundColor: checked ? Colors.primary : 'transparent' }}>
        {checked && <StyledText className="text-white text-[10px]">✓</StyledText>}
      </StyledView>
      <StyledView className="flex-1">
        <StyledText className="text-base font-bold">{title}</StyledText>
        <StyledText className="text-xs">{description}</StyledText>
      </StyledView>
    </StyledTouchableOpacity>
  );
};

export default PermitScreen;
