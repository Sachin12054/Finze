declare module '@react-native-picker/picker' {
  import * as React from 'react';
    import { TextStyle, ViewStyle } from 'react-native';

  export interface PickerProps {
  selectedValue?: string | number;
  onValueChange?: (itemValue: string | number, itemIndex: number) => void;
  enabled?: boolean;
  mode?: 'dialog' | 'dropdown';
  itemStyle?: TextStyle;
  prompt?: string;
  style?: ViewStyle;
  testID?: string;
  children?: React.ReactNode;
  }

  export interface PickerItemProps {
    label: string;
    value: string | number;
    color?: string;
    fontFamily?: string;
    testID?: string;
  }

  export const Picker: React.FC<PickerProps> & {
    Item: React.FC<PickerItemProps>;
  };
}