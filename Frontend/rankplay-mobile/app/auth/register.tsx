/**
 * Register Screen for RankPlay
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    display_name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Mínimo 3 caracteres';
    }

    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mínimo 8 caracteres';
    }

    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    console.log('=== REGISTER BUTTON PRESSED ===');
    console.log('Form data:', { ...formData, password: '***', password_confirm: '***' });
    
    if (!validate()) {
      console.log('Validation failed:', errors);
      return;
    }

    console.log('Validation passed, calling register...');
    setIsLoading(true);
    try {
      console.log('Calling AuthContext register...');
      await register(formData);
      console.log('Register successful, navigating to tabs');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Register error:', error);
      // Extraer mensaje de error específico
      let errorMessage = 'No se pudo crear la cuenta';
      if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert('Error al Registrarse', errorMessage);
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
          {/* Header */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.neutral[700]} />
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="trophy" size={48} color={Colors.primary[600]} />
            </View>
            <Text style={styles.appName}>RankPlay</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a la competencia</Text>

            <Input
              label="Nombre de Usuario"
              placeholder="jugador123"
              value={formData.username}
              onChangeText={(v) => updateField('username', v)}
              autoCapitalize="none"
              leftIcon="person"
              error={errors.username}
            />

            <Input
              label="Nombre Visible (opcional)"
              placeholder="Tu nombre"
              value={formData.display_name}
              onChangeText={(v) => updateField('display_name', v)}
              leftIcon="at"
            />

            <Input
              label="Email"
              placeholder="tu@email.com"
              value={formData.email}
              onChangeText={(v) => updateField('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail"
              error={errors.email}
            />

            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={formData.password}
              onChangeText={(v) => updateField('password', v)}
              secureTextEntry
              autoCapitalize="none"
              leftIcon="lock-closed"
              error={errors.password}
            />

            <Input
              label="Confirmar Contraseña"
              placeholder="••••••••"
              value={formData.password_confirm}
              onChangeText={(v) => updateField('password_confirm', v)}
              secureTextEntry
              autoCapitalize="none"
              leftIcon="lock-closed"
              error={errors.password_confirm}
            />

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                Al registrarte, aceptas nuestros{' '}
                <Text style={styles.termsLink}>Términos de Servicio</Text>
                {' '}y{' '}
                <Text style={styles.termsLink}>Política de Privacidad</Text>
              </Text>
            </View>

            <Button
              title="Crear Cuenta"
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              size="lg"
            />
          </View>

          {/* Login Link */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>Inicia sesión</Text>
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
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  appName: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.primary[600],
  },
  formSection: {
    flex: 1,
  },
  title: {
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
  termsContainer: {
    marginBottom: Spacing.lg,
  },
  termsText: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.primary[600],
    fontWeight: '500',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: Spacing.lg,
  },
  loginText: {
    fontSize: FontSizes.md,
    color: Colors.neutral[600],
  },
  loginLink: {
    fontSize: FontSizes.md,
    color: Colors.primary[600],
    fontWeight: '600',
  },
});
