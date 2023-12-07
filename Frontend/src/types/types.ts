// Types.ts
export interface Schedule {
  id: number;
  materia_id: number;
  grupo_id: string;
  dia: string;
  hora_inicio: Date;
  hora_fin: Date;
  salon: string;
}

export interface Subject {
  id: number;
  name: string;
}

export interface SubjectSchedule {
  id: number;
  name: string;
  schedules: Schedule[];
}

export interface SubjectSelectedSchedule {
  id: number;
  name: string;
  schedules: Map<string, Schedule>;
}
