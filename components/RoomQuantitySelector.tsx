'use client';

import { useState } from 'react';
import type { RoomCategory } from '../lib/data';

export type RoomSelection = {
  roomId: string;
  roomName: string;
  quantity: number;
};

type RoomQuantitySelectorProps = {
  rooms: RoomCategory[];
  selections: RoomSelection[];
  onChange: (selections: RoomSelection[]) => void;
};

/*
 * Small helper so a broken/missing image falls back to the
 * text placeholder rather than a broken-image icon -- each row
 * needs its own error state since they're rendered in a list.
 */
function RoomThumb({
  image,
  name,
}: {
  image: string;
  name: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!image || failed) {
    return (
      <div className="roomQtyImageFallback">
        <span>{name}</span>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={name}
      onError={() => setFailed(true)}
    />
  );
}

/*
 * ============================================================
 * ROOM QUANTITY SELECTOR
 *
 * Replaces the old single "Room type preference" dropdown with a
 * per-category quantity stepper -- a hotel may have several room
 * categories (Deluxe, Premium, Suite, ...), and a guest may need
 * rooms across more than one of them. There is deliberately no
 * guest-count field here: guest count belongs to the event
 * details, not the room stay.
 *
 * Each row shows the room's full details inline -- image, spec
 * line, description, amenities -- rather than hiding them behind
 * a "View details" link, so the card itself is the detail view.
 * ============================================================
 */
export function RoomQuantitySelector({
  rooms,
  selections,
  onChange,
}: RoomQuantitySelectorProps) {
  function quantityFor(roomId: string) {
    return (
      selections.find((s) => s.roomId === roomId)?.quantity || 0
    );
  }

  function setQuantity(room: RoomCategory, quantity: number) {
    const clamped = Math.max(0, Math.min(50, quantity));

    const existingIndex = selections.findIndex(
      (s) => s.roomId === room.id
    );

    if (clamped === 0) {
      if (existingIndex === -1) return;

      onChange(
        selections.filter((s) => s.roomId !== room.id)
      );

      return;
    }

    if (existingIndex === -1) {
      onChange([
        ...selections,
        {
          roomId: room.id,
          roomName: room.name,
          quantity: clamped,
        },
      ]);

      return;
    }

    const next = [...selections];

    next[existingIndex] = {
      ...next[existingIndex],
      quantity: clamped,
    };

    onChange(next);
  }

  const totalRooms = selections.reduce(
    (sum, s) => sum + s.quantity,
    0
  );

  if (rooms.length === 0) {
    return null;
  }

  return (
    <div className="roomQtySelector">
      <div className="roomQtySelectorHeader">
        <span>Room Selection</span>

        {totalRooms > 0 && (
          <span className="roomQtySelectorTotal">
            {totalRooms} room{totalRooms === 1 ? '' : 's'} selected
          </span>
        )}
      </div>

      <div className="roomQtySelectorList">
        {rooms.map((room) => {
          const qty = quantityFor(room.id);

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
            room.view,
          ]
            .filter(Boolean)
            .join(' · ');

          const tags = [
            ...room.features,
            ...room.amenities,
          ].slice(0, 8);

          return (
            <div className="roomQtyRow" key={room.id}>
              <div className="roomQtyImage">
                <RoomThumb image={room.image} name={room.name} />
              </div>

              <div className="roomQtyInfo">
                <h4>{room.name}</h4>

                {specLine && (
                  <p className="roomQtySpec">{specLine}</p>
                )}

                {room.description && (
                  <p className="roomQtyDescription">
                    {room.description}
                  </p>
                )}

                {tags.length > 0 && (
                  <ul className="roomQtyTags">
                    {tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                )}

                <div className="roomQtyStepperRow">
                  <span className="roomQtyStepperLabel">
                    Rooms required
                  </span>

                  <div className="roomQtyStepper">
                    <button
                      type="button"
                      aria-label={`Fewer ${room.name}`}
                      disabled={qty <= 0}
                      onClick={() =>
                        setQuantity(room, qty - 1)
                      }
                    >
                      −
                    </button>

                    <span>{qty}</span>

                    <button
                      type="button"
                      aria-label={`More ${room.name}`}
                      onClick={() =>
                        setQuantity(room, qty + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .roomQtySelector {
          border: 1px solid rgba(138, 101, 48, 0.22);
          border-radius: 16px;
          padding: 22px 22px 8px;
          margin-top: 8px;
          background: #fffefb;
        }

        .roomQtySelectorHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 18px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #151515;
        }

        .roomQtySelectorTotal {
          font-weight: 500;
          text-transform: none;
          letter-spacing: normal;
          color: #8a6530;
          font-size: 13px;
        }

        .roomQtySelectorList {
          display: flex;
          flex-direction: column;
        }

        .roomQtyRow {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 26px;
          padding: 26px 0;
          border-top: 1px solid #efece5;
        }

        .roomQtyRow:first-child {
          border-top: none;
        }

        .roomQtyImage {
          width: 320px;
          aspect-ratio: 3 / 2;
          border-radius: 12px;
          overflow: hidden;
          background: #f2efe9;
          flex-shrink: 0;
        }

        .roomQtyImage img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        .roomQtyImageFallback {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 8px;
          font-size: 12px;
          color: #a39c8f;
          letter-spacing: 0.02em;
        }

        .roomQtyInfo h4 {
          margin: 0 0 6px;
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 400;
          font-size: 22px;
          color: #22190f;
        }

        .roomQtySpec {
          margin: 0 0 12px;
          font-size: 13px;
          font-weight: 600;
          color: #8a6530;
        }

        .roomQtyDescription {
          margin: 0 0 14px;
          font-size: 13.5px;
          line-height: 1.7;
          color: #55503f;
          max-width: 60ch;
        }

        .roomQtyTags {
          list-style: none;
          margin: 0 0 18px;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .roomQtyTags li {
          padding: 5px 12px;
          border: 1px solid #e2dccd;
          border-radius: 20px;
          font-size: 11.5px;
          color: #66604f;
          background: #fbf8f1;
        }

        .roomQtyStepperRow {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .roomQtyStepperLabel {
          font-size: 12.5px;
          font-weight: 600;
          color: #22190f;
        }

        .roomQtyStepper {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid #dcd8d0;
          border-radius: 30px;
          padding: 4px 6px;
        }

        .roomQtyStepper button {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid #151515;
          background: #fff;
          color: #151515;
          font-size: 17px;
          line-height: 1;
          cursor: pointer;
          display: grid;
          place-items: center;
        }

        .roomQtyStepper button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .roomQtyStepper span {
          min-width: 20px;
          text-align: center;
          font-size: 15px;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .roomQtyRow {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .roomQtyImage {
            width: 100%;
          }

          .roomQtyStepperRow {
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}
