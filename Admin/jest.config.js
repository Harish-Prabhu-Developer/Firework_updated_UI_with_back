module.exports = {
  preset: 'react-native',
  testPathIgnorePatterns: ['/node_modules/', 'App.test.tsx'],
  setupFiles: ['./jest-setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-.*|@react-native-community|@?react-navigation|@react-native-community|@react-native/assets|react-redux|@tanstack|@reduxjs|immer|react-native-safe-area-context|react-native-screens)/)',
  ],
};
