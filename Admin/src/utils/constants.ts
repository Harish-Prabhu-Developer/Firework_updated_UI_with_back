import { Platform } from 'react-native';
export const API_URL = Platform.OS === 'android' ? 'http://10.204.212.247:3000/api/v1' : 'http://192.168.29.216:3000/api/v1';
