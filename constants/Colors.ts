// Using a more descriptive naming convention for the color palette
export const AppColors = {
  background: '#0D1117', // Very dark blue, almost black
  card: '#161B22',       // Dark grey-blue for cards
  text: '#E6EDF3',        // Light grey for primary text
  textSecondary: '#8B949E', // Medium grey for secondary text
  primary: '#58A6FF',      // Bright blue for accents and buttons
  border: '#30363D',      // Grey for borders
  success: '#3FB950',     // Green for success indicators
};

// This structure is kept for compatibility with Expo's templates if needed
export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: AppColors.primary,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: AppColors.primary,
  },
  dark: {
    text: AppColors.text,
    background: AppColors.background,
    tint: AppColors.primary,
    icon: AppColors.textSecondary,
    tabIconDefault: AppColors.textSecondary,
    tabIconSelected: AppColors.primary,
  },
};
