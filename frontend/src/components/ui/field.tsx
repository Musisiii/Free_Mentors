import React from "react";
import { Box, Stack, Typography } from "@mui/material";

interface FieldProps {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Field = ({ label, icon, children }: FieldProps) => (
  <Box>
    <Stack
      direction="row"
      spacing={0.5}
      alignItems="center"
      sx={{ fontSize: "0.75rem", color: "text.secondary" }}
    >
      {icon}
      <Typography component="span" sx={{ fontSize: "0.75rem" }}>
        {label}
      </Typography>
    </Stack>
    <Box sx={{ fontWeight: 400, my: 0.5 }}>{children}</Box>
  </Box>
);

export { Field };
