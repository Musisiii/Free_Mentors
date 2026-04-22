import { ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { darkMuiTheme } from "@/lib/muiTheme";

export const MuiThemeProvider = ({ children }: { children: ReactNode }) => {
  return <ThemeProvider theme={darkMuiTheme}>{children}</ThemeProvider>;
};
