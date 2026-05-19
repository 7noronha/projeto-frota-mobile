// Tipos vendorizados (cópia da superfície usada de @fleetops/types).
// O app mobile é standalone (npm, fora do monorepo bun) — sem acoplamento
// com packages/*. Manter em sincronia com a API se o contrato mudar.

export type Perfil = 'admin' | 'gerente' | 'encarregado' | 'operador' | 'motorista';

export type StatusViagem = 'CRIADA' | 'EM_ANDAMENTO' | 'FINALIZADA';

export interface RespostaLogin {
  token: string;
  usuario: {
    id: string;
    matricula: string;
    nome: string;
    perfil: Perfil;
  };
}

export interface RespostaPaginada<T> {
  dados: T[];
  total: number;
  pagina: number;
  tamanhoPagina: number;
  totalPaginas: number;
}

export interface UsuarioResposta {
  id: string;
  matricula: string;
  nome: string;
  perfil: Perfil;
  email: string | null;
  telefone: string | null;
  cnh: string | null;
  cnhValidade: string | null;
  ativo: boolean;
  dataCriacao: string;
}

export interface ViagemResposta {
  id: string;
  origem: string;
  destino: string;
  dataViagem: string;
  horaInicioPrevista: string;
  horaFimPrevista: string;
  dataHoraInicioReal: string | null;
  dataHoraFimReal: string | null;
  odometroInicial: number | null;
  odometroFinal: number | null;
  distanciaPercorrida: number | null;
  motoristaId: string;
  veiculoId: string;
  operadorCriadorId: string;
  solicitadoPor: string;
  autorizadoPor: string;
  observacoes: string | null;
  status: StatusViagem;
  dataCriacao: string;
}

export interface ViagemDetalhada extends ViagemResposta {
  motorista: {
    id: string;
    nome: string;
    matricula: string;
  };
  veiculo: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    odometroAtual: number;
  };
}

export type TipoCombustivel = 'gasolina' | 'etanol' | 'diesel' | 'gnv' | 'flex';

export interface CriarAbastecimento {
  valor: number;
  litros: number;
  precoLitro: number;
  tipoCombustivel: TipoCombustivel;
  odometro?: number;
  data?: string;
  descricao?: string;
  observacoes?: string;
}

export interface AbastecimentoResposta {
  id: string;
  veiculoId: string;
  tipo: string;
  data: string;
  valor: number;
  litros: number;
  precoLitro: number;
  tipoCombustivel: string;
  odometro: number | null;
  descricao: string;
  dataCriacao: string;
}
