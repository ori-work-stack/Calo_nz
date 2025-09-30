
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Handle source maps better
config.serializer.getModulesRunBeforeMainModule = () => [];

// Better error handling
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;
