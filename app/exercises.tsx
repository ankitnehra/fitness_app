import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, FlatList, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppColors } from '@/constants/Colors';

const ExerciseItem = React.memo(({ item, onRemove }) => (
  <View style={styles.exerciseItem}>
    <View>
      <Text style={styles.exerciseName}>{item.name}</Text>
      <Text style={styles.exerciseDetails}>Sets: {item.sets}   Reps: {item.reps}</Text>
    </View>
    <TouchableOpacity onPress={onRemove}>
      <Text style={styles.deleteButton}>🗑️</Text>
    </TouchableOpacity>
  </View>
));

export default function ExercisesScreen() {
  const { day } = useLocalSearchParams();
  const router = useRouter();
  const [exercises, setExercises] = useState([]);
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');

  const storageKey = `@exercises_${day}`;

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const savedExercises = await AsyncStorage.getItem(storageKey);
        if (savedExercises !== null) {
          const parsedExercises = JSON.parse(savedExercises);
          const exercisesWithIds = parsedExercises.map((ex, index) => ({
            ...ex,
            id: ex.id || `${Date.now()}-${index}`,
          }));
          setExercises(exercisesWithIds);
        }
      } catch (e) {
        Alert.alert('Error', 'Failed to load exercises.');
      }
    };
    loadExercises();
  }, [storageKey]);

  const handleAddExercise = () => {
    if (exerciseName.trim() && sets.trim() && reps.trim()) {
      const newExercise = {
        id: Date.now().toString(),
        name: exerciseName.trim(),
        sets: parseInt(sets, 10),
        reps: parseInt(reps, 10),
      };
      setExercises(prev => [...prev, newExercise]);
      setExerciseName('');
      setSets('');
      setReps('');
    } else {
      Alert.alert('Error', 'Please fill out all fields for the exercise.');
    }
  };

  const handleRemoveExercise = useCallback((id) => {
    setExercises(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleSaveChanges = async () => {
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(exercises));
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save exercises.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{day}'s Exercises</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="Exercise Name (e.g., Bench Press)"
            placeholderTextColor={AppColors.textSecondary}
            value={exerciseName}
            onChangeText={setExerciseName}
          />
          <View style={styles.setsRepsContainer}>
            <TextInput
              style={[styles.input, styles.setsRepsInput]}
              placeholder="Sets"
              placeholderTextColor={AppColors.textSecondary}
              value={sets}
              onChangeText={setSets}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.setsRepsInput]}
              placeholder="Reps"
              placeholderTextColor={AppColors.textSecondary}
              value={reps}
              onChangeText={setReps}
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={handleAddExercise}>
            <Text style={styles.primaryButtonText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExerciseItem 
              item={item}
              onRemove={() => handleRemoveExercise(item.id)}
            />
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No exercises added yet.</Text>}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        />

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
            <Text style={styles.saveButtonText}>Save and Go Back</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: AppColors.primary,
    fontSize: 30,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AppColors.text,
    textAlign: 'center',
  },
  addForm: {
    margin: 20,
    padding: 15,
    backgroundColor: AppColors.card,
    borderRadius: 10,
  },
  input: {
    height: 50,
    backgroundColor: AppColors.background,
    color: AppColors.text,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 16,
  },
  setsRepsContainer: {
    flexDirection: 'row',
  },
  setsRepsInput: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: AppColors.card,
    borderRadius: 10,
    marginBottom: 10,
  },
  exerciseName: {
    fontWeight: 'bold',
    color: AppColors.text,
    fontSize: 16,
  },
  exerciseDetails: {
    color: AppColors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  deleteButton: {
    fontSize: 24,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: AppColors.textSecondary,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  saveButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
