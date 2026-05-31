import { useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { useEnderecoCoord } from '@/lib/useEnderecoCoord';
import { useEnviarPosicao } from '@/lib/useEnviarPosicao';
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

function FormIniciar({ id, odometro_atual }: { id: number; odometro_atual: number }) {
  const [odometro, setOdometro] = useState(String(odometro_atual));
  const [erro, setErro] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const notificar = useNotificar();

  const mutacao = useMutation({
    mutationFn: (odometro_inicial: number) =>
      fetchApi(`/viagens/${id}/iniciar`, {
        method: 'PATCH',
        body: JSON.stringify({ odometro_inicial }),
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
    if (isNaN(valor) || valor < odometro_atual) {
      setErro(`Odômetro deve ser ≥ ${odometro_atual.toLocaleString('pt-BR')} km`);
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
            placeholder={String(odometro_atual)}
          />
        </Input>
        <Text size="xs" style={{ color: '#94A3B8', marginTop: 4 }}>
          Odômetro atual do veículo: {odometro_atual.toLocaleString('pt-BR')} km
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

function FormFinalizar({ id, odometro_inicial }: { id: number; odometro_inicial: number }) {
  const [odometro, setOdometro] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const notificar = useNotificar();

  const mutacao = useMutation({
    mutationFn: (odometro_final: number) =>
      fetchApi(`/viagens/${id}/finalizar`, {
        method: 'PATCH',
        body: JSON.stringify({ odometro_final }),
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
    if (isNaN(valor) || valor <= odometro_inicial) {
      setErro(`Odômetro deve ser > ${odometro_inicial.toLocaleString('pt-BR')} km`);
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
            placeholder={String(odometro_inicial + 1)}
          />
        </Input>
        <Text size="xs" style={{ color: '#94A3B8', marginTop: 4 }}>
          Odômetro na saída: {odometro_inicial.toLocaleString('pt-BR')} km
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

  const { data: viagem, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['viagem', id],
    queryFn: () => fetchApi<ViagemDetalhada>(`/viagens/${id}`),
    enabled: !!id,
  });

  // GPS do motorista — só ativo quando a viagem está em andamento.
  // Em memória, nada persiste no servidor.
  const gpsAtivo = viagem?.status?.nome === 'EM_ANDAMENTO';
  const { coords: minhaPosicao, status: statusGps } = useLocalizacaoAtual({
    ativo: gpsAtivo,
  });

  // Envia a posição pra API a cada 3 min — operador acompanha em tempo real
  useEnviarPosicao({
    viagemId: gpsAtivo ? id : null,
    posicao: minhaPosicao,
    ativo: gpsAtivo,
  });

  // Coordenadas de origem/destino: usa as da API ou geocodifica o endereço.
  const origemCoord = useEnderecoCoord(
    viagem?.origem ?? null,
    viagem?.origem_latitude ?? null,
    viagem?.origem_longitude ?? null,
  );
  const destinoCoord = useEnderecoCoord(
    viagem?.destino ?? null,
    viagem?.destino_latitude ?? null,
    viagem?.destino_longitude ?? null,
  );

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#F8FAFC' }}
        edges={['bottom', 'left', 'right']}
      >
        <ScrollView style={{ flex: 1 }}>
          <DetalheViagemSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError || !viagem) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#F8FAFC' }}
        edges={['bottom', 'left', 'right']}
      >
      <Box
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
          backgroundColor: '#F8FAFC',
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
      </SafeAreaView>
    );
  }

  const cfg = CONFIG_STATUS[viagem.status.nome as StatusViagem];
  const data_viagem = formatarDataIso(viagem.data_viagem);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      edges={['bottom', 'left', 'right']}
    >
    <ScrollView
      style={{ flex: 1 }}
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
            {data_viagem} · {viagem.hora_inicio_prevista} – {viagem.hora_fim_prevista}
          </Text>
        </Box>

        <Divider />

        {/* Mapa de acompanhamento (Mapbox Static Images). Mostra sempre que há
            endereço — o app geocodifica caso a API não tenha as coordenadas.
            GPS do motorista é ativado apenas em viagens EM_ANDAMENTO. */}
        {(origemCoord || destinoCoord) && (
          <MapaAcompanhamento
            origemCoord={origemCoord}
            destinoCoord={destinoCoord}
            rota_geometria={viagem.rota_geometria}
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

        {/* Metricas da viagem — distância planejada (sempre), distância restante
            e tempo decorrido (só com GPS ativo + viagem iniciada) */}
        <InfoDistancia
          posicaoAtual={
            gpsAtivo && minhaPosicao
              ? { latitude: minhaPosicao.latitude, longitude: minhaPosicao.longitude }
              : null
          }
          origem={origemCoord}
          destino={destinoCoord}
          inicioReal={viagem.data_hora_inicio_real}
          rota_distancia_km={viagem.rota_distancia_km}
          velocidade_media_km_h={viagem.velocidade_media_km_h}
        />

        {/* Informações gerais */}
        <SecaoCard titulo="Detalhes">
          <VStack style={{ gap: 12 }}>
            <HStack style={{ gap: 16 }}>
              <Box style={{ flex: 1 }}>
                <CampoInfo rotulo="Data" valor={data_viagem} />
              </Box>
              <Box style={{ flex: 1 }}>
                <CampoInfo
                  rotulo="Horário previsto"
                  valor={`${viagem.hora_inicio_prevista} – ${viagem.hora_fim_prevista}`}
                />
              </Box>
            </HStack>
            <CampoInfo rotulo="Origem" valor={viagem.origem} />
            <CampoInfo rotulo="Solicitado por" valor={viagem.solicitado_por} />
            <CampoInfo rotulo="Autorizado por" valor={viagem.autorizado_por} />
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
        {viagem.status.nome !== 'CRIADA' && (
          <SecaoCard titulo="Execução">
            <VStack style={{ gap: 12 }}>
              <HStack style={{ gap: 16 }}>
                <Box style={{ flex: 1 }}>
                  <CampoInfo
                    rotulo="Início real"
                    valor={
                      viagem.data_hora_inicio_real
                        ? formatarDataHoraIso(viagem.data_hora_inicio_real)
                        : undefined
                    }
                  />
                </Box>
                <Box style={{ flex: 1 }}>
                  <CampoInfo
                    rotulo="Fim real"
                    valor={
                      viagem.data_hora_fim_real
                        ? formatarDataHoraIso(viagem.data_hora_fim_real)
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
                      viagem.odometro_inicial != null
                        ? `${viagem.odometro_inicial.toLocaleString('pt-BR')} km`
                        : undefined
                    }
                  />
                </Box>
                <Box style={{ flex: 1 }}>
                  <CampoInfo
                    rotulo="Odôm. final"
                    valor={
                      viagem.odometro_final != null
                        ? `${viagem.odometro_final.toLocaleString('pt-BR')} km`
                        : undefined
                    }
                  />
                </Box>
              </HStack>
              {viagem.distancia_percorrida != null && (
                <CampoInfo
                  rotulo="Distância percorrida"
                  valor={`${viagem.distancia_percorrida.toLocaleString('pt-BR')} km`}
                />
              )}
            </VStack>
          </SecaoCard>
        )}

        {/* Ação contextual */}
        {viagem.status.nome === 'CRIADA' && (
          <FormIniciar id={viagem.id} odometro_atual={viagem.veiculo.odometro_atual} />
        )}

        {viagem.status.nome === 'EM_ANDAMENTO' && viagem.odometro_inicial != null && (
          <FormFinalizar id={viagem.id} odometro_inicial={viagem.odometro_inicial} />
        )}
      </VStack>
    </ScrollView>
    </SafeAreaView>
  );
}
