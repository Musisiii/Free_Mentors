import React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

const labelColor: Record<string, string> = {
  Total: "text.secondary",
  Pending: "#a16207",
  Accepted: "primary.main",
  Rejected: "#b91c1c",
  Completed: "#1d4ed8",
};

export const StatCard = ({
  icon,
  label,
  value,
  loading,
  isActive = false,
  onClick,
}: StatCardProps) => (
  <Card
    onClick={onClick}
    sx={{
      cursor: "pointer",
      transition: "all 150ms",
      color: labelColor[label] ?? "text.primary",
      borderWidth: isActive ? 2 : 1,
      borderStyle: "solid",
      borderColor: isActive ? "primary.main" : "divider",
      pointerEvents: loading ? "none" : "auto",
      opacity: loading ? 0.7 : 1,
      "&:hover": isActive ? {} : { bgcolor: "rgba(0,0,0,0.04)" },
    }}
  >
    <CardContent
      sx={{
        pt: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Box>
        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: "1.875rem", fontWeight: 700 }}>
          {loading ? "—" : value}
        </Typography>
      </Box>
      {icon}
    </CardContent>
  </Card>
);
