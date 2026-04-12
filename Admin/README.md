# 🍞 React Native Toast with NativeWind

A beautiful, animated Toast notification component for React Native with NativeWind (Tailwind CSS) styling. Inspired by the popular `react-hot-toast` library for web, bringing the same delightful experience to React Native.

## ✨ Features

- 🎨 **NativeWind Styling** - Beautiful Tailwind CSS styling out of the box
- 🎬 **Multiple Animations** - Slide, Scale, Fade, and Bounce animations
- 📍 **Flexible Positioning** - 6 positions (top-left, top-right, top-center, bottom-left, bottom-right, bottom-center)
- 🎯 **Toast Types** - Success, Error, Warning, Info, and Default types with distinct colors
- 👆 **Swipe to Dismiss** - Intuitive gesture-based dismissal
- ⏱️ **Auto-dismiss** - Configurable duration with progress bar
- 🔧 **Highly Customizable** - Custom icons, styles, and callbacks
- 📱 **React Native Reanimated** - Smooth 60fps animations
- 🔔 **Action Support** - Press callbacks for interactive toasts

## 📦 Installation

```bash
# Using npm
npm install

# Using yarn
yarn install
```

## 🚀 Quick Start

### 1. Wrap your app with ToastProvider

```tsx
import { ToastProvider } from './src';

export default function App() {
  return (
    <ToastProvider>
      <YourApp />
    </ToastProvider>
  );
}
```

### 2. Use the useToast hook

```tsx
import { useToast, ToastContainer } from './src';

function YourComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Operation successful!');
  };

  return (
    <>
      <Button onPress={handleSuccess} title="Show Toast" />
      <ToastContainer />
    </>
  );
}
```

## 📖 API Reference

### ToastProvider

Wrap your app with the provider to enable toast functionality.

```tsx
<ToastProvider 
  defaultOptions={{
    position: 'top-right',
    duration: 4000,
    animation: 'slide',
  }}
  maxToasts={5}
>
  <App />
</ToastProvider>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultOptions` | `ToastOptions` | `{}` | Default options applied to all toasts |
| `maxToasts` | `number` | `5` | Maximum number of visible toasts |
| `gap` | `number` | `8` | Gap between toasts in pixels |

### useToast Hook

The main hook for controlling toasts.

```tsx
const toast = useToast();
```

#### Methods

| Method | Description |
|--------|-------------|
| `success(message, options?)` | Show a success toast |
| `error(message, options?)` | Show an error toast |
| `warning(message, options?)` | Show a warning toast |
| `info(message, options?)` | Show an info toast |
| `custom(message, options?)` | Show a custom toast |
| `addToast(message, options?)` | Add a toast with full options |
| `removeToast(id)` | Remove a specific toast |
| `removeAllToasts()` | Remove all toasts |
| `updateToast(id, options)` | Update an existing toast |

### ToastOptions

```tsx
interface ToastOptions {
  // Unique identifier
  id?: string;
  
  // Toast type: 'success' | 'error' | 'warning' | 'info' | 'default'
  type?: ToastType;
  
  // Position: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  position?: ToastPosition;
  
  // Duration in milliseconds (0 = no auto-dismiss)
  duration?: number;
  
  // Animation: 'slide' | 'fade' | 'scale' | 'bounce'
  animation?: ToastAnimation;
  
  // Show close button
  showCloseButton?: boolean;
  
  // Enable swipe to dismiss
  swipeToDismiss?: boolean;
  
  // Show progress bar
  showProgress?: boolean;
  
  // Title text (bold)
  title?: string;
  
  // Description text (smaller)
  description?: string;
  
  // Custom icon (emoji string or React node)
  icon?: string | React.ReactNode;
  
  // Callback when toast is pressed
  onPress?: () => void;
  
  // Callback when toast is dismissed
  onDismiss?: () => void;
  
  // Custom styles
  style?: ViewStyle;
}
```

## 💡 Usage Examples

### Basic Toasts

```tsx
const toast = useToast();

// Success toast
toast.success('File uploaded successfully!');

// Error toast
toast.error('Failed to save changes');

// Warning toast
toast.warning('Your session will expire soon');

// Info toast
toast.info('New updates are available');
```

### With Title and Description

```tsx
toast.success('3 files uploaded to cloud storage', {
  title: 'Upload Complete',
  description: 'Total size: 2.4 MB',
});
```

### Custom Position

```tsx
toast.info('Saved to clipboard', {
  position: 'bottom-center',
});

toast.error('Connection lost', {
  position: 'top-left',
});
```

### Custom Duration

```tsx
// Quick toast (2 seconds)
toast.success('Copied!', { duration: 2000 });

// Longer toast (8 seconds)
toast.error('Please check your connection', { duration: 8000 });

// Persistent toast (no auto-dismiss)
toast.warning('Important: Please read', { 
  duration: 0,
  showProgress: false,
});
```

### Animation Styles

```tsx
// Slide animation (default for left/right positions)
toast.success('Sliding in!', { animation: 'slide' });

// Scale animation (default for top/bottom positions)
toast.error('Scaling in!', { animation: 'scale' });

// Fade animation
toast.info('Fading in!', { animation: 'fade' });

// Bounce animation
toast.success('Bouncing in!', { animation: 'bounce' });
```

### Custom Icons

```tsx
// Emoji icons
toast.success('Party time!', { icon: '🎉' });
toast.info('New feature!', { icon: '✨' });
toast.warning('Heads up!', { icon: '👀' });

// Custom React component
toast.custom('Custom!', {
  icon: <CustomIcon />,
});
```

### Interactive Toasts

```tsx
// With press action
toast.info('Tap to view details', {
  onPress: () => navigation.navigate('Details'),
});

// With dismiss callback
toast.success('Item deleted', {
  onDismiss: () => console.log('Toast dismissed'),
});
```

### Multiple Toasts

```tsx
// Show multiple toasts
toast.success('First toast!');
setTimeout(() => toast.info('Second toast!'), 200);
setTimeout(() => toast.warning('Third toast!'), 400);

// Clear all toasts
toast.removeAllToasts();
```

### Real-World Scenarios

```tsx
// File upload
toast.success('document.pdf uploaded', {
  title: 'Upload Complete',
  icon: '📄',
});

// Network error
toast.error('Please check your internet connection', {
  title: 'Connection Failed',
  duration: 6000,
});

// Achievement
toast.success('You completed your first task!', {
  title: '🏆 Achievement Unlocked!',
  animation: 'bounce',
  duration: 5000,
});

// Form validation
toast.error('Please fill in all required fields', {
  title: 'Validation Error',
  position: 'top',
});
```

## 🎨 Customization

### Colors

Colors are defined in `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        toast: {
          success: '#10B981', // Emerald
          error: '#EF4444',   // Red
          warning: '#F59E0B', // Amber
          info: '#3B82F6',    // Blue
        },
      },
    },
  },
};
```

### Custom Icons

Create custom icon components:

```tsx
import { getToastColors } from './src/utils';

function CustomSuccessIcon() {
  return (
    <Svg width={24} height={24}>
      {/* Your SVG path */}
    </Svg>
  );
}

// Use it
toast.success('Success!', { icon: <CustomSuccessIcon /> });
```

## 📁 Project Structure

```
rn-toast-nativewind/
├── App.tsx                    # Demo app
├── src/
│   ├── index.ts              # Main exports
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   ├── context/
│   │   └── ToastContext.tsx  # Toast context & provider
│   ├── components/
│   │   ├── ToastItem.tsx     # Individual toast component
│   │   ├── ToastContainer.tsx # Toast container
│   │   └── Icons.tsx         # SVG icons
│   ├── hooks/
│   │   └── useToastActions.ts # Additional hooks
│   └── utils/
│       └── index.ts          # Utility functions
├── tailwind.config.js        # Tailwind configuration
├── babel.config.js           # Babel configuration
└── package.json
```

## 🤝 Dependencies

- `react-native-reanimated` - Smooth animations
- `react-native-gesture-handler` - Gesture handling
- `react-native-safe-area-context` - Safe area handling
- `nativewind` - Tailwind CSS for React Native
- `react-native-svg` - SVG support for icons

## 📄 License

MIT

---

Made with ❤️ for React Native developers
