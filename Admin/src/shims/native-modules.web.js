/**
 * native-modules.web.js
 * Web stubs for native-only modules.
 * Webpack resolves all native packages to this file on the web platform.
 * Each export is a no-op to prevent "module not found" errors on web builds.
 */

import React from 'react';
import { View } from 'react-native';

// react-native-camera-kit stub
export const Camera = () => null;

// react-native-html-to-pdf stub
export default {
  convert: () => Promise.resolve({ filePath: '' }),
};

// react-native-print stub
export const print = () => Promise.resolve();
export const printPDF = () => Promise.resolve();

// react-native-blob-util stub
export const RNFetchBlob = {
  fetch: () => Promise.resolve({ path: () => '' }),
  fs: {
    dirs: { DocumentDir: '', DownloadDir: '' },
    writeFile: () => Promise.resolve(),
    readFile: () => Promise.resolve(''),
    exists: () => Promise.resolve(false),
    unlink: () => Promise.resolve(),
  },
  config: () => ({ fetch: () => Promise.resolve({ path: () => '' }) }),
};
