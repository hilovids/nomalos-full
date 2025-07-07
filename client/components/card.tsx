import React from "react";

type CardProps = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
}>;

export default function Card({ children, className = "", style }: CardProps) {
  return (
    <div
      className={`bg-[#181818] rounded-lg shadow p-6 sm:p-8 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}