const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Suppress React warnings in development
if (process.env.NODE_ENV === 'development') {
  config.resolver.alias = {
    ...config.resolver.alias,
    'react': require.resolve('react'),
    'react-native': require.resolve('react-native'),
  };
}

module.exports = config;