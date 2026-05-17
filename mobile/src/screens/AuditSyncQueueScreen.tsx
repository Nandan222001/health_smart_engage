import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors } from '../theme';
import { TopAppBar, IndustrialCard, Button } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);

const AuditSyncQueueScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
      <TopAppBar title="Audit Sync Queue" showBack onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <StyledText className="text-sm font-bold uppercase color-on-surface-variant">Pending Audits (2)</StyledText>
        
        <IndustrialCard indicatorColor={Colors.primary}>
          <StyledText className="font-bold">PPE Audit - Zone 4</StyledText>
          <StyledText className="text-xs color-on-surface-variant">Captured: Today, 10:45 AM</StyledText>
          <StyledText className="text-[10px] color-outline mt-1">Ready to sync</StyledText>
        </IndustrialCard>

        <IndustrialCard indicatorColor={Colors.primary}>
          <StyledText className="font-bold">Equipment Audit - Block B</StyledText>
          <StyledText className="text-xs color-on-surface-variant">Captured: Yesterday, 16:30 PM</StyledText>
          <StyledText className="text-[10px] color-outline mt-1">Ready to sync</StyledText>
        </IndustrialCard>

        <Button label="Sync All Data" icon="🔄" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AuditSyncQueueScreen;
