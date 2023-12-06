import { Schedule, Subject, SubjectSchedule } from '../types/types';
import materiasResponse from './../mocks/materias.json';
import horarioMateriaResponse from './../mocks/horario_materia.json';

interface MateriaResponse {
  materias: Subject[];
}

interface HorarioMateriaResponse {
  horarios: Schedule[];
}

export const getSubjectsFromAPI: () => Promise<SubjectSchedule[]> =
  async () => {
    //const { materias } = materiasResponse as MateriaResponse; //Comentar luego

    const materiasResponse = await fetch("http://localhost:3002/materias", {
      method: "GET"
    });
    const { materias } = await materiasResponse.json() as MateriaResponse;

    return mergeSubjectsWithSchedule(materias);
  };

const mergeSubjectsWithSchedule: (
  subjects: Subject[]
) => Promise<SubjectSchedule[]> = (subjects) => {
  const schedulePromises = subjects.map((subject) =>
    getAvailableSchedulesForSubject(subject.id).then((schedules) => {
      return {
        ...subject,
        schedules,
      };
    })
  );

  return Promise.all(schedulePromises);
};

export const getAvailableSchedulesForSubject: (
  subject_id: number
) => Promise<Schedule[]> = async(subject_id) => {
  //const { horarios } = horarioMateriaResponse as HorarioMateriaResponse;

  const horarioMateriaResponse = await fetch(`http://localhost:3002/horario/${subject_id}`, {
    method: "GET"
  });
  const { horarios } = await horarioMateriaResponse.json() as HorarioMateriaResponse;

  return Promise.resolve(horarios);
};

export const generatePdf = async (data) => {
  try {
    // Configurar la solicitud
    const response = await fetch('localhost/generate_pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Agregar otros headers necesarios, como tokens de autenticación si es necesario
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    // Obtener los datos de la respuesta como Blob
    const blob = await response.blob();

    // Crear un URL para el Blob
    const blobUrl = window.URL.createObjectURL(blob);

    // Crear un enlace temporario y forzar la descarga
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'horario.pdf'; // Nombre del archivo a descargar
    document.body.appendChild(link);
    link.click();

    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error al generar el PDF:', error);
  }
};
