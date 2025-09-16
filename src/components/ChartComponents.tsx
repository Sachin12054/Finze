// Empty chart components for AnalyticsTab compatibility
export const BarChartComponent: React.FC<{ weeklySpending: any[]; isDarkTheme: boolean }> = () => <CategorySpendingChart />;
export const LineChartComponent: React.FC<{ monthlyTrend: any[]; isDarkTheme: boolean }> = () => <CategorySpendingChart />;
export const PieChartComponent: React.FC<{ categoryData: any[]; isDarkTheme: boolean }> = () => <CategorySpendingChart />;
// src/components/ChartComponents.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const getThemedStyles = (isDarkTheme: boolean) => StyleSheet.create({
  container: {
    backgroundColor: isDarkTheme ? '#1E293B' : '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    margin: 12,
    shadowColor: isDarkTheme ? '#000000' : '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDarkTheme ? 0.3 : 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: isDarkTheme ? 1 : 0,
    borderColor: isDarkTheme ? '#334155' : 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: isDarkTheme ? '#F8FAFC' : '#1E293B',
    textAlign: 'center',
    marginBottom: 20,
  },
  themeToggle: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDarkTheme ? '#3B82F6' : '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

// Theme Toggle Component
export const ThemeToggle = () => {
  const { isDarkTheme, toggleTheme } = useTheme();
  const styles = getThemedStyles(isDarkTheme);

  return (
    <TouchableOpacity 
      style={styles.themeToggle}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={isDarkTheme ? "sunny" : "moon"} 
        size={20} 
        color={isDarkTheme ? '#F59E0B' : '#1E293B'} 
      />
    </TouchableOpacity>
  );
};

// Empty Chart Component
export const CategorySpendingChart = () => {
  const { isDarkTheme } = useTheme();
  const styles = getThemedStyles(isDarkTheme);

  return (
    <View style={styles.container}>
      <ThemeToggle />
      <Text style={styles.message}>Chart components removed</Text>
    </View>
  );
};

// Empty Chart Component
export const DailyExpensesBarChart = () => {
  const { isDarkTheme } = useTheme();
  const styles = getThemedStyles(isDarkTheme);

  return (
    <View style={styles.container}>
      <ThemeToggle />
      <Text style={styles.message}>Chart components removed</Text>
    </View>
  );
};

// Empty Chart Component
export const WeeklyTrendLineChart = () => {
  const { isDarkTheme } = useTheme();
  const styles = getThemedStyles(isDarkTheme);

  return (
    <View style={styles.container}>
      <ThemeToggle />
      <Text style={styles.message}>Chart components removed</Text>
    </View>
  );
};

// Empty Chart Component
export const MonthlyComparisonChart = () => {
  const { isDarkTheme } = useTheme();
  const styles = getThemedStyles(isDarkTheme);

  return (
    <View style={styles.container}>
      <ThemeToggle />
      <Text style={styles.message}>Chart components removed</Text>
    </View>
  );
};

// Legacy exports for backward compatibility
export const ExpensePieChart = CategorySpendingChart;
export const ExpenseBarChart = DailyExpensesBarChart;
