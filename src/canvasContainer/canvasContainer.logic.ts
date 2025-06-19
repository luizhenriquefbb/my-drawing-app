import { useState } from "react";

export function useColorPickerLogic() {
  const [color, setColor] = useState<string>("#ff0000");

  return {
    color,
    setColor,
  };
}
