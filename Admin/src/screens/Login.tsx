import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff, Mail, Phone, Lock, ShieldCheck, ArrowRight } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_DESKTOP = SCREEN_WIDTH >= 768;

export default function Login({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  // Auto-detect phone vs email
  const isPhone = /^[0-9+]/.test(identifier);
  const InputIcon = isPhone ? Phone : Mail;

  const validate = () => {
    const e: typeof errors = {};
    if (!identifier.trim()) {
      e.identifier = 'Phone or Email is required';
    } else if (!isPhone && !/\S+@\S+\.\S+/.test(identifier)) {
      e.identifier = 'Enter a valid email address';
    } else if (isPhone && identifier.replace(/[^0-9]/g, '').length < 10) {
      e.identifier = 'Enter a valid 10-digit phone number';
    }
    if (!password) {
      e.password = 'Password is required';
    } else if (password.length < 6) {
      e.password = 'Minimum 6 characters required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    // TODO: Replace with real API authentication
    setTimeout(() => {
      setLoading(false);
      navigation.replace('Main');
    }, 1800);
  };

  // ── Shared input field style ──────────────────────────────────────
  const inputRow = (
    value: string,
    active: boolean,
    hasError: boolean,
  ) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: hasError ? '#ef4444' : active ? '#6366f1' : '#e2e8f0',
    paddingHorizontal: 14,
    height: 52,
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7ff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f7ff" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
            backgroundColor: '#f5f7ff',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Card Container — centered on all screens ── */}
          <View
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: '#ffffff',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: '#e0e7ff',
              padding: 32,
              // Premium multi-layer elevation
              shadowColor: '#4f46e5',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.18,
              shadowRadius: 48,
              elevation: 20,
            }}
          >
            {/* ── Brand ── */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View
                style={{
                  height: 64,
                  width: 64,
                  borderRadius: 18,
                  backgroundColor: '#6366f1',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  shadowColor: '#6366f1',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <ShieldCheck size={32} color="#ffffff" />
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '900',
                  color: '#1e293b',
                  letterSpacing: -0.3,
                }}
              >
                Crackers Kingdom
              </Text>
              <View
                style={{
                  marginTop: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 3,
                  backgroundColor: '#eef2ff',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#c7d2fe',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '800',
                    color: '#4f46e5',
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                  }}
                >
                  Admin Portal
                </Text>
              </View>
            </View>

            {/* ── Heading ── */}
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 4 }}>
              Welcome back
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '500', marginBottom: 24 }}>
              Sign in to your admin account to continue
            </Text>

            {/* ── Email / Phone ── */}
            <View style={{ marginBottom: 16 }}>
              <Text style={labelStyle}>Email or Phone</Text>
              <View style={inputRow(identifier, !!identifier, !!errors.identifier)}>
                <InputIcon size={17} color={identifier ? '#6366f1' : '#94a3b8'} />
                <TextInput
                  style={inputText}
                  placeholder="Enter email or phone"
                  placeholderTextColor="#94a3b8"
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType={isPhone ? 'phone-pad' : 'email-address'}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.identifier && <Text style={errorText}>{errors.identifier}</Text>}
            </View>

            {/* ── Password ── */}
            <View style={{ marginBottom: 20 }}>
              <Text style={labelStyle}>Password</Text>
              <View style={inputRow(password, !!password, !!errors.password)}>
                <Lock size={17} color={password ? '#6366f1' : '#94a3b8'} />
                <TextInput
                  style={inputText}
                  placeholder="Enter your password"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  {showPassword
                    ? <EyeOff size={17} color="#94a3b8" />
                    : <Eye size={17} color="#94a3b8" />}
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={errorText}>{errors.password}</Text>}
            </View>

            {/* ── Remember Me + Forgot Password ── */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 28,
              }}
            >
              <TouchableOpacity
                onPress={() => setRememberMe(!rememberMe)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    height: 18,
                    width: 18,
                    borderRadius: 5,
                    borderWidth: 2,
                    borderColor: rememberMe ? '#6366f1' : '#cbd5e1',
                    backgroundColor: rememberMe ? '#6366f1' : '#ffffff',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {rememberMe && (
                    <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '900', lineHeight: 12 }}>✓</Text>
                  )}
                </View>
                <Text style={{ fontSize: 13, color: '#475569', fontWeight: '600' }}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7} onPress={() => console.log('Forgot password')}>
                <Text style={{ fontSize: 13, color: '#6366f1', fontWeight: '700' }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Login Button ── */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              style={{
                height: 52,
                borderRadius: 13,
                backgroundColor: loading ? '#818cf8' : '#6366f1',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                shadowColor: '#6366f1',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#ffffff' }}>
                    Signing in...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#ffffff', letterSpacing: 0.2 }}>
                    Sign In
                  </Text>
                  <ArrowRight size={17} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>

            {/* ── Divider ── */}
            <View
              style={{
                marginTop: 28,
                paddingTop: 20,
                borderTopWidth: 1,
                borderTopColor: '#f1f5f9',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 11, color: '#cbd5e1', fontWeight: '600', letterSpacing: 0.5 }}>
                © 2025 Crackers Kingdom · Admin v1.0
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Shared tiny styles ────────────────────────────────────────────
const labelStyle = {
  fontSize: 11,
  fontWeight: '800' as const,
  color: '#64748b',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.8,
  marginBottom: 8,
};

const inputText = {
  flex: 1,
  marginLeft: 10,
  fontSize: 14,
  color: '#0f172a',
  fontWeight: '500' as const,
};

const errorText = {
  fontSize: 11,
  color: '#ef4444',
  fontWeight: '600' as const,
  marginTop: 5,
};
