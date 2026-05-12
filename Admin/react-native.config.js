module.exports = {
  dependencies: {
    'react-native-camera-kit': {
      platforms: {
        android: {
          // Keep Android autolinking aligned with the codegen target emitted by camera-kit.
          libraryName: 'RNCameraKit',
        },
      },
    },
  },
};
