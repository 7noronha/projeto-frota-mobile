import '@/global.css';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { ErroApi, registrarHandlerNaoAutenticado } from '@/lib/api';

// Push notifications só carregam fora do Expo Go (SDK 53+ removeu push lá).
// Import dinâmico evita o warning ruidoso da lib no Expo Go.
const ehExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!ehExpoGo) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  import('expo-notifications').then((Notifications) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, erro) => {
        // Não retentar 401 (sessão expirada — handler já redirecionou) nem 403
        if (erro instanceof ErroApi && (erro.status === 401 || erro.status === 403)) {
          return false;
        }
        return count < 1;
      },
      staleTime: 30_000,
    },
  },
});

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    registrarHandlerNaoAutenticado(() => {
      queryClient.clear();
      router.replace('/login');
    });
  }, [router]);

  // Deep-link no tap da notificação — leva pra tela da viagem.
  // Em Expo Go, pula (push não está disponível).
  useEffect(() => {
    if (ehExpoGo) return;
    let subscription: { remove: () => void } | undefined;
    (async () => {
      const Notifications = await import('expo-notifications');
      subscription = Notifications.addNotificationResponseReceivedListener((resposta) => {
        const dados = resposta.notification.request.content.data as
          | { tela?: string; viagemId?: string }
          | undefined;
        if (dados?.tela === 'viagem' && dados.viagemId) {
          router.push(`/(motorista)/viagens/${dados.viagemId}` as never);
        }
      });
    })();
    return () => subscription?.remove();
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GluestackUIProvider mode="light">
          <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="(motorista)" />
            </Stack>
            <StatusBar style="light" />
          </QueryClientProvider>
        </GluestackUIProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
