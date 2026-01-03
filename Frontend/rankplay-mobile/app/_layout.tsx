import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Tema personalizado con colores de RankPlay
const RankPlayLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary[600],
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.neutral[900],
    border: Colors.neutral[200],
  },
};

const RankPlayDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.primary[500],
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.neutral[50],
    border: Colors.neutral[700],
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? RankPlayDarkTheme : RankPlayLightTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="auth/login"
            options={{
              headerShown: true,
              headerTitle: 'Iniciar Sesion',
              headerBackTitle: 'Atras',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="auth/register"
            options={{
              headerShown: true,
              headerTitle: 'Crear Cuenta',
              headerBackTitle: 'Atras',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="game/[id]"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="user/[id]"
            options={{
              headerShown: true,
              headerBackTitle: 'Atras',
            }}
          />
          <Stack.Screen
            name="achievements"
            options={{
              headerShown: true,
              headerTitle: 'Logros',
              headerBackTitle: 'Atras',
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
