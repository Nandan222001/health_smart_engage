import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUserRole } from '../hooks/useUserRole';
import { Colors } from '../theme';

// Screens
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
import ContractorScanScreen from '../screens/ContractorScanScreen';
import RiskAssessmentScreen from '../screens/RiskAssessmentScreen';
import InvestigationScreen from '../screens/InvestigationScreen';
import SyncStatusScreen from '../screens/SyncStatusScreen';
import TrainingCompletionScreen from '../screens/TrainingCompletionScreen';
import EmployeeCertificationScreen from '../screens/EmployeeCertificationScreen';
import VendorStatusScreen from '../screens/VendorStatusScreen';
import LivePermitBoardScreen from '../screens/LivePermitBoardScreen';
import AssetInspectionScreen from '../screens/AssetInspectionScreen';
import AuditSyncQueueScreen from '../screens/AuditSyncQueueScreen';
import PermitExtensionScreen from '../screens/PermitExtensionScreen';
import PermitClosureScreen from '../screens/PermitClosureScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
    <Stack.Screen name="ContractorScan" component={ContractorScanScreen} />
    <Stack.Screen name="RiskAssessment" component={RiskAssessmentScreen} />
    <Stack.Screen name="Investigation" component={InvestigationScreen} />
    <Stack.Screen name="SyncStatus" component={SyncStatusScreen} />
    <Stack.Screen name="TrainingRecord" component={TrainingCompletionScreen} />
    <Stack.Screen name="EmpCert" component={EmployeeCertificationScreen} />
    <Stack.Screen name="VendorStatus" component={VendorStatusScreen} />
    <Stack.Screen name="LivePermits" component={LivePermitBoardScreen} />
    <Stack.Screen name="AssetInspection" component={AssetInspectionScreen} />
    <Stack.Screen name="AuditSync" component={AuditSyncQueueScreen} />
    <Stack.Screen name="PermitExtend" component={PermitExtensionScreen} />
    <Stack.Screen name="PermitClose" component={PermitClosureScreen} />
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
          <Tab.Screen name="Board" component={LivePermitBoardScreen} options={{ tabBarIcon: () => '📈' }} />
          <Tab.Screen name="Audits" component={AuditScreen} options={{ tabBarIcon: () => '📋' }} />
        </>
      )}
      {role === 'GATE_SECURITY' && (
        <Tab.Screen name="Scan" component={ContractorScanScreen} options={{ tabBarIcon: () => '🔍' }} />
      )}
      <Tab.Screen name="Library" component={SOPScreen} options={{ tabBarIcon: () => '📖' }} />
    </Tab.Navigator>
  );
};

export const RoleBasedNavigator = () => <CommonStack />;
