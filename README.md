# 💪 Aegis Fitness Tracker

**Aegis** is your personal, no-nonsense fitness logbook designed for one person: **you**. Forget social feeds and complicated meal tracking. This app is built for individuals who are serious about tracking their weightlifting progress and maintaining personal accountability over their health goals.

It's a private, on-device digital companion to help you monitor progressive overload, track body measurements, and stay consistent with your diet and hydration.



## ✨ Key Features

-   **🏋️‍♀️ Detailed Workout Logging**: Plan your weekly workout schedule and log every set, rep, and weight lifted during your sessions.
-   **📈 Progress Visualization**: Watch your strength grow with beautiful charts that track your lift history and personal records for every exercise.
-   **📏 Body & Health Tracking**: Log key body measurements (weight, chest, etc.) and track daily health metrics like calorie intake, water consumption, and diet adherence.
-   **🗓️ Consistency Calendar**: Get a clear, at-a-glance view of your workout history to see your consistency over time and stay motivated.
-   **🔒 Private & Offline**: All your data is stored securely on your device. No accounts, no cloud, no nonsense.

## 🚀 Getting Started

This is a mobile application built with [React Native](https://reactnative.dev/) and [Expo](https://expo.dev/).

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the App

```bash
npx expo start
```

This will open the Expo developer tools in your browser. You can then choose to run the app on:

-   An iOS Simulator (requires Xcode)
-   An Android Emulator (requires Android Studio)
-   A physical device using the [Expo Go app](https://expo.dev/go)

## 🛠️ Tech Stack

-   **Framework**: React Native & Expo
-   **Navigation**: Expo Router (file-based routing)
-   **Data Storage**: AsyncStorage for local, on-device persistence
-   **Charting**: `react-native-chart-kit`
-   **Styling**: Custom components with a dark theme

## 📁 Project Structure

The application code is located in the `app/` directory, which uses file-based routing:

-   `app/index.tsx`: The entry point, redirecting to the welcome screen or the main app.
-   `app/welcome.tsx`: The first-time user setup screen.
-   `app/(tabs)/`: The main tab navigator for the app's core sections.
    -   `_layout.tsx`: The tab navigator configuration.
    -   `index.tsx`: The main **Tracking** dashboard.
    -   `progress.tsx`: The **Progress & History** screen.
    -   `configuration.tsx`: The **Configuration Hub**.
-   `app/*.tsx`: Modal screens that are presented over the main tabs (e.g., `workout.tsx`, `logMeasurements.tsx`).
-   `components/`: Shared, reusable UI components.
-   `constants/`: Static values, such as the color palette.

---

Happy lifting!