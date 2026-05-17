import React from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView, ScrollView, TextInput, StyleSheet } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing, BorderRadius } from '../theme';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);
const StyledTextInput = styled(TextInput);

const SOPScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
      {/* TopAppBar */}
      <StyledView 
        className="flex-row justify-between items-center w-full px-4 h-14 bg-white border-b-2 z-50"
        style={{ borderColor: Colors.outlineVariant }}
      >
        <StyledView className="flex-row items-center" style={{ gap: 12 }}>
          <StyledView className="w-10 h-10 rounded-full overflow-hidden bg-[#edeef0]">
            <StyledImage 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCaDEKtcQpe1SKA1lHWtC72fjfEo9Ei1pBRjRYYU9apZmNID33tHd-A7rSAjh76-pTSL_qdGCIfDBRw4vuN4E1P-pn3-9UPq5VXkj1cdE-0dqUYlItUao_RUZKOzdWUD5e-PWPVxm-zr2rYlwk7TiS-iXDQ1J9ToydL5xvaeuNf_GRYMhoiZMt3h0yB9ddw3FG-JQ4e-Eh5ckxY1aAVVhRT04fRPiCEgAB3vLmP4L-wQJ6CaN4Cu_VMxDENx8EaW2Y04mDZ4h1mag' }}
              className="w-full h-full"
            />
          </StyledView>
          <StyledText className="text-xl font-bold" style={{ color: Colors.primary }}>HSE FieldSafe</StyledText>
        </StyledView>
        <StyledTouchableOpacity className="w-12 h-12 items-center justify-center">
          <StyledText className="text-xl" style={{ color: Colors.primary }}>🔔</StyledText>
        </StyledTouchableOpacity>
      </StyledView>

      <ScrollView contentContainerStyle={{ paddingBottom: 220 }}>
        <StyledView className="px-4 pt-6" style={{ gap: Spacing.stackLg }}>
          {/* Search Section */}
          <StyledView style={{ gap: Spacing.stackSm }}>
            <StyledText className="text-xl font-bold" style={{ color: Colors.onSurface }}>SOP Documentation</StyledText>
            <StyledView className="relative">
              <StyledText className="absolute left-4 top-4 z-10" style={{ color: Colors.outline }}>🔍</StyledText>
              <StyledTextInput 
                className="w-full h-14 pl-12 pr-4 bg-white border-2 rounded-lg text-sm"
                style={{ borderColor: Colors.outline, color: Colors.onSurface }}
                placeholder="Search by title or safety tag..."
                placeholderTextColor={Colors.outlineVariant}
              />
            </StyledView>
            <StyledScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mt-2">
              <FilterTag label="All SOPs" active />
              <FilterTag label="High Risk" />
              <FilterTag label="Electrical" />
              <FilterTag label="Working at Height" />
            </StyledScrollView>
          </StyledView>

          {/* SOP Cards List */}
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
            <SOPCard 
              title="Hazardous Chemical Handling"
              description="Refined safety data for handling Class 4 Corrosive materials in Block C."
              tag="URGENT UPDATE"
              rev="Rev 6.1"
              updated="Updated 2 days ago"
              action="Acknowledge Now"
              color="#ba1a1a"
            />
            <SOPCard 
              title="On-Site PPE Standards"
              description="Minimum requirements for protective eyewear, headwear, and steel-toed boots."
              tag="GENERAL"
              rev="Rev 2.0"
              updated="Jan 15, 2023"
              color="#434654"
            />
          </StyledView>
        </StyledView>
      </ScrollView>

      {/* Sticky Bottom Acknowledge */}
      <StyledView 
        className="absolute bottom-20 left-0 w-full bg-white p-4 border-t-2 z-40"
        style={{ borderColor: Colors.outlineVariant }}
      >
        <StyledTouchableOpacity 
          className="w-full h-14 flex-row items-center justify-center rounded-lg shadow-md active:scale-95"
          style={{ backgroundColor: Colors.secondaryContainer, gap: 8 }}
        >
          <StyledText className="text-xl">✅</StyledText>
          <StyledText className="text-sm font-bold uppercase tracking-wider" style={{ color: Colors.onSecondaryContainer }}>Acknowledge All Read SOPs</StyledText>
        </StyledTouchableOpacity>
      </StyledView>

      {/* Bottom Nav Placeholder */}
      <StyledView 
        className="absolute bottom-0 left-0 w-full flex-row justify-around items-center px-4 py-2 bg-white border-t-2 z-50"
        style={{ borderColor: Colors.outlineVariant }}
      >
        <NavItem icon="📊" label="Dashboard" />
        <NavItem icon="⚠️" label="Incidents" active />
        <NavItem icon="📋" label="Permits" />
        <NavItem icon="⚙️" label="Settings" />
      </StyledView>
    </SafeAreaView>
  );
};

// Sub-components
const FilterTag = ({ label, active = false }: any) => (
  <StyledTouchableOpacity 
    className={`px-4 py-2 rounded-full border ${active ? 'bg-[#003d9b]' : 'bg-[#e7e8ea] border-[#c3c6d6]'}`}
  >
    <StyledText className={`text-xs font-bold ${active ? 'text-white' : 'text-on-surface-variant'}`}>{label}</StyledText>
  </StyledTouchableOpacity>
);

const SOPCard = ({ title, description, tag, rev, updated, views, action, color }: any) => (
  <StyledView className="bg-white p-4 border rounded-lg relative" style={{ borderColor: Colors.outlineVariant, borderLeftWidth: 4, borderLeftColor: color }}>
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
        <StyledText className="text-[10px]" style={{ color: Colors.outline }}>📅</StyledText>
        <StyledText className="text-[10px]" style={{ color: Colors.outline }}>{updated}</StyledText>
      </StyledView>
      {views && (
        <StyledView className="flex-row items-center" style={{ gap: 4 }}>
          <StyledText className="text-[10px]" style={{ color: Colors.outline }}>👁️</StyledText>
          <StyledText className="text-[10px]" style={{ color: Colors.outline }}>{views}</StyledText>
        </StyledView>
      )}
      {action && (
        <StyledView className="flex-row items-center ml-auto" style={{ gap: 4 }}>
          <StyledText className="text-[10px]" style={{ color: Colors.primary }}>✅</StyledText>
          <StyledText className="text-[10px] font-bold" style={{ color: Colors.primary }}>{action}</StyledText>
        </StyledView>
      )}
    </StyledView>
  </StyledView>
);

const NavItem = ({ icon, label, active = false }: any) => (
  <StyledTouchableOpacity 
    className={`flex-col items-center justify-center px-4 py-1 rounded-lg ${active ? 'bg-[#fed000]' : ''}`}
  >
    <StyledText className="text-xl">{icon}</StyledText>
    <StyledText className="text-[10px] font-bold">{label}</StyledText>
  </StyledTouchableOpacity>
);

export default SOPScreen;
