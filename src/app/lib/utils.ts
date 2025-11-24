import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { FocusEvent } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Auto-selects all text in an input field when it receives focus.
 * This allows users to start typing immediately without having to delete existing values.
 * 
 * @param e - The focus event from the input element
 */
export function selectAllOnFocus(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.select();
}

