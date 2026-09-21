import { useState } from "react";
import { MessageCircleHeart } from "lucide-react";

import VoiceQuery from "./VoiceQuery";

// Small floating chat icon, fixed to the bottom of the page.
// Clicking it opens the "Ask About This Prescription" voice
// chatbot in a panel; clicking the backdrop or the panel's own
// close button dismisses it again.
export default function ChatWidget({ documentId }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="chat-fab"
        onClick={() => setIsOpen(true)}
        aria-label="Ask about this prescription"
        style={{ display: isOpen ? "none" : "flex" }}
      >
        <MessageCircleHeart size={26} />
      </button>

      {isOpen && (
        <div
          className="chat-widget-overlay"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="chat-widget-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <VoiceQuery
              documentId={documentId}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}