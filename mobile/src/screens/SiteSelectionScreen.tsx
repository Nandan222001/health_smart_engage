import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing } from '../theme';
import { TopAppBar, IndustrialCard, InputField, Button } from '../components';
import { useSites } from '../hooks/useSites';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

const SiteSelectionScreen = ({ navigation }: any) => {
  const [selectedSite, setSelectedSite] = useState('1');
  const [rememberSelection, setRememberSelection] = useState(false);
  const { sites, loading } = useSites();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <TopAppBar title="HSE Operations" />

      <ScrollView contentContainerStyle={{ paddingBottom: 100, px: Spacing.marginMobile }}>
        <StyledView className="px-4">
          <StyledView className="mt-6 mb-6">
            <StyledText className="text-3xl font-bold" style={{ color: Colors.onSurface }}>Select Your Site</StyledText>
            <StyledText className="text-sm mt-2" style={{ color: Colors.onSurfaceVariant }}>
              Identify your current operational context to begin reporting.
            </StyledText>
          </StyledView>

          <InputField 
            placeholder="Search sites..."
            icon="🔍"
            className="mb-6"
          />

          <StyledView className="mb-6" style={{ gap: 16 }}>
            {loading ? (
              <StyledText>Loading sites...</StyledText>
            ) : (
              sites.map((site) => (
                <IndustrialCard 
                  key={site.id}
                  onPress={() => setSelectedSite(site.id)}
                  indicatorColor={selectedSite === site.id ? Colors.secondaryContainer : undefined}
                  className={selectedSite === site.id ? 'border-primary' : ''}
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
                    {selectedSite === site.id && <StyledText className="text-2xl">✅</StyledText>}
                  </StyledView>
                </IndustrialCard>
              ))
            )}
          </StyledView>

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

          <StyledView className="w-full h-48 rounded-lg overflow-hidden border-2 relative mb-6" style={{ borderColor: Colors.outline }}>
            <StyledImage 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-NfZYh8d7qecC5PrfPmiJCXc6dvuT3jOaRPAAXVcXQiJ94jC6dRHlUiqJpe-CnptSHutUxFjwhI2t6UU3AqoHmsr6xybFT6G9Ts1WGhNRWtbMGFvgJmG6YMgB2T8sIiIZrGkOgDDk-Hv_rxGZjA2jAQ6H--L9WFgxjyTl-icFPhWQyz8_hLemCzlQaIUObjpBuOiSXT1X6sV1Js5KeXiohjHc8d32T865MBiPqxvU-PBTsyB9GhOYp2Ywq_uz73nWWKj8PuxAnw' }}
              className="w-full h-full opacity-60"
            />
          </StyledView>
        </StyledView>
      </ScrollView>

      <StyledView className="absolute bottom-0 left-0 w-full bg-white border-t-2 px-4 py-4 z-50" style={{ borderColor: Colors.outline }}>
        <Button label="Confirm" icon="➡️" onPress={() => navigation?.navigate('Dashboard')} />
      </StyledView>
    </SafeAreaView>
  );
};

const StyledTouchableOpacity = styled(TouchableOpacity);

export default SiteSelectionScreen;
