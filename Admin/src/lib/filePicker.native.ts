import { pick } from '@react-native-documents/picker';

export async function pickImage(): Promise<string | null> {
  try {
    const [result] = await pick({
      type: ['image/*'],
    });
    return result.uri;
  } catch (err) {
    console.log('User cancelled or error', err);
    return null;
  }
}
