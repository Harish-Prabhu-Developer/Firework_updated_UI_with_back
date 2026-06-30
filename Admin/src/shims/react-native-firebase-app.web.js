// Admin/src/shims/react-native-firebase-app.web.js
// Web Firebase app is initialized in firebaseConfig.web.ts; this just satisfies
// any `import '@react-native-firebase/app'` side-effect imports elsewhere.
export default { apps: [], app: () => null };