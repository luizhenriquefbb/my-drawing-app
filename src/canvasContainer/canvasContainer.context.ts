import { createContext } from "react";

export type CanvasContextType = {
  color: string;
  setColor: (color: string) => void;
};

export const CanvasContext = createContext<CanvasContextType>(
  {} as CanvasContextType
);

export const CanvasProvider = CanvasContext.Provider;
