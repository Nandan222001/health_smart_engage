import React from 'react';
import { View, Text, SafeAreaView, ScrollView, Image } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing } from '../theme';
import { TopAppBar, IndustrialCard, StatusChip } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

const EmployeeCertificationScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
      <TopAppBar title="Worker Validation" showBack onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <IndustrialCard className="items-center py-6">
          <StyledView className="w-24 h-24 rounded-full bg-[#edeef0] border-2 border-outline-variant overflow-hidden mb-4">
             <StyledImage source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCaDEKtcQpe1SKA1lHWtC72fjfEo9Ei1pBRjRYYU9apZmNID33tHd-A7rSAjh76-pTSL_qdGCIfDBRw4vuN4E1P-pn3-9UPq5VXkj1cdE-0dqUYlItUao_RUZKOzdWUD5e-PWPVxm-zr2rYlwk7TiS-iXDQ1J9ToydL5xvaeuNf_GRYMhoiZMt3h0yB9ddw3FG-JQ4e-Eh5ckxY1aAVVhRT04fRPiCEgAB3vLmP4L-wQJ6CaN4Cu_VMxDENx8EaW2Y04mDZ4h1mag' }} className="w-full h-full" />
          </StyledView>
          <StyledText className="text-xl font-bold">Mike Roberts</StyledText>
          <StyledText className="text-xs color-on-surface-variant">ID: HSE-EMP-8842</StyledText>
          <StatusChip label="FULLY COMPLIANT" variant="success" className="mt-4" />
        </IndustrialCard>

        <StyledText className="text-sm font-bold uppercase color-on-surface-variant">Active Certifications</StyledText>
        <CertItem title="Working at Height" expiry="Expires Dec 2024" status="Valid" />
        <CertItem title="Confined Space Entry" expiry="Expires Oct 2023" status="EXPIRED" isExpired />
        <CertItem title="Fire Warden Level 2" expiry="Expires Jan 2025" status="Valid" />
      </ScrollView>
    </SafeAreaView>
  );
};

const CertItem = ({ title, expiry, status, isExpired }: any) => (
  <StyledView className="p-4 bg-white border border-outline-variant flex-row justify-between items-center">
    <StyledView>
      <StyledText className="font-bold">{title}</StyledText>
      <StyledText className="text-[10px] color-on-surface-variant">{expiry}</StyledText>
    </StyledView>
    <StyledText className={`text-xs font-bold ${isExpired ? 'color-error' : 'color-primary'}`}>{status}</StyledText>
  </StyledView>
);

export default EmployeeCertificationScreen;
