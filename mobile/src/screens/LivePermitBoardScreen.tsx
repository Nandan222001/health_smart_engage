import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors } from '../theme';
import { TopAppBar, IndustrialCard, StatusChip } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);

const LivePermitBoardScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
      <TopAppBar title="Live Permit Board" showBack onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <StyledText className="text-sm font-bold uppercase color-on-surface-variant">Active Permits (4)</StyledText>
        
        <PermitItem id="#PTW-2024-001" title="Hot Work: Welding" holder="J. Doe" site="Zone A" status="ACTIVE" variant="success" />
        <PermitItem id="#PTW-2024-002" title="Confined Space: Tank 4" holder="R. Smith" site="Sector B" status="ACTIVE" variant="success" />
        <PermitItem id="#PTW-2024-003" title="Excavation" holder="T. Brown" site="North Yard" status="PENDING" variant="warning" />
        <PermitItem id="#PTW-2024-004" title="Electrical Isolation" holder="M. Wilson" site="Substation 1" status="ACTIVE" variant="success" />
      </ScrollView>
    </SafeAreaView>
  );
};

const PermitItem = ({ id, title, holder, site, status, variant }: any) => (
  <IndustrialCard indicatorColor={variant === 'success' ? '#2E7D32' : Colors.secondaryContainer}>
    <StyledView className="flex-row justify-between items-start mb-2">
      <StyledView>
        <StyledText className="text-xs font-bold color-primary">{id}</StyledText>
        <StyledText className="text-lg font-bold">{title}</StyledText>
      </StyledView>
      <StatusChip label={status} variant={variant} />
    </StyledView>
    <StyledView className="flex-row justify-between mt-2 border-t border-outline-variant pt-2">
      <StyledText className="text-[10px] color-on-surface-variant">Holder: {holder}</StyledText>
      <StyledText className="text-[10px] color-on-surface-variant">Location: {site}</StyledText>
    </StyledView>
  </IndustrialCard>
);

export default LivePermitBoardScreen;
