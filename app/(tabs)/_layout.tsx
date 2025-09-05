import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tracking',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="configuration"
        options={{
          title: 'Configuration',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}
