'use client';

import { useState } from 'react';
import type { RoomCategory } from '../lib/data';

type RoomDetailsModalProps = {
  room: RoomCategory;
  onClose: () => void;
};

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="room-modal-section">
      <span className="room-modal-section-title">
        {title}
      </span>
      {children}

      <style jsx>{`
        .room-modal-section {
          padding: 16px 0;
          border-top: 1px solid #eee;
        }

        .room-modal-section-title {
          display: block;
          margin-bottom: 8px;
          color: #888;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
        }
      `}</style>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="room-modal-taglist">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}

      <style jsx>{`
        .room-modal-taglist {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .room-modal-taglist li {
          padding: 6px 12px;
          border: 1px solid #dcd8d0;
          border-radius: 30px;
          color: #555;
          font-size: 11px;
        }
      `}</style>
    </ul>
  );
}

export function RoomDetailsModal({
  room,
  onClose,
}: RoomDetailsModalProps) {
  const gallery = room.image
    ? [room.image, ...room.gallery.filter((g) => g !== room.image)]
    : room.gallery;

  const [activeImage, setActiveImage] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<number>>(
    new Set()
  );

  const activeSrc = failedImages.has(activeImage)
    ? null
    : gallery[activeImage];

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-modal-title"
      className="room-modal-overlay"
      onClick={onClose}
    >
      <div
        className="room-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="room-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="room-modal-gallery">
          {gallery.length > 0 && activeSrc ? (
            <img
              src={activeSrc}
              alt={room.name}
              onError={() =>
                setFailedImages(
                  (current) =>
                    new Set(current).add(activeImage)
                )
              }
            />
          ) : (
            <div className="room-modal-gallery-fallback">
              <span>{room.name}</span>
            </div>
          )}

          {gallery.length > 1 && (
            <div className="room-modal-thumbs">
              {gallery.map((img, index) => (
                <button
                  type="button"
                  key={img}
                  className={
                    index === activeImage
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setActiveImage(index)
                  }
                  aria-label={`Image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="room-modal-content">
          <h3 id="room-modal-title">{room.name}</h3>

          {specLine && (
            <p className="room-modal-spec">
              {specLine}
            </p>
          )}

          {room.view && (
            <p className="room-modal-view">
              {room.view}
              {room.hasBalcony ? ' · Balcony' : ''}
            </p>
          )}

          {room.floorLocation && (
            <p className="room-modal-view">
              {room.floorLocation}
            </p>
          )}

          {room.description && (
            <p className="room-modal-description">
              {room.description}
            </p>
          )}

          {room.features.length > 0 && (
            <DetailSection title="HIGHLIGHTS">
              <TagList items={room.features} />
            </DetailSection>
          )}

          {room.bathroomDetails && (
            <DetailSection title="BATHROOM">
              <p className="room-modal-text">
                {room.bathroomDetails}
              </p>
            </DetailSection>
          )}

          {room.amenities.length > 0 && (
            <DetailSection title="IN-ROOM AMENITIES">
              <TagList items={room.amenities} />
            </DetailSection>
          )}

          {room.technology.length > 0 && (
            <DetailSection title="TECHNOLOGY">
              <TagList items={room.technology} />
            </DetailSection>
          )}

          {room.diningDetails && (
            <DetailSection title="DINING & REFRESHMENT">
              <p className="room-modal-text">
                {room.diningDetails}
              </p>
            </DetailSection>
          )}

          {room.services.length > 0 && (
            <DetailSection title="SERVICES">
              <TagList items={room.services} />
            </DetailSection>
          )}

          {room.specialInclusions.length > 0 && (
            <DetailSection title="SPECIAL INCLUSIONS">
              <TagList items={room.specialInclusions} />
            </DetailSection>
          )}
        </div>
      </div>

      <style jsx>{`
        .room-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 999999;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(10, 10, 10, 0.55);
          backdrop-filter: blur(8px);
          overflow-y: auto;
        }

        .room-modal {
          position: relative;
          width: min(920px, 100%);
          max-height: 88vh;
          overflow-y: auto;
          background: #fff;
          border-radius: 20px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.25);
        }

        .room-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 2;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          cursor: pointer;
        }

        .room-modal-gallery {
          position: relative;
          background: #f2efe9;
          min-height: 280px;
        }

        .room-modal-gallery img {
          width: 100%;
          height: 100%;
          min-height: 280px;
          object-fit: cover;
          display: block;
        }

        .room-modal-gallery-fallback {
          width: 100%;
          height: 100%;
          min-height: 280px;
          display: grid;
          place-items: center;
          color: #a39c8f;
          font-size: 13px;
        }

        .room-modal-thumbs {
          position: absolute;
          bottom: 14px;
          left: 14px;
          display: flex;
          gap: 6px;
        }

        .room-modal-thumbs button {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.55);
          cursor: pointer;
          padding: 0;
        }

        .room-modal-thumbs button.active {
          background: #fff;
        }

        .room-modal-content {
          padding: 30px 32px 36px;
        }

        .room-modal-content h3 {
          margin: 0 0 6px;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 30px;
          font-weight: 400;
          letter-spacing: -0.02em;
        }

        .room-modal-spec {
          margin: 0;
          color: #333;
          font-size: 14px;
        }

        .room-modal-view {
          margin: 4px 0 0;
          color: #888;
          font-size: 12px;
          letter-spacing: 0.04em;
        }

        .room-modal-description {
          margin: 16px 0 0;
          color: #68645e;
          font-size: 14px;
          line-height: 1.7;
        }

        .room-modal-text {
          margin: 0;
          color: #555;
          font-size: 13px;
          line-height: 1.6;
        }

        @media (max-width: 720px) {
          .room-modal {
            grid-template-columns: 1fr;
            max-height: 92vh;
          }

          .room-modal-gallery,
          .room-modal-gallery img,
          .room-modal-gallery-fallback {
            min-height: 220px;
          }
        }
      `}</style>
    </div>
  );
}
