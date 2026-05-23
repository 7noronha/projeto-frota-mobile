import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
} from '@/components/ui/form-control';
import { fetchApi, ErroApi } from '@/lib/api';
import { useNotificar } from '@/lib/notificar';
import type { CriarAbastecimento, ItemLookup, VeiculoResumo } from '@/tipos';

function rotuloCombustivel(nome: string): string {
  const map: Record<string, string> = {
    gasolina: 'Gasolina',
    etanol: 'Etanol',
    diesel: 'Diesel',
    gnv: 'GNV',
    flex: 'Flex',
  };
  return map[nome] ?? nome;
}

// Aceita vírgula (pt-BR) ou ponto
function paraNumero(v: string): number {
  return parseFloat(v.replace(',', '.'));
}

export default function TelaAbastecimento() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const notificar = useNotificar();

  const {
    data: veiculos,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['veiculos-meus'],
    queryFn: () => fetchApi<VeiculoResumo[]>('/veiculos/meus'),
  });

  const { data: combustiveis } = useQuery({
    queryKey: ['lookups', 'tipos_combustivel'],
    queryFn: () => fetchApi<ItemLookup[]>('/lookups/tipos_combustivel'),
    staleTime: 1000 * 60 * 60, // 1h
  });

  const [veiculoId, setVeiculoId] = useState<number | null>(null);
  const [litros, setLitros] = useState('');
  const [preco_litro, setPrecoLitro] = useState('');
  const [valor, setValor] = useState('');
  const [combustivel, setCombustivel] = useState<number | null>(null);
  const [odometro, setOdometro] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  // Seleciona automaticamente quando há só um veículo
  const veiculoSelecionado =
    veiculoId ?? (veiculos && veiculos.length === 1 ? veiculos[0].id : null);

  const totalCalculado = useMemo(() => {
    const l = paraNumero(litros);
    const p = paraNumero(preco_litro);
    if (!isNaN(l) && !isNaN(p) && l > 0 && p > 0) return (l * p).toFixed(2);
    return null;
  }, [litros, preco_litro]);

  const mutacao = useMutation({
    mutationFn: (corpo: CriarAbastecimento) =>
      fetchApi(`/veiculos/${veiculoSelecionado}/despesas`, {
        method: 'POST',
        body: JSON.stringify(corpo),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veiculos-meus'] });
      notificar.sucesso({
        titulo: 'Abastecimento registrado',
        descricao: 'A despesa foi lançada no veículo.',
      });
      router.back();
    },
    onError: (e) => {
      const msg = e instanceof ErroApi ? e.message : 'Erro ao registrar abastecimento';
      setErro(msg);
      notificar.erro({ titulo: 'Não foi possível registrar', descricao: msg });
    },
  });

  function handleSalvar() {
    if (!veiculoSelecionado) return setErro('Selecione o veículo');
    const l = paraNumero(litros);
    const p = paraNumero(preco_litro);
    const v = valor.trim() ? paraNumero(valor) : Number(totalCalculado);

    if (isNaN(l) || l <= 0) return setErro('Informe os litros (maior que zero)');
    if (isNaN(p) || p <= 0) return setErro('Informe o preço por litro (maior que zero)');
    if (!combustivel) return setErro('Selecione o tipo de combustível');
    if (isNaN(v) || v <= 0) return setErro('Informe o valor total (maior que zero)');

    const odo = odometro.trim() ? parseInt(odometro, 10) : undefined;
    if (odometro.trim() && (odo === undefined || isNaN(odo) || odo < 0)) {
      return setErro('Odômetro inválido');
    }

    setErro(null);
    mutacao.mutate({
      valor: Number(v.toFixed(2)),
      litros: l,
      preco_litro: p,
      tipo_combustivel_id: combustivel,
      odometro: odo,
      observacoes: observacoes.trim() || undefined,
    });
  }

  if (isLoading) {
    return (
      <Box style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <Spinner size="large" color="#0066FF" />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 24 }}>
        <Text style={{ color: '#DC2626', textAlign: 'center', marginBottom: 16 }}>
          Não foi possível carregar seus veículos.
        </Text>
        <Button onPress={() => refetch()} variant="outline" style={{ borderColor: '#0066FF', borderWidth: 1 }}>
          <ButtonText style={{ color: '#0066FF' }}>Tentar novamente</ButtonText>
        </Button>
      </Box>
    );
  }

  if (!veiculos || veiculos.length === 0) {
    return (
      <Box style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 24 }}>
        <Text style={{ color: '#0F172A', fontWeight: '600', marginBottom: 4, textAlign: 'center' }}>
          Nenhum veículo disponível
        </Text>
        <Text size="sm" style={{ color: '#64748B', textAlign: 'center' }}>
          Você só pode lançar abastecimento em veículos das suas viagens.
        </Text>
      </Box>
    );
  }

  return (
    // Dentro de Stack com header — não aplicar 'top' (já tratado pelo header).
    // 'bottom' protege contra a barra de navegação de 3 botões do Android.
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      edges={['bottom', 'left', 'right']}
    >
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <VStack style={{ gap: 16, paddingHorizontal: 16, paddingVertical: 16 }}>
        <Box>
          <Heading size="lg" style={{ color: '#0F172A' }}>
            Novo abastecimento
          </Heading>
          <Text style={{ color: '#94A3B8', marginTop: 4 }}>
            Selecione o veículo e preencha os dados.
          </Text>
        </Box>

        <FormControl>
          <FormControlLabel>
            <FormControlLabelText size="sm" style={{ color: '#334155' }}>
              Veículo
            </FormControlLabelText>
          </FormControlLabel>
          <VStack style={{ gap: 8 }}>
            {veiculos.map((v) => {
              const ativo = veiculoSelecionado === v.id;
              return (
                <Pressable
                  key={v.id}
                  onPress={() => {
                    setVeiculoId(v.id);
                    setErro(null);
                  }}
                  style={{
                    backgroundColor: ativo ? '#0066FF' : '#FFFFFF',
                    borderColor: ativo ? '#0066FF' : '#CBD5E1',
                    borderWidth: 1,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <Text style={{ color: ativo ? '#FFFFFF' : '#0F172A', fontWeight: '700' }}>
                    {v.placa}
                  </Text>
                  <Text size="xs" style={{ color: ativo ? '#DBEAFE' : '#64748B' }}>
                    {v.marca} {v.modelo}
                  </Text>
                </Pressable>
              );
            })}
          </VStack>
        </FormControl>

        <FormControl>
          <FormControlLabel>
            <FormControlLabelText size="sm" style={{ color: '#334155' }}>
              Litros
            </FormControlLabelText>
          </FormControlLabel>
          <Input variant="outline" style={{ backgroundColor: '#FFFFFF' }}>
            <InputField
              keyboardType="decimal-pad"
              value={litros}
              onChangeText={(t) => {
                setLitros(t);
                setErro(null);
              }}
              placeholder="Ex.: 42,137"
            />
          </Input>
        </FormControl>

        <FormControl>
          <FormControlLabel>
            <FormControlLabelText size="sm" style={{ color: '#334155' }}>
              Preço por litro (R$)
            </FormControlLabelText>
          </FormControlLabel>
          <Input variant="outline" style={{ backgroundColor: '#FFFFFF' }}>
            <InputField
              keyboardType="decimal-pad"
              value={preco_litro}
              onChangeText={(t) => {
                setPrecoLitro(t);
                setErro(null);
              }}
              placeholder="Ex.: 6,829"
            />
          </Input>
        </FormControl>

        <FormControl>
          <FormControlLabel>
            <FormControlLabelText size="sm" style={{ color: '#334155' }}>
              Valor total (R$)
            </FormControlLabelText>
          </FormControlLabel>
          <Input variant="outline" style={{ backgroundColor: '#FFFFFF' }}>
            <InputField
              keyboardType="decimal-pad"
              value={valor}
              onChangeText={(t) => {
                setValor(t);
                setErro(null);
              }}
              placeholder={totalCalculado ?? 'Ex.: 287,50'}
            />
          </Input>
          {totalCalculado && !valor.trim() ? (
            <Text size="xs" style={{ color: '#94A3B8', marginTop: 4 }}>
              Calculado: R$ {totalCalculado} (litros × preço)
            </Text>
          ) : null}
        </FormControl>

        <FormControl>
          <FormControlLabel>
            <FormControlLabelText size="sm" style={{ color: '#334155' }}>
              Combustível
            </FormControlLabelText>
          </FormControlLabel>
          <HStack style={{ gap: 8, flexWrap: 'wrap' }}>
            {(combustiveis ?? []).map((c) => {
              const ativo = combustivel === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    setCombustivel(c.id);
                    setErro(null);
                  }}
                  style={{
                    backgroundColor: ativo ? '#0066FF' : '#FFFFFF',
                    borderColor: ativo ? '#0066FF' : '#CBD5E1',
                    borderWidth: 1,
                    borderRadius: 9999,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    size="sm"
                    style={{ color: ativo ? '#FFFFFF' : '#334155', fontWeight: '600' }}
                  >
                    {rotuloCombustivel(c.nome)}
                  </Text>
                </Pressable>
              );
            })}
          </HStack>
        </FormControl>

        <FormControl>
          <FormControlLabel>
            <FormControlLabelText size="sm" style={{ color: '#334155' }}>
              Odômetro (km) — opcional
            </FormControlLabelText>
          </FormControlLabel>
          <Input variant="outline" style={{ backgroundColor: '#FFFFFF' }}>
            <InputField
              keyboardType="numeric"
              value={odometro}
              onChangeText={(t) => {
                setOdometro(t);
                setErro(null);
              }}
              placeholder="Ex.: 152340"
            />
          </Input>
        </FormControl>

        <FormControl isInvalid={!!erro}>
          <FormControlLabel>
            <FormControlLabelText size="sm" style={{ color: '#334155' }}>
              Observações — opcional
            </FormControlLabelText>
          </FormControlLabel>
          <Input variant="outline" style={{ backgroundColor: '#FFFFFF' }}>
            <InputField
              value={observacoes}
              onChangeText={setObservacoes}
              placeholder="Ex.: Posto BR, BR-153 km 12"
            />
          </Input>
          {erro && (
            <FormControlError>
              <FormControlErrorText>{erro}</FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>

        <Button
          onPress={handleSalvar}
          isDisabled={mutacao.isPending}
          style={{ backgroundColor: '#0066FF', borderRadius: 8 }}
        >
          {mutacao.isPending ? (
            <ButtonSpinner color="#FFFFFF" />
          ) : (
            <ButtonText style={{ color: '#FFFFFF', fontWeight: '600' }}>
              Salvar abastecimento
            </ButtonText>
          )}
        </Button>
      </VStack>
    </ScrollView>
    </SafeAreaView>
  );
}
