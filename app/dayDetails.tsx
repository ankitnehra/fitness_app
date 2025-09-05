import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { AppColors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const getDayOfWeek = (dateString) => {
  // Manually parse the 'YYYY-MM-DD' string to avoid timezone issues.
  // new Date('2025-09-04') can be interpreted as UTC, leading to off-by-one errors.
  const parts = dateString.split('-').map(part => parseInt(part, 10));
  // Note: Month is 0-indexed in JavaScript's Date constructor (0=Jan, 11=Dec)
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

export default function DayDetailsScreen() {
  const { date } = useLocalSearchParams();
  const router = useRouter();
  const [workoutLog, setWorkoutLog] = useState(null);
  const [dailyLog, setDailyLog] = useState({ calorieIntake: '', waterIntake: '', alcoholIntake: '' });
  const [measurementLog, setMeasurementLog] = useState(null);
  const [dayOfWeek, setDayOfWeek] = useState('');
  const insets = useSafeAreaInsets();

  const loadDayData = useCallback(async () => {
    if (!date) return;
    setDayOfWeek(getDayOfWeek(date));
    try {
      const workoutLogKey = `@workout_log_${date}`;
      const savedWorkoutLog = await AsyncStorage.getItem(workoutLogKey);
      setWorkoutLog(savedWorkoutLog ? JSON.parse(savedWorkoutLog) : null);

      const dailyLogKey = `@daily_log_${date}`;
      const savedDailyLog = await AsyncStorage.getItem(dailyLogKey);
      setDailyLog(savedDailyLog ? JSON.parse(savedDailyLog) : { calorieIntake: '', waterIntake: '', alcoholIntake: '' });

      const savedMeasurementLogs = await AsyncStorage.getItem('@measurement_logs');
      if (savedMeasurementLogs) {
        const allMeasurements = JSON.parse(savedMeasurementLogs);
        setMeasurementLog(allMeasurements[date] || null);
      } else {
        setMeasurementLog(null);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load data for this day.');
    }
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      const selectedDate = new Date(date);
      const today = new Date();
      selectedDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        Alert.alert("Future Date", "You cannot view or edit details for a future date.", [
          { text: "OK", onPress: () => router.back() }
        ]);
        return;
      }
      loadDayData();
    }, [date, loadDayData, router])
  );

  const handleDailyLogChange = (field, value) => {
    setDailyLog(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      const dailyLogKey = `@daily_log_${date}`;
      await AsyncStorage.setItem(dailyLogKey, JSON.stringify(dailyLog));
      Alert.alert('Success', 'Your changes have been saved.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save changes.');
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
            <Text style={styles.title}>Details for {date}</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{dayOfWeek} Workout</Text>
            {workoutLog ? (
              <>
                {workoutLog.exercises.map((ex) => (
                  <View key={ex.id} style={styles.exerciseItem}>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    {ex.sets.map((set, setIndex) => (
                      <Text key={`${ex.id}-${setIndex}`} style={styles.setText}>
                        Set {setIndex + 1}: {set.weight || 'N/A'} lbs x {set.reps || 'N/A'} reps
                      </Text>
                    ))}
                  </View>
                ))}
                <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push(`/workout?day=${dayOfWeek}&date=${date}`)}>
                  <Text style={styles.secondaryButtonText}>Edit Workout</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.primaryButton} onPress={() => router.push(`/workout?day=${dayOfWeek}&date=${date}`)}>
                <Text style={styles.primaryButtonText}>Log Workout</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Health Check-in</Text>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Calories (kcal)</Text>
              <TextInput style={styles.input} value={String(dailyLog.calorieIntake)} onChangeText={(val) => handleDailyLogChange('calorieIntake', val)} keyboardType="numeric" />
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Water (Liters)</Text>
              <TextInput style={styles.input} value={String(dailyLog.waterIntake)} onChangeText={(val) => handleDailyLogChange('waterIntake', val)} keyboardType="numeric" />
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Alcohol (Drinks)</Text>
              <TextInput style={styles.input} value={String(dailyLog.alcoholIntake)} onChangeText={(val) => handleDailyLogChange('alcoholIntake', val)} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Body Measurements</Text>
            {measurementLog ? (
              <>
                {Object.entries(measurementLog).map(([key, value]) => (
                  <View key={key} style={styles.detailRow}>
                    <Text style={styles.label}>{key}</Text>
                    <Text style={styles.value}>{String(value)}</Text>
                  </View>
                ))}
                <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push(`/logMeasurements?date=${date}`)}>
                  <Text style={styles.secondaryButtonText}>Edit Measurements</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.primaryButton} onPress={() => router.push(`/logMeasurements?date=${date}`)}>
                <Text style={styles.primaryButtonText}>Log Measurements</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
            <Text style={styles.saveButtonText}>Save Health Check-in</Text>
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
  exerciseItem: { marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  exerciseName: { color: AppColors.text, fontSize: 16, fontWeight: 'bold' },
  setText: { color: AppColors.textSecondary, fontSize: 14, marginLeft: 10 },
  input: { flex: 0.5, backgroundColor: AppColors.background, color: AppColors.text, borderRadius: 8, borderWidth: 1, borderColor: AppColors.border, padding: 10, fontSize: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { color: AppColors.text, fontSize: 16 },
  value: { color: AppColors.text, fontSize: 16, flex: 1, textAlign: 'right' },
  primaryButton: { backgroundColor: AppColors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secondaryButton: { backgroundColor: AppColors.background, borderRadius: 8, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: AppColors.primary, marginTop: 10 },
  secondaryButtonText: { color: AppColors.primary, fontWeight: 'bold', fontSize: 16 },
  saveButton: { backgroundColor: AppColors.primary, borderRadius: 8, paddingVertical: 15, alignItems: 'center', margin: 10, marginBottom: 30 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});
