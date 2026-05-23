// Tipos vendorizados (cópia da superfície usada de @fleetops/types).
// O app mobile é standalone (npm, fora do monorepo bun) — sem acoplamento
// com packages/*. Manter em sincronia com a API se o contrato mudar.
//
// Schema atual: snake_case + INT IDs (refactor 2026-05).

export interface ItemLookup {
  id: number;
  nome: string;
  descricao: string | null;
}

// Aliases para compat com código mobile (status/perfil/tipo_combustivel
// agora são lookups — usar .nome para comparações).
export type StatusViagem = 'CRIADA' | 'EM_ANDAMENTO' | 'FINALIZADA';
export type Perfil = 'admin' | 'gerente' | 'encarregado' | 'operador' | 'motorista';
export type TipoCombustivel = 'gasolina' | 'etanol' | 'diesel' | 'gnv' | 'flex';

export interface RespostaLogin {
  token: string;
  usuario: {
    id: number;
    matricula: string;
    nome: string;
    perfil: string; // nome do perfil ("motorista", "admin", etc.)
  };
}

export interface RespostaPaginada<T> {
  dados: T[];
  total: number;
  pagina: number;
  tamanho_pagina: number;
  total_paginas: number;
}

export interface UsuarioResposta {
  id: number;
  matricula: string;
  nome: string;
  perfil_id: number;
  perfil: ItemLookup;
  email: string | null;
  telefone: string | null;
  cnh: string | null;
  cnh_validade: string | null;
  ativo: boolean;
  data_hora_criacao: string;
}

export interface ViagemResposta {
  id: number;
  origem: string;
  destino: string;
  origem_latitude: number | null;
  origem_longitude: number | null;
  destino_latitude: number | null;
  destino_longitude: number | null;
  rota_geometria: unknown | null;
  rota_distancia_km: number | null;
  rota_duracao_min: number | null;
  velocidade_media_km_h: number | null;
  data_viagem: string;
  hora_inicio_prevista: string;
  hora_fim_prevista: string;
  data_hora_inicio_real: string | null;
  data_hora_fim_real: string | null;
  odometro_inicial: number | null;
  odometro_final: number | null;
  distancia_percorrida: number | null;
  motorista_id: number;
  veiculo_id: number;
  operador_criador_id: number;
  solicitado_por: string;
  autorizado_por: string;
  observacoes: string | null;
  status_id: number;
  data_hora_criacao: string;
}

export interface ViagemDetalhada extends ViagemResposta {
  motorista: {
    id: number;
    nome: string;
    matricula: string;
  };
  veiculo: {
    id: number;
    placa: string;
    marca: string;
    modelo: string;
    odometro_atual: number;
  };
  status: ItemLookup;
}

export interface CriarAbastecimento {
  tipo_combustivel_id: number;
  valor: number;
  litros: number;
  preco_litro: number;
  odometro?: number;
  data?: string;
  descricao?: string;
  observacoes?: string;
}

export interface VeiculoResumo {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
}

export interface AbastecimentoResposta {
  id: number;
  veiculo_id: number;
  tipo_combustivel_id: number;
  tipo_combustivel: ItemLookup;
  data: string;
  valor: number;
  litros: number;
  preco_litro: number;
  odometro: number | null;
  descricao: string;
  observacoes: string | null;
  data_hora_criacao: string;
}
