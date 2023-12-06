import { FC, forwardRef, useRef, useState, useEffect } from 'react';

import './../style.css';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import { getDates } from './../backend';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useSubject } from '../context/ScheduleContext';
import CalendarWeekView from '../components/CalendarWeekView';
import { generatePdf } from '../api/api';

const AvailableSubjectsWeekCalendar: React.FC = ({ subjects }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const newEvents = [];
    subjects.forEach((subject) => {
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
  }, [subjects]);

  return <CalendarWeekView events={events} />;
};

const ViewSchedule: FC<{ name: string }> = ({ name }) => {
  const calendarRef = useRef();
  const { firstWeek, secondWeek } = useSubject();

  const printDocument = () => {
    //generatePdf(null);
     const doc = new jsPDF({ format: [2 * 800, 2 * 800] });

     doc.html(calendarRef.current, {
       callback: function (pdf) {
         pdf.save('document.pdf');
       },
     });
  };

  return (
    <>
      <div ref={calendarRef}>
        <h2> Horarios establecidad para la primera semana </h2>
        <AvailableSubjectsWeekCalendar subjects={firstWeek} />
        <h2> Horarios establecidad para la segunda semana </h2>
        <AvailableSubjectsWeekCalendar subjects={secondWeek} />
      </div>

      <button className="next-page" onClick={printDocument}>
        Generar PDF
      </button>
      <div className="button-wrapper"></div>
    </>
  );
};

export default ViewSchedule;

const localizer = momentLocalizer(moment);

const MyCalendar = forwardRef((props, ref) => (
  <div>
    <Calendar
      ref={ref}
      localizer={localizer}
      events={props.myDates}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 500 }}
    />
  </div>
));
