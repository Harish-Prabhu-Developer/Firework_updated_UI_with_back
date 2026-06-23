jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  refresh: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }) => children,
  Swipeable: ({ children }) => children,
  DrawerLayout: ({ children }) => children,
  State: {},
  PanGestureHandler: ({ children }) => children,
  TapGestureHandler: ({ children }) => children,
  LongPressGestureHandler: ({ children }) => children,
  PinchGestureHandler: ({ children }) => children,
  RotationGestureHandler: ({ children }) => children,
  FlingGestureHandler: ({ children }) => children,
  NativeViewGestureHandler: ({ children }) => children,
  ScrollView: ({ children }) => children,
  TextInput: ({ children }) => children,
}));

jest.mock('react-native-reanimated', () => ({
  default: { createAnimatedComponent: c => c },
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withTiming: jest.fn(() => 0),
  withSpring: jest.fn(() => 0),
  withRepeat: jest.fn(() => 0),
  withSequence: jest.fn(() => 0),
  Easing: {},
  FadeIn: {},
  FadeOut: {},
  SlideInRight: {},
  SlideOutRight: {},
  Layout: {},
}));
