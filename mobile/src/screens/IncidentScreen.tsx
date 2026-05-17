import React from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView, ScrollView, TextInput, StyleSheet } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing, BorderRadius } from '../theme';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);
const StyledTextInput = styled(TextInput);

const IncidentScreen = ({ navigation }: any) => {
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
        <StyledView className="flex-row items-center" style={{ gap: 16 }}>
          <StyledText className="text-xl" style={{ color: Colors.primary }}>🔔</StyledText>
          <StyledView className="w-10 h-10 rounded-full bg-[#edeef0] border overflow-hidden" style={{ borderColor: Colors.outlineVariant }}>
            <StyledImage 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCv4BSFuoDqaaev9gdjozLAJActq-qjFf6MzozzwLpnBmvthSOofKBmqlG7RJbr0f7nCq19mafI7gYOPC0HEqF66Lwz2eXilJTcmeq9am1VxjDwBX-obZTj4Nz6elK8JO6EjutwMbEkojN6mVR9YB10bBKIZJecZGvKsoW5HhHm1o2MoP9YCQcuhk1bWX3s1ANcpa6oxXKAgBlrLFTbAIXFRG2KK2liSyp0U_mCdnUz4nJJH8UhQVLl9o3RT3UNVLGWsUpG95fsXg' }}
              className="w-full h-full"
            />
          </StyledView>
        </StyledView>
      </StyledView>

      <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
        <StyledView className="px-4 pt-6" style={{ gap: Spacing.stackLg }}>
          {/* Protocol Banner */}
          <StyledView className="bg-[#f3f4f6] p-4 border-l-4" style={{ borderLeftColor: Colors.primary }}>
            <StyledText className="text-xs font-bold mb-1" style={{ color: Colors.primary }}>FIELD SAFETY PROTOCOL</StyledText>
            <StyledText className="text-sm" style={{ color: Colors.onSurfaceVariant }}>
              Ensure immediate hazards are contained before completing this report.
            </StyledText>
          </StyledView>

          {/* Incident Type Selector */}
          <StyledView style={{ gap: Spacing.stackSm }}>
            <StyledText className="text-xs font-bold" style={{ color: Colors.outline }}>SELECT INCIDENT TYPE</StyledText>
            <StyledView className="flex-row flex-wrap" style={{ gap: Spacing.stackSm }}>
              <TypeButton label="Near Miss" active />
              <TypeButton label="Injury" />
              <TypeButton label="Equipment Damage" />
              <TypeButton label="Environmental" />
            </StyledView>
          </StyledView>

          {/* Evidence Capture */}
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

          {/* Location Field */}
          <StyledView style={{ gap: Spacing.stackSm }}>
            <StyledText className="text-xs font-bold" style={{ color: Colors.outline }}>INCIDENT LOCATION</StyledText>
            <StyledView className="relative">
              <StyledText className="absolute left-4 top-4 z-10" style={{ color: Colors.primary }}>📍</StyledText>
              <StyledTextInput 
                className="w-full h-14 pl-12 pr-12 border-2 bg-white rounded-lg text-sm"
                style={{ borderColor: Colors.outline, color: Colors.onSurface }}
                value="Zone B - North Assembly Floor"
              />
              <StyledTouchableOpacity className="absolute right-4 top-4">
                <StyledText className="text-xl" style={{ color: Colors.primary }}>🔄</StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          </StyledView>

          {/* Description Field */}
          <StyledView style={{ gap: Spacing.stackSm }}>
            <StyledText className="text-xs font-bold" style={{ color: Colors.outline }}>DETAILED DESCRIPTION</StyledText>
            <StyledTextInput 
              className="w-full p-4 border-2 bg-white rounded-lg text-sm"
              style={{ borderColor: Colors.outline, color: Colors.onSurface }}
              placeholder="Describe what happened..."
              placeholderTextColor={Colors.outlineVariant}
              multiline
              numberOfLines={4}
            />
          </StyledView>

          {/* Informational Alert */}
          <StyledView className="p-4 rounded-lg flex-row border-2" style={{ backgroundColor: Colors.secondaryContainer, borderColor: Colors.secondary, gap: 12 }}>
            <StyledText className="text-xl">⚠️</StyledText>
            <StyledView className="flex-1" style={{ gap: 4 }}>
              <StyledText className="text-xs font-bold" style={{ color: Colors.onSecondaryContainer }}>URGENT PRIORITY</StyledText>
              <StyledText className="text-[10px]" style={{ color: Colors.onSecondaryContainer }}>Reporting high-risk incidents triggers immediate Supervisor notification.</StyledText>
            </StyledView>
          </StyledView>

          {/* Submit Button */}
          <StyledTouchableOpacity 
            className="w-full h-14 flex-row items-center justify-center rounded-lg shadow-lg active:scale-95"
            style={{ backgroundColor: Colors.primary, gap: 12 }}
          >
            <StyledText className="text-white text-xl">📨</StyledText>
            <StyledText className="text-lg font-bold text-white">Submit Report</StyledText>
          </StyledTouchableOpacity>
        </StyledView>
      </ScrollView>

      {/* Bottom Nav Placeholder */}
      <StyledView 
        className="absolute bottom-0 left-0 w-full flex-row justify-around items-center px-4 py-2 bg-white border-t-2 z-50"
        style={{ borderColor: Colors.outlineVariant }}
      >
        <NavItem icon="📊" label="Dashboard" />
        <NavItem icon="⚠️" label="Incidents" active />
        <NavItem icon="📋" label="Permits" />
        <NavItem icon="⚙️" label="Settings" />
      </StyledView>
    </SafeAreaView>
  );
};

// Sub-components
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

const NavItem = ({ icon, label, active = false }: any) => (
  <StyledTouchableOpacity 
    className={`flex-col items-center justify-center px-4 py-1 rounded-lg ${active ? 'bg-[#fed000]' : ''}`}
  >
    <StyledText className="text-xl">{icon}</StyledText>
    <StyledText className="text-[10px] font-bold">{label}</StyledText>
  </StyledTouchableOpacity>
);

export default IncidentScreen;
