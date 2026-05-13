import { Platform } from 'react-native';
export const API_URL = Platform.OS === 'android' ? 'http://10.97.163.247:3000/api/v1' : 'http://192.168.29.216:3000/api/v1';
