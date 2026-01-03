/**
 * Login Screen for RankPlay
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    console.log('=== LOGIN BUTTON PRESSED ===');
    console.log('Email:', email);
    console.log('Password length:', password.length);
    
    if (!validate()) {
      console.log('Validation failed:', errors);
      return;
    }
    
    console.log('Validation passed, calling login...');
    setIsLoading(true);
    try {
      console.log('Calling AuthContext login...');
      await login(email, password);
      console.log('Login successful, navigating to tabs');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'No se pudo iniciar sesión';
      if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert('Error al Iniciar Sesión', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="trophy" size={64} color={Colors.primary[600]} />
            </View>
            <Text style={styles.appName}>RankPlay</Text>
            <Text style={styles.tagline}>Centro de minijuegos con rankings</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formSection}>
            <Text style={styles.welcomeText}>¡Bienvenido de vuelta!</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

            <Input
              label="Email"
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail"
              error={errors.email}
            />

            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              leftIcon="lock-closed"
              error={errors.password}
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <Button
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              size="lg"
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o continúa con</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-google" size={24} color={Colors.neutral[700]} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-apple" size={24} color={Colors.neutral[700]} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-facebook" size={24} color={Colors.neutral[700]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Link */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.registerLink}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: FontSizes.xxxl,
    fontWeight: '800',
    color: Colors.primary[600],
    letterSpacing: -1,
  },
  tagline: {
    fontSize: FontSizes.md,
    color: Colors.neutral[500],
    marginTop: Spacing.xs,
  },
  formSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.neutral[900],
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.neutral[500],
    marginBottom: Spacing.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    fontSize: FontSizes.sm,
    color: Colors.primary[600],
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral[200],
  },
  dividerText: {
    paddingHorizontal: Spacing.md,
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: Spacing.lg,
  },
  registerText: {
    fontSize: FontSizes.md,
    color: Colors.neutral[600],
  },
  registerLink: {
    fontSize: FontSizes.md,
    color: Colors.primary[600],
    fontWeight: '600',
  },
});
