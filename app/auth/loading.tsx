import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function Loading() {
  const router = useRouter();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Floating particles animation
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create floating particles animation
    const createParticleAnimation = (particle: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(particle, {
            toValue: 1,
            duration: 3000,
            delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(particle, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Start particle animations
    createParticleAnimation(particle1, 0).start();
    createParticleAnimation(particle2, 1000).start();
    createParticleAnimation(particle3, 2000).start();

    // Continuous glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Progress animation (using JS driver for width)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 4000,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false, // Must use JS driver for width animation
    }).start();

    // Main loading sequence
    Animated.sequence([
      // Phase 1: Logo entrance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
      
      // Phase 2: Pulse before transition
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ),
      
      Animated.delay(1000),
    ]).start(() => {
      // Navigate to welcome screen after animation (total ~5 seconds)
      router.replace('/auth/welcome' as any);
    });
  }, []);

  // Animated values for transformations
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const getParticleTransform = (particle: Animated.Value, direction: number) => {
    const translateY = particle.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -30 * direction],
    });
    const opacity = particle.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 1, 0.3],
    });
    return { translateY, opacity };
  };

  return (
    <View style={styles.container}>
      {/* Professional Background Gradient */}
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#2563eb']} // Professional dark blue gradient
        style={styles.backgroundGradient}
      >
        {/* Animated Background Particles */}
        <Animated.View 
          style={[
            styles.particle,
            styles.particle1,
            {
              opacity: getParticleTransform(particle1, 1).opacity,
              transform: [{ translateY: getParticleTransform(particle1, 1).translateY }],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.particle,
            styles.particle2,
            {
              opacity: getParticleTransform(particle2, -1).opacity,
              transform: [{ translateY: getParticleTransform(particle2, -1).translateY }],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.particle,
            styles.particle3,
            {
              opacity: getParticleTransform(particle3, 1.5).opacity,
              transform: [{ translateY: getParticleTransform(particle3, 1.5).translateY }],
            },
          ]}
        />
      </LinearGradient>
      
      {/* Main Logo Container - Centered Professional Layout */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
              { rotate: rotateInterpolate },
            ],
          },
        ]}
      >
        {/* Multi-layer Glow Effects */}
        <Animated.View
          style={[
            styles.glowEffect,
            styles.glowOuter,
            {
              opacity: Animated.multiply(glowOpacity, 0.3),
              transform: [{ scale: Animated.multiply(pulseAnim, 1.5) }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.glowEffect,
            styles.glowMiddle,
            {
              opacity: Animated.multiply(glowOpacity, 0.5),
              transform: [{ scale: Animated.multiply(pulseAnim, 1.2) }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.glowEffect,
            styles.glowInner,
            {
              opacity: glowOpacity,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        
        {/* Main Logo Image - Premium Finze Logo */}
        <View style={styles.logoImageContainer}>
          <Image
            source={require('../../assets/Logo/Logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          
          {/* Overlay Ring Animation */}
          <Animated.View
            style={[
              styles.logoRing,
              {
                opacity: glowOpacity,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        </View>
        
        {/* Premium AI Badge */}
        <Animated.View
          style={[
            styles.premiumBadge,
            {
              opacity: fadeAnim,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Text style={styles.premiumText}>AI</Text>
        </Animated.View>
      </Animated.View>

      {/* App Branding - Fixed Position */}
      <Animated.View
        style={[
          styles.brandingContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Text style={styles.appName}>Finze</Text>
        <Text style={styles.tagline}>Smart Financial Intelligence</Text>
        <View style={styles.versionContainer}>
          <View style={styles.versionDot} />
          <Text style={styles.versionText}>Powered by AI</Text>
        </View>
      </Animated.View>

      {/* Advanced Progress Section - Fixed Position */}
      <Animated.View
        style={[
          styles.progressSection,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Progress Bar Container */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth,
                },
              ]}
            >
              <LinearGradient
                colors={['#3b82f6', '#10b981', '#06b6d4']} // Professional blue-green gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressGradient}
              />
            </Animated.View>
          </View>
          
          {/* Progress Text */}
          <Text style={styles.progressText}>
            Initializing your financial journey...
          </Text>
        </View>

        {/* Loading Features List */}
        <View style={styles.featuresList}>
          <Animated.View style={[styles.featureItem, { opacity: fadeAnim }]}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Setting up AI insights</Text>
          </Animated.View>
          <Animated.View style={[styles.featureItem, { opacity: fadeAnim }]}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Preparing expense tracking</Text>
          </Animated.View>
          <Animated.View style={[styles.featureItem, { opacity: fadeAnim }]}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Configuring smart budgets</Text>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Bottom Branding */}
      <Animated.View
        style={[
          styles.bottomBranding,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Text style={styles.companyText}>© 2024 Finze Technologies</Text>
        <Text style={styles.taglineBottom}>Experience the future of finance</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  // Floating Particles
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  particle1: {
    top: '20%',
    left: '15%',
    backgroundColor: '#3b82f6', // Professional blue
  },
  particle2: {
    top: '60%',
    right: '20%',
    backgroundColor: '#10b981', // Professional emerald
  },
  particle3: {
    top: '40%',
    left: '80%',
    backgroundColor: '#06b6d4', // Professional cyan
  },
  
  // Logo Container - Perfectly Centered and Professional
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
    zIndex: 10,
  },
  glowEffect: {
    position: 'absolute',
    borderRadius: 200,
    backgroundColor: '#3b82f6', // Professional blue glow
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 15,
  },
  glowOuter: {
    width: 450,
    height: 450,
    opacity: 0.08, // Very subtle
  },
  glowMiddle: {
    width: 360,
    height: 360,
    opacity: 0.12, // Subtle
  },
  glowInner: {
    width: 300,
    height: 300,
    opacity: 0.15, // Light glow
  },
  logoImageContainer: {
    width: 240,
    height: 240,
    borderRadius: 120, // Perfect circle
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 15,
    borderWidth: 3,
    borderColor: '#e2e8f0', // Light professional border
    position: 'relative',
    overflow: 'hidden', // Ensure content stays within circle
  },
  logoImage: {
    width: 200, // Larger to fill the circle better
    height: 200,
    borderRadius: 100, // Make the image itself circular
  },
  logoRing: {
    position: 'absolute',
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    borderRadius: 132, // Adjusted for new size
    borderWidth: 2,
    borderColor: '#3b82f6', // Professional blue ring
    opacity: 0.4,
  },
  premiumBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10b981', // Professional emerald green
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  premiumText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  
  // Branding - Professional Positioning
  brandingContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  appName: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 3,
    textShadowColor: '#3b82f6', // Professional blue shadow
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 18,
    color: '#cbd5e1',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1.2,
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  versionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981', // Professional emerald green
  },
  versionText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  
  // Progress Section - Better Positioning
  progressSection: {
    width: '90%',
    alignItems: 'center',
    marginBottom: 40,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 15,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
    position: 'relative',
  },
  progressGradient: {
    flex: 1,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 16,
    color: '#e2e8f0',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  // Features List
  featuresList: {
    width: '100%',
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 20,
  },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#3b82f6', // Professional blue
  },
  featureText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  
  // Bottom Branding - Better Positioning
  bottomBranding: {
    alignItems: 'center',
    marginTop: 20,
  },
  companyText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  taglineBottom: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
});