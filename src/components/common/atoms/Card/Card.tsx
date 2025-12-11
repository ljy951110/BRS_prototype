import { ReactNode } from "react";
import styles from "./index.module.scss";

interface CardProps {
  children: ReactNode;
  variant?: "default" | "elevated" | "glass";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

export const Card = ({
  children,
  variant = "default",
  padding = "md",
  className = "",
  onClick,
}: CardProps) => {
  return (
    <div
      className={`${styles.card} ${styles[variant]} ${
        styles[`padding-${padding}`]
      } ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};
