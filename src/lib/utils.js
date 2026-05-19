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

let clipboardTimeoutId = null;

export const copyToClipboard = async (text) => {
  try {
    if (window.ipcRenderer) {
      await window.ipcRenderer.invoke('clipboard-write', text);
    } else {
      await navigator.clipboard.writeText(text);
    }
    
    // Clear previous timeout if exists
    if (clipboardTimeoutId) {
      clearTimeout(clipboardTimeoutId);
    }
    
    // Set 30 seconds timeout
    clipboardTimeoutId = setTimeout(async () => {
      try {
        let currentText = "";
        if (window.ipcRenderer) {
          currentText = await window.ipcRenderer.invoke('clipboard-read');
        } else {
          currentText = await navigator.clipboard.readText();
        }

        // Only clear if the clipboard still contains what we copied
        if (currentText === text) {
          if (window.ipcRenderer) {
            await window.ipcRenderer.invoke('clipboard-write', "");
          } else {
            await navigator.clipboard.writeText("");
          }
        }
      } catch (e) {
        console.error("Failed to read/clear clipboard", e);
        // Fallback: just clear it if we can
        try {
          if (window.ipcRenderer) {
            await window.ipcRenderer.invoke('clipboard-write', "");
          } else {
            await navigator.clipboard.writeText("");
          }
        } catch (innerError) {
           // Ignore inner error (likely document not focused)
        }
      }
    }, 30000); // 30 seconds
    
    return true;
  } catch (error) {
    console.error("Failed to copy", error);
    return false;
  }
};
