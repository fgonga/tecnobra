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
 *
 *
 */

import dayjs, { Dayjs } from 'dayjs';
export type DateRange = {
  start: string;
  end: string;
};
export type TimeKeys = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';
export const Time = {
  parse(date: string | Date | Dayjs): Dayjs {
    return dayjs(date);
  },
  get(element: TimeKeys): DateRange {
    return this[element]();
  },
  today(): DateRange {
    const hoje = dayjs().format('YYYY-MM-DD');
    return {
      start: hoje,
      end: hoje,
    };
  },
  yesterday(): DateRange {
    const ontem = dayjs().subtract(1, 'day');
    return {
      start: ontem.format('YYYY-MM-DD'),
      end: ontem.format('YYYY-MM-DD'),
    };
  },
  week(): DateRange {
    const first = dayjs().day(1);
    const last = first.add(6, 'day');
    return {
      start: first.format('YYYY-MM-DD'),
      end: last.format('YYYY-MM-DD'),
    };
  },
  month(): DateRange {
    const first = dayjs().startOf('month');
    const last = dayjs().endOf('month');
    return {
      start: first.format('YYYY-MM-DD'),
      end: last.format('YYYY-MM-DD'),
    };
  },
  year(): DateRange {
    const first = dayjs().startOf('year');
    const last = dayjs().endOf('year');
    return {
      start: first.format('YYYY-MM-DD'),
      end: last.format('YYYY-MM-DD'),
    };
  },
  custom(): DateRange {
    return {
      start: null,
      end: null,
    };
  }
};
type DateTimeRange = {
  start: string; end: string;
};
type TimeLocalKeys = 'today' | 'yesterday' | 'week' | 'month' | 'year';

export const TimeLocal = {
  parse(date: string | Date | Dayjs): Dayjs {
    return dayjs(date);
  },
  get(element: TimeLocalKeys): DateTimeRange {
    return this[element]();
  },
  yesterday(): DateTimeRange {
    const ontem = dayjs().subtract(1, 'day');
    return {
      start: ontem.startOf('day').format('YYYY-MM-DDTHH:mm'),
      end: ontem.endOf('day').format('YYYY-MM-DDTHH:mm'),
    };
  },
  today(): DateTimeRange {
    const hoje = dayjs();
    return {
      start: hoje.startOf('day').format('YYYY-MM-DDTHH:mm'),
      end: hoje.endOf('day').format('YYYY-MM-DDTHH:mm'),
    };
  },
  week(): DateTimeRange {
    const first = dayjs().startOf('week');
    const last = dayjs().endOf('week');
    return {
      start: first.format('YYYY-MM-DDTHH:mm'),
      end: last.format('YYYY-MM-DDTHH:mm'),
    };
  },
  month(): DateTimeRange {
    const first = dayjs().startOf('month');
    const last = dayjs().endOf('month');
    return {
      start: first.format('YYYY-MM-DDTHH:mm'),
      end: last.format('YYYY-MM-DDTHH:mm'),
    };
  },
  year(): DateTimeRange {
    const first = dayjs().startOf('year');
    const last = dayjs().endOf('year');
    return {
      start: first.format('YYYY-MM-DDTHH:mm'),
      end: last.format('YYYY-MM-DDTHH:mm'),
    };
  },
};
