import React, { useState, useEffect } from 'react';
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
import api from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatIdentityDisplay, cleanIdentityInput } from '../utils/Formatter';
import { useToast } from '../hooks/useToast';
import { encrypt, decrypt } from '../utils/encryption';
import { usePermissions } from '../hooks/usePermissions';
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Radius, FontSizes, Fonts } from '../styles/globalStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_DESKTOP = SCREEN_WIDTH >= 768;

export default function Login({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { setCurrentRole, loadPermissions } = usePermissions();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; common?: string }>({});

  // Load remembered identity on mount
  useEffect(() => {
    const loadRememberedIdentity = async () => {
      try {
        const savedIdentity = await AsyncStorage.getItem('rememberedIdentity');
        const savedPassword = await AsyncStorage.getItem('rememberedPassword');

        if (savedIdentity && savedPassword) {
          setIdentifier(decrypt(savedIdentity));
          setPassword(decrypt(savedPassword));
          setRememberMe(true);
        }
      } catch (error) {
        console.warn('⚠️ Login: Failed to load remembered identity');
      }
    };
    loadRememberedIdentity();
  }, []);

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

    try {
      const { data } = await api.post('/auth/login', {
        identifier,
        password
      });

      if (data.success) {
        await AsyncStorage.setItem('accessToken', data.data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.data.refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(data.data.user));

        // Update role and load permissions
        setCurrentRole(data.data.user.roleName || "");
        await loadPermissions();

        try {
          if (rememberMe) {
            await AsyncStorage.setItem('rememberedIdentity', encrypt(identifier));
            await AsyncStorage.setItem('rememberedPassword', encrypt(password));
          } else {
            await AsyncStorage.removeItem('rememberedIdentity');
            await AsyncStorage.removeItem('rememberedPassword');
          }
        } catch (error) {
          console.warn('⚠️ Login: Failed to save identity preference');
        }

        // Update permission context immediately
        if (data.user?.roleName) setCurrentRole(data.user.roleName);
        await loadPermissions();

        toast.success('Login successful');
        navigation.replace('Main');
      } else {
        setErrors({ common: data.msg || 'Invalid credentials' });
        toast.apiError(data, 'Invalid credentials');
      }
    } catch (error: any) {
      console.error('Login Error:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.msg || 'An error occurred during login. Please try again.';
      setErrors({ common: errorMsg });
      toast.apiError(error, errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ── Shared input field style ──────────────────────────────────────
  const inputRow = (
    value: string,
    active: boolean,
    hasError: boolean,
  ) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: hasError ? colors.destructive : active ? colors.primary : colors.border,
    paddingHorizontal: 14,
    height: 52,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

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
            backgroundColor: colors.background,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Card Container — centered on all screens ── */}
          <View
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: colors.card,
              borderRadius: Radius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 32,
              // Premium multi-layer elevation
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.1,
              shadowRadius: 40,
              elevation: 15,
            }}
          >
            {/* ── Brand ── */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View
                style={{
                  height: 64,
                  width: 64,
                  borderRadius: 18,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <ShieldCheck size={32} color={colors.primaryForeground} />
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '900',
                  color: colors.foreground,
                  letterSpacing: -0.3,
                  fontFamily: Fonts.display,
                }}
              >
                Crackers Kingdom
              </Text>
              <View
                style={{
                  marginTop: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 3,
                  backgroundColor: colors.muted,
                  borderRadius: Radius.full,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '800',
                    color: colors.primary,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                  }}
                >
                  Admin Portal
                </Text>
              </View>
            </View>

            {/* ── Heading ── */}
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.foreground, marginBottom: 4, fontFamily: Fonts.display }}>
              Welcome back
            </Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground, fontWeight: '500', marginBottom: 24, fontFamily: Fonts.body }}>
              Sign in to your admin account to continue
            </Text>

            {/* ── Email / Phone ── */}
            <View style={{ marginBottom: 16 }}>
              <Text style={labelStyle}>Email or Phone</Text>
              <View style={inputRow(identifier, !!identifier, !!errors.identifier)}>
                <InputIcon size={17} color={identifier ? colors.primary : colors.mutedForeground} />
                <TextInput
                  style={inputText}
                  placeholder="Enter email or phone"
                  placeholderTextColor={colors.mutedForeground}
                  value={formatIdentityDisplay(identifier)}
                  onChangeText={(text) => setIdentifier(cleanIdentityInput(text))}
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
                <Lock size={17} color={password ? colors.primary : colors.mutedForeground} />
                <TextInput
                  style={inputText}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  {showPassword
                    ? <EyeOff size={17} color={colors.mutedForeground} />
                    : <Eye size={17} color={colors.mutedForeground} />}
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
                    borderColor: rememberMe ? colors.primary : colors.border,
                    backgroundColor: rememberMe ? colors.primary : colors.card,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {rememberMe && (
                    <Text style={{ color: colors.primaryForeground, fontSize: 10, fontWeight: '900', lineHeight: 12 }}>✓</Text>
                  )}
                </View>
                <Text style={{ fontSize: 13, color: colors.mutedForeground, fontWeight: '600', fontFamily: Fonts.body }}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7} onPress={() => console.log('Forgot password')}>
                <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '700', fontFamily: Fonts.body }}>
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
                borderRadius: Radius.lg,
                backgroundColor: loading ? colors.primary + 'CC' : colors.primary,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              {loading ? (
                <>
                  <ActivityIndicator color={colors.primaryForeground} size="small" />
                  <Text style={{ fontSize: 15, fontWeight: '800', color: colors.primaryForeground, fontFamily: Fonts.body }}>
                    Signing in...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: colors.primaryForeground, letterSpacing: 0.2, fontFamily: Fonts.body }}>
                    Sign In
                  </Text>
                  <ArrowRight size={17} color={colors.primaryForeground} />
                </>
              )}
            </TouchableOpacity>
            {errors.common && <Text style={[errorText, { textAlign: 'center', marginTop: 14 }]}>{errors.common}</Text>}
            {/* ── Divider ── */}
            <View
              style={{
                marginTop: 28,
                paddingTop: 20,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 11, color: colors.mutedForeground, fontWeight: '600', letterSpacing: 0.5, fontFamily: Fonts.body }}>
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
  color: colors.mutedForeground,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.8,
  marginBottom: 8,
  fontFamily: Fonts.body,
};

const inputText = {
  flex: 1,
  marginLeft: 10,
  fontSize: 14,
  color: colors.foreground,
  fontWeight: '500' as const,
  fontFamily: Fonts.body,
};

const errorText = {
  fontSize: 11,
  color: colors.destructive,
  fontWeight: '600' as const,
  marginTop: 5,
  fontFamily: Fonts.body,
};

