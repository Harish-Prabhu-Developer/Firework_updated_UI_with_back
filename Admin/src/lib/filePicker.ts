import { Platform } from 'react-native';

export async function pickImage(): Promise<string | null> {
  // Web implementation (fallback, usually handled by <input type="file">)
  console.log('Pick image not implemented for web in this helper');
  return null;
}
