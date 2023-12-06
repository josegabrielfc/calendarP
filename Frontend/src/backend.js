// Se importa la librería necesaria para trabajar con fechas
import { parseISO } from 'date-fns';
import moment from 'moment';
export const getDates = () => {
  return [
    {
      title: 'Evento 1',
      start: new Date(2023, 3, 10),
      end: new Date(2023, 3, 11),
    },
    {
      title: 'Evento 2',
      start: new Date(2023, 3, 12),
      end: new Date(2023, 3, 13),
    },
  ];
};

export const getDatesWeek = () => {
  return [
    { title: 'Reunión de equipo', day: 'Lunes', startHour: 9, endHour: 10 },
    {
      title: 'Revisión de proyecto',
      day: 'Martes',
      startHour: 11,
      endHour: 12,
    },
    // Más eventos
  ];
};
