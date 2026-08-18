import { Package } from "lucide-react";

interface SandikIconProps {
  size?: number;
  className?: string;
}

/** "Sandık" nav icon — a chest/trunk mark (lucide's Package reads closest
 * to a chest among the available icons; Archive read as a trash bin). */
export function SandikIcon({ size = 20, className }: SandikIconProps) {
  return <Package size={size} className={className} />;
}
