import React from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing } from '../theme';
import { TopAppBar, BottomNavBar, IndustrialCard, StatusChip } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

const DashboardScreen = ({ navigation }: any) => {
  const navItems = [
    { icon: '📊', label: 'Dashboard', active: true },
    { icon: '📖', label: 'Incidents', onPress: () => navigation?.navigate('Incidents') },
    { icon: '📋', label: 'Tasks', onPress: () => navigation?.navigate('CAPA') },
    { icon: '⚙️', label: 'Settings' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
      <TopAppBar 
        title="HSE Operations" 
        showNotifications 
        onBack={() => navigation?.navigate('Notifications')} 
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <StyledView className="px-4 pt-6" style={{ gap: Spacing.stackLg }}>
          <StyledView>
            <StyledText className="text-xs font-bold uppercase tracking-wider" style={{ color: Colors.onSurfaceVariant }}>Welcome back</StyledText>
            <StyledText className="text-3xl font-bold mt-1" style={{ color: Colors.onSurface }}>Hello, Mike</StyledText>
          </StyledView>

          {/* Status Banner */}
          <StyledView 
            className="flex-row items-center justify-between p-4 rounded-lg shadow-sm border-2"
            style={{ backgroundColor: '#2E7D32', borderColor: '#1B5E20' }}
          >
            <StyledView className="flex-row items-center" style={{ gap: 16 }}>
              <StyledView className="bg-white/20 p-2 rounded-full">
                <StyledText className="text-3xl text-white">🛡️</StyledText>
              </StyledView>
              <StyledView>
                <StyledText className="text-xl font-bold text-white">Safe Day</StyledText>
                <StyledText className="text-xs text-white/80">No active incidents at Site A-12</StyledText>
              </StyledView>
            </StyledView>
            <StyledText className="text-4xl text-white">✅</StyledText>
          </StyledView>

          {/* Quick Actions */}
          <StyledView>
            <StyledText className="text-xs font-bold uppercase mb-2" style={{ color: Colors.onSurfaceVariant }}>Quick Actions</StyledText>
            <StyledView className="flex-row justify-between" style={{ gap: Spacing.stackSm }}>
              <ActionItem icon="⚠️" label="Report Incident" color={Colors.primary} textColor="white" onPress={() => navigation?.navigate('Incidents')} />
              <ActionItem icon="🚨" label="Hazard" color={Colors.error} textColor="white" onPress={() => navigation?.navigate('Hazard')} />
              <ActionItem icon="🤖" label="AI Advisor" color={Colors.secondary} textColor="white" onPress={() => navigation?.navigate('AIAdvisor')} />
            </StyledView>
          </StyledView>

          {/* Additional Features */}
          <StyledView>
            <StyledText className="text-xs font-bold uppercase mb-2" style={{ color: Colors.onSurfaceVariant }}>Operations</StyledText>
            <StyledView className="flex-row justify-between" style={{ gap: Spacing.stackSm }}>
              <ActionItem icon="🏗️" label="Assets" color={Colors.surfaceContainerHigh} textColor={Colors.onSurface} border={Colors.outline} onPress={() => navigation?.navigate('Assets')} />
              <ActionItem icon="📝" label="Permits" color={Colors.surfaceContainerHigh} textColor={Colors.onSurface} border={Colors.outline} onPress={() => navigation?.navigate('Permits')} />
              <ActionItem icon="📖" label="SOPs" color={Colors.surfaceContainerHigh} textColor={Colors.onSurface} border={Colors.outline} onPress={() => navigation?.navigate('Docs')} />
            </StyledView>
          </StyledView>

          <StyledView style={{ gap: Spacing.stackSm }}>
            <StyledView className="flex-row justify-between items-end">
              <StyledText className="text-xs font-bold uppercase" style={{ color: Colors.onSurfaceVariant }}>Recent Tasks</StyledText>
              <TouchableOpacity onPress={() => navigation?.navigate('CAPA')}>
                <StyledText className="text-xs underline" style={{ color: Colors.primary }}>View All</StyledText>
              </TouchableOpacity>
            </StyledView>
            <TaskCard title="Site Perimeter Check" location="Main Warehouse" due="Due by 14:00" status="IN PROGRESS" indicator={Colors.secondaryContainer} />
          </StyledView>
        </StyledView>
      </ScrollView>

      <BottomNavBar items={navItems} />
    </SafeAreaView>
  );
};

const StyledTouchableOpacity = styled(TouchableOpacity);

const ActionItem = ({ icon, label, color, textColor, border, onPress }: any) => (
  <StyledTouchableOpacity 
    className="flex-1 aspect-square rounded-lg items-center justify-center p-2 border-2"
    style={{ backgroundColor: color, borderColor: border || color }}
    onPress={onPress}
  >
    <StyledText className="text-2xl mb-1">{icon}</StyledText>
    <StyledText className="text-[10px] font-bold text-center leading-tight" style={{ color: textColor }}>{label}</StyledText>
  </StyledTouchableOpacity>
);

const TaskCard = ({ title, location, due, status, indicator }: any) => (
  <IndustrialCard indicatorColor={indicator}>
    <StyledView className="flex-row justify-between items-start mb-1">
      <StyledText className="text-lg font-bold" style={{ color: Colors.onSurface }}>{title}</StyledText>
      <StatusChip label={status} />
    </StyledView>
    <StyledText className="text-xs" style={{ color: Colors.onSurfaceVariant }}>📍 {location}</StyledText>
    <StyledText className="text-xs mt-1" style={{ color: Colors.onSurfaceVariant }}>🕒 {due}</StyledText>
  </IndustrialCard>
);

export default DashboardScreen;
