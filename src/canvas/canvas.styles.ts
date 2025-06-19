export const canvasContainerStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  pointerEvents: "none",
};

export const canvasStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "transparent",
  pointerEvents: "auto",
  zIndex: 1,
};

export const colorPickerWrapperStyle: React.CSSProperties = {
  position: "fixed",
  top: 20,
  right: 20,
  zIndex: 10,
  background: "rgba(255,255,255,0.7)",
  borderRadius: 8,
  padding: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  display: "flex",
  alignItems: "center",
};

export const colorPickerInputStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  border: "none",
  background: "none",
  cursor: "pointer",
};
