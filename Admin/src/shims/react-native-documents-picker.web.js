// src/shims/react-native-documents-picker.web.js
// Web stub for @react-native-documents/picker
export const pick = async (options) => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    if (options?.type) {
      input.accept = Array.isArray(options.type) ? options.type.join(',') : options.type;
    }
    input.onchange = (e) => {
      const file = e.target?.files?.[0];
      if (file) resolve([{ uri: URL.createObjectURL(file), name: file.name, type: file.type, size: file.size }]);
      else reject(new Error('No file selected'));
    };
    input.oncancel = () => reject(new Error('Document picker cancelled'));
    input.click();
  });
};

export default { pick };
