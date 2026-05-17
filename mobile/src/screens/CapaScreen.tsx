import React from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing } from '../theme';
import { TopAppBar, IndustrialCard, StatusChip, Button } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);

const CapaScreen = ({ navigation }: any) => {
  const capas = [
    { id: '1', title: 'Fix Loose Guardrail', area: 'Zone 4', status: 'OVERDUE', type: 'error' },
    { id: '2', title: 'Replace Fire Extinguisher', area: 'Block B', status: 'IN PROGRESS', type: 'warning' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
      <TopAppBar title="My CAPA Actions" showBack onBack={() => navigation?.goBack()} />
      <ScrollView className="p-4">
        <StyledView style={{ gap: 16 }}>
          {capas.map((c) => (
            <IndustrialCard key={c.id} indicatorColor={c.type === 'error' ? Colors.error : Colors.secondaryContainer}>
              <StyledView className="flex-row justify-between items-start mb-2">
                <StyledView>
                  <StyledText className="text-lg font-bold" style={{ color: Colors.onSurface }}>{c.title}</StyledText>
                  <StyledText className="text-xs" style={{ color: Colors.onSurfaceVariant }}>{c.area}</StyledText>
                </StyledView>
                <StatusChip label={c.status} variant={c.type === 'error' ? 'error' : 'warning'} />
              </StyledView>
              <Button label="Upload Evidence" variant="outline" className="h-10 mt-2" />
            </IndustrialCard>
          ))}
        </StyledView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CapaScreen;
