import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SiteSelectionScreen from '../screens/SiteSelectionScreen';
import { RoleBasedNavigator } from './RoleBasedNavigator';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SiteSelection" component={SiteSelectionScreen} />
      <Stack.Screen name="App" component={RoleBasedNavigator} />
    </Stack.Navigator>
  );
};
