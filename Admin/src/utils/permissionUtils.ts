/**
 * permissionUtils.ts — Centralised device permission helpers
 * for Crackers Kingdom Admin (React Native + Web)
 *
 * FIXES:
 *  1. requestOne() — removed pre-check via .check(); always call .request() directly.
 *     Android returns the current grant state from .request() itself, and .check()
 *     can return a stale cached result that blocks the system dialog from appearing.
 *  2. requestStorageWritePermission() — API 29-32 still needs WRITE_EXTERNAL_STORAGE
 *     when writing directly to DownloadDir via react-native-blob-util fs.writeFile().
 *     Only API 33+ is truly exempt. Corrected the version gate from 29 → 33.
 *  3. useStoragePermission hook (useStoragePermission.ts) is superseded by this file.
 *     All callers should import from here instead.
 */

import { Platform, PermissionsAndroid, Alert } from 'react-native';
import type { Rationale, Permission } from 'react-native';

/* ─── Internal helpers ──────────────────────────── */

const isAndroid = Platform.OS === 'android';
const androidVersion = isAndroid ? parseInt(String(Platform.Version), 10) : 0;
const isAndroid13Plus = androidVersion >= 33;

/**
 * Request a single Android permission.
 *
 * FIX: Do NOT call PermissionsAndroid.check() first.
 * Calling .check() before .request() causes the system dialog to be skipped
 * when the permission was previously denied (it returns DENIED from cache and
 * we never call .request()). Always call .request() directly — it returns
 * GRANTED, DENIED, or NEVER_ASK_AGAIN and shows the dialog when appropriate.
 */
export const requestOne = async (
  permission: Permission | string,
  rationale?: Rationale,
): Promise<boolean> => {
  if (!isAndroid || !permission) return true;
  try {
    const result = rationale
      ? await PermissionsAndroid.request(permission as Permission, rationale)
      : await PermissionsAndroid.request(permission as Permission);

    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(`[permissionUtils] Failed to request ${permission}:`, err);
    return false;
  }
};

/* ══════════════════════════════════════════════════
   IMAGE UPLOAD PERMISSION
   Used by: Category, Product, Media (hero slide)
══════════════════════════════════════════════════ */
export const requestImageUploadPermission = async (
  moduleName = 'this module',
): Promise<boolean> => {
  if (!isAndroid) return true;

  const permission = isAndroid13Plus
    ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
    : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

  const granted = await requestOne(permission, {
    title: 'Image Access Required',
    message: `Crackers Kingdom needs access to your photos to upload an image for ${moduleName}.`,
    buttonPositive: 'Allow',
    buttonNegative: 'Deny',
  });

  if (!granted) {
    Alert.alert(
      'Permission Required',
      'Image access was denied. Please allow it in Settings → Apps → Crackers Kingdom → Permissions.',
      [{ text: 'OK' }],
    );
  }

  return granted;
};

/* ══════════════════════════════════════════════════
   VIDEO UPLOAD PERMISSION
   Used by: Video screen
══════════════════════════════════════════════════ */
export const requestVideoUploadPermission = async (): Promise<boolean> => {
  if (!isAndroid) return true;

  const permission = isAndroid13Plus
    ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
    : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

  const granted = await requestOne(permission, {
    title: 'Video Access Required',
    message: 'Crackers Kingdom needs access to your videos to upload a product video.',
    buttonPositive: 'Allow',
    buttonNegative: 'Deny',
  });

  if (!granted) {
    Alert.alert(
      'Permission Required',
      'Video access was denied. Please allow it in Settings → Apps → Crackers Kingdom → Permissions.',
      [{ text: 'OK' }],
    );
  }

  return granted;
};

/* ══════════════════════════════════════════════════
   GENERAL FILE / DOCUMENT PICK PERMISSION
   Used by: CSV import
══════════════════════════════════════════════════ */
export const requestFileReadPermission = async (): Promise<boolean> => {
  if (!isAndroid) return true;

  // API 33+: DocumentPicker manages its own picker URI; no storage permission needed.
  if (isAndroid13Plus) return true;

  const granted = await requestOne(
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    {
      title: 'File Access Required',
      message: 'Crackers Kingdom needs storage access to import files.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );

  if (!granted) {
    Alert.alert(
      'Permission Required',
      'File read access was denied. Please allow it in device Settings.',
      [{ text: 'OK' }],
    );
  }

  return granted;
};

/* ══════════════════════════════════════════════════
   STORAGE WRITE / DOWNLOAD PERMISSION
   Used by: exportUtils (CSV, Excel, PDF downloads)
   
   FIX: The previous code returned true for API >= 29, which is wrong.
   react-native-blob-util fs.writeFile() to DownloadDir still requires
   WRITE_EXTERNAL_STORAGE on API 29–32. Only API 33+ is exempt because
   DownloadManager handles it internally without the manifest permission.
══════════════════════════════════════════════════ */
export const requestStorageWritePermission = async (): Promise<boolean> => {
  if (!isAndroid) return true;

  // Android 13+ (API 33+): WRITE_EXTERNAL_STORAGE is fully deprecated;
  // DownloadManager and MediaStore handle saves without it.
  if (isAndroid13Plus) return true;

  // Android 9–12 (API 28–32): WRITE_EXTERNAL_STORAGE is still required
  // when writing files directly to the shared Downloads directory.
  const granted = await requestOne(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    {
      title: 'Storage Permission Required',
      message: 'Crackers Kingdom needs storage access to save exported files to your Downloads folder.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );

  if (!granted) {
    Alert.alert(
      'Permission Required',
      'Storage permission was denied. Files cannot be saved without it.',
      [{ text: 'OK' }],
    );
  }

  return granted;
};

/* ══════════════════════════════════════════════════
   CAMERA PERMISSION
   Used by: QrScan screen
══════════════════════════════════════════════════ */
export const requestCameraPermission = async (): Promise<boolean> => {
  if (!isAndroid) return true;

  const granted = await requestOne(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    {
      title: 'Camera Access Required',
      message: 'Crackers Kingdom needs camera access to scan QR codes.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );

  if (!granted) {
    Alert.alert(
      'Camera Permission Required',
      'Camera access is needed to scan QR codes. Please allow it in device Settings.',
      [{ text: 'OK' }],
    );
  }

  return granted;
};

/* ══════════════════════════════════════════════════
   WEB FILE PICKER HELPERS
══════════════════════════════════════════════════ */

export const pickFileOnWeb = (accept = '*/*'): Promise<File | null> =>
  new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = (e: any) => resolve(e.target?.files?.[0] ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });

export const pickImageOnWeb = (): Promise<File | null> =>
  pickFileOnWeb('image/png,image/jpeg,image/jpg,image/gif,image/webp');

export const pickVideoOnWeb = (): Promise<File | null> =>
  pickFileOnWeb('video/*');

export const pickCSVOnWeb = (): Promise<File | null> =>
  pickFileOnWeb('.csv,text/csv,text/comma-separated-values');

/* ══════════════════════════════════════════════════
   UNIFIED CROSS-PLATFORM FILE PICKER
══════════════════════════════════════════════════ */

interface PickedFile {
  uri: string;
  name: string;
  type: string;
  webFile?: File;
}

const isPickerCancellation = (err: any): boolean => {
  if (!err) return false;
  const msg: string = err?.message ?? '';
  return (
    err?.code === 'DOCUMENT_PICKER_CANCELED' ||
    msg.includes('cancel') ||
    msg.includes('Cancel') ||
    msg.includes('dismissed')
  );
};

export const pickImage = async (moduleName = 'this module'): Promise<PickedFile | null> => {
  if (Platform.OS === 'web') {
    const file = await pickImageOnWeb();
    if (!file) return null;
    return {
      uri: URL.createObjectURL(file),
      name: file.name,
      type: file.type || 'image/jpeg',
      webFile: file,
    };
  }

  const ok = await requestImageUploadPermission(moduleName);
  if (!ok) return null;

  try {
    const Picker = require('@react-native-documents/picker');
    const [picked] = await Picker.pick({
      type: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
    });
    if (!picked?.uri) return null;
    return {
      uri: picked.uri,
      name: picked.name || `image-${Date.now()}.jpg`,
      type: picked.type || 'image/jpeg',
    };
  } catch (e: any) {
    if (!isPickerCancellation(e)) {
      Alert.alert('Pick Failed', e?.message || 'Could not open file picker.');
    }
    return null;
  }
};

export const pickVideo = async (): Promise<PickedFile | null> => {
  if (Platform.OS === 'web') {
    const file = await pickVideoOnWeb();
    if (!file) return null;
    return {
      uri: URL.createObjectURL(file),
      name: file.name,
      type: file.type || 'video/mp4',
      webFile: file,
    };
  }

  const ok = await requestVideoUploadPermission();
  if (!ok) return null;

  try {
    const Picker = require('@react-native-documents/picker');
    const [picked] = await Picker.pick({ type: [Picker.types?.video ?? 'video/*'] });
    if (!picked?.uri) return null;
    return {
      uri: picked.uri,
      name: picked.name || `video-${Date.now()}.mp4`,
      type: picked.type || 'video/mp4',
    };
  } catch (e: any) {
    if (!isPickerCancellation(e)) {
      Alert.alert('Pick Failed', e?.message || 'Could not open file picker.');
    }
    return null;
  }
};

export const pickCSV = async (): Promise<PickedFile | null> => {
  if (Platform.OS === 'web') {
    const file = await pickCSVOnWeb();
    if (!file) return null;
    return {
      uri: URL.createObjectURL(file),
      name: file.name,
      type: 'text/csv',
      webFile: file,
    };
  }

  const ok = await requestFileReadPermission();
  if (!ok) return null;

  try {
    const Picker = require('@react-native-documents/picker');
    const [picked] = await Picker.pick({
      type: ['text/csv', 'text/comma-separated-values', 'public.comma-separated-values-text'],
    });
    if (!picked?.uri) return null;
    return {
      uri: picked.uri,
      name: picked.name || `import-${Date.now()}.csv`,
      type: picked.type || 'text/csv',
    };
  } catch (e: any) {
    if (!isPickerCancellation(e)) {
      Alert.alert('Pick Failed', e?.message || 'Could not open file picker.');
    }
    return null;
  }
};