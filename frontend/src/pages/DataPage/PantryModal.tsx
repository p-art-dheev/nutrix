import React, { useState } from 'react';
import { Modal } from '../../components/Modal';
import { clearPantry, removeFromPantry } from '../../services/datasetApi';
import type { PantryItem } from '../../types/dataset';
import './PantryModal.css';

interface PantryModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PantryItem[];
  onRemove: (ids: number[]) => void;
}

export const PantryModal: React.FC<PantryModalProps> = ({
  isOpen,
  onClose,
  items,
  onRemove,
}) => {
  const [removingId, setRemovingId] = useState<number | null>(null);

  const handleRemove = async (rowId: number) => {
    onRemove([rowId]);
    setRemovingId(rowId);
    try {
      await removeFromPantry(rowId);
    } finally {
      setRemovingId(null);
    }
  };

  const handleClear = async () => {
    const ids = items.map((item) => item.id);
    onRemove(ids);
    await clearPantry();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="pantry-modal">
        <header className="pantry-modal-header">
          <div>
            <h2>Your Pantry</h2>
            <p>{items.length} food item{items.length !== 1 ? 's' : ''} selected</p>
          </div>
        </header>

        <div className="pantry-modal-body">
          {items.length === 0 ? (
            <p className="pantry-empty">
              No items yet. Use the <strong>+</strong> button or select rows in the dataset table to build your pantry.
            </p>
          ) : (
            <ul className="pantry-list">
              {items.map((item) => (
                <li key={item.id} className="pantry-item">
                  <span className="pantry-item-name" title={item.food ?? undefined}>
                    {item.food ?? `Item ${item.id}`}
                  </span>
                  <button
                    type="button"
                    className="btn-remove-pantry"
                    onClick={() => handleRemove(item.id)}
                    disabled={removingId === item.id}
                    aria-label={`Remove ${item.food}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="pantry-modal-footer">
            <button type="button" className="btn-clear-pantry" onClick={handleClear}>
              Clear pantry
            </button>
          </footer>
        )}
      </div>
    </Modal>
  );
};
