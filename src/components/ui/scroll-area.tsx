import React from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';

interface ScrollAreaProps extends ScrollViewProps {
  children: React.ReactNode;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({ children, ...props }) => {
  return (
    <ScrollView 
      showsVerticalScrollIndicator={false} 
      showsHorizontalScrollIndicator={false}
      {...props}
    >
      {children}
    </ScrollView>
  );
};
