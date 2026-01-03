/**
 * HelpSupportScreen - Preguntas frecuentes y soporte
 */
import React, { useState } from 'react';
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

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={() => setIsExpanded(!isExpanded)}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.neutral[600]}
        />
      </View>
      {isExpanded && <Text style={styles.faqAnswer}>{answer}</Text>}
    </TouchableOpacity>
  );
}

interface ContactOptionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}

function ContactOption({ icon, title, description, onPress }: ContactOptionProps) {
  return (
    <TouchableOpacity style={styles.contactOption} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.contactIcon}>
        <Ionicons name={icon} size={24} color={Colors.primary[600]} />
      </View>
      <View style={styles.contactText}>
        <Text style={styles.contactTitle}>{title}</Text>
        <Text style={styles.contactDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.neutral[400]} />
    </TouchableOpacity>
  );
}

export default function HelpSupportScreen() {
  const faqs: FAQItemProps[] = [
    {
      question: '¿Cómo puedo ganar más XP?',
      answer: 'Puedes ganar XP jugando juegos, completando logros y compitiendo en rankings. Cada juego otorga una cantidad diferente de XP según su dificultad.',
    },
    {
      question: '¿Cómo funciona el sistema de rankings?',
      answer: 'Los rankings se actualizan en tiempo real basándose en tus mejores puntajes. Hay rankings globales, de amigos y semanales para cada juego.',
    },
    {
      question: '¿Puedo jugar sin conexión?',
      answer: 'Algunos juegos están disponibles sin conexión, pero necesitas internet para guardar tus puntajes y ver rankings actualizados.',
    },
    {
      question: '¿Cómo agrego amigos?',
      answer: 'Ve a la sección de Amigos, busca por nombre de usuario y envía una solicitud. También puedes aceptar solicitudes de otros jugadores.',
    },
    {
      question: '¿Qué son los logros?',
      answer: 'Los logros son recompensas especiales que obtienes al completar desafíos específicos. Algunos otorgan XP extra, avatares o títulos especiales.',
    },
    {
      question: '¿Cómo cambio mi contraseña?',
      answer: 'Ve a Perfil > Editar Perfil. Necesitarás tu contraseña actual para confirmar cualquier cambio por seguridad.',
    },
    {
      question: '¿Mis datos están seguros?',
      answer: 'Sí, usamos encriptación y seguimos las mejores prácticas de seguridad. Puedes controlar tu privacidad en Configuración > Privacidad.',
    },
    {
      question: '¿Puedo eliminar mi cuenta?',
      answer: 'Sí, puedes solicitar la eliminación de tu cuenta contactando a soporte. Ten en cuenta que esta acción es permanente.',
    },
  ];

  const handleEmail = () => {
    Linking.openURL('mailto:soporte@rankplay.com');
  };

  const handleTwitter = () => {
    Linking.openURL('https://twitter.com/rankplay');
  };

  const handleDiscord = () => {
    Linking.openURL('https://discord.gg/rankplay');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.neutral[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Ayuda y Soporte</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
          <View style={styles.faqContainer}>
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Necesitas más ayuda?</Text>
          <Text style={styles.sectionDescription}>
            Nuestro equipo está aquí para ayudarte
          </Text>

          <ContactOption
            icon="mail-outline"
            title="Email"
            description="soporte@rankplay.com"
            onPress={handleEmail}
          />

          <ContactOption
            icon="logo-twitter"
            title="Twitter"
            description="@rankplay"
            onPress={handleTwitter}
          />

          <ContactOption
            icon="logo-discord"
            title="Discord"
            description="Únete a nuestra comunidad"
            onPress={handleDiscord}
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
  faqContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  faqItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.neutral[900],
    flex: 1,
    marginRight: Spacing.sm,
  },
  faqAnswer: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[600],
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  contactText: {
    flex: 1,
  },
  contactTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  contactDescription: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[600],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral[200],
    marginVertical: Spacing.lg,
  },
});
