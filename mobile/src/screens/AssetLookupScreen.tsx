import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing } from '../theme';
import { TopAppBar, InputField, IndustrialCard, StatusChip } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);

const AssetLookupScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <TopAppBar title="Asset Management" showBack onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <InputField label="SEARCH ASSET" placeholder="Search Asset or Scan QR" icon="🔍" />
        
        <StyledText className="text-sm font-bold uppercase" style={{ color: Colors.onSurfaceVariant }}>Recent Assets</StyledText>
        
        <IndustrialCard indicatorColor={Colors.primary}>
          <StyledView className="flex-row justify-between items-center">
            <StyledView>
              <StyledText className="text-lg font-bold">Crane-02 (Mobile)</StyledText>
              <StyledText className="text-xs">Location: South Yard</StyledText>
            </StyledView>
            <StatusChip label="COMPLIANT" variant="success" />
          </StyledView>
        </IndustrialCard>

        <IndustrialCard indicatorColor={Colors.error}>
          <StyledView className="flex-row justify-between items-center">
            <StyledView>
              <StyledText className="text-lg font-bold">Forklift-05</StyledText>
              <StyledText className="text-xs">Location: Warehouse B</StyledText>
            </StyledView>
            <StatusChip label="SERVICE DUE" variant="error" />
          </StyledView>
        </IndustrialCard>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AssetLookupScreen;
