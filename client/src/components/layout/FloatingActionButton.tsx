import { useState } from 'react';
import { Plus } from 'lucide-react';
import QuickActionsPanel from './QuickActionsPanel';
import './FloatingActionButton.css';

export default function FloatingActionButton() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
  };

  return (
    <>
      <button
        className="fab"
        onClick={togglePanel}
        aria-label="Open quick actions menu"
        aria-expanded={isPanelOpen}
      >
        <Plus size={24} />
      </button>
      <QuickActionsPanel
        isOpen={isPanelOpen}
        onClose={closePanel}
      />
    </>
  );
}
