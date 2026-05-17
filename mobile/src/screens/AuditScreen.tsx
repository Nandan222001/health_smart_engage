import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing } from '../theme';
import { TopAppBar, BottomNavBar, IndustrialCard, Button, StatusChip } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);

const AuditScreen = ({ navigation }: any) => {
  const navItems = [
    { icon: '📊', label: 'Dashboard' },
    { icon: '⚠️', label: 'Incidents', active: true },
    { icon: '📝', label: 'Permits' },
    { icon: '⚙️', label: 'Settings' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
      <TopAppBar title="HSE FieldSafe" showBack onBack={() => navigation?.goBack()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <StyledView className="px-4 pt-6" style={{ gap: Spacing.stackMd }}>
          <IndustrialCard indicatorColor={Colors.primary}>
            <StyledView className="flex-row justify-between items-start mb-2">
              <StyledView>
                <StyledText className="text-lg font-bold" style={{ color: Colors.onSurface }}>PPE Compliance Audit</StyledText>
                <StyledText className="text-xs" style={{ color: Colors.onSurfaceVariant }}>Zone 4: Heavy Fabrication Area</StyledText>
              </StyledView>
              <StatusChip label="In Progress" variant="warning" />
            </StyledView>
            <StyledView className="h-2 w-full bg-[#edeef0] rounded-full mt-4">
              <StyledView className="h-full bg-[#003d9b] rounded-full" style={{ width: '33.3%' }} />
            </StyledView>
            <StyledView className="mt-2 items-end">
              <StyledText className="text-[10px]" style={{ color: Colors.onSurfaceVariant }}>Progress: 2 of 6 items completed</StyledText>
            </StyledView>
          </IndustrialCard>

          <Button label="Complete Audit" icon="📋" />

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
          </StyledView>
        </StyledView>
      </ScrollView>

      <BottomNavBar items={navItems} />
    </SafeAreaView>
  );
};

const AuditQuestion = ({ clause, question, status, indicator, hasEvidence }: any) => (
  <IndustrialCard indicatorColor={indicator}>
    <StyledView style={{ gap: 12 }}>
      <StyledView className="flex-row justify-between items-start">
        <StyledText className="text-[10px] font-bold uppercase tracking-tight" style={{ color: Colors.onTertiaryFixedVariant }}>{clause}</StyledText>
        <StyledText className="text-lg" style={{ color: Colors.outline }}>ℹ️</StyledText>
      </StyledView>
      <StyledText className="text-base font-semibold" style={{ color: Colors.onSurface }}>{question}</StyledText>
      
      <StyledView className="flex-row bg-[#edeef0] p-1 border" style={{ borderColor: Colors.outlineVariant }}>
        <StatusButton label="Pass" active={status === 'Pass'} />
        <StatusButton label="Fail" active={status === 'Fail'} />
        <StatusButton label="N/A" active={status === 'N/A'} />
      </StyledView>

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
  </IndustrialCard>
);

const StatusButton = ({ label, active }: any) => (
  <StyledTouchableOpacity 
    className={`flex-1 py-2 items-center justify-center ${active ? 'bg-white shadow-sm border border-[#c3c6d6]' : ''}`}
  >
    <StyledText className={`text-sm font-bold ${active ? 'text-on-surface' : 'text-on-surface-variant'}`}>{label}</StyledText>
  </StyledTouchableOpacity>
);

export default AuditScreen;
