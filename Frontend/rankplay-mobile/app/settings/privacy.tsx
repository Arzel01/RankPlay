/**
 * PrivacySettingsScreen - Configuración de privacidad
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';

type PrivacyLevel = 'public' | 'friends' | 'friends_of_friends' | 'anonymous';

interface PrivacyOptionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}

function PrivacyOption({ icon, title, description, selected, onPress }: PrivacyOptionProps) {
  return (
    <TouchableOpacity
      style={[styles.option, selected && styles.optionSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.optionLeft}>
        <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
          <Ionicons
            name={icon}
            size={24}
            color={selected ? Colors.primary[600] : Colors.neutral[600]}
          />
        </View>
        <View style={styles.optionText}>
          <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
            {title}
          </Text>
          <Text style={styles.optionDescription}>{description}</Text>
        </View>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </TouchableOpacity>
  );
}

export default function PrivacySettingsScreen() {
  const [scorePrivacy, setScorePrivacy] = useState<PrivacyLevel>('public');
  const [profilePrivacy, setProfilePrivacy] = useState<PrivacyLevel>('public');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Aquí guardarías la configuración en el backend
      // await api.updatePrivacySettings({ scorePrivacy, profilePrivacy });
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      Alert.alert('Éxito', 'Configuración de privacidad actualizada', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar la configuración');
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
        <Text style={styles.title}>Privacidad</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibilidad de Puntajes</Text>
          <Text style={styles.sectionDescription}>
            Controla quién puede ver tus puntajes y posición en rankings
          </Text>

          <PrivacyOption
            icon="globe-outline"
            title="Público"
            description="Todos pueden ver tus puntajes"
            selected={scorePrivacy === 'public'}
            onPress={() => setScorePrivacy('public')}
          />

          <PrivacyOption
            icon="people-outline"
            title="Solo Amigos"
            description="Solo tus amigos pueden ver tus puntajes"
            selected={scorePrivacy === 'friends'}
            onPress={() => setScorePrivacy('friends')}
          />

          <PrivacyOption
            icon="people-circle-outline"
            title="Amigos de Amigos"
            description="Tus amigos y los amigos de ellos pueden verlos"
            selected={scorePrivacy === 'friends_of_friends'}
            onPress={() => setScorePrivacy('friends_of_friends')}
          />

          <PrivacyOption
            icon="eye-off-outline"
            title="Anónimo"
            description="Tus puntajes aparecen sin tu nombre"
            selected={scorePrivacy === 'anonymous'}
            onPress={() => setScorePrivacy('anonymous')}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibilidad de Perfil</Text>
          <Text style={styles.sectionDescription}>
            Controla quién puede ver tu perfil y estadísticas
          </Text>

          <PrivacyOption
            icon="globe-outline"
            title="Público"
            description="Cualquiera puede ver tu perfil"
            selected={profilePrivacy === 'public'}
            onPress={() => setProfilePrivacy('public')}
          />

          <PrivacyOption
            icon="people-outline"
            title="Solo Amigos"
            description="Solo tus amigos pueden ver tu perfil completo"
            selected={profilePrivacy === 'friends'}
            onPress={() => setProfilePrivacy('friends')}
          />

          <PrivacyOption
            icon="people-circle-outline"
            title="Amigos de Amigos"
            description="Visible para tu red extendida"
            selected={profilePrivacy === 'friends_of_friends'}
            onPress={() => setProfilePrivacy('friends_of_friends')}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Configuración</Text>
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
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.neutral[900],
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[600],
    marginBottom: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.neutral[200],
  },
  optionSelected: {
    borderColor: Colors.primary[600],
    backgroundColor: Colors.primary[50],
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionIconSelected: {
    backgroundColor: Colors.primary[100],
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  optionTitleSelected: {
    color: Colors.primary[700],
  },
  optionDescription: {
    fontSize: FontSizes.xs,
    color: Colors.neutral[600],
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary[600],
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary[600],
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
