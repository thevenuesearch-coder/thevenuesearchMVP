'use client';

import { useState } from 'react';
import type { RoomCategory } from '../lib/data';
import { RoomDetailsModal } from './RoomDetailsModal';

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
 * ============================================================
 * ROOM QUANTITY SELECTOR
 *
 * Replaces the old single "Room type preference" dropdown with a
 * per-category quantity stepper -- a hotel may have several room
 * categories (Deluxe, Premium, Suite, ...), and a guest may need
 * rooms across more than one of them. There is deliberately no
 * guest-count field here: guest count belongs to the event
 * details, not the room stay.
 * ============================================================
 */
export function RoomQuantitySelector({
  rooms,
  selections,
  onChange,
}: RoomQuantitySelectorProps) {
  const [detailsRoom, setDetailsRoom] =
    useState<RoomCategory | null>(null);

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

          return (
            <div
              className="roomQtyRow"
              key={room.id}
            >
              <div className="roomQtyImage">
                {room.image ? (
                  <img
                    src={room.image}
                    alt={room.name}
                  />
                ) : (
                  <div className="roomQtyImageFallback">
                    <span>{room.name}</span>
                  </div>
                )}
              </div>

              <div className="roomQtyInfo">
                <h4>{room.name}</h4>

                {room.occupancyNote || room.maxOccupancy ? (
                  <p>
                    {room.occupancyNote ||
                      `Sleeps ${room.maxOccupancy}`}
                  </p>
                ) : null}

                <button
                  type="button"
                  className="roomQtyViewDetails"
                  onClick={() => setDetailsRoom(room)}
                >
                  View details
                </button>
              </div>

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
          );
        })}
      </div>

      {detailsRoom && (
        <RoomDetailsModal
          room={detailsRoom}
          onClose={() => setDetailsRoom(null)}
        />
      )}

      <style jsx>{`
        .roomQtySelector {
          border: 1px solid rgba(138, 101, 48, 0.22);
          border-radius: 16px;
          padding: 18px 18px 6px;
          margin-top: 8px;
          background: #fffefb;
        }

        .roomQtySelectorHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 14px;
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
          grid-template-columns: 72px 1fr auto;
          align-items: center;
          gap: 14px;
          padding: 12px 0;
          border-top: 1px solid #efece5;
        }

        .roomQtyRow:first-child {
          border-top: none;
        }

        .roomQtyImage {
          width: 72px;
          height: 72px;
          border-radius: 10px;
          overflow: hidden;
          background: #f2efe9;
          flex-shrink: 0;
        }

        .roomQtyImage img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .roomQtyImageFallback {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 4px;
          font-size: 9px;
          color: #a39c8f;
          letter-spacing: 0.04em;
        }

        .roomQtyInfo h4 {
          margin: 0 0 2px;
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 400;
          font-size: 16px;
        }

        .roomQtyInfo p {
          margin: 0 0 4px;
          font-size: 12.5px;
          color: #666;
        }

        .roomQtyViewDetails {
          border: none;
          background: none;
          padding: 0;
          color: #8a6530;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          text-decoration: underline;
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
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 1px solid #151515;
          background: #fff;
          color: #151515;
          font-size: 16px;
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
          min-width: 18px;
          text-align: center;
          font-size: 14px;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .roomQtyRow {
            grid-template-columns: 56px 1fr;
            grid-template-areas:
              'image info'
              'stepper stepper';
          }

          .roomQtyImage {
            grid-area: image;
            width: 56px;
            height: 56px;
          }

          .roomQtyInfo {
            grid-area: info;
          }

          .roomQtyStepper {
            grid-area: stepper;
            justify-content: flex-end;
            margin-top: 8px;
          }
        }
      `}</style>
    </div>
  );
}
