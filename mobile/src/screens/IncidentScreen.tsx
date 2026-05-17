import React from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing } from '../theme';
import { TopAppBar, BottomNavBar, Button, InputField } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);

const IncidentScreen = ({ navigation }: any) => {
  const navItems = [
    { icon: '📊', label: 'Dashboard' },
    { icon: '⚠️', label: 'Incidents', active: true },
    { icon: '📋', label: 'Permits' },
    { icon: '⚙️', label: 'Settings' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <TopAppBar title="HSE FieldSafe" showBack onBack={() => navigation?.goBack()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
        <StyledView className="px-4 pt-6" style={{ gap: Spacing.stackLg }}>
          <StyledView className="bg-[#f3f4f6] p-4 border-l-4" style={{ borderLeftColor: Colors.primary }}>
            <StyledText className="text-xs font-bold mb-1" style={{ color: Colors.primary }}>FIELD SAFETY PROTOCOL</StyledText>
            <StyledText className="text-sm" style={{ color: Colors.onSurfaceVariant }}>
              Ensure immediate hazards are contained before completing this report.
            </StyledText>
          </StyledView>

          <StyledView style={{ gap: Spacing.stackSm }}>
            <StyledText className="text-xs font-bold" style={{ color: Colors.outline }}>SELECT INCIDENT TYPE</StyledText>
            <StyledView className="flex-row flex-wrap" style={{ gap: Spacing.stackSm }}>
              <TypeButton label="Near Miss" active />
              <TypeButton label="Injury" />
              <TypeButton label="Equipment Damage" />
              <TypeButton label="Environmental" />
            </StyledView>
          </StyledView>

          <StyledView style={{ gap: Spacing.stackSm }}>
            <StyledText className="text-xs font-bold" style={{ color: Colors.outline }}>EVIDENCE CAPTURE</StyledText>
            <StyledView className="w-full h-44 bg-[#e1e2e4] border-2 border-dashed rounded-xl items-center justify-center relative overflow-hidden" style={{ borderColor: Colors.outline }}>
              <StyledImage 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYDNsw3tHCQs9sS3bIl4XPcL3Ejg-tZ1s-sqiaRN086hD2upKK7LFWZSzE36CzAGLUnX__UxIWeDyJI5o8DdK4RWafibd3u37g3EnFW5FVLlAXqGNa-Z8WTPMTG_GXTdf3PQv6OntacHgjdMaP9FUqKthWcDgK6_sjwSHscJrw1tRVL074ZxehGjfAnP4PmBhFmhKpgURXpBYixrTN5sB3pMtJmPuwwC57SZg6c4MtGoeDIPif2RqaMDhRn07tNE9rl_RWZ49h4g' }}
                className="absolute inset-0 w-full h-full opacity-20"
              />
              <StyledTouchableOpacity className="z-10 items-center" style={{ gap: 8 }}>
                <StyledView className="w-14 h-14 items-center justify-center rounded-full shadow-md" style={{ backgroundColor: Colors.primary }}>
                  <StyledText className="text-3xl">📷</StyledText>
                </StyledView>
                <StyledText className="text-sm font-bold" style={{ color: Colors.primary }}>Take Photo</StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          </StyledView>

          <InputField 
            label="INCIDENT LOCATION"
            value="Zone B - North Assembly Floor"
            icon="📍"
          />

          <InputField 
            label="DETAILED DESCRIPTION"
            placeholder="Describe what happened..."
            multiline
            numberOfLines={4}
          />

          <StyledView className="p-4 rounded-lg flex-row border-2" style={{ backgroundColor: Colors.secondaryContainer, borderColor: Colors.secondary, gap: 12 }}>
            <StyledText className="text-xl">⚠️</StyledText>
            <StyledView className="flex-1" style={{ gap: 4 }}>
              <StyledText className="text-xs font-bold" style={{ color: Colors.onSecondaryContainer }}>URGENT PRIORITY</StyledText>
              <StyledText className="text-[10px]" style={{ color: Colors.onSecondaryContainer }}>Reporting high-risk incidents triggers immediate Supervisor notification.</StyledText>
            </StyledView>
          </StyledView>

          <Button label="Submit Report" icon="📨" />
        </StyledView>
      </ScrollView>

      <BottomNavBar items={navItems} />
    </SafeAreaView>
  );
};

const TypeButton = ({ label, active = false }: any) => (
  <StyledTouchableOpacity 
    className="w-[48%] h-14 items-center justify-center border-2 rounded-lg"
    style={{ 
      borderColor: active ? Colors.primary : Colors.outline, 
      backgroundColor: active ? Colors.primaryContainer : 'transparent' 
    }}
  >
    <StyledText className={`text-xs font-bold ${active ? 'text-[#003d9b]' : 'text-on-surface-variant'}`}>{label}</StyledText>
  </StyledTouchableOpacity>
);

export default IncidentScreen;
