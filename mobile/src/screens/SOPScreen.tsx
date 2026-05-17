import React from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing } from '../theme';
import { TopAppBar, BottomNavBar, Button, IndustrialCard, InputField } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

const SOPScreen = ({ navigation }: any) => {
  const navItems = [
    { icon: '📊', label: 'Dashboard' },
    { icon: '⚠️', label: 'Incidents', active: true },
    { icon: '📋', label: 'Permits' },
    { icon: '⚙️', label: 'Settings' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
      <TopAppBar title="HSE FieldSafe" />

      <ScrollView contentContainerStyle={{ paddingBottom: 220 }}>
        <StyledView className="px-4 pt-6" style={{ gap: Spacing.stackLg }}>
          <StyledView style={{ gap: Spacing.stackSm }}>
            <StyledText className="text-xl font-bold" style={{ color: Colors.onSurface }}>SOP Documentation</StyledText>
            <InputField placeholder="Search by title or safety tag..." icon="🔍" />
            <StyledScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mt-2">
              <FilterTag label="All SOPs" active />
              <FilterTag label="High Risk" />
              <FilterTag label="Electrical" />
              <FilterTag label="Working at Height" />
            </StyledScrollView>
          </StyledView>

          <StyledView style={{ gap: Spacing.stackMd }}>
            <SOPCard 
              title="Confined Space Entry Protocol"
              description="Mandatory procedures for entry and atmospheric monitoring in Grade A enclosures."
              tag="HIGH RISK"
              rev="Rev 4.2"
              updated="Oct 12, 2023"
              views="2.4k views"
              color={Colors.primary}
            />
            <SOPCard 
              title="LOTO: Lock Out Tag Out"
              description="Standard energy isolation process for heavy machinery maintenance cycles."
              tag="ELECTRICAL"
              rev="Rev 1.0"
              updated="Sep 30, 2023"
              views="Pending Review"
              color="#725c00"
            />
          </StyledView>
        </StyledView>
      </ScrollView>

      <StyledView className="absolute bottom-20 left-0 w-full bg-white p-4 border-t-2 z-40" style={{ borderColor: Colors.outlineVariant }}>
        <Button label="Acknowledge All Read SOPs" icon="✅" variant="secondary" />
      </StyledView>

      <BottomNavBar items={navItems} />
    </SafeAreaView>
  );
};

const FilterTag = ({ label, active = false }: any) => (
  <StyledTouchableOpacity 
    className={`px-4 py-2 rounded-full border ${active ? 'bg-[#003d9b]' : 'bg-[#e7e8ea] border-[#c3c6d6]'}`}
  >
    <StyledText className={`text-xs font-bold ${active ? 'text-white' : 'text-on-surface-variant'}`}>{label}</StyledText>
  </StyledTouchableOpacity>
);

const SOPCard = ({ title, description, tag, rev, updated, views, action, color }: any) => (
  <IndustrialCard indicatorColor={color}>
    <StyledView className="flex-row justify-between items-start mb-2">
      <StyledView className="bg-[#edeef0] px-2 py-0.5 rounded">
        <StyledText className="text-[10px] font-bold" style={{ color: Colors.onSurfaceVariant }}>{tag}</StyledText>
      </StyledView>
      <StyledText className="text-[10px] font-bold uppercase" style={{ color: Colors.outline }}>{rev}</StyledText>
    </StyledView>
    <StyledText className="text-lg font-bold mb-1" style={{ color: Colors.onSurface }}>{title}</StyledText>
    <StyledText className="text-sm mb-4" style={{ color: Colors.onSurfaceVariant }}>{description}</StyledText>
    <StyledView className="flex-row items-center gap-4 border-t pt-3" style={{ borderColor: Colors.outlineVariant }}>
      <StyledView className="flex-row items-center" style={{ gap: 4 }}>
        <StyledText className="text-[10px]">📅</StyledText>
        <StyledText className="text-[10px]" style={{ color: Colors.outline }}>{updated}</StyledText>
      </StyledView>
    </StyledView>
  </IndustrialCard>
);

const StyledTouchableOpacity = styled(TouchableOpacity);

export default SOPScreen;
