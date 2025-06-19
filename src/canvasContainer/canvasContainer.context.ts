import { createContext } from "react";

export type CanvasContextType = {
  color: string;
  setColor: (color: string) => void;
};

export const CanvasContainerContext = createContext<CanvasContextType>(
  {} as CanvasContextType
);

export const CanvasProvider = CanvasContainerContext.Provider;
