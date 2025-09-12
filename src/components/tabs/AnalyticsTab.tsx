import React from 'react';
import { ScrollView, View } from 'react-native';
import {
    BarChartComponent,
    LineChartComponent,
    PieChartComponent
} from '../ChartComponents';

interface AnalyticsTabProps {
  categoryData: any[];
  monthlyTrend: any[];
  weeklySpending: any[];
  isDarkTheme: boolean;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  categoryData,
  monthlyTrend,
  weeklySpending,
  isDarkTheme
}) => {
  return (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 20 }}
    >
      <PieChartComponent 
        categoryData={categoryData}
        isDarkTheme={isDarkTheme}
      />
      
      <LineChartComponent 
        monthlyTrend={monthlyTrend}
        isDarkTheme={isDarkTheme}
      />
      
      <BarChartComponent 
        weeklySpending={weeklySpending}
        isDarkTheme={isDarkTheme}
      />
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};
