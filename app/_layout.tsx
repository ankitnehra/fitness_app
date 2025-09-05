import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Create a custom dark theme by extending the default and overriding colors
const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.background,
    text: Colors.dark.text,
    border: Colors.dark.background,
    notification: Colors.dark.tint,
  },
};

export default function RootLayout() {
  // Forcing dark theme as per the new design
  return (
    <ThemeProvider value={AppDarkTheme}>
      <Stack screenOptions={{
        headerStyle: {
          backgroundColor: AppDarkTheme.colors.background,
        },
        headerTintColor: AppDarkTheme.colors.text,
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="workout" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="exercises" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="dayDetails" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="logMeasurements" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}