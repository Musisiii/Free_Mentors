import React from "react";

interface FieldProps {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Field = ({ label, icon, children }: FieldProps) => (
  <div>
    <div className="text-xs text-muted-foreground flex items-center gap-1">
      {icon}
      {label}
    </div>
    <div className="font-normal my-1">{children}</div>
  </div>
);

export { Field };