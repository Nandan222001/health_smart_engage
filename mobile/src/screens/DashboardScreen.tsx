import React from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing } from '../theme';
import { TopAppBar, BottomNavBar, IndustrialCard, StatusChip } from '../components';
import { useUserRole } from '../hooks/useUserRole';

const StyledView = styled(View);
const StyledText = styled(Text);

const DashboardScreen = ({ navigation }: any) => {
  const { role } = useUserRole();

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
            <StyledText className="text-xs font-bold uppercase tracking-wider" style={{ color: Colors.onSurfaceVariant }}>{role.replace('_', ' ')}</StyledText>
            <StyledText className="text-3xl font-bold mt-1" style={{ color: Colors.onSurface }}>Hello, Mike</StyledText>
          </StyledView>

          {/* Role-Specific Quick Actions */}
          <StyledView>
            <StyledText className="text-xs font-bold uppercase mb-2" style={{ color: Colors.onSurfaceVariant }}>Priority Actions</StyledText>
            <StyledView className="flex-row flex-wrap justify-between" style={{ gap: 8 }}>
              {role === 'FIELD_WORKER' && (
                <>
                  <ActionItem icon="⚠️" label="Report" color={Colors.primary} textColor="white" onPress={() => navigation?.navigate('Incidents')} />
                  <ActionItem icon="🚨" label="Hazard" color={Colors.error} textColor="white" onPress={() => navigation?.navigate('Hazard')} />
                  <ActionItem icon="📝" label="Permit" color={Colors.secondary} textColor="white" onPress={() => navigation?.navigate('Permits')} />
                </>
              )}
              {role === 'SAFETY_MANAGER' && (
                <>
                  <ActionItem icon="📈" label="Live Board" color={Colors.primary} textColor="white" onPress={() => navigation?.navigate('LivePermits')} />
                  <ActionItem icon="📋" label="Audits" color={Colors.secondary} textColor="white" onPress={() => navigation?.navigate('Audit')} />
                  <ActionItem icon="🔍" label="Investigate" color={Colors.error} textColor="white" onPress={() => navigation?.navigate('Investigation')} />
                </>
              )}
              {role === 'GATE_SECURITY' && (
                <>
                  <ActionItem icon="🔍" label="Scan QR" color={Colors.primary} textColor="white" onPress={() => navigation?.navigate('ContractorScan')} />
                  <ActionItem icon="🏢" label="Vendor" color={Colors.secondary} textColor="white" onPress={() => navigation?.navigate('VendorStatus')} />
                  <ActionItem icon="📋" label="Check List" color={Colors.surfaceContainerHigh} textColor={Colors.onSurface} border={Colors.outline} />
                </>
              )}
            </StyledView>
          </StyledView>

          {/* Operational Tools */}
          <StyledView>
            <StyledText className="text-xs font-bold uppercase mb-2" style={{ color: Colors.onSurfaceVariant }}>Operational Tools</StyledText>
            <StyledView className="flex-row flex-wrap justify-between" style={{ gap: 8 }}>
              <ActionItem icon="🏗️" label="Assets" color={Colors.surfaceContainerHigh} textColor={Colors.onSurface} border={Colors.outline} onPress={() => navigation?.navigate('Assets')} />
              <ActionItem icon="🤖" label="AI Advisor" color={Colors.surfaceContainerHigh} textColor={Colors.onSurface} border={Colors.outline} onPress={() => navigation?.navigate('AIAdvisor')} />
              <ActionItem icon="👤" label="Verify" color={Colors.surfaceContainerHigh} textColor={Colors.onSurface} border={Colors.outline} onPress={() => navigation?.navigate('EmpCert')} />
              <ActionItem icon="🔄" label="Sync" color={Colors.surfaceContainerHigh} textColor={Colors.onSurface} border={Colors.outline} onPress={() => navigation?.navigate('SyncStatus')} />
            </StyledView>
          </StyledView>

          <TaskCard title="Site Perimeter Check" location="Main Warehouse" due="Due by 14:00" status="IN PROGRESS" indicator={Colors.secondaryContainer} />
        </StyledView>
      </ScrollView>
    </SafeAreaView>
  );
};

const StyledTouchableOpacity = styled(TouchableOpacity);

const ActionItem = ({ icon, label, color, textColor, border, onPress }: any) => (
  <StyledTouchableOpacity 
    className="w-[31%] aspect-square rounded-lg items-center justify-center p-2 border-2"
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
