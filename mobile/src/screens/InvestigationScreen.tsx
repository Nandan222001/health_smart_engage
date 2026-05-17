import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing } from '../theme';
import { TopAppBar, IndustrialCard, InputField, Button } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);

const InvestigationScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <TopAppBar title="Incident Investigation" showBack onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <StyledView className="bg-primary p-4 rounded-lg">
          <StyledText className="text-white font-bold">Investigation ID: #INV-402</StyledText>
          <StyledText className="text-white/80 text-xs">Assigned to: Lead Investigator</StyledText>
        </StyledView>

        <StyledText className="text-sm font-bold uppercase color-on-surface-variant">Root Cause Analysis (5-Whys)</StyledText>
        <InputField label="WHY DID IT HAPPEN?" placeholder="Immediate cause..." />
        <InputField label="WHY DID THAT HAPPEN?" placeholder="Underlying cause..." />
        <InputField label="WHY DID THAT HAPPEN?" placeholder="Systemic cause..." />

        <StyledText className="text-sm font-bold uppercase color-on-surface-variant">Investigation Notes</StyledText>
        <InputField multiline numberOfLines={4} placeholder="Capture field observations..." />

        <Button label="Save Progress" variant="secondary" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default InvestigationScreen;
