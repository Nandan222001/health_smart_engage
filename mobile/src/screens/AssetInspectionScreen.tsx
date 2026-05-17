import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors } from '../theme';
import { TopAppBar, IndustrialCard, InputField, Button, StatusChip } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);

const AssetInspectionScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <TopAppBar title="Asset Inspection" showBack onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <IndustrialCard indicatorColor={Colors.primary}>
          <StyledText className="text-lg font-bold">Crane-02 (Mobile)</StyledText>
          <StyledText className="text-xs color-on-surface-variant">Model: Liebherr LTM 1050</StyledText>
          <StatusChip label="INSPECTION DUE" variant="warning" className="mt-2" />
        </IndustrialCard>

        <StyledText className="text-sm font-bold uppercase color-on-surface-variant">Inspection Checklist</StyledText>
        <InputField label="HYDRAULIC PRESSURE" placeholder="Enter bar reading..." />
        <InputField label="WIRE ROPE STATUS" placeholder="Condition notes..." />
        <InputField label="CONTROL SYSTEM" placeholder="Functional test result..." />

        <Button label="Submit Inspection" icon="📋" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AssetInspectionScreen;
