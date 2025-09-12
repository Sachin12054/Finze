import Toast from 'react-native-toast-message';

export const useToast = () => {
  const toast = ({
    title,
    description,
    variant = 'default',
    duration = 3000,
  }: {
    title: string;
    description?: string | React.ReactNode;
    variant?: 'default' | 'destructive' | 'success';
    duration?: number;
  }) => {
    const type = variant === 'destructive' ? 'error' : variant === 'success' ? 'success' : 'info';
    
    Toast.show({
      type,
      text1: title,
      text2: typeof description === 'string' ? description : '',
      visibilityTime: duration,
    });
  };

  return { toast };
};
