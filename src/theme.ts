import { createTheme } from "@mui/material";

const thumbHover = "rgb(81, 60, 135)";
const thumbColor = "rgb(56, 41, 94)";
const trackColor = "rgb(32, 32, 32)";

export const theme = createTheme({
  typography: {
    fontFamily: '"Styrene A Web", "Helvetica Neue", Sans-Serif',
  },
  palette: {
    mode: "dark",
    primary: {
      main: "#8259ef",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Firefox
        /*"@supports (scrollbar-color: auto)": {
          html: {
            scrollbarWidth: "thin",
            scrollbarColor: `${thumbColor} ${trackColor}`,
          },
        },*/
        // Chrome/Safari/Edge
        "@media all and (-webkit-min-device-pixel-ratio:0)": {
          "*::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
          },
          "*::-webkit-scrollbar-thumb": {
            background: thumbColor,
            borderRadius: "6px",
            transition: "background 0.2s",
          },
          "*::-webkit-scrollbar-thumb:hover": {
            background: thumbHover,
          },
          "*::-webkit-scrollbar-track": {
            background: trackColor,
          },
        },
      },
    },
  },
});
