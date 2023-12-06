import React from 'react';
import './../styles/calendar.css';

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

function convertHourToInterval(hour) {
  // Convertir la hora a un formato de 24 horas
  let start = hour.toString().padStart(2, '0') + ':00';
  let end = (hour + 1).toString().padStart(2, '0') + ':00';

  return `${start} - ${end}`;
}

const CalendarWeekView = ({ events }) => {
  const newEvents = processEvents(events);
  // Crear una cuadrícula para las horas y los días
  const renderGrid = () => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 6); // Ejemplo: de 8 a 20 horas
    return (
      <table>
        <thead>
          <tr>
            <th>Hora</th>
            {daysOfWeek.map((day) => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((hour) => (
            <tr key={hour}>
              <td>{convertHourToInterval(hour)}</td>
              {daysOfWeek.map((day) => (
                <td key={day} className="day">
                  {renderEvent(day, hour)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Función para renderizar un evento en una celda específica
  const renderEvent = (day, hour) => {
    const events = newEvents[day.toUpperCase()]
      ? newEvents[day.toUpperCase()][hour]
      : undefined;
    return events
      ? events.map((event) => (
          <div className="event" key={`${event.title}-${event.startHour}`}>
            {event.title}{' '}
            {event.description && <span> - {event.description}</span>}
          </div>
        ))
      : null;
  };

  return <div className="calendar-week-view">{renderGrid()}</div>;
};

const processEvents = (events) => {
  const mapper = {};

  events.forEach((event) => {
    if (!mapper[event.day]) mapper[event.day] = [];

    for (let i = event.startHour; i < event.endHour; i++) {
      mapper[event.day].push({
        title: event.title,
        day: event.day,
        description: event.description,
        startHour: i,
        endHour: i + 1,
      });
    }
  });

  const finalMapper = {};

  Object.entries(mapper).forEach((data) => {
    const [day, events] = data;

    events.forEach((event) => {
      if (!finalMapper[day]) finalMapper[event.day] = [];
      if (!finalMapper[day][event.startHour])
        finalMapper[day][event.startHour] = [];

      finalMapper[day.toUpperCase()][event.startHour].push(event);
    });
  });

  return finalMapper;
};

export default CalendarWeekView;
