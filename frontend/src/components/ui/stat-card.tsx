import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export const StatCard = ({
  icon,
  label,
  value,
  loading,
  isActive = false,
  onClick,
}: StatCardProps) => (
  <Card
    className={`cursor-pointer transition-all ${
      isActive
        ? "border-2 border-primary"
        : "hover:bg-secondary/60"
    }`}
    onClick={onClick}
  >
    <CardContent className="pt-6 flex items-center justify-between">
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-3xl font-bold">{loading ? "—" : value}</div>
      </div>
      {icon}
    </CardContent>
  </Card>
);