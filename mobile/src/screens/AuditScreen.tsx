import React from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing, BorderRadius } from '../theme';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);

const AuditScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
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

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <StyledView className="px-4 pt-6" style={{ gap: Spacing.stackMd }}>
          {/* Audit Header Info */}
          <StyledView className="bg-white p-4 border shadow-sm" style={{ borderColor: Colors.outlineVariant }}>
            <StyledView className="flex-row justify-between items-start mb-2">
              <StyledView>
                <StyledText className="text-lg font-bold" style={{ color: Colors.onSurface }}>PPE Compliance Audit</StyledText>
                <StyledText className="text-xs" style={{ color: Colors.onSurfaceVariant }}>Zone 4: Heavy Fabrication Area</StyledText>
              </StyledView>
              <StyledView className="bg-[#fed000] px-3 py-1">
                <StyledText className="text-[10px] font-bold uppercase tracking-wider" style={{ color: Colors.onSecondaryContainer }}>In Progress</StyledText>
              </StyledView>
            </StyledView>
            <StyledView className="h-2 w-full bg-[#edeef0] rounded-full mt-4">
              <StyledView className="h-full bg-[#003d9b] rounded-full" style={{ width: '33.3%' }} />
            </StyledView>
            <StyledView className="mt-2 items-end">
              <StyledText className="text-[10px]" style={{ color: Colors.onSurfaceVariant }}>Progress: 2 of 6 items completed</StyledText>
            </StyledView>
          </StyledView>

          {/* Complete Button */}
          <StyledTouchableOpacity 
            className="w-full h-14 items-center justify-center flex-row rounded shadow-md active:scale-[0.98]"
            style={{ backgroundColor: Colors.primary, gap: Spacing.stackSm }}
          >
            <StyledText className="text-white text-xl">📋</StyledText>
            <StyledText className="text-sm font-bold text-white">Complete Audit</StyledText>
          </StyledTouchableOpacity>

          {/* Question Cards */}
          <StyledView style={{ gap: Spacing.stackMd }}>
            <AuditQuestion 
              clause="Clause 4.2.1"
              question="Are all personnel in the fabrication zone wearing ANSI-rated impact-resistant eye protection?"
              status="Fail"
              indicator={Colors.primary}
            />
            <AuditQuestion 
              clause="Clause 4.3.5"
              question="Are steel-toed boots in good condition without visible degradation of the sole or protective cap?"
              status="N/A"
              indicator={Colors.secondaryContainer}
              hasEvidence
            />
            <AuditQuestion 
              clause="Clause 5.1.2"
              question="Is hearing protection (muffs or plugs) available and utilized in designated 'High Noise' areas?"
              status="N/A"
              indicator={Colors.error}
            />
          </StyledView>
        </StyledView>
      </ScrollView>

      {/* Bottom Nav Placeholder */}
      <StyledView 
        className="absolute bottom-0 left-0 w-full flex-row justify-around items-center px-4 py-2 bg-white border-t-2 z-50"
        style={{ borderColor: Colors.outline }}
      >
        <NavItem icon="📊" label="Dashboard" />
        <NavItem icon="⚠️" label="Incidents" />
        <NavItem icon="📝" label="Permits" />
        <NavItem icon="⚙️" label="Settings" />
      </StyledView>
    </SafeAreaView>
  );
};

// Sub-components
const AuditQuestion = ({ clause, question, status, indicator, hasEvidence }: any) => (
  <StyledView className="bg-white border relative flex-col" style={{ borderColor: Colors.outlineVariant }}>
    <StyledView className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: indicator }} />
    <StyledView className="p-4" style={{ gap: 12 }}>
      <StyledView className="flex-row justify-between items-start">
        <StyledText className="text-[10px] font-bold uppercase tracking-tight" style={{ color: Colors.onTertiaryFixedVariant }}>{clause}</StyledText>
        <StyledText className="text-lg" style={{ color: Colors.outline }}>ℹ️</StyledText>
      </StyledView>
      <StyledText className="text-base font-semibold" style={{ color: Colors.onSurface }}>{question}</StyledText>
      
      {/* Segmented Control */}
      <StyledView className="flex-row bg-[#edeef0] p-1 border" style={{ borderColor: Colors.outlineVariant }}>
        <StatusButton label="Pass" active={status === 'Pass'} />
        <StatusButton label="Fail" active={status === 'Fail'} />
        <StatusButton label="N/A" active={status === 'N/A'} />
      </StyledView>

      {/* Evidence */}
      {hasEvidence && (
        <StyledView className="flex-row items-center p-2 bg-[#f3f4f6] border" style={{ borderColor: Colors.outlineVariant, gap: 12 }}>
          <StyledView className="w-12 h-12 bg-[#c3c6d6]">
            <StyledImage 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjwFAabSHT19KxdvzbvQH4I4290h3stT_u5kPCFLkoo8qjKujt4TTg7snlkMpdjmuTlvM-9rfq1sUG8tGDiir77t1Uf4yFO1q6TCXwFvTXFGXGrhnXFAWoMwwuTwhEwf07BruLt5zApERA8VGKXWDF5y8StIXpGmh3eyY3oas3KPmVF5vcdS3I53Jd2LrqD3CGwVzsS2sN-3-8cWfpOb1EJm1j-mua6sGunujZx_6yckI2cD09y1ovPP9kAigAFyJR8ktgu7FBDg' }}
              className="w-full h-full"
            />
          </StyledView>
          <StyledView className="flex-1">
            <StyledText className="text-xs font-bold" style={{ color: Colors.onSurface }}>boot_inspection_01.jpg</StyledText>
            <StyledText className="text-[10px]" style={{ color: Colors.outline }}>Today, 10:45 AM</StyledText>
          </StyledView>
          <StyledText className="text-lg" style={{ color: Colors.error }}>🗑️</StyledText>
        </StyledView>
      )}

      <StyledTouchableOpacity className="w-full h-12 flex-row items-center justify-center border-2 border-dashed border-[#c3c6d6] hover:bg-[#f3f4f6]" style={{ gap: 8 }}>
        <StyledText className="text-lg" style={{ color: Colors.onSurfaceVariant }}>📷</StyledText>
        <StyledText className="text-sm font-semibold" style={{ color: Colors.onSurfaceVariant }}>{hasEvidence ? 'Add More' : 'Add Evidence'}</StyledText>
      </StyledTouchableOpacity>
    </StyledView>
  </StyledView>
);

const StatusButton = ({ label, active }: any) => (
  <StyledTouchableOpacity 
    className={`flex-1 py-2 items-center justify-center ${active ? 'bg-white shadow-sm border border-[#c3c6d6]' : ''}`}
  >
    <StyledText className={`text-sm font-bold ${active ? 'text-on-surface' : 'text-on-surface-variant'}`}>{label}</StyledText>
  </StyledTouchableOpacity>
);

const NavItem = ({ icon, label, onPress }: any) => (
  <StyledTouchableOpacity className="flex-col items-center justify-center px-4 py-1" onPress={onPress}>
    <StyledText className="text-xl">{icon}</StyledText>
    <StyledText className="text-[10px] font-bold">{label}</StyledText>
  </StyledTouchableOpacity>
);

export default AuditScreen;
