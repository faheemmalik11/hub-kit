import type { ReactElement } from "react";
import { FocusScope } from "@radix-ui/react-focus-scope";

export function FocusPause({ children }: { children: ReactElement }) {
  return (
    <FocusScope asChild trapped={false} loop={false}>
      {children}
    </FocusScope>
  );
}
