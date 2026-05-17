import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors } from '../theme';
import { TopAppBar, IndustrialCard, StatusChip, Button } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);

const SyncStatusScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
      <TopAppBar title="Offline Sync Status" showBack onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <StyledView className="items-center p-8 bg-white border-2 border-outline-variant rounded-xl">
          <StyledText className="text-4xl mb-2">🔄</StyledText>
          <StyledText className="text-xl font-bold">All Data Synced</StyledText>
          <StyledText className="text-xs color-on-surface-variant mt-1">Last synced: Today, 15:45</StyledText>
        </StyledView>

        <StyledText className="text-sm font-bold uppercase color-on-surface-variant">Pending Uploads (0)</StyledText>
        <StyledText className="text-xs color-outline text-center py-8">No records awaiting sync.</StyledText>

        <Button label="Sync Now" icon="🔄" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default SyncStatusScreen;
