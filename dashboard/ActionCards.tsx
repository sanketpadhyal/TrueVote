import React from 'react';
import eventArt from './images/event_illustration.png';
import eventArtHd from './images/event_illustration_hd.jpg';

interface ActionCardsProps {
  onNewEvent?: () => void;
}

export const ActionCards: React.FC<ActionCardsProps> = ({
  onNewEvent,
}) => {
  return (
    <div className="dashboard-action-cards">
      {/* Event Action Card */}
      <div className="action-card">
        <div className="action-card-artwork">
          <img
            src={eventArt}
            alt="New Event Illustration"
            className="action-card-img"
            onError={(e) => {
              (e.target as HTMLImageElement).src = eventArtHd;
            }}
          />
        </div>
        <div className="action-card-button-wrap">
          <button
            type="button"
            className="btn-action-card"
            onClick={onNewEvent}
          >
            new event
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionCards;
