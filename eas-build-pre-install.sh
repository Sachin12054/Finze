#!/bin/bash

# Pre-install script to force compatible versions for React Native 0.81.4
echo "Forcing compatible AGP and Kotlin versions for React Native 0.81.4..."

# Force AGP version in gradle.properties
echo "android.gradle.plugin.version=8.1.0" >> android/gradle.properties
echo "android.gradle.plugin.version.override=8.1.0" >> android/gradle.properties

# Create or update build.gradle with forced versions
cat > android/build.gradle << 'EOF'
buildscript {
    ext {
        buildToolsVersion = "36.0.0"
        minSdkVersion = 24
        compileSdkVersion = 36
        targetSdkVersion = 36
        kotlinVersion = "1.8.22"
        ndkVersion = "27.1.12297006"
        
        // Force compatible versions for RN 0.81.4
        agpVersion = "8.1.0"
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.1.0")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.8.22")
    }
    configurations.all {
        resolutionStrategy {
            force "com.android.tools.build:gradle:8.1.0"
            force "org.jetbrains.kotlin:kotlin-gradle-plugin:1.8.22"
            force "org.jetbrains.kotlin:kotlin-stdlib:1.8.22"
            force "org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22"
        }
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url "https://www.jitpack.io" }
    }
    
    configurations.all {
        resolutionStrategy {
            force "com.android.tools.build:gradle:8.1.0"
            force "org.jetbrains.kotlin:kotlin-gradle-plugin:1.8.22"
            force "org.jetbrains.kotlin:kotlin-stdlib:1.8.22"
            force "org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22"
        }
    }
}
EOF

echo "Pre-install script completed."