import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { AppColors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const getTodayDateString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export default function LogMeasurementsScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams();
  const [measurements, setMeasurements] = useState([]);
  const [measurementData, setMeasurementData] = useState({});
  const [adhocMeasurements, setAdhocMeasurements] = useState([{ name: '', value: '' }]);
  const logDate = date || getTodayDateString();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      const selectedDate = new Date(logDate);
      const today = new Date();
      selectedDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        Alert.alert("Future Date", "You cannot log measurements for a future date.", [
          { text: "OK", onPress: () => router.back() }
        ]);
        return;
      }

      const loadMeasurementData = async () => {
        try {
          const savedMeasurements = await AsyncStorage.getItem('@user_measurements');
          setMeasurements(savedMeasurements ? JSON.parse(savedMeasurements) : []);

          const savedLogs = await AsyncStorage.getItem('@measurement_logs');
          if (savedLogs) {
            const allLogs = JSON.parse(savedLogs);
            if (allLogs[logDate]) {
              setMeasurementData(allLogs[logDate]);
            } else {
              setMeasurementData({});
            }
          } else {
            setMeasurementData({});
          }
        } catch (e) {
          Alert.alert('Error', 'Failed to load measurement data.');
        }
      };
      loadMeasurementData();
    }, [logDate, router])
  );

  const handleDataChange = (text, measurement) => {
    setMeasurementData(prev => ({ ...prev, [measurement]: text }));
  };

  const handleAdhocChange = (index, field, value) => {
    const newAdhoc = [...adhocMeasurements];
    newAdhoc[index][field] = value;
    setAdhocMeasurements(newAdhoc);
  };

  const addAdhocField = () => {
    setAdhocMeasurements([...adhocMeasurements, { name: '', value: '' }]);
  };

  const handleSaveChanges = async () => {
    try {
      const finalData = { ...measurementData };
      adhocMeasurements.forEach(item => {
        if (item.name.trim() && item.value.trim()) {
          finalData[item.name.trim()] = item.value.trim();
        }
      });

      const savedLogs = await AsyncStorage.getItem('@measurement_logs') || '{}';
      const logs = JSON.parse(savedLogs);
      logs[logDate] = finalData;
      await AsyncStorage.setItem('@measurement_logs', JSON.stringify(logs));
      Alert.alert('Success', `Measurements saved for ${logDate}.`);
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save measurement data.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 0}
      >
        <ScrollView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Log Measurements</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Measurements for {logDate}</Text>
            {measurements.map(item => (
              <View style={styles.measurementRow} key={item}>
                <Text style={styles.label}>{item}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Value"
                  placeholderTextColor={AppColors.textSecondary}
                  keyboardType="numeric"
                  value={String(measurementData[item] || '')}
                  onChangeText={(text) => handleDataChange(text, item)}
                />
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Other Measurements</Text>
            {adhocMeasurements.map((item, index) => (
              <View style={styles.adhocRow} key={index}>
                <TextInput
                  style={[styles.input, { flex: 2, marginRight: 10 }]}
                  placeholder="Measurement Name"
                  placeholderTextColor={AppColors.textSecondary}
                  value={item.name}
                  onChangeText={(text) => handleAdhocChange(index, 'name', text)}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Value"
                  placeholderTextColor={AppColors.textSecondary}
                  keyboardType="numeric"
                  value={item.value}
                  onChangeText={(text) => handleAdhocChange(index, 'value', text)}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addAdhocField}>
              <Text style={styles.addButtonText}>+ Add Another</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
            <Text style={styles.saveButtonText}>Save All Measurements</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingTop: 20, paddingBottom: 10 },
  backButton: { padding: 10 },
  backButtonText: { color: AppColors.primary, fontSize: 30, fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', color: AppColors.text, textAlign: 'center' },
  card: { backgroundColor: AppColors.card, borderRadius: 10, padding: 15, margin: 10 },
  cardTitle: { fontSize: 20, fontWeight: '600', color: AppColors.text, marginBottom: 15 },
  measurementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  label: { color: AppColors.text, fontSize: 16, flex: 1 },
  input: { backgroundColor: AppColors.background, color: AppColors.text, borderRadius: 8, borderWidth: 1, borderColor: AppColors.border, padding: 10, fontSize: 16 },
  adhocRow: { flexDirection: 'row', marginBottom: 10 },
  addButton: { backgroundColor: AppColors.primary, borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  saveButton: { backgroundColor: AppColors.primary, borderRadius: 8, paddingVertical: 15, alignItems: 'center', margin: 10 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});
