// authUtils.ts - Utility functions for authentication forms

import { Animated } from 'react-native';

export interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  [key: string]: string | undefined;
}

export interface AnimationRefs {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  scaleAnim: Animated.Value;
  shakeAnim: Animated.Value;
  buttonScale: Animated.Value;
  inputFocus: Animated.Value;
}

// Validation Functions
export const validateEmail = (email: string): string => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim()) return "Email is required";
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return "";
};

export const validatePassword = (password: string, isSignup: boolean = false): string => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  
  if (isSignup) {
    if (!/(?=.*[a-z])/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/(?=.*[A-Z])/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/(?=.*\d)/.test(password)) return "Password must contain at least one number";
    if (!/(?=.*[!@#$%^&*])/.test(password)) return "Password must contain at least one special character (!@#$%^&*)";
  }
  
  return "";
};

export const validateConfirmPassword = (password: string, confirmPassword: string): string => {
  if (!confirmPassword) return "Please confirm your password";
  if (password !== confirmPassword) return "Passwords do not match";
  return "";
};

export const validateName = (name: string): string => {
  if (!name.trim()) return "Name is required";
  if (name.trim().length < 2) return "Name must be at least 2 characters";
  if (!/^[a-zA-Z\s]+$/.test(name)) return "Name can only contain letters and spaces";
  return "";
};

export const validatePhone = (phone: string): string => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  if (!phone.trim()) return "Phone number is required";
  if (!phoneRegex.test(phone)) return "Please enter a valid phone number";
  return "";
};

// Animation Functions
export const createEntranceAnimation = (
  fadeAnim: Animated.Value,
  slideAnim: Animated.Value,
  scaleAnim: Animated.Value
): Animated.CompositeAnimation => {
  return Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }),
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }),
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    })
  ]);
};

export const createExitAnimation = (
  fadeAnim: Animated.Value,
  scaleAnim: Animated.Value
): Animated.CompositeAnimation => {
  return Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }),
    Animated.timing(scaleAnim, {
      toValue: 1.1,
      duration: 300,
      useNativeDriver: true,
    })
  ]);
};

export const createButtonPressAnimation = (
  buttonScale: Animated.Value
): Animated.CompositeAnimation => {
  return Animated.sequence([
    Animated.timing(buttonScale, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.spring(buttonScale, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    })
  ]);
};

export const createShakeAnimation = (
  shakeAnim: Animated.Value
): Animated.CompositeAnimation => {
  return Animated.sequence([
    Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true })
  ]);
};

export const createInputFocusAnimation = (
  inputFocusAnim: Animated.Value,
  focused: boolean
): Animated.CompositeAnimation => {
  return Animated.timing(inputFocusAnim, {
    toValue: focused ? 1 : 0,
    duration: 300,
    useNativeDriver: false,
  });
};

export const createPulseAnimation = (
  pulseAnim: Animated.Value
): Animated.CompositeAnimation => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ])
  );
};

// Password Strength Checker
export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;
  
  // Length check
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  
  // No common patterns
  if (!/(.)\1{2,}/.test(password)) score += 1; // No repeated characters
  if (!/123|abc|qwe/i.test(password)) score += 1; // No sequential patterns
  
  const strengthMap = {
    0: { label: 'Very Weak', color: '#EF4444' },
    1: { label: 'Very Weak', color: '#EF4444' },
    2: { label: 'Weak', color: '#F97316' },
    3: { label: 'Weak', color: '#F97316' },
    4: { label: 'Fair', color: '#EAB308' },
    5: { label: 'Good', color: '#84CC16' },
    6: { label: 'Good', color: '#84CC16' },
    7: { label: 'Strong', color: '#10B981' },
    8: { label: 'Very Strong', color: '#059669' },
  };
  
  return {
    score,
    ...strengthMap[Math.min(score, 8) as keyof typeof strengthMap]
  };
};

// Form State Management
export class AuthFormState {
  private errors: ValidationErrors = {};
  private touched: { [key: string]: boolean } = {};
  
  setError(field: string, error: string): void {
    this.errors[field] = error;
  }
  
  getError(field: string): string | undefined {
    return this.errors[field];
  }
  
  clearError(field: string): void {
    delete this.errors[field];
  }
  
  clearAllErrors(): void {
    this.errors = {};
  }
  
  hasErrors(): boolean {
    return Object.values(this.errors).some(error => error !== "");
  }
  
  setTouched(field: string, touched: boolean = true): void {
    this.touched[field] = touched;
  }
  
  isTouched(field: string): boolean {
    return this.touched[field] || false;
  }
  
  shouldShowError(field: string): boolean {
    return this.isTouched(field) && !!this.getError(field);
  }
}

// Debounce function for real-time validation
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Custom hook for form animations (if using hooks)
export const useAuthAnimations = () => {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const scaleAnim = new Animated.Value(0.9);
  const shakeAnim = new Animated.Value(0);
  const buttonScale = new Animated.Value(1);
  const inputFocus = new Animated.Value(0);
  
  const playEntranceAnimation = () => {
    createEntranceAnimation(fadeAnim, slideAnim, scaleAnim).start();
  };
  
  const playExitAnimation = (onComplete?: () => void) => {
    createExitAnimation(fadeAnim, scaleAnim).start(onComplete);
  };
  
  const playButtonPressAnimation = () => {
    createButtonPressAnimation(buttonScale).start();
  };
  
  const playShakeAnimation = () => {
    createShakeAnimation(shakeAnim).start();
  };
  
  const playInputFocusAnimation = (focused: boolean) => {
    createInputFocusAnimation(inputFocus, focused).start();
  };
  
  return {
    animations: {
      fadeAnim,
      slideAnim,
      scaleAnim,
      shakeAnim,
      buttonScale,
      inputFocus,
    },
    playEntranceAnimation,
    playExitAnimation,
    playButtonPressAnimation,
    playShakeAnimation,
    playInputFocusAnimation,
  };
};

// Loading states
export const LoadingStates = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export type LoadingState = typeof LoadingStates[keyof typeof LoadingStates];

// Common styles for consistency
export const commonStyles = {
  colors: {
    primary: '#8B5CF6',
    primaryDark: '#7C3AED',
    secondary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
    white: '#FFFFFF',
    black: '#000000',
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 16,
    },
  },
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 24,
    full: 9999,
  },
};