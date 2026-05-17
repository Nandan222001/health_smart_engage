import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors } from '../theme';
import { TopAppBar, IndustrialCard, StatusChip } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);

const VendorStatusScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
      <TopAppBar title="Vendor Compliance" showBack onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <IndustrialCard indicatorColor={Colors.primary}>
          <StyledText className="text-xl font-bold">Apex Engineering Ltd</StyledText>
          <StyledText className="text-xs color-on-surface-variant mb-4">Vendor ID: V-441-20</StyledText>
          <StatusChip label="QUALIFIED" variant="success" />
        </IndustrialCard>

        <StyledText className="text-sm font-bold uppercase color-on-surface-variant">Document Status</StyledText>
        <DocItem title="Public Liability Insurance" status="Valid" date="Expires 20 Dec 2024" />
        <DocItem title="Safety Management Plan" status="Valid" date="Verified Jan 2024" />
        <DocItem title="Worker Compensation" status="PENDING" date="Requires Review" isWarning />
      </ScrollView>
    </SafeAreaView>
  );
};

const DocItem = ({ title, status, date, isWarning }: any) => (
  <StyledView className="p-4 bg-white border border-outline-variant flex-row justify-between items-center">
    <StyledView>
      <StyledText className="font-bold">{title}</StyledText>
      <StyledText className="text-[10px] color-on-surface-variant">{date}</StyledText>
    </StyledView>
    <StyledText className={`text-xs font-bold ${isWarning ? 'color-secondary' : 'color-primary'}`}>{status}</StyledText>
  </StyledView>
);

export default VendorStatusScreen;
