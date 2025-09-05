# Aegis Fitness Tracker - Engineering Plan

This document outlines the engineering tasks required to build the Aegis Fitness Tracker.

## Current High-Priority Bug

### Issue: Keyboard dismisses immediately on multiple form screens

-   **Files:** `app/(tabs)/configuration.tsx`, `app/logMeasurements.tsx`, `app/dayDetails.tsx`
-   **Description:** On screens that contain forms within a `ScrollView` (like Configuration, Log Measurements, and Day Details), when a user taps on a `TextInput`, the keyboard appears for a moment and then immediately dismisses. This prevents text entry. The `workout.tsx` screen, which has a slightly different layout structure, does not have this issue.
-   **Analysis:** This is a complex layout issue between `KeyboardAvoidingView` and `ScrollView`. The root cause is likely a subtle conflict in how the component tree is rendered and how the available screen space is calculated when the keyboard appears. Attempts to fix this by restructuring the layout to match the working `workout.tsx` screen have been unsuccessful, indicating a more deeply rooted issue.
-   **Status:** **Unresolved.** This is a critical bug impacting core functionality.

### Next Steps

A definitive solution is required across all affected screens. The next session should focus on:
1.  Isolating the form components in a minimal reproduction case to rule out external styling conflicts.
2.  Implementing a robust, reusable keyboard-aware form component that can be used in `configuration.tsx`, `logMeasurements.tsx`, and `dayDetails.tsx`.
3.  Considering alternative libraries like `react-native-keyboard-aware-scroll-view` as a replacement for the native `KeyboardAvoidingView` if the issue cannot be resolved with the current toolkit.
