import React from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing } from '../theme';
import { TopAppBar, IndustrialCard, StatusChip } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);

const NotificationScreen = ({ navigation }: any) => {
  const notifications = [
    { id: '1', title: 'New Permit Request', message: 'Permit #2024-001 requires your approval.', time: '10m ago', type: 'warning' },
    { id: '2', title: 'Asset Inspection Due', message: 'Crane-02 inspection is overdue by 2 days.', time: '1h ago', type: 'error' },
    { id: '3', title: 'Policy Update', message: 'SOP for Working at Height has been updated.', time: '5h ago', type: 'info' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
      <TopAppBar title="Notifications" showBack onBack={() => navigation?.goBack()} />
      <ScrollView className="p-4">
        <StyledView style={{ gap: 16 }}>
          {notifications.map((n) => (
            <IndustrialCard key={n.id} indicatorColor={n.type === 'error' ? Colors.error : n.type === 'warning' ? Colors.secondaryContainer : Colors.primary}>
              <StyledView className="flex-row justify-between items-start mb-1">
                <StyledText className="text-lg font-bold" style={{ color: Colors.onSurface }}>{n.title}</StyledText>
                <StyledText className="text-[10px]" style={{ color: Colors.outline }}>{n.time}</StyledText>
              </StyledView>
              <StyledText className="text-sm" style={{ color: Colors.onSurfaceVariant }}>{n.message}</StyledText>
            </IndustrialCard>
          ))}
        </StyledView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationScreen;
