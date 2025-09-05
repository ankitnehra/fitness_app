import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { LineChart } from 'react-native-chart-kit';
import RNPickerSelect from 'react-native-picker-select';
import { AppColors } from '@/constants/Colors';
import Tabs from '@/components/ui/Tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get('window').width;
const CHART_COLORS = [
  'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)',
  'rgba(255, 159, 64, 1)', 'rgba(199, 199, 199, 1)', 'rgba(83, 102, 255, 1)', 'rgba(10, 206, 86, 1)', 'rgba(255, 99, 255, 1)',
  'rgba(255, 159, 244, 1)', 'rgba(54, 162, 10, 1)', 'rgba(10, 206, 235, 1)', 'rgba(255, 10, 86, 1)', 'rgba(75, 192, 10, 1)',
  'rgba(153, 10, 255, 1)', 'rgba(255, 159, 10, 1)', 'rgba(199, 199, 10, 1)', 'rgba(83, 10, 255, 1)', 'rgba(10, 206, 10, 1)'
];

const prepareChartData = (data) => {
  const labels = [];
  const datasets = data.datasets.map(ds => ({ ...ds, data: [] }));

  data.labels.forEach((label, i) => {
    if (data.datasets.some(ds => ds.data[i] !== null)) {
      labels.push(label);
      data.datasets.forEach((ds, j) => {
        datasets[j].data.push(ds.data[i]);
      });
    }
  });

  return { labels, datasets, legend: data.legend };
};

export default function ProgressScreen() {
  const router = useRouter();
  const [markedDates, setMarkedDates] = useState({});
  const [activeTab, setActiveTab] = useState('Overview');
  const [weightChartData, setWeightChartData] = useState(null);
  const [otherMeasurementsChartData, setOtherMeasurementsChartData] = useState(null);
  const [exerciseChartData, setExerciseChartData] = useState({});
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const loadMeasurementChartData = async () => {
    try {
      const savedLogs = await AsyncStorage.getItem('@measurement_logs');
      if (!savedLogs) {
        setWeightChartData(null);
        setOtherMeasurementsChartData(null);
        return;
      }

      const logs = JSON.parse(savedLogs);
      const sortedDates = Object.keys(logs).sort((a, b) => new Date(a) - new Date(b));
      if (sortedDates.length === 0) {
        setWeightChartData(null);
        setOtherMeasurementsChartData(null);
        return;
      }

      const labels = sortedDates.map(date => date.substring(5));
      const weightData = Array(sortedDates.length).fill(null);
      
      const allOtherMeasurements = new Set();
      sortedDates.forEach(date => {
        Object.keys(logs[date]).forEach(m => {
          if (m !== 'Weight') allOtherMeasurements.add(m);
        });
      });
      const sortedOtherMeasurements = Array.from(allOtherMeasurements).sort();
      
      const otherData = {};
      sortedOtherMeasurements.forEach((measurement, index) => {
        otherData[measurement] = {
          data: Array(sortedDates.length).fill(null),
          color: (opacity = 1) => CHART_COLORS[index % CHART_COLORS.length],
        };
      });

      sortedDates.forEach((date, index) => {
        const dayMeasurements = logs[date];
        if (dayMeasurements.Weight) {
          const weightValue = parseFloat(dayMeasurements.Weight);
          if (!isNaN(weightValue) && weightValue > 0) weightData[index] = weightValue;
        }
        for (const measurement in dayMeasurements) {
          if (measurement !== 'Weight') {
            const measureValue = parseFloat(dayMeasurements[measurement]);
            if (!isNaN(measureValue) && measureValue > 0) {
              if (otherData[measurement]) {
                otherData[measurement].data[index] = measureValue;
              }
            }
          }
        }
      });

      if (weightData.some(d => d !== null)) {
        setWeightChartData({
          labels,
          datasets: [{ data: weightData, color: () => AppColors.primary, strokeWidth: 3 }],
          legend: ['Weight (lbs)']
        });
      } else {
        setWeightChartData(null);
      }

      if (Object.keys(otherData).length > 0) {
        setOtherMeasurementsChartData({
          labels,
          datasets: Object.values(otherData),
          legend: Object.keys(otherData).map(key => `${key} (in)`)
        });
      } else {
        setOtherMeasurementsChartData(null);
      }

    } catch (e) {
      Alert.alert('Error', 'Failed to load measurement history for charts.');
    }
  };

  const loadExerciseChartData = async (workoutLogs) => {
    try {
      const progress = {};
      workoutLogs.sort(([keyA], [keyB]) => new Date(keyA.replace('@workout_log_', '')) - new Date(keyB.replace('@workout_log_', ''))).forEach(([key, value]) => {
        const date = key.replace('@workout_log_', '');
        const log = JSON.parse(value);
        if (log.exercises) {
          log.exercises.forEach(ex => {
            if (ex.sets && Array.isArray(ex.sets)) {
              const maxWeight = Math.max(...ex.sets.map(s => parseInt(s.weight, 10)).filter(w => !isNaN(w) && w > 0));
              if (maxWeight > 0) {
                if (!progress[ex.name]) {
                  progress[ex.name] = { labels: [], data: [] };
                }
                progress[ex.name].labels.push(date.substring(5));
                progress[ex.name].data.push(maxWeight);
              }
            }
          });
        }
      });

      const newExerciseChartData = {};
      for (const name in progress) {
        if (progress[name].data.length > 0) {
          newExerciseChartData[name] = {
            labels: progress[name].labels,
            datasets: [{ data: progress[name].data }],
          };
        }
      }
      setExerciseChartData(newExerciseChartData);
      if (Object.keys(newExerciseChartData).length > 0 && !selectedExercise) {
        setSelectedExercise(Object.keys(newExerciseChartData)[0]);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load exercise history for charts.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const keys = await AsyncStorage.getAllKeys();
          const workoutLogKeys = keys.filter(key => key.startsWith('@workout_log_'));
          const workoutLogs = await AsyncStorage.multiGet(workoutLogKeys);
          
          const newMarkedDates = {};
          workoutLogs.forEach(([key]) => {
            const date = key.replace('@workout_log_', '');
            newMarkedDates[date] = { marked: true, dotColor: AppColors.primary };
          });
          setMarkedDates(newMarkedDates);

          await loadMeasurementChartData();
          if (workoutLogs.length > 0) await loadExerciseChartData(workoutLogs);

        } catch (e) {
          Alert.alert('Error', 'Failed to load data.');
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }, [])
  );

  const handleDayPress = (day) => {
    // The calendar returns a date string in 'YYYY-MM-DD' format.
    // We can pass this string directly to the details screen.
    const dateString = day.dateString;

    // Create a date object from the string to compare it with today's date.
    // To avoid timezone issues, we can treat the dates as local.
    const parts = dateString.split('-').map(part => parseInt(part, 10));
    const selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date

    if (selectedDate > today) {
      Alert.alert("Future Date", "You cannot view or edit details for a future date.");
      return;
    }
    router.push(`/dayDetails?date=${dateString}`);
  };

  const renderExerciseProgress = () => {
    const exerciseNames = Object.keys(exerciseChartData);
    if (exerciseNames.length === 0) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Exercise Progress</Text>
          <Text style={styles.secondaryText}>No workout data logged yet.</Text>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Exercise Progress</Text>
        <RNPickerSelect
          onValueChange={(value) => setSelectedExercise(value)}
          items={exerciseNames.map(name => ({ label: name, value: name }))}
          style={pickerSelectStyles}
          value={selectedExercise}
          placeholder={{ label: "Select an exercise...", value: null }}
        />
        {selectedExercise && exerciseChartData[selectedExercise] && (
          <LineChart
            data={prepareChartData(exerciseChartData[selectedExercise])}
            width={screenWidth - 50}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{ borderRadius: 8, marginTop: 15 }}
          />
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 50 }} />;
    }

    switch (activeTab) {
      case 'Overview':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Consistency</Text>
            <Calendar
              markedDates={markedDates}
              onDayPress={handleDayPress}
              theme={{
                backgroundColor: AppColors.card,
                calendarBackground: AppColors.card,
                textSectionTitleColor: AppColors.textSecondary,
                selectedDayBackgroundColor: AppColors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: AppColors.primary,
                dayTextColor: AppColors.text,
                textDisabledColor: AppColors.border,
                dotColor: AppColors.primary,
                selectedDotColor: '#ffffff',
                arrowColor: AppColors.primary,
                monthTextColor: AppColors.text,
                indicatorColor: AppColors.primary,
              }}
            />
          </View>
        );
      case 'Measurements':
        return (
          <>
            {weightChartData ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Weight Trend (lbs)</Text>
                <LineChart
                  data={prepareChartData(weightChartData)}
                  width={screenWidth - 50}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={{ borderRadius: 8 }}
                />
              </View>
            ) : null}
            {otherMeasurementsChartData ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Other Measurements (in)</Text>
                <LineChart
                  data={prepareChartData(otherMeasurementsChartData)}
                  width={screenWidth - 50}
                  height={220}
                  chartConfig={{...chartConfig, propsForDatasets: {
                    strokeDasharray: "4 4"
                  }}}
                  bezier
                  style={{ borderRadius: 8 }}
                  legend={otherMeasurementsChartData.legend}
                />
              </View>
            ) : null}
            {!weightChartData && !otherMeasurementsChartData && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Measurement Trends</Text>
                <Text style={styles.secondaryText}>No measurement data logged yet.</Text>
              </View>
            )}
          </>
        );
      case 'Exercises':
        return renderExerciseProgress();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView>
        <Text style={styles.headerTitle}>Progress & History</Text>
        <Tabs
          tabs={['Overview', 'Measurements', 'Exercises']}
          activeTab={activeTab}
          onTabPress={setActiveTab}
        />
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const chartConfig = {
  backgroundColor: AppColors.primary,
  backgroundGradientFrom: AppColors.card,
  backgroundGradientTo: AppColors.card,
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
  style: { borderRadius: 16 },
  propsForDots: { r: '6', strokeWidth: '2', stroke: AppColors.primary },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: AppColors.text, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  card: { backgroundColor: AppColors.card, borderRadius: 10, padding: 15, marginHorizontal: 10, marginBottom: 20 },
  cardTitle: { fontSize: 20, fontWeight: '600', color: AppColors.text, marginBottom: 15 },
  secondaryText: { color: AppColors.textSecondary, fontSize: 14, textAlign: 'center', marginVertical: 10 },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    color: AppColors.text,
    paddingRight: 30,
    backgroundColor: AppColors.background,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    color: AppColors.text,
    paddingRight: 30,
    backgroundColor: AppColors.background,
  },
});