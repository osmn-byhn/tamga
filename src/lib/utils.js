import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getFaviconUrl(url) {
  if (!url) return null;
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch (e) {
    // If URL is invalid, try to use it as a domain
    return `https://www.google.com/s2/favicons?domain=${url}&sz=64`;
  }
}
