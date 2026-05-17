import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing, BorderRadius } from '../theme';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);
const StyledTextInput = styled(TextInput);

const sites = [
  { id: '1', title: 'Main Plant - South', zone: 'Zone A - Processing Unit', icon: '🏭' },
  { id: '2', title: 'Storage Facility B', zone: 'Logistics & Hazmat Sector', icon: '📦' },
  { id: '3', title: 'Offshore Platform Gamma', zone: 'Drilling Deck 4', icon: '🛢️' },
];

const SiteSelectionScreen = ({ navigation }: any) => {
  const [selectedSite, setSelectedSite] = useState('1');
  const [rememberSelection, setRememberSelection] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <StyledView 
        className="flex-row justify-between items-center w-full px-4 h-14 bg-white border-b-2 z-50"
        style={{ borderColor: Colors.outline }}
      >
        <StyledView className="flex-row items-center" style={{ gap: Spacing.stackSm }}>
          <StyledTouchableOpacity className="w-12 h-12 items-center justify-center rounded-full">
            <StyledText className="text-xl">☰</StyledText>
          </StyledTouchableOpacity>
          <StyledText className="text-xl font-bold" style={{ color: Colors.primary }}>HSE Operations</StyledText>
        </StyledView>
        <StyledTouchableOpacity className="w-12 h-12 items-center justify-center rounded-full">
          <StyledText className="text-xl">👤</StyledText>
        </StyledTouchableOpacity>
      </StyledView>

      <ScrollView contentContainerStyle={{ paddingTop: 14, paddingBottom: 100, px: Spacing.marginMobile }}>
        <StyledView className="px-4">
          {/* Headline Section */}
          <StyledView className="mt-6 mb-6">
            <StyledText className="text-3xl font-bold" style={{ color: Colors.onSurface }}>Select Your Site</StyledText>
            <StyledText className="text-sm mt-2" style={{ color: Colors.onSurfaceVariant }}>
              Identify your current operational context to begin reporting.
            </StyledText>
          </StyledView>

          {/* Search Bar */}
          <StyledView className="relative mb-6">
            <StyledText className="absolute left-4 top-4 z-10" style={{ color: Colors.outline }}>🔍</StyledText>
            <StyledTextInput 
              className="w-full h-14 pl-12 pr-4 bg-white border-2 rounded-lg text-on-surface"
              style={{ borderColor: Colors.outline }}
              placeholder="Search sites..."
              placeholderTextColor={Colors.outlineVariant}
            />
          </StyledView>

          {/* Site List */}
          <StyledView className="mb-6" style={{ gap: 16 }}>
            {sites.map((site) => (
              <StyledTouchableOpacity 
                key={site.id}
                onPress={() => setSelectedSite(site.id)}
                className="relative bg-white border-2 rounded-lg p-4 active:scale-[0.98]"
                style={{ borderColor: selectedSite === site.id ? Colors.primary : Colors.outline }}
              >
                <StyledView className="flex-row items-center justify-between">
                  <StyledView className="flex-row items-center" style={{ gap: 16 }}>
                    <StyledView className="w-12 h-12 bg-[#edeef0] items-center justify-center rounded-lg">
                      <StyledText className="text-2xl">{site.icon}</StyledText>
                    </StyledView>
                    <StyledView>
                      <StyledText className="text-lg font-bold" style={{ color: Colors.onSurface }}>{site.title}</StyledText>
                      <StyledText className="text-sm" style={{ color: Colors.onSurfaceVariant }}>{site.zone}</StyledText>
                    </StyledView>
                  </StyledView>
                  {selectedSite === site.id && (
                    <StyledText className="text-2xl" style={{ color: Colors.primary }}>✅</StyledText>
                  )}
                </StyledView>
                {/* 4px Indicator Bar */}
                {selectedSite === site.id && (
                  <StyledView className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" style={{ backgroundColor: Colors.secondaryContainer }} />
                )}
              </StyledTouchableOpacity>
            ))}
          </StyledView>

          {/* Checkbox: Remember Selection */}
          <StyledTouchableOpacity 
            className="flex-row items-center mb-6" 
            style={{ gap: Spacing.stackMd }}
            onPress={() => setRememberSelection(!rememberSelection)}
          >
            <StyledView 
              className="w-6 h-6 border-2 rounded items-center justify-center"
              style={{ borderColor: Colors.outline, backgroundColor: rememberSelection ? Colors.primary : 'transparent' }}
            >
              {rememberSelection && <StyledText className="text-white text-[10px]">✓</StyledText>}
            </StyledView>
            <StyledText className="text-sm font-semibold" style={{ color: Colors.onSurface }}>Remember my selection</StyledText>
          </StyledTouchableOpacity>

          {/* Featured Map Section */}
          <StyledView className="w-full h-48 rounded-lg overflow-hidden border-2 relative mb-6" style={{ borderColor: Colors.outline }}>
            <StyledImage 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-NfZYh8d7qecC5PrfPmiJCXc6dvuT3jOaRPAAXVcXQiJ94jC6dRHlUiqJpe-CnptSHutUxFjwhI2t6UU3AqoHmsr6xybFT6G9Ts1WGhNRWtbMGFvgJmG6YMgB2T8sIiIZrGkOgDDk-Hv_rxGZjA2jAQ6H--L9WFgxjyTl-icFPhWQyz8_hLemCzlQaIUObjpBuOiSXT1X6sV1Js5KeXiohjHc8d32T865MBiPqxvU-PBTsyB9GhOYp2Ywq_uz73nWWKj8PuxAnw' }}
              className="w-full h-full opacity-60"
            />
            <StyledView className="absolute bottom-4 left-4 flex-row items-center bg-white px-3 py-1 rounded border" style={{ borderColor: Colors.outline, gap: 8 }}>
              <StyledText className="text-xs">📍</StyledText>
              <StyledText className="text-[10px] font-bold">3 Sites near your GPS location</StyledText>
            </StyledView>
          </StyledView>
        </StyledView>
      </ScrollView>

      {/* Footer Action */}
      <StyledView className="absolute bottom-0 left-0 w-full bg-white border-t-2 px-4 py-4 z-50" style={{ borderColor: Colors.outline }}>
        <StyledTouchableOpacity 
          className="w-full h-14 flex-row items-center justify-center rounded-lg active:scale-[0.98]"
          style={{ backgroundColor: Colors.primary, gap: Spacing.stackSm }}
          onPress={() => navigation?.navigate('Dashboard')}
        >
          <StyledText className="text-lg font-bold text-white uppercase">Confirm</StyledText>
          <StyledText className="text-white text-xl">➡️</StyledText>
        </StyledTouchableOpacity>
      </StyledView>
    </SafeAreaView>
  );
};

export default SiteSelectionScreen;
