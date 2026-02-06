import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getSpacing = (space: any) => {
  if (typeof space === "number") return `${space}px`;
  if (!space) return "0px";
  return `${space.top}px ${space.right}px ${space.bottom}px ${space.left}px`;
};
