import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calculateXAxes = (step = 0.1, multiplier: number, start: number, end: number) => {
  return Array.from({ length: Math.floor((end - start) / step) + 1 }, (_, index) => {
    const scale = 2 / (3 - Math.cos(2 * index * step));
    return scale * Math.cos(index * step) * multiplier;
  });
};

export const calculateYAxes = (
  step = 0.1,
  multiplier: number,
  start: number = Math.PI,
  end: number = -Math.PI
) => {
  return Array.from({ length: Math.floor((end - start) / step) + 1 }, (_, index) => {
    const scale = 2 / (3 - Math.cos(2 * index * step));
    return ((scale * Math.sin(2 * step * index)) / 2) * multiplier;
  });
};
