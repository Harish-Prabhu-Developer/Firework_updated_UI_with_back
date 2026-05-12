import { Platform, PermissionsAndroid, Alert } from 'react-native';

export const useStoragePermission = () => {
  const requestWritePermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
      // For Android 13 (API 33) and above
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        // Technically, WRITE_EXTERNAL_STORAGE is deprecated in API 33+
        // and doesn't need to be requested for Downloads.
        return true;
      }

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'Crackers Kingdom needs storage access to save export files to your device.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        Alert.alert(
          'Permission Denied',
          'We need storage permission to download files. Please enable it in settings.'
        );
        return false;
      }
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  };

  const requestReadPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
      let permission;
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        permission = (PermissionsAndroid.PERMISSIONS as any).READ_MEDIA_IMAGES;
      } else {
        permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
      }

      const granted = await PermissionsAndroid.request(permission, {
        title: 'Storage Permission',
        message: 'Crackers Kingdom needs access to your gallery to upload images.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      });

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  };

  return { requestWritePermission, requestReadPermission };
};
