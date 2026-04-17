import { useNavigationType } from "react-router-dom";

export type NavDirection = 1 | -1 | 0;

/**
 * Returns the navigation direction based on browser history action:
 *  1 = forward (PUSH)
 * -1 = backward (POP / browser back)
 *  0 = replace / initial (no slide)
 */
export function useNavDirection(): NavDirection {
  const type = useNavigationType();
  if (type === "POP") return -1;
  if (type === "PUSH") return 1;
  return 0;
}
