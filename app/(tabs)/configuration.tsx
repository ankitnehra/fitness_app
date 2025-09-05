import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { AppColors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ConfigurationScreen() {
  const router = useRouter();
  const [schedule, setSchedule] = useState({});
  const [measurements, setMeasurements] = useState([]);
  const [newMeasurement, setNewMeasurement] = useState('');
  const [goals, setGoals] = useState({ calories: '', water: '', alcohol: '' });
  const [exerciseCounts, setExerciseCounts] = useState({});
  const insets = useSafeAreaInsets();

  const loadData = async () => {
    try {
      const savedSchedule = await AsyncStorage.getItem('@user_schedule');
      setSchedule(savedSchedule ? JSON.parse(savedSchedule) : {});

      const savedMeasurements = await AsyncStorage.getItem('@user_measurements');
      setMeasurements(savedMeasurements ? JSON.parse(savedMeasurements) : ['Weight', 'Chest']);
      
      const savedGoals = await AsyncStorage.getItem('@user_goals');
      setGoals(savedGoals ? JSON.parse(savedGoals) : { calories: '', water: '', alcohol: '' });

      const counts = {};
      for (const day of DAYS) {
        const exercises = await AsyncStorage.getItem(`@exercises_${day}`);
        counts[day] = exercises ? JSON.parse(exercises).length : 0;
      }
      setExerciseCounts(counts);

    } catch (e) {
      Alert.alert('Error', 'Failed to load configurations.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem('@user_schedule', JSON.stringify(schedule));
      await AsyncStorage.setItem('@user_measurements', JSON.stringify(measurements));
      await AsyncStorage.setItem('@user_goals', JSON.stringify(goals));
      Alert.alert('Success', 'Your configurations have been saved!');
    } catch (e) {
      Alert.alert('Error', 'Failed to save configurations.');
    }
  };

  const handleAddMeasurement = () => {
    if (newMeasurement.trim() !== '' && !measurements.includes(newMeasurement.trim())) {
      setMeasurements([...measurements, newMeasurement.trim()]);
      setNewMeasurement('');
    }
  };

  const handleRemoveMeasurement = (itemToRemove) => {
    setMeasurements(measurements.filter(item => item !== itemToRemove));
  };

  const getWorkoutDisplay = (day) => {
    const workoutTitle = schedule[day];
    const count = exerciseCounts[day] || 0;

    if (workoutTitle && workoutTitle.trim()) {
      return `${workoutTitle} (${count} exercises)`;
    }
    if (count > 0) {
      return `${count} exercises`;
    }
    return 'Rest Day';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 0}
      >
        <Text style={styles.headerTitle}>Configuration Hub</Text>
        <Text style={styles.headerSubtitle}>Set up your weekly workout schedule, goals, and tracking preferences.</Text>
        <ScrollView>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Weekly Workout Schedule</Text>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save All Changes</Text>
              </TouchableOpacity>
            </View>
            {DAYS.map(day => (
              <TouchableOpacity key={day} style={styles.dayRow} onPress={() => router.push(`/exercises?day=${day}`)}>
                <Text style={styles.dayLabel}>{day}</Text>
                <View style={styles.dayTouchable}>
                  <Text style={styles.workoutText}>{getWorkoutDisplay(day)}</Text>
                  <Text style={styles.arrow}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Health Goals</Text>
            <Text style={styles.label}>Daily Calorie Goal</Text>
            <TextInput
              style={styles.input}
              value={goals.calories}
              onChangeText={text => setGoals(g => ({ ...g, calories: text }))}
              placeholder="e.g., 2500"
              placeholderTextColor={AppColors.textSecondary}
              keyboardType="numeric"
            />
            <Text style={styles.label}>Daily Water Intake Goal (Liters)</Text>
            <TextInput
              style={styles.input}
              value={goals.water}
              onChangeText={text => setGoals(g => ({ ...g, water: text }))}
              placeholder="e.g., 3"
              placeholderTextColor={AppColors.textSecondary}
              keyboardType="numeric"
            />
            <Text style={styles.label}>Weekly Alcohol Limit (Drinks)</Text>
            <TextInput
              style={styles.input}
              value={goals.alcohol}
              onChangeText={text => setGoals(g => ({ ...g, alcohol: text }))}
              placeholder="e.g., 5"
              placeholderTextColor={AppColors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Body Measurements to Track</Text>
            {measurements.map((item) => (
              <View key={item} style={styles.measurementRow}>
                <Text style={styles.measurementLabel}>{item}</Text>
                <TouchableOpacity onPress={() => handleRemoveMeasurement(item)}>
                  <Text style={styles.deleteButton}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.addMeasurementContainer}>
              <TextInput
                style={styles.input}
                placeholder="New measurement"
                value={newMeasurement}
                onChangeText={setNewMeasurement}
                placeholderTextColor={AppColors.textSecondary}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddMeasurement}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: AppColors.text, paddingHorizontal: 20, paddingTop: 20 },
  headerSubtitle: { fontSize: 16, color: AppColors.textSecondary, paddingHorizontal: 20, paddingBottom: 10, marginBottom: 10 },
  card: { backgroundColor: AppColors.card, borderRadius: 10, padding: 15, margin: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 20, fontWeight: '600', color: AppColors.text },
  saveButton: { backgroundColor: AppColors.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  dayRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: AppColors.border, paddingVertical: 12 },
  dayLabel: { color: AppColors.text, fontSize: 16, width: 90 },
  dayTouchable: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  workoutText: { flex: 1, color: AppColors.textSecondary, fontSize: 16, paddingVertical: 0 },
  arrow: { color: AppColors.textSecondary, fontSize: 24 },
  label: { color: AppColors.text, fontSize: 16, marginBottom: 5, marginTop: 10 },
  input: { flex: 1, backgroundColor: AppColors.background, color: AppColors.text, borderRadius: 8, borderWidth: 1, borderColor: AppColors.border, padding: 10, fontSize: 16, marginBottom: 10 },
  measurementRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  measurementLabel: { color: AppColors.text, fontSize: 16 },
  deleteButton: { fontSize: 20 },
  addMeasurementContainer: { flexDirection: 'row', marginTop: 15 },
  addButton: { backgroundColor: AppColors.primary, padding: 10, borderRadius: 8, marginLeft: 10, justifyContent: 'center' },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
});