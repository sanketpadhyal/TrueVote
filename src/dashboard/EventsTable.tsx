import React, { useState } from 'react';
import { EventItem } from './types';
import RealtimeAnalyticsModal from './RealtimeAnalyticsModal';
import PauseOrQuitModal from './PauseOrQuitModal';
import { deleteEventFromPinata, fetchEventsFromPinata, uploadEventToPinata } from '../services/pinata';
import { saveEventsToBackup, loadEventsFromBackup, removeEventFromBackup } from '../services/storage';

const getStoredEvents = (): EventItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('truevote_events');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error parsing truevote_events from storage:', e);
  }
  return [];
};

export const EventsTable: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>(getStoredEvents);
  const [selectedAnalyticsEventId, setSelectedAnalyticsEventId] = useState<string | null>(null);
  const [selectedPauseQuitEvent, setSelectedPauseQuitEvent] = useState<EventItem | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const handleStorageUpdate = () => {
      const stored = getStoredEvents();
      setEvents(stored);
      if (stored.length > 0) {
        saveEventsToBackup(stored);
      }
    };

    window.addEventListener('truevote_events_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    // Initial restoration & Pinata sync
    const syncExistingEvents = async () => {
      if (process.env.NODE_ENV === 'test') {
        return;
      }
      const current = getStoredEvents();
      if (current.length > 0) {
        saveEventsToBackup(current);
      } else {
        // If localStorage was cleared, check IndexedDB backup first
        const idbEvents = await loadEventsFromBackup();
        if (isMounted && idbEvents && idbEvents.length > 0) {
          console.log('Restored events from persistent storage backup:', idbEvents.length);
          setEvents(idbEvents);
          try {
            localStorage.setItem('truevote_events', JSON.stringify(idbEvents));
            window.dispatchEvent(new Event('truevote_events_updated'));
          } catch (e) {
            console.error(e);
          }
        }
      }

      // Sync from Pinata IPFS
      try {
        const pinataEvents = await fetchEventsFromPinata();
        if (isMounted && pinataEvents && pinataEvents.length > 0) {
          console.log('Fetched events from Pinata IPFS:', pinataEvents.length);
          setEvents((prev) => {
            const map = new Map<string, EventItem>();
            for (const ev of prev) {
              map.set(ev.id, ev);
              map.set(ev.votingNumber, ev);
            }
            let added = false;
            for (const pEv of pinataEvents) {
              if (!map.has(pEv.id) && !map.has(pEv.votingNumber)) {
                map.set(pEv.id, pEv);
                added = true;
              }
            }
            if (!added) return prev;
            const merged = Array.from(new Set(map.values()));
            try {
              localStorage.setItem('truevote_events', JSON.stringify(merged));
              saveEventsToBackup(merged);
              window.dispatchEvent(new Event('truevote_events_updated'));
            } catch (e) {
              console.error(e);
            }
            return merged;
          });
        }
      } catch (pinataErr) {
        console.warn('Pinata auto-sync notice:', pinataErr);
      }
    };

    syncExistingEvents();

    return () => {
      isMounted = false;
      window.removeEventListener('truevote_events_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const updateEventStatus = (id: string, updates: Partial<EventItem>) => {
    setEvents((prev) => {
      let targetUpdatedEvent: EventItem | null = null;
      const updated = prev.map((ev) => {
        if (ev.id === id) {
          targetUpdatedEvent = { ...ev, ...updates };
          return targetUpdatedEvent;
        }
        return ev;
      });
      try {
        localStorage.setItem('truevote_events', JSON.stringify(updated));
        saveEventsToBackup(updated);
        window.dispatchEvent(new Event('truevote_events_updated'));
        try {
          const bc = new BroadcastChannel('truevote_events_channel');
          bc.postMessage({ type: 'EVENT_UPDATED', eventId: id });
          bc.close();
        } catch (e) {}
      } catch (e) {
        console.error(e);
      }

      // Automatically sync updated activation status to Pinata IPFS
      if (targetUpdatedEvent) {
        uploadEventToPinata(targetUpdatedEvent)
          .then((pinResult) => {
            if (pinResult?.IpfsHash) {
              setEvents((curr) => {
                const withPin = curr.map((ev) =>
                  ev.id === id
                    ? {
                        ...ev,
                        ipfsHash: pinResult.IpfsHash,
                        ipfsUrl: pinResult.gatewayUrl,
                        ipfsFileId: pinResult.fileId,
                      }
                    : ev
                );
                localStorage.setItem('truevote_events', JSON.stringify(withPin));
                saveEventsToBackup(withPin);
                return withPin;
              });
            }
          })
          .catch((err) => {
            console.warn('Pinata activation sync notice:', err);
          });
      }

      return updated;
    });
  };

  const handleActivationClick = (event: EventItem) => {
    if (event.isActivated) {
      // If already active, trigger iOS popup to ask "Pause or Quit?"
      setSelectedPauseQuitEvent(event);
    } else {
      // If inactive, activate directly
      updateEventStatus(event.id, { isActivated: true });
    }
  };

  const handlePauseEvent = (id: string) => {
    updateEventStatus(id, { isActivated: false });
    setSelectedPauseQuitEvent(null);
  };

  const handleDeleteEvent = async (eventToDelete: EventItem) => {
    // 1. Unpin / delete this specific vote schema from Pinata IPFS
    try {
      await deleteEventFromPinata(eventToDelete.ipfsHash, eventToDelete.ipfsFileId);
    } catch (err) {
      console.warn('Pinata delete error:', err);
    }

    // 2. Remove vote from local storage, backup storage, and update state
    setEvents((prev) => {
      const updated = prev.filter((ev) => ev.id !== eventToDelete.id);
      try {
        localStorage.setItem('truevote_events', JSON.stringify(updated));
        removeEventFromBackup(eventToDelete.id);
        window.dispatchEvent(new Event('truevote_events_updated'));
        try {
          const bc = new BroadcastChannel('truevote_events_channel');
          bc.postMessage({ type: 'EVENT_DELETED', eventId: eventToDelete.id });
          bc.close();
        } catch (e) {}
      } catch (e) {
        console.error('Error saving updated events to storage:', e);
      }
      return updated;
    });

    // 3. Clear any cached vote status flags for this event
    try {
      localStorage.removeItem(`truevote_voted_${eventToDelete.id}`);
      localStorage.removeItem(`truevote_voted_${eventToDelete.votingNumber}`);
    } catch (e) {
      // ignore
    }

    // 4. Close active analytics modal if it was open for this event
    if (selectedAnalyticsEventId === eventToDelete.id) {
      setSelectedAnalyticsEventId(null);
    }

    setSelectedPauseQuitEvent(null);
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
              <th className="th-dates">activation date & live stats</th>
            </tr>
          </thead>
          <tbody>
            {events.length > 0 ? (
              events.map((event, idx) => {
                const isAlt = idx % 2 === 1;
                return (
                  <tr key={event.id} className={`table-row ${isAlt ? 'row-alt' : ''}`}>
                    <td className="td-event">
                      <a
                        href={`/voting/${event.id}`}
                        className="event-title-text"
                        title="Open anonymous voting ballot"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {event.name}
                      </a>
                    </td>
                    <td className="td-voting">{event.votingNumber}</td>
                    <td className="td-activation">{event.activationType}</td>
                    <td className="td-dates-cell">
                      <div className="table-actions-group">
                        {/* Real-time Analytics Button */}
                        <button
                          type="button"
                          className="btn-live-stats"
                          onClick={() => setSelectedAnalyticsEventId(event.id)}
                          aria-label="Live Stats"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                          </svg>
                          <span>Live Stats</span>
                        </button>

                        {/* Activation Toggle Button / Scheduled Dates */}
                        {event.activationType === 'manual' ? (
                          <div className="action-button-align">
                            <button
                              type="button"
                              className={`btn-activate ${event.isActivated ? 'is-active' : ''}`}
                              onClick={() => handleActivationClick(event)}
                              aria-label={event.isActivated ? 'Deactivate event' : 'Activate event'}
                              title={
                                event.isActivated
                                  ? 'Active — click to pause or quit'
                                  : 'Click to activate voting'
                              }
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
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="events-empty-cell">
                  <div className="events-empty-box">
                    <div className="events-empty-icon-wrap">
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </div>
                    <h3 className="events-empty-title">No Voting Events Created Yet</h3>
                    <p className="events-empty-subtitle">
                      There are currently no active or scheduled election sessions. Click the button below to configure your first verifiable voting event.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Real-time iOS Analytics Modal with Live Graphs */}
      <RealtimeAnalyticsModal
        isOpen={Boolean(selectedAnalyticsEventId)}
        onClose={() => setSelectedAnalyticsEventId(null)}
        eventId={selectedAnalyticsEventId}
      />

      {/* iOS Action Sheet: Pause or Delete Confirmation */}
      <PauseOrQuitModal
        isOpen={Boolean(selectedPauseQuitEvent)}
        onClose={() => setSelectedPauseQuitEvent(null)}
        event={selectedPauseQuitEvent}
        onPause={handlePauseEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
};

export default EventsTable;
