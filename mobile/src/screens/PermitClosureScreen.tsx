import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors } from '../theme';
import { TopAppBar, IndustrialCard, Button } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);

const PermitClosureScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <TopAppBar title="Close Permit" showBack onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <IndustrialCard className="bg-primary/5">
          <StyledText className="font-bold">Permit #PTW-2024-001</StyledText>
          <StyledText className="text-xs">Task: Hot Work - Welding</StyledText>
        </IndustrialCard>

        <StyledText className="text-sm font-bold uppercase color-on-surface-variant">Closure Evidence</StyledText>
        <StyledView className="w-full h-44 bg-[#e1e2e4] border-2 border-dashed rounded-xl items-center justify-center" style={{ borderColor: Colors.outline }}>
          <StyledText className="text-3xl">📸</StyledText>
          <StyledText className="text-sm font-bold color-primary">Photo of Area Restored</StyledText>
        </StyledView>

        <StyledView className="p-4 bg-secondary-container/20 border-l-4 border-secondary">
          <StyledText className="text-xs font-bold color-on-secondary-container">VERIFICATION</StyledText>
          <StyledText className="text-[10px] color-on-secondary-container">Ensure all LOTO tags are removed and area is safe for normal operations.</StyledText>
        </StyledView>

        <Button label="Close Permit" icon="✅" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default PermitClosureScreen;
