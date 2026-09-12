import React, { useState } from 'react';
import { EventItem } from './types';

const INITIAL_EVENTS: EventItem[] = [
  {
    id: '1',
    name: 'XI Meeting of the Community Krakow - Podgórze',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '01 mar 2021',
    startTime: '10:00',
    endDate: '03 mar 2021',
    endTime: '20:00',
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
    startDate: '05 apr 2021',
    startTime: '10:00',
    endDate: '09 apr 2021',
    endTime: '20:00',
  },
  {
    id: '4',
    name: "Voting for the chairman of the designers' association",
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '11 jun 2021',
    startTime: '10:00',
    endDate: '15 jun 2021',
    endTime: '20:00',
  },
  {
    id: '5',
    name: 'XI Posiedzenie Wspólnoty Kraków - Podgórze',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '20 aug 2021',
    startTime: '10:00',
    endDate: '28 aug 2021',
    endTime: '20:00',
  },
  {
    id: '6',
    name: 'Annual General Meeting – Warsaw Tech Park',
    votingNumber: 'Voting no 2',
    activationType: 'automatic',
    startDate: '14 sep 2021',
    startTime: '09:00',
    endDate: '18 sep 2021',
    endTime: '18:00',
  },
  {
    id: '7',
    name: 'Board of Directors Election – FinVenture S.A.',
    votingNumber: 'Voting no 1',
    activationType: 'manual',
    isActivated: false,
  },
  {
    id: '8',
    name: 'Student Council Presidential Election – AGH University',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '02 oct 2021',
    startTime: '08:00',
    endDate: '05 oct 2021',
    endTime: '20:00',
  },
  {
    id: '9',
    name: 'Referendum on Urban Greenery Zone – District 4',
    votingNumber: 'Voting no 3',
    activationType: 'automatic',
    startDate: '12 oct 2021',
    startTime: '10:00',
    endDate: '16 oct 2021',
    endTime: '19:00',
  },
  {
    id: '10',
    name: 'Election of the Medical Board Representative',
    votingNumber: 'Voting no 1',
    activationType: 'manual',
    isActivated: false,
  },
  {
    id: '11',
    name: 'Supervisory Board Member Selection – Solaris Energy',
    votingNumber: 'Voting no 2',
    activationType: 'automatic',
    startDate: '01 nov 2021',
    startTime: '09:00',
    endDate: '04 nov 2021',
    endTime: '17:00',
  },
  {
    id: '12',
    name: 'XII Community Assembly – Kraków Stare Miasto',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '15 nov 2021',
    startTime: '10:00',
    endDate: '17 nov 2021',
    endTime: '21:00',
  },
  {
    id: '13',
    name: 'Shareholders Resolution #24 – Capital Allocation',
    votingNumber: 'Voting no 4',
    activationType: 'manual',
    isActivated: true,
  },
  {
    id: '14',
    name: 'Faculty Representative Election – Computer Science Dept',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '01 dec 2021',
    startTime: '08:30',
    endDate: '03 dec 2021',
    endTime: '18:30',
  },
  {
    id: '15',
    name: 'Local Council By-Election – Wieliczka Ward 2',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '10 dec 2021',
    startTime: '09:00',
    endDate: '12 dec 2021',
    endTime: '20:00',
  },
  {
    id: '16',
    name: 'Vote on Annual Budget Approval – Horizon NGO',
    votingNumber: 'Voting no 2',
    activationType: 'manual',
    isActivated: false,
  },
  {
    id: '17',
    name: 'Election of Ethics Committee – Polish Bar Association',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '05 jan 2022',
    startTime: '10:00',
    endDate: '08 jan 2022',
    endTime: '18:00',
  },
  {
    id: '18',
    name: 'Sports Club Management Board Election – KS Cracovia',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '18 jan 2022',
    startTime: '11:00',
    endDate: '20 jan 2022',
    endTime: '19:00',
  },
  {
    id: '19',
    name: 'Employee Representative Selection – Apex Logistics',
    votingNumber: 'Voting no 1',
    activationType: 'manual',
    isActivated: false,
  },
  {
    id: '20',
    name: 'Neighborhood Improvement Grant Allocation – Krowodrza',
    votingNumber: 'Voting no 2',
    activationType: 'automatic',
    startDate: '02 feb 2022',
    startTime: '09:00',
    endDate: '06 feb 2022',
    endTime: '20:00',
  },
  {
    id: '21',
    name: 'Election of Union Delegate – Central Transport Union',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '14 feb 2022',
    startTime: '08:00',
    endDate: '17 feb 2022',
    endTime: '16:00',
  },
  {
    id: '22',
    name: 'Cooperative Housing Board Vote – Osiedle Piastów',
    votingNumber: 'Voting no 1',
    activationType: 'manual',
    isActivated: false,
  },
  {
    id: '23',
    name: 'Annual Scientific Council Voting – BioTech Institute',
    votingNumber: 'Voting no 3',
    activationType: 'automatic',
    startDate: '01 mar 2022',
    startTime: '10:00',
    endDate: '04 mar 2022',
    endTime: '19:00',
  },
  {
    id: '24',
    name: 'Municipal Civic Budget Voting – Tarnów 2022',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '15 mar 2022',
    startTime: '08:00',
    endDate: '22 mar 2022',
    endTime: '20:00',
  },
  {
    id: '25',
    name: 'Chamber of Commerce Executive Committee Ballot',
    votingNumber: 'Voting no 2',
    activationType: 'manual',
    isActivated: true,
  },
  {
    id: '26',
    name: 'Alumni Association Advisory Board Election',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '04 apr 2022',
    startTime: '09:00',
    endDate: '07 apr 2022',
    endTime: '18:00',
  },
  {
    id: '27',
    name: 'Vote on Remote Work Policy Revision – CloudScale Ltd',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '18 apr 2022',
    startTime: '10:00',
    endDate: '21 apr 2022',
    endTime: '17:00',
  },
  {
    id: '28',
    name: 'Teachers Council Steering Group Election',
    votingNumber: 'Voting no 1',
    activationType: 'manual',
    isActivated: false,
  },
  {
    id: '29',
    name: 'Regional Architects Guild Annual Ballot',
    votingNumber: 'Voting no 2',
    activationType: 'automatic',
    startDate: '02 may 2022',
    startTime: '09:30',
    endDate: '05 may 2022',
    endTime: '18:30',
  },
  {
    id: '30',
    name: 'Environmental Initiative Fund Approval – EcoVanguard',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '16 may 2022',
    startTime: '10:00',
    endDate: '20 may 2022',
    endTime: '20:00',
  },
  {
    id: '31',
    name: 'Hospital Advisory Panel Appointment Vote',
    votingNumber: 'Voting no 1',
    activationType: 'manual',
    isActivated: false,
  },
  {
    id: '32',
    name: 'Public Transport Modernization Poll – District 9',
    votingNumber: 'Voting no 3',
    activationType: 'automatic',
    startDate: '01 jun 2022',
    startTime: '08:00',
    endDate: '05 jun 2022',
    endTime: '21:00',
  },
  {
    id: '33',
    name: 'Cultural Foundation Board of Trustees Selection',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '14 jun 2022',
    startTime: '10:00',
    endDate: '17 jun 2022',
    endTime: '19:00',
  },
  {
    id: '34',
    name: 'FinTech Alliance Governance Committee Vote',
    votingNumber: 'Voting no 2',
    activationType: 'manual',
    isActivated: false,
  },
  {
    id: '35',
    name: 'XIII Posiedzenie Wspólnoty Mieszkaniowej Nowa Huta',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '05 jul 2022',
    startTime: '09:00',
    endDate: '08 jul 2022',
    endTime: '18:00',
  },
  {
    id: '36',
    name: 'Young Entrepreneurs Network Leadership Ballot',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '19 jul 2022',
    startTime: '10:00',
    endDate: '23 jul 2022',
    endTime: '20:00',
  },
  {
    id: '37',
    name: 'Vote on Expansion Strategy – Nordic Retail Group',
    votingNumber: 'Voting no 1',
    activationType: 'manual',
    isActivated: false,
  },
  {
    id: '38',
    name: 'City Council Youth Advisory Council Election',
    votingNumber: 'Voting no 2',
    activationType: 'automatic',
    startDate: '08 aug 2022',
    startTime: '09:00',
    endDate: '12 aug 2022',
    endTime: '18:00',
  },
  {
    id: '39',
    name: 'Software Engineers Guild Representative Vote',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '22 aug 2022',
    startTime: '10:00',
    endDate: '25 aug 2022',
    endTime: '20:00',
  },
  {
    id: '40',
    name: 'Maritime Heritage Society Council Election',
    votingNumber: 'Voting no 1',
    activationType: 'manual',
    isActivated: false,
  },
  {
    id: '41',
    name: 'Renewable Energy Transition Ballot – Silesia Green',
    votingNumber: 'Voting no 3',
    activationType: 'automatic',
    startDate: '05 sep 2022',
    startTime: '08:30',
    endDate: '09 sep 2022',
    endTime: '19:00',
  },
  {
    id: '42',
    name: 'University Senate Student Representative Ballot',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '19 sep 2022',
    startTime: '09:00',
    endDate: '23 sep 2022',
    endTime: '21:00',
  },
  {
    id: '43',
    name: 'Community Safety & Lighting Project Referendum',
    votingNumber: 'Voting no 1',
    activationType: 'manual',
    isActivated: true,
  },
  {
    id: '44',
    name: 'Startup Accelerator Selection Jury Vote',
    votingNumber: 'Voting no 2',
    activationType: 'automatic',
    startDate: '03 oct 2022',
    startTime: '10:00',
    endDate: '06 oct 2022',
    endTime: '18:00',
  },
  {
    id: '45',
    name: 'XIV Extraordinary Meeting of Wspólnota Podgórze',
    votingNumber: 'Voting no 1',
    activationType: 'automatic',
    startDate: '17 oct 2022',
    startTime: '09:00',
    endDate: '20 oct 2022',
    endTime: '20:00',
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
      <div className="table-responsive-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th className="th-event">event</th>
              <th className="th-voting">voting</th>
              <th className="th-activation">activation</th>
              <th className="th-dates">activation date</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, idx) => {
              const isAlt = idx % 2 === 1;
              return (
                <tr key={event.id} className={`table-row ${isAlt ? 'row-alt' : ''}`}>
                  <td className="td-event">
                    <span className="event-title-text">{event.name}</span>
                  </td>
                  <td className="td-voting">{event.votingNumber}</td>
                  <td className="td-activation">{event.activationType}</td>
                  <td className="td-dates-cell">
                    {event.activationType === 'manual' ? (
                      <div className="action-button-align">
                        <button
                          type="button"
                          className={`btn-activate ${event.isActivated ? 'is-active' : ''}`}
                          onClick={() => toggleActivation(event.id)}
                          aria-label={event.isActivated ? 'Deactivate event' : 'Activate event'}
                        >
                          <span>{event.isActivated ? 'active' : 'activate'}</span>
                          <svg
                            className="power-icon"
                            width="15"
                            height="15"
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
                      </div>
                    ) : (
                      <div className="dates-columns-wrapper">
                        <div className="date-block">
                          <span className="date-day">{event.startDate}</span>
                          <span className="date-time">{event.startTime}</span>
                        </div>
                        <div className="date-block">
                          <span className="date-day">{event.endDate}</span>
                          <span className="date-time">{event.endTime}</span>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventsTable;
