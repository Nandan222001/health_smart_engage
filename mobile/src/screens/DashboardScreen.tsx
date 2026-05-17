import React from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing, BorderRadius } from '../theme';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);

const DashboardScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
      {/* TopAppBar */}
      <StyledView 
        className="flex-row justify-between items-center w-full px-4 h-14 bg-white border-b-2 z-50"
        style={{ borderColor: Colors.outline }}
      >
        <StyledView className="flex-row items-center" style={{ gap: Spacing.stackSm }}>
          <StyledTouchableOpacity className="w-12 h-12 items-center justify-center rounded-full">
            <StyledText className="text-xl" style={{ color: Colors.primary }}>☰</StyledText>
          </StyledTouchableOpacity>
          <StyledText className="text-xl font-bold" style={{ color: Colors.primary }}>HSE Operations</StyledText>
        </StyledView>
        <StyledTouchableOpacity className="w-12 h-12 items-center justify-center rounded-full">
          <StyledText className="text-xl" style={{ color: Colors.primary }}>👤</StyledText>
        </StyledTouchableOpacity>
      </StyledView>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <StyledView className="px-4 pt-6" style={{ gap: Spacing.stackLg }}>
          {/* Greeting Section */}
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

          {/* Quick Actions Grid */}
          <StyledView>
            <StyledText className="text-xs font-bold uppercase mb-2" style={{ color: Colors.onSurfaceVariant }}>Quick Actions</StyledText>
            <StyledView className="flex-row justify-between" style={{ gap: Spacing.stackSm }}>
              <ActionItem icon="⚠️" label="Report Incident" color={Colors.primary} textColor="white" onPress={() => navigation?.navigate('Incident')} />
              <ActionItem icon="🔍" label="Scan QR" color={Colors.secondaryContainer} textColor={Colors.onSecondaryContainer} border={Colors.onSecondaryContainer} />
              <ActionItem icon="✅" label="My Tasks" color={Colors.surfaceContainerHigh} textColor={Colors.onSurface} border={Colors.outline} />
            </StyledView>
          </StyledView>

          {/* Tasks Section */}
          <StyledView style={{ gap: Spacing.stackSm }}>
            <StyledView className="flex-row justify-between items-end">
              <StyledText className="text-xs font-bold uppercase" style={{ color: Colors.onSurfaceVariant }}>Recent Tasks</StyledText>
              <StyledTouchableOpacity>
                <StyledText className="text-xs underline" style={{ color: Colors.primary }}>View All</StyledText>
              </StyledTouchableOpacity>
            </StyledView>
            <StyledView style={{ gap: 12 }}>
              <TaskCard title="Site Perimeter Check" location="Main Warehouse" due="Due by 14:00" status="IN PROGRESS" indicator={Colors.secondaryContainer} />
              <TaskCard title="Equipment Tagging" location="Loading Dock 4" due="Due Yesterday" status="OVERDUE" indicator={Colors.error} />
              <TaskCard title="Staff PPE Audit" location="Admin Block" due="Due tomorrow" status="UPCOMING" indicator={Colors.primary} />
            </StyledView>
          </StyledView>

          {/* Visual Anchor */}
          <StyledView className="rounded-lg overflow-hidden border-2 relative h-40" style={{ borderColor: Colors.outline }}>
            <StyledImage 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEd-eTDviReeB-k-SWLVXQSI-XkZJYvWWV_-QVoEwc_vTchC4L-3dMiaTrbp6-kXVK5zQfcvRdyOifaJdHACS9Gy16KcvUleJ_hxutiZTyWx0gxEv5gDtleVf4QpQ0ZQgyOcXPvM6g7DzF6zWQDKo_W5Nw6eJpEPcUQN8gA1yEF4T8EZu4dxR11gTATubAtNvA1Jcp7mbrVdkAugLgd-HHdSh9GYS6KWiqxtHJmo0yVNiAoJoXvhvJYMHzxfGP58sjQDp-7jn1ig' }}
              className="w-full h-full opacity-60"
            />
            <StyledView className="absolute inset-0 bg-black/40 flex-col justify-end p-4">
              <StyledText className="text-[10px] font-bold text-white uppercase">Active Site</StyledText>
              <StyledText className="text-lg font-bold text-white">Zone B-North Operations</StyledText>
            </StyledView>
          </StyledView>
        </StyledView>
      </ScrollView>

      {/* BottomNavBar */}
      <StyledView 
        className="absolute bottom-0 left-0 w-full flex-row justify-around items-center px-4 py-2 bg-white border-t-2 z-50"
        style={{ borderColor: Colors.outline }}
      >
        <NavItem icon="📊" label="Dashboard" active />
        <NavItem icon="📖" label="Incidents" onPress={() => navigation?.navigate('Incident')} />
        <NavItem icon="🏢" label="Sites" onPress={() => navigation?.navigate('SiteSelection')} />
        <NavItem icon="⚙️" label="Settings" />
      </StyledView>
    </SafeAreaView>
  );
};

// Sub-components
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
  <StyledView className="bg-white border-2 p-4 rounded-lg flex-row relative overflow-hidden" style={{ borderColor: Colors.outlineVariant }}>
    <StyledView className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: indicator }} />
    <StyledView className="flex-1">
      <StyledView className="flex-row justify-between items-start mb-1">
        <StyledText className="text-lg font-bold" style={{ color: Colors.onSurface }}>{title}</StyledText>
        <StyledView className="px-2 py-0.5 rounded-full border" style={{ backgroundColor: Colors.surfaceContainer, borderColor: Colors.outline }}>
          <StyledText className="text-[8px] font-bold uppercase">{status}</StyledText>
        </StyledView>
      </StyledView>
      <StyledText className="text-xs" style={{ color: Colors.onSurfaceVariant }}>📍 {location}</StyledText>
      <StyledText className="text-xs mt-1" style={{ color: Colors.onSurfaceVariant }}>🕒 {due}</StyledText>
    </StyledView>
  </StyledView>
);

const NavItem = ({ icon, label, active = false, onPress }: any) => (
  <StyledTouchableOpacity 
    className={`flex-col items-center justify-center px-4 py-1 rounded-lg ${active ? 'bg-[#fed000]' : ''}`}
    onPress={onPress}
  >
    <StyledText className="text-xl">{icon}</StyledText>
    <StyledText className="text-[10px] font-bold">{label}</StyledText>
  </StyledTouchableOpacity>
);

export default DashboardScreen;
