import type { ElementType, ReactNode } from "react";

type Width = "narrow" | "default" | "wide";

interface AppShellProps {
  as?: ElementType;
  width?: Width;
  bleed?: boolean;
  padded?: boolean;
  className?: string;
  children: ReactNode;
}

const widthClass: Record<Width, string> = {
  narrow: "app-shell--narrow",
  default: "",
  wide: "app-shell--wide",
};

export default function AppShell({
  as: Component = "div",
  width = "default",
  bleed = false,
  padded = true,
  className = "",
  children,
}: AppShellProps) {
  const classes = [
    "app-shell",
    widthClass[width],
    bleed ? "app-shell--bleed" : "",
    padded ? "app-shell--padded" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return <Component className={classes}>{children}</Component>;
}


