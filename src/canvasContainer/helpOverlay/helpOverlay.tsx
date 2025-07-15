import React, { useState } from "react";
import "./helpOverlay.styles.css";

const HelpOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      <button
        className="help-button"
        onClick={() => setIsVisible(!isVisible)}
        title="Show/Hide Help"
      >
        ?
      </button>

      {isVisible && (
        <div className="help-overlay">
          <div className="help-content">
            <h3>Drawing Controls</h3>
            <div className="help-section">
              <h4>Tools</h4>
              <p><kbd>F1</kbd> - Pencil Tool</p>
              <p><kbd>F2</kbd> - Selector Tool</p>
              <p><kbd>F3</kbd> - Clear Canvas</p>
              <p><kbd>Backspace</kbd> - Delete Selected</p>
            </div>

            <div className="help-section">
              <h4>Colors</h4>
              <p><kbd>1</kbd> - Red</p>
              <p><kbd>2</kbd> - Blue</p>
              <p><kbd>3</kbd> - Yellow</p>
              <p><kbd>4</kbd> - Green</p>
            </div>

            <div className="help-section">
              <h4>Navigation</h4>
              <p><kbd>Mouse Wheel</kbd> - Zoom In/Out</p>
              <p><kbd>Middle Mouse</kbd> - Pan Canvas</p>
              <p><kbd>Space + Drag</kbd> - Pan Canvas</p>
            </div>

            <div className="help-section">
              <h4>Shortcuts</h4>
              <p><kbd>Ctrl/Cmd + Z</kbd> - Undo</p>
              <p><kbd>Ctrl/Cmd + Y</kbd> - Redo</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpOverlay;
