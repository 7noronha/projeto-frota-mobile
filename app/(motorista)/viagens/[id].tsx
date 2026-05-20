import { useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatarDataIso, formatarDataHoraIso } from '@/lib/datetime';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Divider } from '@/components/ui/divider';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
} from '@/components/ui/form-control';
import { fetchApi, ErroApi } from '@/lib/api';
import { useNotificar } from '@/lib/notificar';
import { DetalheViagemSkeleton } from '@/components/DetalheViagemSkeleton';
import { MapaAcompanhamento } from '@/components/MapaAcompanhamento';
import { InfoDistancia } from '@/components/InfoDistancia';
import { useLocalizacaoAtual } from '@/lib/useLocalizacaoAtual';
import type { ViagemDetalhada, StatusViagem } from '@/tipos';

const CONFIG_STATUS: Record<StatusViagem, { rotulo: string; cor: string; fundo: string }> = {
  CRIADA: { rotulo: 'Criada', cor: '#1D4ED8', fundo: '#DBEAFE' },
  EM_ANDAMENTO: { rotulo: 'Em andamento', cor: '#92400E', fundo: '#FEF3C7' },
  FINALIZADA: { rotulo: 'Finalizada', cor: '#065F46', fundo: '#D1FAE5' },
};

function CampoInfo({ rotulo, valor }: { rotulo: string; valor?: string | number | null }) {
  return (
    <Box>
      <Text
        size="xs"
        style={{ color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {rotulo}
      </Text>
      <Text size="sm" style={{ color: '#0F172A', fontWeight: '500', marginTop: 2 }}>
        {valor ?? '—'}
      </Text>
    </Box>
  );
}

function SecaoCard({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <Box
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
      }}
    >
      <Text
        size="sm"
        style={{
          fontWeight: '600',
          color: '#64748B',
          marginBottom: 12,
          textTransform: 'uppercase',
        }}
      >
        {titulo}
      </Text>
      {children}
    </Box>
  );
}

function FormIniciar({ id, odometroAtual }: { id: string; odometroAtual: number }) {
  const [odometro, setOdometro] = useState(String(odometroAtual));
  const [erro, setErro] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const notificar = useNotificar();

  const mutacao = useMutation({
    mutationFn: (odometroInicial: number) =>
      fetchApi(`/viagens/${id}/iniciar`, {
        method: 'PATCH',
        body: JSON.stringify({ odometroInicial }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['viagem', id] });
      queryClient.invalidateQueries({ queryKey: ['viagens'] });
      notificar.sucesso({
        titulo: 'Viagem iniciada',
        descricao: 'Boa viagem! Lembre-se de finalizar ao chegar.',
      });
    },
    onError: (e) => {
      const msg = e instanceof ErroApi ? e.message : 'Erro ao iniciar viagem';
      setErro(msg);
      notificar.erro({ titulo: 'Não foi possível iniciar', descricao: msg });
    },
  });

  function handleIniciar() {
    const valor = parseInt(odometro, 10);
    if (isNaN(valor) || valor < odometroAtual) {
      setErro(`Odômetro deve ser ≥ ${odometroAtual.toLocaleString('pt-BR')} km`);
      return;
    }
    setErro(null);
    mutacao.mutate(valor);
  }

  return (
    <Box
      style={{
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#BFDBFE',
      }}
    >
      <Text style={{ fontWeight: '600', color: '#1E40AF', marginBottom: 12 }}>
        Iniciar viagem
      </Text>
      <FormControl isInvalid={!!erro} style={{ marginBottom: 12 }}>
        <FormControlLabel>
          <FormControlLabelText size="sm" style={{ color: '#334155' }}>
            Odômetro inicial (km)
          </FormControlLabelText>
        </FormControlLabel>
        <Input variant="outline" style={{ backgroundColor: '#FFFFFF' }}>
          <InputField
            keyboardType="numeric"
            value={odometro}
            onChangeText={(v) => {
              setOdometro(v);
              setErro(null);
            }}
            placeholder={String(odometroAtual)}
          />
        </Input>
        <Text size="xs" style={{ color: '#94A3B8', marginTop: 4 }}>
          Odômetro atual do veículo: {odometroAtual.toLocaleString('pt-BR')} km
        </Text>
        {erro && (
          <FormControlError>
            <FormControlErrorText>{erro}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>
      <Button
        onPress={handleIniciar}
        isDisabled={mutacao.isPending}
        style={{ backgroundColor: '#0066FF', borderRadius: 8 }}
      >
        {mutacao.isPending ? (
          <ButtonSpinner color="#FFFFFF" />
        ) : (
          <ButtonText style={{ color: '#FFFFFF', fontWeight: '600' }}>
            Confirmar início
          </ButtonText>
        )}
      </Button>
    </Box>
  );
}

function FormFinalizar({ id, odometroInicial }: { id: string; odometroInicial: number }) {
  const [odometro, setOdometro] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const notificar = useNotificar();

  const mutacao = useMutation({
    mutationFn: (odometroFinal: number) =>
      fetchApi(`/viagens/${id}/finalizar`, {
        method: 'PATCH',
        body: JSON.stringify({ odometroFinal }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['viagem', id] });
      queryClient.invalidateQueries({ queryKey: ['viagens'] });
      notificar.sucesso({
        titulo: 'Viagem finalizada',
        descricao: 'Obrigado! Os dados foram registrados.',
      });
    },
    onError: (e) => {
      const msg = e instanceof ErroApi ? e.message : 'Erro ao finalizar viagem';
      setErro(msg);
      notificar.erro({ titulo: 'Não foi possível finalizar', descricao: msg });
    },
  });

  function handleFinalizar() {
    const valor = parseInt(odometro, 10);
    if (isNaN(valor) || valor <= odometroInicial) {
      setErro(`Odômetro deve ser > ${odometroInicial.toLocaleString('pt-BR')} km`);
      return;
    }
    setErro(null);
    mutacao.mutate(valor);
  }

  return (
    <Box
      style={{
        backgroundColor: '#FFFBEB',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#FDE68A',
      }}
    >
      <Text style={{ fontWeight: '600', color: '#92400E', marginBottom: 12 }}>
        Finalizar viagem
      </Text>
      <FormControl isInvalid={!!erro} style={{ marginBottom: 12 }}>
        <FormControlLabel>
          <FormControlLabelText size="sm" style={{ color: '#334155' }}>
            Odômetro final (km)
          </FormControlLabelText>
        </FormControlLabel>
        <Input variant="outline" style={{ backgroundColor: '#FFFFFF' }}>
          <InputField
            keyboardType="numeric"
            value={odometro}
            onChangeText={(v) => {
              setOdometro(v);
              setErro(null);
            }}
            placeholder={String(odometroInicial + 1)}
          />
        </Input>
        <Text size="xs" style={{ color: '#94A3B8', marginTop: 4 }}>
          Odômetro na saída: {odometroInicial.toLocaleString('pt-BR')} km
        </Text>
        {erro && (
          <FormControlError>
            <FormControlErrorText>{erro}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>
      <Button
        onPress={handleFinalizar}
        isDisabled={mutacao.isPending}
        style={{ backgroundColor: '#059669', borderRadius: 8 }}
      >
        {mutacao.isPending ? (
          <ButtonSpinner color="#FFFFFF" />
        ) : (
          <ButtonText style={{ color: '#FFFFFF', fontWeight: '600' }}>
            Confirmar chegada
          </ButtonText>
        )}
      </Button>
    </Box>
  );
}

export default function TelaDetalheViagem() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { data: viagem, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['viagem', id],
    queryFn: () => fetchApi<ViagemDetalhada>(`/viagens/${id}`),
    enabled: !!id,
  });

  // GPS do motorista — só ativo quando a viagem está em andamento.
  // Em memória, nada persiste no servidor.
  const gpsAtivo = viagem?.status === 'EM_ANDAMENTO';
  const { coords: minhaPosicao, status: statusGps } = useLocalizacaoAtual({
    ativo: gpsAtivo,
  });

  if (isLoading) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: '#F8FAFC' }}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        <DetalheViagemSkeleton />
      </ScrollView>
    );
  }

  if (isError || !viagem) {
    return (
      <Box
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
          backgroundColor: '#F8FAFC',
          paddingBottom: insets.bottom,
        }}
      >
        <Text style={{ color: '#DC2626', textAlign: 'center', marginBottom: 16 }}>
          Não foi possível carregar a viagem.
        </Text>
        <Button
          onPress={() => refetch()}
          variant="outline"
          style={{ borderColor: '#0066FF' }}
        >
          <ButtonText style={{ color: '#0066FF' }}>Tentar novamente</ButtonText>
        </Button>
      </Box>
    );
  }

  const cfg = CONFIG_STATUS[viagem.status];
  const dataViagem = formatarDataIso(viagem.dataViagem);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      contentContainerStyle={{ paddingBottom: insets.bottom }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0066FF" />
      }
    >
      <VStack style={{ gap: 12, paddingHorizontal: 16, paddingVertical: 16 }}>
        {/* Status */}
        <HStack style={{ justifyContent: 'flex-end' }}>
          <Badge
            style={{
              backgroundColor: cfg.fundo,
              borderRadius: 9999,
              paddingHorizontal: 12,
              paddingVertical: 4,
            }}
          >
            <BadgeText size="sm" style={{ color: cfg.cor, fontWeight: '600' }}>
              {cfg.rotulo}
            </BadgeText>
          </Badge>
        </HStack>

        {/* Destino principal */}
        <Box>
          <Heading size="xl" numberOfLines={2} style={{ color: '#0F172A' }}>
            {viagem.destino}
          </Heading>
          <Text style={{ color: '#94A3B8', marginTop: 4 }}>
            {dataViagem} · {viagem.horaInicioPrevista} – {viagem.horaFimPrevista}
          </Text>
        </Box>

        <Divider />

        {/* Mapa de acompanhamento — só mostra se há coordenadas; GPS do
            motorista é ativado apenas em viagens EM_ANDAMENTO */}
        {(viagem.origemLatitude != null || viagem.destinoLatitude != null) && (
          <MapaAcompanhamento
            origemLatitude={viagem.origemLatitude}
            origemLongitude={viagem.origemLongitude}
            destinoLatitude={viagem.destinoLatitude}
            destinoLongitude={viagem.destinoLongitude}
            posicaoMotorista={
              minhaPosicao
                ? {
                    latitude: minhaPosicao.latitude,
                    longitude: minhaPosicao.longitude,
                    precisao: minhaPosicao.precisao,
                  }
                : null
            }
            statusGps={statusGps}
            mostrarAvisoGps={gpsAtivo}
          />
        )}

        {/* Distância até o destino + tempo decorrido da viagem em curso */}
        {gpsAtivo && (
          <InfoDistancia
            posicaoAtual={
              minhaPosicao
                ? { latitude: minhaPosicao.latitude, longitude: minhaPosicao.longitude }
                : null
            }
            destino={
              viagem.destinoLatitude != null && viagem.destinoLongitude != null
                ? { latitude: viagem.destinoLatitude, longitude: viagem.destinoLongitude }
                : null
            }
            inicioReal={viagem.dataHoraInicioReal}
          />
        )}

        {/* Informações gerais */}
        <SecaoCard titulo="Detalhes">
          <VStack style={{ gap: 12 }}>
            <HStack style={{ gap: 16 }}>
              <Box style={{ flex: 1 }}>
                <CampoInfo rotulo="Data" valor={dataViagem} />
              </Box>
              <Box style={{ flex: 1 }}>
                <CampoInfo
                  rotulo="Horário previsto"
                  valor={`${viagem.horaInicioPrevista} – ${viagem.horaFimPrevista}`}
                />
              </Box>
            </HStack>
            <CampoInfo rotulo="Origem" valor={viagem.origem} />
            <CampoInfo rotulo="Solicitado por" valor={viagem.solicitadoPor} />
            <CampoInfo rotulo="Autorizado por" valor={viagem.autorizadoPor} />
            {viagem.observacoes && (
              <CampoInfo rotulo="Observações" valor={viagem.observacoes} />
            )}
          </VStack>
        </SecaoCard>

        {/* Veículo */}
        <SecaoCard titulo="Veículo">
          <HStack style={{ gap: 16 }}>
            <Box style={{ flex: 1 }}>
              <CampoInfo rotulo="Placa" valor={viagem.veiculo.placa} />
            </Box>
            <Box style={{ flex: 1 }}>
              <CampoInfo
                rotulo="Modelo"
                valor={`${viagem.veiculo.marca} ${viagem.veiculo.modelo}`}
              />
            </Box>
          </HStack>
        </SecaoCard>

        {/* Execução (quando iniciada) */}
        {viagem.status !== 'CRIADA' && (
          <SecaoCard titulo="Execução">
            <VStack style={{ gap: 12 }}>
              <HStack style={{ gap: 16 }}>
                <Box style={{ flex: 1 }}>
                  <CampoInfo
                    rotulo="Início real"
                    valor={
                      viagem.dataHoraInicioReal
                        ? formatarDataHoraIso(viagem.dataHoraInicioReal)
                        : undefined
                    }
                  />
                </Box>
                <Box style={{ flex: 1 }}>
                  <CampoInfo
                    rotulo="Fim real"
                    valor={
                      viagem.dataHoraFimReal
                        ? formatarDataHoraIso(viagem.dataHoraFimReal)
                        : undefined
                    }
                  />
                </Box>
              </HStack>
              <HStack style={{ gap: 16 }}>
                <Box style={{ flex: 1 }}>
                  <CampoInfo
                    rotulo="Odôm. inicial"
                    valor={
                      viagem.odometroInicial != null
                        ? `${viagem.odometroInicial.toLocaleString('pt-BR')} km`
                        : undefined
                    }
                  />
                </Box>
                <Box style={{ flex: 1 }}>
                  <CampoInfo
                    rotulo="Odôm. final"
                    valor={
                      viagem.odometroFinal != null
                        ? `${viagem.odometroFinal.toLocaleString('pt-BR')} km`
                        : undefined
                    }
                  />
                </Box>
              </HStack>
              {viagem.distanciaPercorrida != null && (
                <CampoInfo
                  rotulo="Distância percorrida"
                  valor={`${viagem.distanciaPercorrida.toLocaleString('pt-BR')} km`}
                />
              )}
            </VStack>
          </SecaoCard>
        )}

        {/* Ação contextual */}
        {viagem.status === 'CRIADA' && (
          <FormIniciar id={viagem.id} odometroAtual={viagem.veiculo.odometroAtual} />
        )}

        {viagem.status === 'EM_ANDAMENTO' && viagem.odometroInicial != null && (
          <FormFinalizar id={viagem.id} odometroInicial={viagem.odometroInicial} />
        )}
      </VStack>
    </ScrollView>
  );
}
