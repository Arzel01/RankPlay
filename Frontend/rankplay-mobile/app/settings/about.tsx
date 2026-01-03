/**
 * AboutScreen - Información de la aplicación
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface InfoItemProps {
  label: string;
  value: string;
}

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

interface LinkItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  url: string;
}

function LinkItem({ icon, title, url }: LinkItemProps) {
  return (
    <TouchableOpacity
      style={styles.linkItem}
      onPress={() => Linking.openURL(url)}
      activeOpacity={0.7}
    >
      <View style={styles.linkIcon}>
        <Ionicons name={icon} size={20} color={Colors.primary[600]} />
      </View>
      <Text style={styles.linkTitle}>{title}</Text>
      <Ionicons name="open-outline" size={18} color={Colors.neutral[400]} />
    </TouchableOpacity>
  );
}

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.neutral[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Acerca de</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="game-controller" size={48} color={Colors.primary[600]} />
          </View>
          <Text style={styles.appName}>RankPlay</Text>
          <Text style={styles.tagline}>Juega, Compite, Domina</Text>
        </View>

        <View style={styles.section}>
          <InfoItem label="Versión" value="1.0.0" />
          <InfoItem label="Build" value="2026.01.02" />
          <InfoItem label="Plataforma" value="React Native / Expo" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enlaces</Text>
          <LinkItem
            icon="globe-outline"
            title="Sitio Web"
            url="https://rankplay.com"
          />
          <LinkItem
            icon="document-text-outline"
            title="Términos de Servicio"
            url="https://rankplay.com/terms"
          />
          <LinkItem
            icon="shield-checkmark-outline"
            title="Política de Privacidad"
            url="https://rankplay.com/privacy"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Redes Sociales</Text>
          <LinkItem
            icon="logo-twitter"
            title="Twitter"
            url="https://twitter.com/rankplay"
          />
          <LinkItem
            icon="logo-instagram"
            title="Instagram"
            url="https://instagram.com/rankplay"
          />
          <LinkItem
            icon="logo-discord"
            title="Discord"
            url="https://discord.gg/rankplay"
          />
        </View>

        <Text style={styles.copyright}>
          © 2026 RankPlay. Todos los derechos reservados.
        </Text>
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
  logoContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  appName: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.neutral[900],
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: FontSizes.md,
    color: Colors.neutral[600],
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.neutral[600],
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  infoLabel: {
    fontSize: FontSizes.md,
    color: Colors.neutral[600],
  },
  infoValue: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.neutral[900],
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  linkIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  linkTitle: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.neutral[900],
  },
  copyright: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
