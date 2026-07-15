// crossPlatformAlert.js
// Small cross-platform wrapper used by RN screens and web fallback.
// On React Native it delegates to Alert.alert; on web it falls back to window.alert/confirm.

const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
let RNAlert = null;
try {
  // require at runtime to avoid bundling errors in web
  // eslint-disable-next-line global-require
  RNAlert = require('react-native').Alert;
} catch (e) {
  RNAlert = null;
}

export default function crossAlert(title, message, buttons) {
  if (RNAlert && RNAlert.alert) {
    // Delegate to React Native Alert when available
    RNAlert.alert(title, message, buttons);
    return;
  }

  // Web fallback: if no buttons provided, behave like alert
  if (!buttons || buttons.length === 0) {
    window.alert((title ? title + "\n\n" : "") + (message || ''));
    return;
  }

  // If two buttons provided, use confirm to approximate binary choice
  if (buttons.length === 2) {
    const ok = window.confirm((title ? title + "\n\n" : "") + (message || ''));
    if (ok && typeof buttons[0].onPress === 'function') buttons[0].onPress();
    if (!ok && typeof buttons[1].onPress === 'function') buttons[1].onPress();
    return;
  }

  // For one-button or more complex cases, show alert then call onPress of first button
  window.alert((title ? title + "\n\n" : "") + (message || ''));
  if (buttons[0] && typeof buttons[0].onPress === 'function') buttons[0].onPress();
}