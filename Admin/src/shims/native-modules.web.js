// Stub for native modules not available on web
// (react-native-html-to-pdf, react-native-print, react-native-blob-util,
//  react-native-camera-kit, @react-native-voice/voice)
module.exports = {
  default: {},
  pick: async () => null,
  DocumentPicker: { pick: async () => null },
  Camera: null,
  DownloadDirectoryPath: '',
  readFile: async () => '',
  writeFile: async () => {},
  print: async () => {},
  convert: async () => {},
  start: async () => {},
  stop: async () => {},
  destroy: async () => {},
  removeAllListeners: () => {},
  onSpeechResults: null,
  onSpeechStart: null,
  onSpeechEnd: null,
  onSpeechError: null,
};
