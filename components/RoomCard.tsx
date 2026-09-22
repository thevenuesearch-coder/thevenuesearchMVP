'use client';

import type { RoomCategory } from '../lib/data';

type RoomCardProps = {
  room: RoomCategory;
  onViewDetails: () => void;
};

export function RoomCard({
  room,
  onViewDetails,
}: RoomCardProps) {
  const specLine = [
    room.bedType,
    room.occupancyNote ||
      (room.maxOccupancy
        ? `Sleeps ${room.maxOccupancy}`
        : null),
    room.sizeSqm
      ? `${room.sizeSqm} sq.m`
      : room.sizeSqft
        ? `${room.sizeSqft} sq.ft`
        : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const visibleFeatures = room.features.slice(0, 4);

  return (
    <article className="room-card">
      <div className="room-card-image">
        {room.image ? (
          <img
            src={room.image}
            alt={room.name}
          />
        ) : (
          <div className="room-card-image-fallback">
            <span>{room.name}</span>
          </div>
        )}
      </div>

      <div className="room-card-body">
        <h4>{room.name}</h4>

        {specLine && (
          <p className="room-card-spec">
            {specLine}
          </p>
        )}

        {room.view && (
          <p className="room-card-view">
            {room.view}
          </p>
        )}

        {visibleFeatures.length > 0 && (
          <ul className="room-card-features">
            {visibleFeatures.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className="room-card-cta"
          onClick={onViewDetails}
        >
          View Details
        </button>
      </div>

      <style jsx>{`
        .room-card {
          display: flex;
          flex-direction: column;
          border: 1px solid #e7e3db;
          border-radius: 18px;
          overflow: hidden;
          background: #fff;
          transition: box-shadow 0.25s ease, transform 0.25s ease;
        }

        .room-card:hover {
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.08);
          transform: translateY(-3px);
        }

        .room-card-image {
          aspect-ratio: 4 / 3;
          background: #f2efe9;
        }

        .room-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .room-card-image-fallback {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          padding: 20px;
          text-align: center;
          color: #a39c8f;
          font-size: 12px;
          letter-spacing: 0.06em;
        }

        .room-card-body {
          padding: 20px 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .room-card-body h4 {
          margin: 0;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 20px;
          font-weight: 400;
          letter-spacing: -0.01em;
        }

        .room-card-spec {
          margin: 2px 0 0;
          color: #555;
          font-size: 13px;
        }

        .room-card-view {
          margin: 0;
          color: #888;
          font-size: 12px;
          letter-spacing: 0.04em;
        }

        .room-card-features {
          list-style: none;
          margin: 10px 0 4px;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .room-card-features li {
          padding: 6px 12px;
          border: 1px solid #dcd8d0;
          border-radius: 30px;
          color: #555;
          font-size: 11px;
        }

        .room-card-cta {
          margin-top: 14px;
          padding: 12px 0;
          border: 1px solid #151515;
          border-radius: 8px;
          background: transparent;
          color: #151515;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .room-card-cta:hover {
          background: #151515;
          color: #fff;
        }
      `}</style>
    </article>
  );
}
