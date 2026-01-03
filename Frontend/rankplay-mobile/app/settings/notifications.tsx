/**
 * NotificationsSettingsScreen - Configuración de notificaciones
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

interface ToggleItemProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

function ToggleItem({ title, description, value, onValueChange }: ToggleItemProps) {
  return (
    <View style={styles.toggleItem}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.neutral[300], true: Colors.primary[400] }}
        thumbColor={value ? Colors.primary[600] : '#f4f3f4'}
      />
    </View>
  );
}

export default function NotificationsSettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [achievements, setAchievements] = useState(true);
  const [friendRequests, setFriendRequests] = useState(true);
  const [newScores, setNewScores] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.neutral[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Notificaciones</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <ToggleItem
            title="Notificaciones Push"
            description="Habilitar todas las notificaciones push"
            value={pushEnabled}
            onValueChange={setPushEnabled}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificarme sobre</Text>
          
          <ToggleItem
            title="Logros desbloqueados"
            description="Cuando consigas un nuevo logro"
            value={achievements}
            onValueChange={setAchievements}
          />

          <ToggleItem
            title="Solicitudes de amistad"
            description="Cuando alguien te envíe una solicitud"
            value={friendRequests}
            onValueChange={setFriendRequests}
          />

          <ToggleItem
            title="Nuevos puntajes"
            description="Cuando un amigo supere tu récord"
            value={newScores}
            onValueChange={setNewScores}
          />

          <ToggleItem
            title="Resumen semanal"
            description="Tu progreso y estadísticas semanales"
            value={weeklyReport}
            onValueChange={setWeeklyReport}
          />
        </View>
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
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.neutral[600],
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  toggleText: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleTitle: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[600],
  },
});
