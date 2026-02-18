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

export const showToast = (message: string, color: string = "#4ade80") => {
  const toast = document.createElement("div");
  toast.innerText = message;
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    padding: "10px 20px",
    background: color,
    color: "white",
    borderRadius: "5px",
    zIndex: "1000",
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
};
