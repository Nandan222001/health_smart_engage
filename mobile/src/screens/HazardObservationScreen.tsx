import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing } from '../theme';
import { TopAppBar, InputField, Button } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);

const HazardObservationScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <TopAppBar title="Report Hazard" showBack onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <StyledText className="text-xl font-bold" style={{ color: Colors.onSurface }}>Hazard Details</StyledText>
        <InputField label="HAZARD TYPE" placeholder="e.g. Slippery Floor, Loose Wiring" />
        <InputField label="LOCATION" icon="📍" value="Detecting GPS..." />
        <InputField label="DESCRIPTION" multiline numberOfLines={4} placeholder="Describe the hazard..." />
        
        <StyledView className="w-full h-40 bg-[#e1e2e4] border-2 border-dashed rounded-xl items-center justify-center" style={{ borderColor: Colors.outline }}>
          <StyledText className="text-3xl">📷</StyledText>
          <StyledText className="text-sm font-bold" style={{ color: Colors.primary }}>Capture Photo</StyledText>
        </StyledView>

        <Button label="Submit Observation" icon="📨" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HazardObservationScreen;
