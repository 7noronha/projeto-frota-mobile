import { useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { formatarDataIso } from '@/lib/datetime';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Badge, BadgeText } from '@/components/ui/badge';
import { fetchApi } from '@/lib/api';
import { ListaViagensSkeleton } from '@/components/ListaViagensSkeleton';
import { BannerCnhVencendo } from '@/components/BannerCnhVencendo';
import type { RespostaPaginada, ViagemDetalhada, StatusViagem } from '@/tipos';

const CONFIG_STATUS: Record<StatusViagem, { rotulo: string; cor: string; fundo: string }> = {
  CRIADA: { rotulo: 'Criada', cor: '#1D4ED8', fundo: '#DBEAFE' },
  EM_ANDAMENTO: { rotulo: 'Em andamento', cor: '#92400E', fundo: '#FEF3C7' },
  FINALIZADA: { rotulo: 'Finalizada', cor: '#065F46', fundo: '#D1FAE5' },
};

function BadgeStatus({ status }: { status: StatusViagem }) {
  const cfg = CONFIG_STATUS[status];
  return (
    <Badge
      style={{
        backgroundColor: cfg.fundo,
        borderRadius: 9999,
        paddingHorizontal: 12,
        paddingVertical: 4,
      }}
    >
      <BadgeText size="sm" style={{ color: cfg.cor, fontWeight: '600', fontSize: 11 }}>
        {cfg.rotulo}
      </BadgeText>
    </Badge>
  );
}

function CartaoViagem({ viagem }: { viagem: ViagemDetalhada }) {
  const router = useRouter();
  const data = formatarDataIso(viagem.data_viagem);

  return (
    <Pressable
      className="active:opacity-70"
      onPress={() => router.push(`/(motorista)/viagens/${viagem.id}`)}
    >
      <Box
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        <HStack
          style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}
        >
          <Text
            numberOfLines={1}
            style={{ fontWeight: '600', color: '#0F172A', flex: 1, marginRight: 8 }}
          >
            {viagem.destino}
          </Text>
          <BadgeStatus status={viagem.status.nome as StatusViagem} />
        </HStack>

        <HStack style={{ gap: 12, marginTop: 4 }}>
          <Text size="sm" style={{ color: '#64748B' }}>
            {data}
          </Text>
          <Text size="sm" style={{ color: '#64748B' }}>
            {viagem.hora_inicio_prevista} – {viagem.hora_fim_prevista}
          </Text>
        </HStack>

        {viagem.distancia_percorrida != null && (
          <Text size="sm" style={{ color: '#64748B', marginTop: 4 }}>
            {viagem.distancia_percorrida.toLocaleString('pt-BR')} km percorridos
          </Text>
        )}
      </Box>
    </Pressable>
  );
}

const FILTROS_STATUS = [
  { valor: undefined, rotulo: 'Todas' },
  { valor: 'CRIADA' as StatusViagem, rotulo: 'Criadas' },
  { valor: 'EM_ANDAMENTO' as StatusViagem, rotulo: 'Em andamento' },
  { valor: 'FINALIZADA' as StatusViagem, rotulo: 'Finalizadas' },
];

export default function TelaViagens() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filtroStatus, setFiltroStatus] = useState<StatusViagem | undefined>();

  const params = new URLSearchParams({ tamanho_pagina: '50' });
  if (filtroStatus) params.set('status', filtroStatus);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['viagens', filtroStatus],
    queryFn: () => fetchApi<RespostaPaginada<ViagemDetalhada>>(`/viagens?${params}`),
  });

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      edges={['bottom', 'left', 'right']}
    >
      {/* Filtros de status */}
      <Box
        style={{
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        >
          {FILTROS_STATUS.map((f) => {
            const ativo = filtroStatus === f.valor;
            return (
              <Pressable
                key={f.rotulo}
                className="active:opacity-80"
                onPress={() => setFiltroStatus(f.valor)}
                style={{
                  backgroundColor: ativo ? '#0066FF' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: ativo ? '#0066FF' : '#E2E8F0',
                  borderRadius: 9999,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                <Text
                  size="sm"
                  style={{ fontWeight: '500', color: ativo ? '#FFFFFF' : '#334155' }}
                >
                  {f.rotulo}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Box>

      {/* Banner de CNH vencendo (se aplicável) */}
      <BannerCnhVencendo />

      {/* Lista */}
      {isLoading ? (
        <ListaViagensSkeleton quantidade={5} />
      ) : isError ? (
        <Box
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ color: '#DC2626', textAlign: 'center', marginBottom: 16 }}>
            Não foi possível carregar as viagens.
          </Text>
          <Pressable className="active:opacity-70" onPress={() => refetch()}>
            <Text style={{ color: '#0066FF', fontWeight: '600' }}>Tentar novamente</Text>
          </Pressable>
        </Box>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0066FF" />
          }
        >
          {data?.dados.length === 0 ? (
            <Box
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 64,
                paddingHorizontal: 24,
              }}
            >
              {/* Decoração visual: círculo com sub-círculo dentro (sem lib de ícones) */}
              <Box
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: '#E0F2FE',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Box
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#0EA5E9' }}
                />
              </Box>
              <Text
                size="md"
                style={{
                  color: '#0F172A',
                  fontWeight: '600',
                  textAlign: 'center',
                  marginBottom: 4,
                }}
              >
                {filtroStatus
                  ? `Nenhuma viagem ${
                      filtroStatus === 'CRIADA'
                        ? 'agendada'
                        : filtroStatus === 'EM_ANDAMENTO'
                          ? 'em andamento'
                          : 'finalizada'
                    }`
                  : 'Você ainda não tem viagens'}
              </Text>
              <Text size="sm" style={{ color: '#64748B', textAlign: 'center' }}>
                {filtroStatus
                  ? 'Troque o filtro para ver outras viagens.'
                  : 'Quando um operador agendar uma viagem para você, ela aparecerá aqui.'}
              </Text>
              {filtroStatus && (
                <Pressable
                  className="active:opacity-80"
                  onPress={() => setFiltroStatus(undefined)}
                  accessibilityRole="button"
                  accessibilityLabel="Mostrar todas as viagens"
                  style={{
                    marginTop: 20,
                    backgroundColor: '#0066FF',
                    borderRadius: 8,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                  }}
                >
                  <Text size="sm" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                    Mostrar todas
                  </Text>
                </Pressable>
              )}
            </Box>
          ) : (
            <VStack style={{ paddingBottom: 32 }}>
              {data?.dados.map((v) => <CartaoViagem key={v.id} viagem={v} />)}
            </VStack>
          )}
        </ScrollView>
      )}

      {/* FAB — lançar abastecimento (fora da viagem, por veículo) */}
      <Pressable
        onPress={() => router.push('/(motorista)/abastecimento')}
        className="active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel="Lançar abastecimento"
        style={{
          position: 'absolute',
          right: 20,
          bottom: insets.bottom + 24,
          backgroundColor: '#0066FF',
          borderRadius: 9999,
          paddingHorizontal: 20,
          paddingVertical: 14,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 5,
        }}
      >
        <Text size="sm" style={{ color: '#FFFFFF', fontWeight: '700' }}>
          + Abastecimento
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
