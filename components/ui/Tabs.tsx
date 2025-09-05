
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppColors } from '@/constants/Colors';

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabPress }: TabsProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => onTabPress(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: AppColors.card,
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 20,
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: AppColors.primary,
  },
  tabText: {
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
});
