import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import IncidentScreen from '../screens/IncidentScreen';
import PermitScreen from '../screens/PermitScreen';
import AuditScreen from '../screens/AuditScreen';
import SOPScreen from '../screens/SOPScreen';
import NotificationScreen from '../screens/NotificationScreen';
import HazardObservationScreen from '../screens/HazardObservationScreen';
import CapaScreen from '../screens/CapaScreen';
import AIAdvisorScreen from '../screens/AIAdvisorScreen';
import AssetLookupScreen from '../screens/AssetLookupScreen';
import { useUserRole } from '../hooks/useUserRole';
import { Colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Common Stack for detailed screens accessible from any role
const CommonStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Main" component={TabNavigator} />
    <Stack.Screen name="Notifications" component={NotificationScreen} />
    <Stack.Screen name="Hazard" component={HazardObservationScreen} />
    <Stack.Screen name="CAPA" component={CapaScreen} />
    <Stack.Screen name="AIAdvisor" component={AIAdvisorScreen} />
    <Stack.Screen name="Assets" component={AssetLookupScreen} />
    <Stack.Screen name="Incidents" component={IncidentScreen} />
    <Stack.Screen name="Permits" component={PermitScreen} />
    <Stack.Screen name="Audit" component={AuditScreen} />
    <Stack.Screen name="Docs" component={SOPScreen} />
  </Stack.Navigator>
);

const TabNavigator = () => {
  const { role } = useUserRole();

  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: Colors.primary }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: () => '📊' }} />
      {role === 'FIELD_WORKER' && (
        <>
          <Tab.Screen name="Report" component={IncidentScreen} options={{ tabBarIcon: () => '⚠️' }} />
          <Tab.Screen name="Permit" component={PermitScreen} options={{ tabBarIcon: () => '📝' }} />
        </>
      )}
      {role === 'SAFETY_MANAGER' && (
        <>
          <Tab.Screen name="LiveBoard" component={DashboardScreen} options={{ tabBarIcon: () => '📈' }} />
          <Tab.Screen name="Audits" component={AuditScreen} options={{ tabBarIcon: () => '📋' }} />
        </>
      )}
      <Tab.Screen name="SOPs" component={SOPScreen} options={{ tabBarIcon: () => '📖' }} />
    </Tab.Navigator>
  );
};

export const RoleBasedNavigator = () => {
  return <CommonStack />;
};
