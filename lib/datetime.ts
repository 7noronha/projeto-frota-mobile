// Funções de data vendorizadas (cópia da superfície usada de
// @fleetops/utils). App mobile standalone — sem acoplamento com packages/*.
import { parseISO, format as formatarData } from 'date-fns';

/**
 * Formata uma data-calendário ISO (`yyyy-MM-dd`) para exibição `dd/MM/yyyy`.
 */
export function formatarDataIso(dataIso: string): string {
  return formatarData(parseISO(dataIso), 'dd/MM/yyyy');
}

/**
 * Formata um timestamp ISO para exibição `dd/MM/yyyy HH:mm`.
 */
export function formatarDataHoraIso(dataHoraIso: string): string {
  return formatarData(parseISO(dataHoraIso), 'dd/MM/yyyy HH:mm');
}
