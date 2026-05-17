import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { Spinner } from '@/components/ui/spinner';
import { buscarToken } from '@/lib/auth';

export default function TelaInicial() {
  const router = useRouter();

  useEffect(() => {
    buscarToken().then((token) => {
      if (token) {
        router.replace('/(motorista)');
      } else {
        router.replace('/login');
      }
    });
  }, [router]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#0A2540' }}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <Box style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="large" color="#00C2FF" />
      </Box>
    </SafeAreaView>
  );
}
