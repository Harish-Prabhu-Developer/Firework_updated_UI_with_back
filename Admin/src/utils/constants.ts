import { Platform } from 'react-native';
export const API_URL = Platform.OS === 'android' ? 'http://10.78.254.247:3000/api/v1' : 'http://localhost:3000/api/v1';
