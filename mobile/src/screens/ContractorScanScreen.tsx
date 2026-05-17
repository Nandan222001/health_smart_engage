import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors } from '../theme';
import { TopAppBar, Button, IndustrialCard } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);

const ContractorScanScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <TopAppBar title="Contractor Entry" showBack onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, items: 'center', justifyContent: 'center', flexGrow: 1 }}>
        <StyledView className="w-64 h-64 border-4 border-primary rounded-xl items-center justify-center bg-white">
          <StyledText className="text-6xl">🔍</StyledText>
          <StyledText className="mt-4 font-bold color-primary">SCAN QR CODE</StyledText>
        </StyledView>
        <StyledText className="text-sm text-center color-on-surface-variant max-w-xs">
          Align the contractor's digital badge QR code within the frame to verify access status.
        </StyledText>
        <Button label="Enter Manually" variant="outline" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ContractorScanScreen;
