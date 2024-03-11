import { dayKey } from '../../utils/dates.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarGrid({ weeks, eventsByDay, today, selected, onDaySelect }) {
  const todayKey = dayKey(today);

  return (
    <div className="calendar" role="grid">
      <div className="calendar-head" role="row">
        {WEEKDAYS.map((day) => (
          <div key={day} role="columnheader">
            {day}
          </div>
        ))}
      </div>
      {weeks.map((week) => (
        <div key={week[0].getTime()} className="calendar-week" role="row">
          {week.map((date) => {
            const key = dayKey(date);
            const events = eventsByDay.get(key) || [];
            const inMonth = date.getMonth() === today.getMonth();
            return (
              <button
                type="button"
                key={key}
                role="gridcell"
                className={[
                  'calendar-day',
                  inMonth ? '' : 'calendar-day-out',
                  key === todayKey ? 'calendar-day-today' : '',
                  key === selected ? 'calendar-day-selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onDaySelect(date)}
              >
                <span className="day-number">{date.getDate()}</span>
                <span className="day-events">
                  {events.slice(0, 3).map((event) => (
                    <span key={event._id} className={`day-event type-${event.type}`}>
                      {event.title}
                    </span>
                  ))}
                  {events.length > 3 && <span className="day-more">+{events.length - 3} more</span>}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
