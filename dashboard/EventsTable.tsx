import React, { useState } from 'react';
import { EventItem } from './types';
import RealtimeAnalyticsModal from './RealtimeAnalyticsModal';
import PauseOrQuitModal from './PauseOrQuitModal';
import { getStoredActivities } from './StatsPanel';
import { deleteEventFromPinata, fetchEventsFromPinata, uploadEventToPinata } from '../services/pinata';
import { saveEventsToBackup, loadEventsFromBackup, removeEventFromBackup } from '../services/storage';
import { informSuccess, informInfo, informError } from '../components/universal-informer';

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
  const isTest = process.env.NODE_ENV === 'test';
  const initialEvents = getStoredEvents();
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [isInitialSyncing, setIsInitialSyncing] = useState<boolean>(!isTest && initialEvents.length === 0);
  const [selectedAnalyticsEventId, setSelectedAnalyticsEventId] = useState<string | null>(null);
  const [selectedPauseQuitEvent, setSelectedPauseQuitEvent] = useState<EventItem | null>(null);
  const [activatingEventIds, setActivatingEventIds] = useState<Set<string>>(new Set());

  const [isSyncSpinning, setIsSyncSpinning] = useState<boolean>(false);

  const syncExistingEvents = async () => {
    if (isTest) return;

    try {
      const deletedKey = 'truevote_deleted_events';
      const deletedSet = new Set<string>();
      try {
        const dList: string[] = JSON.parse(localStorage.getItem(deletedKey) || '[]');
        for (let k = 0; k < dList.length; k++) {
          if (dList[k]) deletedSet.add(String(dList[k]).toLowerCase());
        }
      } catch (e) {}

      const pinataEvents = await fetchEventsFromPinata();

      const validPinataEvents = (pinataEvents || []).filter((pEv) => {
        const idMatch = pEv.id && deletedSet.has(String(pEv.id).toLowerCase());
        const numMatch = pEv.votingNumber && deletedSet.has(String(pEv.votingNumber).toLowerCase());
        return !idMatch && !numMatch;
      });

      const localEvents = getStoredEvents();
      const now = Date.now();
      const pendingUploads = localEvents.filter((ev) => {
        const isDeleted =
          (ev.id && deletedSet.has(String(ev.id).toLowerCase())) ||
          (ev.votingNumber && deletedSet.has(String(ev.votingNumber).toLowerCase()));
        if (isDeleted) return false;
        if (ev.createdAt) {
          const age = now - new Date(ev.createdAt).getTime();
          return age < 45000;
        }
        return false;
      });

      const map = new Map<string, EventItem>();
      for (let j = 0; j < validPinataEvents.length; j++) {
        const pEv = validPinataEvents[j];
        map.set(pEv.id, pEv);
      }

      for (let p = 0; p < pendingUploads.length; p++) {
        const pEv = pendingUploads[p];
        let exists = false;
        map.forEach((v) => {
          if (v.id === pEv.id || (v.votingNumber && v.votingNumber === pEv.votingNumber)) {
            exists = true;
          }
        });
        if (!exists) {
          map.set(pEv.id, pEv);
        }
      }

      const combined: EventItem[] = [];
      map.forEach((item) => combined.push(item));

      setEvents(combined);
      localStorage.setItem('truevote_events', JSON.stringify(combined));
      saveEventsToBackup(combined);

      const totalUsed = combined.reduce((sum, e) => sum + (e.totalVotesCast || 0), 0);
      localStorage.setItem('truevote_votes_used', String(totalUsed));

      getStoredActivities();

      window.dispatchEvent(new Event('truevote_events_updated'));
    } catch (pinataErr) {
      console.warn('Pinata auto-sync notice:', pinataErr);

      const idbEvents = await loadEventsFromBackup();
      if (idbEvents && idbEvents.length > 0) {
        setEvents(idbEvents);
      }
    } finally {
      setIsInitialSyncing(false);
    }
  };

  const syncRef = React.useRef(syncExistingEvents);
  syncRef.current = syncExistingEvents;

  React.useEffect(() => {
    const handleStorageUpdate = () => {
      const stored = getStoredEvents();
      setEvents(stored);
      if (stored.length > 0) {
        saveEventsToBackup(stored);
      }
    };

    window.addEventListener('truevote_events_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('truevote_events_channel');
      bc.onmessage = () => {
        handleStorageUpdate();
      };
    } catch (e) {}

    syncRef.current();

    const intervalId = setInterval(() => {
      syncRef.current();
    }, 12000);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('truevote_events_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      if (bc) {
        try {
          bc.close();
        } catch (e) {}
      }
    };

  }, []);

  const updateEventStatus = async (id: string, updates: Partial<EventItem>) => {
    setActivatingEventIds((prev) => new Set(prev).add(id));

    const currentEvent = events.find((ev) => ev.id === id);
    const targetUpdatedEvent: EventItem | null = currentEvent
      ? { ...currentEvent, ...updates }
      : null;

    setEvents((prev) => {
      const updated = prev.map((ev) => {
        if (ev.id === id) {
          return { ...ev, ...updates };
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

      return updated;
    });

    if (targetUpdatedEvent) {
      try {
        const pinResult = await uploadEventToPinata(targetUpdatedEvent);
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

        if (updates.isActivated !== undefined) {
          if (updates.isActivated) {
            informSuccess(
              `"${targetUpdatedEvent.name || 'Voting Event'}" is now live and accepting ballots.`,
              'Voting Event Activated'
            );
          } else {
            informInfo(
              `"${targetUpdatedEvent.name || 'Voting Event'}" has been paused.`,
              'Voting Event Paused'
            );
          }
        }
      } catch (err) {
        console.warn('Pinata activation sync notice:', err);
        informError('Could not sync status with IPFS. Changes saved locally.', 'IPFS Sync Notice');
      } finally {
        setActivatingEventIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } else {
      setActivatingEventIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleActivationClick = (event: EventItem) => {
    if (activatingEventIds.has(event.id)) return;
    if (event.isActivated) {

      setSelectedPauseQuitEvent(event);
    } else {

      updateEventStatus(event.id, { isActivated: true });
    }
  };

  const handlePauseEvent = (id: string) => {
    setSelectedPauseQuitEvent(null);
    updateEventStatus(id, { isActivated: false });
  };

  const handleResumeEvent = (id: string) => {
    setSelectedPauseQuitEvent(null);
    updateEventStatus(id, { isActivated: true });
  };

  const handleDeleteEvent = async (eventToDelete: EventItem) => {

    try {
      await deleteEventFromPinata(
        eventToDelete.ipfsHash,
        eventToDelete.ipfsFileId,
        eventToDelete.votingNumber || eventToDelete.id
      );
    } catch (err) {
      console.warn('Pinata delete error:', err);
    }

    try {
      const deletedKey = 'truevote_deleted_events';
      const deletedList: string[] = JSON.parse(localStorage.getItem(deletedKey) || '[]');
      if (eventToDelete.id && !deletedList.includes(eventToDelete.id)) {
        deletedList.push(eventToDelete.id);
      }
      if (eventToDelete.votingNumber && !deletedList.includes(eventToDelete.votingNumber)) {
        deletedList.push(eventToDelete.votingNumber);
      }
      localStorage.setItem(deletedKey, JSON.stringify(deletedList));
    } catch (e) {}

    setEvents((prev) => {
      const updated = prev.filter(
        (ev) =>
          ev.id !== eventToDelete.id &&
          (!eventToDelete.votingNumber || ev.votingNumber !== eventToDelete.votingNumber)
      );
      try {
        localStorage.setItem('truevote_events', JSON.stringify(updated));
        removeEventFromBackup(eventToDelete.id, eventToDelete.votingNumber);

        const totalUsed = updated.reduce((sum, e) => sum + (e.totalVotesCast || 0), 0);
        localStorage.setItem('truevote_votes_used', String(totalUsed));

        const actsStr = localStorage.getItem('truevote_activities');
        if (actsStr) {
          try {
            const acts: any[] = JSON.parse(actsStr);
            const filteredActs = acts.filter(
              (a) =>
                a.votingNumber !== eventToDelete.votingNumber &&
                !a.id?.includes(eventToDelete.id) &&
                !(eventToDelete.votingNumber && a.id?.includes(eventToDelete.votingNumber))
            );
            localStorage.setItem('truevote_activities', JSON.stringify(filteredActs));
          } catch (err) {}
        }

        window.dispatchEvent(new Event('truevote_events_updated'));
        try {
          const bc = new BroadcastChannel('truevote_events_channel');
          bc.postMessage({ type: 'EVENT_DELETED', eventId: eventToDelete.id, votingNumber: eventToDelete.votingNumber });
          bc.close();
        } catch (e) {}
      } catch (e) {
        console.error('Error saving updated events to storage:', e);
      }
      return updated;
    });

    try {
      localStorage.removeItem(`truevote_voted_${eventToDelete.id}`);
      localStorage.removeItem(`truevote_voted_${eventToDelete.votingNumber}`);
    } catch (e) {

    }

    if (selectedAnalyticsEventId === eventToDelete.id) {
      setSelectedAnalyticsEventId(null);
    }

    setSelectedPauseQuitEvent(null);
  };

  return (
    <div className="dashboard-table-container">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <button
          type="button"
          className="btn-ipfs-sync"
          onClick={async () => {
            setIsSyncSpinning(true);
            try {
              await syncExistingEvents();
            } finally {
              setTimeout(() => {
                setIsSyncSpinning(false);
              }, 750);
            }
          }}
          aria-label="Sync with IPFS"
        >
          <svg
            className={`sync-icon ${isSyncSpinning ? 'sync-icon-spinning' : ''}`}
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>Sync with IPFS</span>
        </button>
      </div>

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
            {isInitialSyncing && events.length === 0 ? (
              [1, 2, 3].map((sKey) => (
                <tr key={`table-skel-${sKey}`} className="table-row table-row-skeleton">
                  <td className="td-event">
                    <div className="truevote-skeleton-light" style={{ width: '130px', height: '16px', borderRadius: '6px' }} />
                  </td>
                  <td className="td-voting">
                    <div className="truevote-skeleton-light" style={{ width: '85px', height: '16px', borderRadius: '6px' }} />
                  </td>
                  <td className="td-activation">
                    <div className="truevote-skeleton-light" style={{ width: '65px', height: '16px', borderRadius: '6px' }} />
                  </td>
                  <td className="td-dates-cell">
                    <div className="table-actions-group">
                      <div className="truevote-skeleton-light" style={{ width: '85px', height: '28px', borderRadius: '9999px' }} />
                      <div className="truevote-skeleton-light" style={{ width: '70px', height: '28px', borderRadius: '9999px' }} />
                    </div>
                  </td>
                </tr>
              ))
            ) : events.length > 0 ? (
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

                        {event.activationType === 'automatic' && (
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

                        <div className="action-button-align">
                          <button
                            type="button"
                            className={`btn-activate ${event.isActivated ? 'is-active' : ''} ${
                              activatingEventIds.has(event.id) ? 'is-loading' : ''
                            }`}
                            onClick={() => handleActivationClick(event)}
                            disabled={activatingEventIds.has(event.id)}
                            aria-label={
                              activatingEventIds.has(event.id)
                                ? 'Updating status...'
                                : event.isActivated
                                ? 'Deactivate event'
                                : 'Activate event'
                            }
                            title={
                              activatingEventIds.has(event.id)
                                ? 'Updating status with decentralized storage...'
                                : event.isActivated
                                ? 'Active — click to pause or delete'
                                : 'Click to activate voting'
                            }
                          >
                            <span>
                              {activatingEventIds.has(event.id)
                                ? event.isActivated
                                  ? 'pausing...'
                                  : 'activating...'
                                : event.isActivated
                                ? 'active'
                                : event.activationType === 'automatic'
                                ? 'paused'
                                : 'activate'}
                            </span>
                            {activatingEventIds.has(event.id) ? (
                              <span
                                className="spinner-border-sm"
                                style={{
                                  width: 13,
                                  height: 13,
                                  borderWidth: 2,
                                  borderStyle: 'solid',
                                  borderColor: event.isActivated
                                    ? 'rgba(255, 255, 255, 0.35)'
                                    : 'rgba(0, 229, 163, 0.35)',
                                  borderTopColor: event.isActivated
                                    ? '#ffffff'
                                    : 'var(--dash-mint)',
                                  borderRadius: '50%',
                                  display: 'inline-block',
                                  animation: 'spin 0.75s linear infinite',
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
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
                            )}
                          </button>
                        </div>

                        <button
                          type="button"
                          className="btn-table-delete"
                          onClick={() => setSelectedPauseQuitEvent(event)}
                          title="Delete this voting event from TrueVote & Pinata IPFS"
                          aria-label="Delete Event"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
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

      <RealtimeAnalyticsModal
        isOpen={Boolean(selectedAnalyticsEventId)}
        onClose={() => setSelectedAnalyticsEventId(null)}
        eventId={selectedAnalyticsEventId}
      />

      <PauseOrQuitModal
        isOpen={Boolean(selectedPauseQuitEvent)}
        onClose={() => setSelectedPauseQuitEvent(null)}
        event={selectedPauseQuitEvent}
        onPause={handlePauseEvent}
        onResume={handleResumeEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
};

export default EventsTable;

