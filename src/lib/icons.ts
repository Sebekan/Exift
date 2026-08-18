import {
  Gem,
  Shirt,
  Smartphone,
  ToyBrick,
  PackageOpen,
  Shapes,
  type LucideIcon,
} from "lucide-react";

export const categoryIconMap: Record<string, LucideIcon> = {
  Gem,
  Shirt,
  Smartphone,
  ToyBrick,
  PackageOpen,
  Shapes,
};

export function getCategoryIcon(name: string): LucideIcon {
  return categoryIconMap[name] ?? Shapes;
}
