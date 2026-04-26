import React from 'react';
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";

/**
 * A component that handles censorship of sensitive data based on user settings.
 * @param {Object} props
 * @param {string} props.value - The actual sensitive value to display or censor.
 * @param {boolean} props.isVisible - Whether the value is currently revealed (overrides settings).
 * @param {string} props.className - Additional CSS classes.
 */
const CensoredText = ({ value, isVisible, className }) => {
  const { hideSensitiveData, maskStyle } = useSettings();
  
  if (!hideSensitiveData || isVisible) {
    return <span className={className}>{value}</span>;
  }

  // If hidden, apply the selected mask style
  switch (maskStyle) {
    case 'stars':
      return <span className={cn(className, "select-none")}>********</span>;
    case 'dots':
      return <span className={cn(className, "select-none")}>••••••••</span>;
    case 'blur':
    default:
      return <span className={cn(className, "blur-md select-none")}>{value}</span>;
  }
};

export default CensoredText;
