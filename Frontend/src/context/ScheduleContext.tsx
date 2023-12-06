// SubjectContext.tsx
import React, { createContext, useState, useContext } from 'react';
import {
  Subject,
  Schedule,
  SubjectSelectedSchedule,
} from './../types/types.ts';

interface SubjectContextType {
  firstWeek: Subject[];
  secondWeek: Subject[];
  addSubject: (subject: Subject, schedule: Schedule) => void;
}

const SubjectContext = createContext<SubjectContextType | undefined>(undefined);

export const SubjectProvider: React.FC = ({ children }) => {
  const [firstWeek, setFirstWeek] = useState<SubjectSelectedSchedule>([]);
  const [secondWeek, setSecondWeek] = useState<SubjectSelectedSchedule>([]);

  const addSubjectFirstWeek: (subject: Subject, schedule: Schedule) => void = (
    subject,
    schedule
  ) => {
    const updatedSubjects = firstWeek.map((s: SubjectSelectedSchedule) => {
      if (s.id === subject.id) {
        // Clonar el sujeto existente y actualizar su horario
        const updatedSubject = { ...s };
        updatedSubject.schedules.set(schedule.grupo_id, schedule);
        return updatedSubject;
      }
      return s;
    });

    // Verificar si el sujeto ya estaba en el estado
    const subjectExists = firstWeek.some((s) => s.id === subject.id);

    if (!subjectExists) {
      // Crear un nuevo sujeto con un Map para los horarios
      const newSubject: SubjectSelectedSchedule = {
        ...subject,
        schedules: new Map<string, Schedule>().set(schedule.grupo_id, schedule),
      };
      updatedSubjects.push(newSubject);
    }

    setFirstWeek(updatedSubjects);
  };

  const addSubjectSecondWeek: (subject: Subject, schedule: Schedule) => void = (
    subject,
    schedule
  ) => {
    const updatedSubjects = secondWeek.map((s: SubjectSelectedSchedule) => {
      if (s.id === subject.id) {
        // Clonar el sujeto existente y actualizar su horario
        const updatedSubject = { ...s };
        updatedSubject.schedules.set(schedule.grupo_id, schedule);
        return updatedSubject;
      }
      return s;
    });

    // Verificar si el sujeto ya estaba en el estado
    const subjectExists = secondWeek.some((s) => s.id === subject.id);

    if (!subjectExists) {
      // Crear un nuevo sujeto con un Map para los horarios
      const newSubject: SubjectSelectedSchedule = {
        ...subject,
        schedules: new Map<string, Schedule>().set(schedule.grupo_id, schedule),
      };
      updatedSubjects.push(newSubject);
    }

    setSecondWeek(updatedSubjects);
  };

  return (
    <SubjectContext.Provider
      value={{
        firstWeek,
        secondWeek,
        addSubjectFirstWeek,
        addSubjectSecondWeek,
      }}
    >
      {children}
    </SubjectContext.Provider>
  );
};

export const useSubject = () => {
  const context = useContext(SubjectContext);
  if (!context) {
    throw new Error('useSubject must be used within a SubjectProvider');
  }
  return context;
};
