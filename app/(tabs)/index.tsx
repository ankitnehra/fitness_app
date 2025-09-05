import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { AppColors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const getTodayKey = (prefix) => {
  const today = new Date();
  return `${prefix}_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export default function TrackingScreen() {
  const router = useRouter();
  const [todaysWorkout, setTodaysWorkout] = useState(null);
  const [todaysDay, setTodaysDay] = useState('');
  const [personalRecords, setPersonalRecords] = useState([]);
  const [waterIntake, setWaterIntake] = useState(0);
  const [calorieIntake, setCalorieIntake] = useState(0);
  const [alcoholIntake, setAlcoholIntake] = useState(0);
  const [isWorkoutLogged, setIsWorkoutLogged] = useState(false);
  const [isMeasurementLogged, setIsMeasurementLogged] = useState(false);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const dayOfWeek = new Date().toLocaleString('en-us', { weekday: 'long' });
          setTodaysDay(dayOfWeek);

          const workoutLogKey = getTodayKey('@workout_log');
          const todaysLog = await AsyncStorage.getItem(workoutLogKey);
          setIsWorkoutLogged(todaysLog !== null);

          const savedSchedule = await AsyncStorage.getItem('@user_schedule');
          const schedule = savedSchedule ? JSON.parse(savedSchedule) : {};
          const workoutForToday = schedule[dayOfWeek];

          const todaysExercises = await AsyncStorage.getItem(`@exercises_${dayOfWeek}`);
          const numExercises = todaysExercises ? JSON.parse(todaysExercises).length : 0;

          if (workoutForToday && workoutForToday.trim()) {
            setTodaysWorkout(workoutForToday);
          } else if (numExercises > 0) {
            setTodaysWorkout(`${numExercises} exercises`);
          } else {
            setTodaysWorkout('Rest Day');
          }

          const dailyLogKey = getTodayKey('@daily_log');
          const dailyLog = await AsyncStorage.getItem(dailyLogKey);
          if (dailyLog) {
            const { waterIntake, calorieIntake, alcoholIntake } = JSON.parse(dailyLog);
            setWaterIntake(waterIntake || 0);
            setCalorieIntake(calorieIntake || 0);
            setAlcoholIntake(alcoholIntake || 0);
          } else {
            setWaterIntake(0);
            setCalorieIntake(0);
            setAlcoholIntake(0);
          }

          const savedMeasurementLogs = await AsyncStorage.getItem('@measurement_logs');
          if (savedMeasurementLogs) {
            const allLogs = JSON.parse(savedMeasurementLogs);
            const todayDate = getTodayKey('').split('_')[1];
            setIsMeasurementLogged(allLogs[todayDate] !== undefined);
          } else {
            setIsMeasurementLogged(false);
          }

          const keys = await AsyncStorage.getAllKeys();
          const workoutLogKeys = keys.filter(key => key.startsWith('@workout_log_'));
          const workoutLogs = await AsyncStorage.multiGet(workoutLogKeys);
          
          const records = {};
          workoutLogs.forEach(([, value]) => {
            if (value) {
              const log = JSON.parse(value);
              if (log.exercises) {
                log.exercises.forEach(exercise => {
                  if (exercise.sets && Array.isArray(exercise.sets)) {
                    const weights = exercise.sets.map(s => parseInt(s.weight, 10)).filter(w => !isNaN(w));
                    if (weights.length > 0) {
                      const maxWeight = Math.max(...weights);
                      if (!records[exercise.name] || maxWeight > records[exercise.name]) {
                        records[exercise.name] = maxWeight;
                      }
                    }
                  }
                });
              }
            }
          });
          setPersonalRecords(Object.entries(records).map(([name, weight]) => ({ name, weight })));

        } catch (e) {
          Alert.alert('Error', 'Failed to load data.');
        }
      };
      loadData();
    }, [])
  );

  useEffect(() => {
    const saveDailyData = async () => {
      try {
        const dailyLogKey = getTodayKey('@daily_log');
        await AsyncStorage.setItem(dailyLogKey, JSON.stringify({ waterIntake, calorieIntake, alcoholIntake }));
      } catch (e) {
        console.error("Failed to save daily data", e);
      }
    };
    saveDailyData();
  }, [waterIntake, calorieIntake, alcoholIntake]);

  const Stepper = ({ label, value, onIncrement, onDecrement, unit }) => (
    <View style={styles.stepperRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepperControl}>
        <TouchableOpacity onPress={onDecrement} style={styles.stepperButton}><Text style={styles.stepperButtonText}>-</Text></TouchableOpacity>
        <Text style={styles.stepperValue}>{value} <Text style={styles.unit}>{unit}</Text></Text>
        <TouchableOpacity onPress={onIncrement} style={styles.stepperButton}><Text style={styles.stepperButtonText}>+</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>Dashboard</Text>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Workout: {todaysDay}</Text>
          <Text style={styles.workoutName}>{todaysWorkout === 'Rest Day' && !isWorkoutLogged ? 'Rest Day' : todaysWorkout}</Text>
          {todaysWorkout !== 'Rest Day' && (
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push(`/workout?day=${todaysDay}`)}>
              <Text style={styles.primaryButtonText}>{isWorkoutLogged ? 'Edit Workout' : 'Start Workout'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Health Check-in</Text>
          <Stepper label="Calorie Intake" value={calorieIntake} onIncrement={() => setCalorieIntake(v => v + 50)} onDecrement={() => setCalorieIntake(v => Math.max(0, v - 50))} unit="kcal" />
          <Stepper label="Water Intake" value={waterIntake} onIncrement={() => setWaterIntake(v => v + 1)} onDecrement={() => setWaterIntake(v => Math.max(0, v - 1))} unit="Liters" />
          <Stepper label="Alcoholic Drinks" value={alcoholIntake} onIncrement={() => setAlcoholIntake(v => v + 1)} onDecrement={() => setAlcoholIntake(v => Math.max(0, v - 1))} unit="Drinks" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Body Measurements</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/logMeasurements')}>
            <Text style={styles.primaryButtonText}>{isMeasurementLogged ? 'Edit Measurements' : 'Log Measurements'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏆 Personal Records</Text>
          {personalRecords.length > 0 ? (
            personalRecords.map(record => (
              <View key={record.name} style={styles.recordRow}>
                <Text style={styles.recordName}>{record.name}</Text>
                <Text style={styles.recordWeight}>{record.weight} lbs</Text>
              </View>
            ))
          ) : (
            <Text style={styles.secondaryText}>No records yet. Complete a workout to see them here!</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: AppColors.text, paddingHorizontal: 20, paddingBottom: 10 },
  scrollViewContent: { paddingBottom: 20 },
  card: { backgroundColor: AppColors.card, borderRadius: 10, padding: 20, marginHorizontal: 10, marginBottom: 20 },
  cardTitle: { fontSize: 20, fontWeight: '600', color: AppColors.text, marginBottom: 15 },
  workoutName: { fontSize: 18, color: AppColors.textSecondary, marginBottom: 20 },
  primaryButton: { backgroundColor: AppColors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  label: { color: AppColors.text, fontSize: 16, flex: 1 },
  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  stepperControl: { flexDirection: 'row', alignItems: 'center' },
  stepperButton: { backgroundColor: AppColors.border, borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  stepperButtonText: { color: AppColors.text, fontSize: 18, fontWeight: 'bold' },
  stepperValue: { color: AppColors.text, fontSize: 16, marginHorizontal: 15, minWidth: 60, textAlign: 'center' },
  unit: { color: AppColors.textSecondary },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  recordName: { color: AppColors.text, fontSize: 16 },
  recordWeight: { color: AppColors.primary, fontSize: 16, fontWeight: 'bold' },
  secondaryText: { color: AppColors.textSecondary, fontSize: 14, textAlign: 'center' },
});
