import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const hasLaunchedBefore = await AsyncStorage.getItem('@has_launched');
      if (hasLaunchedBefore === 'true') {
        router.replace('/(tabs)');
      } else {
        router.replace('/welcome');
      }
    };

    checkFirstLaunch();
  }, []);

  // This component will be visible for a split second, so we render nothing.
  return <View />;
}
