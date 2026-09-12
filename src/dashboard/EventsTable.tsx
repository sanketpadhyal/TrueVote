import React, { useState } from 'react';
import { EventItem } from './types';

const INITIAL_EVENTS: EventItem[] = [
  {
    id: '1',
    name: 'XI Meeting of the Community Krakow - Podgórze',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '01 mar 2021 10:00',
    endDate: '03 mar 2021 20:00',
  },
  {
    id: '2',
    name: 'Voting for the mayor of Chrzanów',
    votingNumber: 'Voting no 1',
    activationType: 'manual',
    isActivated: false,
  },
  {
    id: '3',
    name: 'Election of the president of PLEO sp.z o.o.',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '05 apr 2021 10:00',
    endDate: '09 apr 2021 20:00',
  },
  {
    id: '4',
    name: "Voting for the chairman of the designers' association",
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '11 jun 2021 10:00',
    endDate: '15 jun 2021 20:00',
  },
  {
    id: '5',
    name: 'XI Posiedzenie Wspólnoty Kraków - Podgórze',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '20 aug 2021 10:00',
    endDate: '28 aug 2021 20:00',
  },
];

export const EventsTable: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);

  const toggleActivation = (id: string) => {
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === id ? { ...ev, isActivated: !ev.isActivated } : ev
      )
    );
  };

  return (
    <div className="dashboard-table-container">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th className="th-event">event</th>
            <th className="th-voting">voting</th>
            <th className="th-activation">activation</th>
            <th className="th-dates" colSpan={2}>
              activation date
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, idx) => {
            const isAlt = idx % 2 === 1;
            return (
              <tr key={event.id} className={`table-row ${isAlt ? 'row-alt' : ''}`}>
                <td className="td-event">{event.name}</td>
                <td className="td-voting">{event.votingNumber}</td>
                <td className="td-activation">{event.activationType}</td>
                {event.activationType === 'manual' ? (
                  <td className="td-action" colSpan={2}>
                    <button
                      type="button"
                      className={`btn-activate ${event.isActivated ? 'is-active' : ''}`}
                      onClick={() => toggleActivation(event.id)}
                    >
                      <span>{event.isActivated ? 'active' : 'activate'}</span>
                      <svg
                        className="power-icon"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                        <line x1="12" y1="2" x2="12" y2="12" />
                      </svg>
                    </button>
                  </td>
                ) : (
                  <>
                    <td className="td-start-date">{event.startDate}</td>
                    <td className="td-end-date">{event.endDate}</td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EventsTable;
