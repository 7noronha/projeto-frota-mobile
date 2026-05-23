import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type { UsuarioResposta } from '@/tipos';

const DIAS_ALERTA = 30;

interface ConfigBanner {
  fundo: string;
  borda: string;
  acento: string;
  textoTitulo: string;
  textoDescricao: string;
}

const CONFIG: Record<'vencida' | 'critico' | 'alerta', ConfigBanner> = {
  vencida: {
    fundo: '#FEE2E2',
    borda: '#FCA5A5',
    acento: '#B91C1C',
    textoTitulo: '#991B1B',
    textoDescricao: '#7F1D1D',
  },
  critico: {
    fundo: '#FFEDD5',
    borda: '#FDBA74',
    acento: '#C2410C',
    textoTitulo: '#9A3412',
    textoDescricao: '#7C2D12',
  },
  alerta: {
    fundo: '#FEF3C7',
    borda: '#FCD34D',
    acento: '#B45309',
    textoTitulo: '#92400E',
    textoDescricao: '#78350F',
  },
};

function calcularDias(cnh_validade: string): number {
  const validade = new Date(cnh_validade + 'T00:00:00');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export function BannerCnhVencendo(): React.ReactElement | null {
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => fetchApi<UsuarioResposta>('/auth/me'),
    staleTime: 5 * 60_000,
  });

  if (!me?.cnh_validade) return null;

  const dias = calcularDias(me.cnh_validade);
  if (dias > DIAS_ALERTA) return null;

  const variante: keyof typeof CONFIG = dias < 0 ? 'vencida' : dias <= 7 ? 'critico' : 'alerta';
  const cfg = CONFIG[variante];

  const titulo =
    dias < 0
      ? `CNH vencida há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'dia' : 'dias'}`
      : dias === 0
        ? 'Sua CNH vence hoje'
        : `Sua CNH vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}`;

  const descricao =
    dias < 0
      ? 'Procure o RH para regularizar — você não poderá ser atribuído a novas viagens.'
      : 'Procure o RH para renovar antes do vencimento.';

  return (
    <Box
      style={{
        backgroundColor: cfg.fundo,
        borderColor: cfg.borda,
        borderWidth: 1,
        borderLeftWidth: 4,
        borderLeftColor: cfg.acento,
        borderRadius: 8,
        padding: 12,
        marginHorizontal: 16,
        marginTop: 12,
      }}
    >
      <HStack style={{ gap: 8, alignItems: 'flex-start' }}>
        {/* Decoração: pequeno círculo colorido como ícone */}
        <Box
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: cfg.acento,
            marginTop: 2,
            flexShrink: 0,
          }}
        />
        <VStack style={{ flex: 1 }}>
          <Text size="sm" style={{ fontWeight: '600', color: cfg.textoTitulo }}>
            {titulo}
          </Text>
          <Text size="xs" style={{ marginTop: 4, color: cfg.textoDescricao }}>
            {descricao}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
}
