import React, { useEffect, useState } from 'react';
import { getSubjectsFromAPI } from '../api/api';
import { Schedule, Subject, SubjectSchedule } from '../types/types';
import { SubjectProvider, useSubject } from './../context/ScheduleContext';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import CalendarWeekView from './../components/CalendarWeekView';
import { getDatesWeek } from './../backend';
import moment from 'moment';
import './../styles/select_schedule.css';
import { useNavigate } from 'react-router-dom';

const AvailableSubjectsTable: React.FC = () => {
  const { addSubjectFirstWeek: addSubject, firstWeek: subjects } = useSubject();
  const [availableSubjects, setAvailableSubjects] = useState<SubjectSchedule[]>(
    []
  );
  const [openSubjectId, setOpenSubjectId] = useState(null);

  const toggleSubject = (subjectId) => {
    setOpenSubjectId(openSubjectId === subjectId ? null : subjectId);
  };

  useEffect(() => {
    const fetchAvailableSubjects = async () => {
      try {
        let subjectsWithSchedules = await getSubjectsFromAPI();
        subjectsWithSchedules.forEach(
          (subject) =>
            (subject.schedules = subject.schedules.sort((a, b) =>
              a.grupo_id < b.grupo_id ? -1 : 1
            ))
        );
        subjectsWithSchedules = subjectsWithSchedules.filter(s => s.schedules.length != 0);
        setAvailableSubjects(subjectsWithSchedules);
      } catch (error) {
        console.error('Error fetching available subjects:', error);
        // Handle errors appropriately
      }
    };

    fetchAvailableSubjects();
  }, []);

  const selectSchedule: (subject: Subject, schedule: Schedule) => void = (
    subject,
    schedule
  ) => {
    addSubject(subject, schedule);
  };

  return (
    <div>
      {availableSubjects.map((subject) => (
        <div key={subject.id} className="subject-container">
          <button
            className="subject-name"
            onClick={() => toggleSubject(subject.id)}
          >
            {subject.name}
          </button>
          {openSubjectId === subject.id && (
            <div className="schedule-container">
              {subject.schedules.map((schedule) => {
                const isSelected = subjects.find(
                  (s) =>
                    s.id === subject.id &&
                    s.schedules.has(schedule.grupo_id) &&
                    s.schedules.get(schedule.grupo_id).id === schedule.id
                );

                return (
                  <div
                    key={schedule.id}
                    className={'schedule' + (isSelected ? ' selected' : '')}
                    onClick={() => selectSchedule(subject, schedule)}
                  >
                    <div>Codigo: {subject.id}</div>
                    <div>Grupo: {schedule.grupo_id}</div>
                    <div>Dia: {schedule.dia}</div>
                    <div>Hora Inicio: {schedule.hora_inicio}</div>
                    <div>Hora Fin: {schedule.hora_fin}</div>
                    <div>Salon: {schedule.salon}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const AvailableSubjectsWeekCalendar: React.FC = () => {
  const { firstWeek } = useSubject();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const newEvents = [];
    firstWeek.forEach((subject) => {
      subject.schedules.forEach((schedule) => {
        newEvents.push({
          title: subject.name,
          day: schedule.dia,
          startHour: parseInt(schedule.hora_inicio.split(':')[0], 10),
          endHour: parseInt(schedule.hora_fin.split(':')[0], 10),
          description: 'Grupo ' + schedule.grupo_id,
        });
      });
    });

    setEvents(newEvents);
  }, [firstWeek]);

  return <CalendarWeekView events={events} />;
};

const SelectScheduleFirstWeek: React.FC = () => {
  const navigate = useNavigate();

  const goToAnotherPage = () => {
    navigate('/home/select/week2');
  };

  return (
    <>
      <h2> Estas son las materias disponibles: </h2>
      <AvailableSubjectsTable />
      <h2> El horario generado para la primera semana es </h2>
      <AvailableSubjectsWeekCalendar />
      <div className="button-wrapper">
        <button className="next-page" onClick={goToAnotherPage}>
          Siguiente semana
        </button>
      </div>
    </>
  );
};

export default SelectScheduleFirstWeek;
