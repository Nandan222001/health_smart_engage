import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors } from '../theme';
import { TopAppBar, IndustrialCard, Button } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);

const TrainingCompletionScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <TopAppBar title="Record Training" showBack onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, items: 'center', flexGrow: 1 }}>
        <IndustrialCard className="w-full">
          <StyledText className="text-lg font-bold">Session: Fire Safety Refresher</StyledText>
          <StyledText className="text-xs color-on-surface-variant">Instructor: John Doe | Site A</StyledText>
        </IndustrialCard>

        <StyledView className="w-64 h-64 border-4 border-secondary-container rounded-xl items-center justify-center bg-white my-8">
          <StyledText className="text-6xl">📸</StyledText>
          <StyledText className="mt-4 font-bold color-secondary">SCAN BADGE</StyledText>
        </StyledView>

        <StyledText className="text-sm text-center color-on-surface-variant max-w-xs">
          Scan the worker's badge to record their attendance for this session.
        </StyledText>
        <Button label="End Session" variant="outline" className="mt-auto" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default TrainingCompletionScreen;
