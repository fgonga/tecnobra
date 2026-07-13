/*
 *  Copyright © 2021 - 2025
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
 *
 *   Bantu Internet Technologies, Lda.
 *   Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *   geral@bit.ao
 *   www.bit.ao
 */
import {Time} from "./time";
export function toData(date: string, format = "DD/MM/YYYY HH:mm"): string {
  return Time.parse(date).format(format);
}
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function startOfTheYear(date: Date = new Date()): string {
  return formatDate(new Date(date.getFullYear(), 0, 1))
}

export function endOfTheYear(date: Date = new Date()): string {
  return formatDate(new Date(date.getFullYear(), 11, 31))
}

export function startOfTheMonth(date: Date = new Date()): string {
  return formatDate(new Date(date.getFullYear(), date.getMonth(), 1))
}

export function endOfTheMonth(date: Date = new Date()): string {
  return formatDate(new Date(date.getFullYear(), date.getMonth() + 1, 0))
}

export function startOfTheWeek(date: Date = new Date()): string {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return formatDate(new Date(date.setDate(diff)))
}

export function endOfTheWeek(date: Date = new Date()): string {
  const start = new Date(startOfTheWeek(date))
  return formatDate(new Date(start.setDate(start.getDate() + 6)))
}

export function startOfTheDay(date: Date = new Date()): string {
  return formatDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()))
}

export function endOfTheDay(date: Date = new Date()): string {
  return formatDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()))
}

export function startOfDayISO(dateStr: string): string {
  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

export function endOfDayISO(dateStr: string): string {
  const date = new Date(dateStr)
  date.setHours(23, 59, 59, 999)
  return date.toISOString()
}

export function getMonthByString(data: string): string {
  const meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  const [mesStr] = data.split('/')
  const mesIndex = parseInt(mesStr, 10) - 1

  if (mesIndex < 0 || mesIndex > 11) {
    throw new Error('Mês inválido')
  }

  return meses[mesIndex]
}
