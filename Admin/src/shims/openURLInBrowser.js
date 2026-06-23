// src/shims/openURLInBrowser.js
module.exports = function openURLInBrowser(url) {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
};
