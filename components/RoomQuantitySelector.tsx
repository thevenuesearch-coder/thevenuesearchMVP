'use client';

import { useMemo, useState } from 'react';

import type { RoomCategory } from '../lib/data';
import { RoomDetailsModal } from './RoomDetailsModal';

export type RoomSelection = {
  roomId: string;
  quantity: number;
};

type RoomQuantitySelectorProps = {
  rooms: RoomCategory[];
  selections: RoomSelection[];
  onChange: (selections: RoomSelection[]) => void;
};

/*
 * Business rule:
 * There are only 18 rooms available in each room category.
 *
 * This limit is enforced here at the UI/component level and is also
 * validated/sanitized by /book/rooms before the booking draft is saved.
 */
export const MAX_ROOMS_PER_CATEGORY = 18;

/*
 * Keep every quantity between 0 and the maximum allowed.
 */
function clampQuantity(value: number) {
  return Math.min(
    Math.max(Number(value) || 0, 0),
    MAX_ROOMS_PER_CATEGORY
  );
}

/*
 * Normalize selections coming from the UI or an older session.
 * This prevents invalid quantities from entering the booking flow.
 */
function normalizeSelections(
  selections: RoomSelection[]
): RoomSelection[] {
  return selections
    .map((selection) => ({
      ...selection,
      quantity: clampQuantity(selection.quantity),
    }))
    .filter((selection) => selection.quantity > 0);
}

export function RoomQuantitySelector({
  rooms,
  selections,
  onChange,
}: RoomQuantitySelectorProps) {
  const [activeRoom, setActiveRoom] =
    useState<RoomCategory | null>(null);

  /*
   * Always work with normalized selections.
   *
   * This protects the UI if an older sessionStorage draft
   * contains an invalid quantity such as 42.
   */
  const normalizedSelections = useMemo(
    () => normalizeSelections(selections),
    [selections]
  );

  /*
   * Get the currently selected quantity for a room category.
   */
  function getQuantity(roomId: string) {
    const selection = normalizedSelections.find(
      (item) => item.roomId === roomId
    );

    return selection?.quantity || 0;
  }

  /*
   * Update the quantity for a particular room category.
   */
  function updateQuantity(
    roomId: string,
    requestedQuantity: number
  ) {
    const quantity = clampQuantity(requestedQuantity);

    const currentSelections =
      normalizeSelections(selections);

    /*
     * If quantity becomes zero, remove the room
     * category from the selection list.
     */
    if (quantity === 0) {
      onChange(
        currentSelections.filter(
          (selection) =>
            selection.roomId !== roomId
        )
      );

      return;
    }

    /*
     * Check whether this room category has
     * already been selected.
     */
    const existing =
      currentSelections.find(
        (selection) =>
          selection.roomId === roomId
      );

    /*
     * Update an existing selection.
     */
    if (existing) {
      onChange(
        currentSelections.map(
          (selection) =>
            selection.roomId === roomId
              ? {
                  ...selection,
                  quantity,
                }
              : selection
        )
      );

      return;
    }

    /*
     * Add a new room category selection.
     */
    onChange([
      ...currentSelections,
      {
        roomId,
        quantity,
      },
    ]);
  }

  /*
   * No room categories available.
   */
  if (!rooms.length) {
    return (
      <div className="roomSelectorEmpty">
        No room categories are available for
        this property.
      </div>
    );
  }

  return (
    <>
      <div className="roomCategoryList">
        {rooms.map((room) => {
          const quantity =
            getQuantity(room.id);

          const atMinimum =
            quantity <= 0;

          const atMaximum =
            quantity >=
            MAX_ROOMS_PER_CATEGORY;

          return (
            <div
              className="roomCategoryRow"
              key={room.id}
            >
              {/* ROOM INFORMATION */}
              <div className="roomCategoryInfo">
                <h3>{room.name}</h3>

                <button
                  type="button"
                  className="roomViewDetailsBtn"
                  onClick={() =>
                    setActiveRoom(room)
                  }
                >
                  View details
                  <span>→</span>
                </button>
              </div>

              {/* ROOM QUANTITY */}
              <div className="roomQuantityControl">
                <span className="roomQuantityLabel">
                  Rooms required
                </span>

                <div
                  className="roomQuantityStepper"
                  aria-label={`${room.name} room quantity`}
                >
                  {/* DECREASE */}
                  <button
                    type="button"
                    aria-label={`Remove one ${room.name}`}
                    disabled={atMinimum}
                    onClick={() =>
                      updateQuantity(
                        room.id,
                        quantity - 1
                      )
                    }
                  >
                    −
                  </button>

                  {/* CURRENT QUANTITY */}
                  <strong>
                    {quantity}
                  </strong>

                  {/* INCREASE */}
                  <button
                    type="button"
                    aria-label={`Add one ${room.name}`}
                    disabled={atMaximum}
                    title={
                      atMaximum
                        ? 'Maximum 18 rooms available in this category'
                        : `Add one ${room.name}`
                    }
                    onClick={() =>
                      updateQuantity(
                        room.id,
                        quantity + 1
                      )
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ROOM DETAILS MODAL */}
      {activeRoom && (
        <RoomDetailsModal
          room={activeRoom}
          onClose={() =>
            setActiveRoom(null)
          }
        />
      )}
    </>
  );
}

export default RoomQuantitySelector;