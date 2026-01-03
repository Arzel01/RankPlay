/**
 * EditProfileScreen - Editar perfil con validación de contraseña
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Campos del formulario
  const [username, setUsername] = useState(user?.username || '');
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState('');
  
  // Validación de contraseña
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Debes ingresar tu contraseña para confirmar los cambios');
      return;
    }

    setIsLoading(true);
    try {
      // Aquí enviarías los datos al backend
      // await api.updateProfile({ username, display_name: displayName, email, bio, password });
      
      // Simulación temporal
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await refreshUser();
      Alert.alert('Éxito', 'Perfil actualizado correctamente', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.neutral[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.label}>Nombre de usuario</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Tu nombre de usuario"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Nombre para mostrar (opcional)</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Como quieres que te vean"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Biografía</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Cuéntanos sobre ti..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.label}>Confirmar con contraseña *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Tu contraseña actual"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={Colors.neutral[400]}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            Por seguridad, necesitamos confirmar tu identidad
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.neutral[900],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.neutral[700],
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.neutral[900],
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
  },
  passwordInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.neutral[900],
  },
  eyeButton: {
    padding: Spacing.md,
  },
  hint: {
    fontSize: FontSizes.xs,
    color: Colors.neutral[500],
    marginTop: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral[200],
    marginVertical: Spacing.lg,
  },
  saveButton: {
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});
