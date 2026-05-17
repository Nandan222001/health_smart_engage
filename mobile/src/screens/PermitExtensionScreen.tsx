import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors } from '../theme';
import { TopAppBar, IndustrialCard, InputField, Button } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);

const PermitExtensionScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <TopAppBar title="Extend Permit" showBack onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <IndustrialCard className="bg-secondary-container/10">
          <StyledText className="font-bold">Permit #PTW-2024-001</StyledText>
          <StyledText className="text-xs">Original Expiry: Today, 18:00</StyledText>
        </IndustrialCard>

        <InputField label="NEW EXPIRY TIME" placeholder="e.g. 22:00" />
        <InputField label="REASON FOR EXTENSION" multiline numberOfLines={3} placeholder="Describe operational delay..." />

        <Button label="Request Extension" icon="⏳" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default PermitExtensionScreen;
