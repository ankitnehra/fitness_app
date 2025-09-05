import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { AppColors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const getTodayDateString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export default function WorkoutScreen() {
  const { day, date } = useLocalSearchParams();
  const router = useRouter();
  const [exercises, setExercises] = useState([]);
  const [workoutData, setWorkoutData] = useState({});
  const workoutDate = date || getTodayDateString();

  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseSets, setNewExerciseSets] = useState('');
  const [newExerciseReps, setNewExerciseReps] = useState('');
  const scrollViewRef = useRef(null);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      const loadWorkoutData = async () => {
        try {
          const workoutLogKey = `@workout_log_${workoutDate}`;
          const exerciseStorageKey = `@exercises_${day}`;
          
          const existingLog = await AsyncStorage.getItem(workoutLogKey);
          const savedExercises = await AsyncStorage.getItem(exerciseStorageKey);
          const configuredExercises = savedExercises ? JSON.parse(savedExercises).map((ex, index) => ({ ...ex, id: ex.id || `${Date.now()}-${index}` })) : [];

          if (existingLog) {
            const loggedWorkout = JSON.parse(existingLog);
            const loggedExercises = loggedWorkout.exercises;
            const initialData = {};
            
            const finalExercises = [...loggedExercises];
            const loggedExerciseIds = new Set(loggedExercises.map(ex => ex.id));

            // Add any new exercises from configuration that aren't in the log
            configuredExercises.forEach(confEx => {
              if (!loggedExerciseIds.has(confEx.id)) {
                finalExercises.push(confEx);
              }
            });
            
            finalExercises.forEach(ex => {
              const loggedEx = loggedExercises.find(le => le.id === ex.id);
              if (loggedEx) {
                initialData[ex.id] = loggedEx.sets.map(set => ({ weight: set.weight || '', reps: set.reps || '' }));
              } else {
                initialData[ex.id] = Array(ex.sets).fill({ weight: '', reps: '' });
              }
            });

            setExercises(finalExercises);
            setWorkoutData(initialData);

          } else {
            setExercises(configuredExercises);
            const initialData = {};
            configuredExercises.forEach(ex => {
              initialData[ex.id] = Array(ex.sets).fill({ weight: '', reps: '' });
            });
            setWorkoutData(initialData);
          }
        } catch (e) {
          Alert.alert('Error', `Failed to load workout data: ${e.message}`);
        }
      };

      if (day) {
        loadWorkoutData();
      }
    }, [day, workoutDate])
  );

  const handleSetChange = (text, exId, setIndex, field) => {
    setWorkoutData(prev => {
      const newSets = JSON.parse(JSON.stringify(prev[exId] || []));
      newSets[setIndex] = { ...newSets[setIndex], [field]: text };
      return { ...prev, [exId]: newSets };
    });
  };

  const handleAddAdhocExercise = () => {
    if (newExerciseName.trim() && newExerciseSets.trim() && newExerciseReps.trim()) {
      const newExercise = {
        id: Date.now().toString(),
        name: newExerciseName.trim(),
        sets: parseInt(newExerciseSets, 10),
        reps: parseInt(newExerciseReps, 10),
      };
      setExercises(prev => [...prev, newExercise]);
      setWorkoutData(prev => ({ ...prev, [newExercise.id]: Array(newExercise.sets).fill({ weight: '', reps: '' }) }));
      setNewExerciseName('');
      setNewExerciseSets('');
      setNewExerciseReps('');
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } else {
      Alert.alert('Error', 'Please fill out all fields for the exercise.');
    }
  };

  const handleFinishWorkout = async () => {
    try {
      const dateKey = `@workout_log_${workoutDate}`;
      const workoutLog = {
        day,
        completedAt: new Date().toISOString(),
        exercises: exercises.map(ex => ({
          ...ex,
          sets: workoutData[ex.id] || [],
        })),
      };
      await AsyncStorage.setItem(dateKey, JSON.stringify(workoutLog));
      Alert.alert('Success!', 'Workout saved.');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save workout session.');
    }
  };

  const renderAdhocForm = () => (
    <View style={[styles.card, { marginVertical: 20 }]}>
      <Text style={styles.cardTitle}>Add Ad-hoc Exercise</Text>
      <TextInput
        style={styles.input}
        placeholder="Exercise Name"
        placeholderTextColor={AppColors.textSecondary}
        value={newExerciseName}
        onChangeText={setNewExerciseName}
        onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100)}
      />
      <View style={styles.setsRepsContainer}>
        <TextInput
          style={[styles.input, { marginRight: 10 }]}
          placeholder="Sets"
          placeholderTextColor={AppColors.textSecondary}
          value={newExerciseSets}
          onChangeText={setNewExerciseSets}
          keyboardType="numeric"
          onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100)}
        />
        <TextInput
          style={styles.input}
          placeholder="Reps"
          placeholderTextColor={AppColors.textSecondary}
          value={newExerciseReps}
          onChangeText={setNewExerciseReps}
          keyboardType="numeric"
          onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100)}
        />
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={handleAddAdhocExercise}>
        <Text style={styles.primaryButtonText}>Add Exercise</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{day}'s Workout</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
        >
          {exercises.length > 0 ? (
            exercises.map((exercise) => {
              const numSets = Array.isArray(exercise.sets) ? exercise.sets.length : exercise.sets;
              return (
                <View key={exercise.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{exercise.name} <Text style={styles.targetReps}>(Target: {exercise.reps} reps)</Text></Text>
                  <View style={styles.setHeaders}>
                    <Text style={[styles.setHeader, { width: 40 }]}>Set</Text>
                    <Text style={[styles.setHeader, { flex: 1, marginHorizontal: 5 }]}>Weight (lbs)</Text>
                    <Text style={[styles.setHeader, { flex: 1, marginHorizontal: 5 }]}>Reps</Text>
                  </View>
                  {Array.from({ length: numSets }).map((_, setIndex) => (
                    <View key={`${exercise.id}-${setIndex}`} style={styles.setContainer}>
                      <Text style={styles.setLabel}>{setIndex + 1}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Weight"
                        placeholderTextColor={AppColors.textSecondary}
                        keyboardType="numeric"
                        value={String(workoutData[exercise.id]?.[setIndex]?.weight || '')}
                        onChangeText={(text) => handleSetChange(text, exercise.id, setIndex, 'weight')}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Reps"
                        placeholderTextColor={AppColors.textSecondary}
                        keyboardType="numeric"
                        value={String(workoutData[exercise.id]?.[setIndex]?.reps || '')}
                        onChangeText={(text) => handleSetChange(text, exercise.id, setIndex, 'reps')}
                      />
                    </View>
                  ))}
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No exercises configured for this day.</Text>
          )}
          {renderAdhocForm()}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.finishButton} onPress={handleFinishWorkout}>
            <Text style={styles.finishButtonText}>Finish Workout</Text>
          </TouchableOpacity>
        </View>
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
  card: { backgroundColor: AppColors.card, borderRadius: 10, padding: 15, marginVertical: 8 },
  cardTitle: { fontSize: 20, fontWeight: '600', color: AppColors.text, marginBottom: 5 },
  targetReps: { fontSize: 14, fontWeight: 'normal', color: AppColors.textSecondary },
  setHeaders: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: 5, paddingHorizontal: 0 },
  setHeader: { color: AppColors.textSecondary, fontWeight: 'bold', textAlign: 'center' },
  setContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  setLabel: { color: AppColors.text, fontSize: 16, width: 40, textAlign: 'center' },
  input: { flex: 1, backgroundColor: AppColors.background, color: AppColors.text, borderRadius: 8, borderWidth: 1, borderColor: AppColors.border, padding: 12, fontSize: 16, marginHorizontal: 5, textAlign: 'center' },
  setsRepsContainer: { flexDirection: 'row' },
  primaryButton: { backgroundColor: AppColors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 5 },
  primaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  emptyText: { textAlign: 'center', marginTop: 50, color: AppColors.textSecondary, fontSize: 16 },
  footer: { padding: 20, backgroundColor: AppColors.background, borderTopWidth: 1, borderTopColor: AppColors.border },
  finishButton: { backgroundColor: AppColors.primary, borderRadius: 8, paddingVertical: 15, alignItems: 'center' },
  finishButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});
