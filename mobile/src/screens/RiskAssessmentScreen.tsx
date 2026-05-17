import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors } from '../theme';
import { TopAppBar, IndustrialCard, StatusChip, Button } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);

const RiskAssessmentScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
      <TopAppBar title="Risk Assessment" showBack onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <IndustrialCard indicatorColor={Colors.primary}>
          <StyledText className="text-xl font-bold mb-2">High Voltage Maintenance</StyledText>
          <StyledView className="flex-row gap-2 mb-4">
            <StatusChip label="CRITICAL RISK" variant="error" />
            <StatusChip label="REV 2.0" />
          </StyledView>
          <StyledText className="text-sm color-on-surface-variant">
            Assessment for electrical isolation and grounding procedures in Power Block D.
          </StyledText>
        </IndustrialCard>

        <StyledText className="text-sm font-bold uppercase color-on-surface-variant">Key Controls</StyledText>
        <ControlItem title="LOTO Verification" status="Required" />
        <ControlItem title="Arc Flash Suit (Cat 4)" status="Required" />
        <ControlItem title="Second Person Standby" status="Required" />

        <Button label="Acknowledge & Accept" className="mt-4" />
      </ScrollView>
    </SafeAreaView>
  );
};

const ControlItem = ({ title, status }: any) => (
  <StyledView className="p-4 bg-white border border-outline-variant flex-row justify-between items-center">
    <StyledText className="font-bold">{title}</StyledText>
    <StyledText className="text-xs color-primary font-bold">{status}</StyledText>
  </StyledView>
);

export default RiskAssessmentScreen;
