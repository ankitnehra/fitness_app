import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeScreen() {
  const [name, setName] = useState('');
  const router = useRouter();

  const handleContinue = async () => {
    if (name.trim().length === 0) {
      Alert.alert('Error', 'Please enter your name.');
      return;
    }
    try {
      await AsyncStorage.setItem('@user_name', name);
      await AsyncStorage.setItem('@has_launched', 'true');
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Error', 'Failed to save your name.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Text style={styles.title}>Welcome to Aegis Fitness</Text>
      <Text style={styles.subtitle}>What should we call you?</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
      />
      <Button title="Continue" onPress={handleContinue} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    color: 'gray',
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
});
