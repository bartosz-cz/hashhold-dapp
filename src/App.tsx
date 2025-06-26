import Footer from "./components/Footer";
import CssBaseline from "@mui/material/CssBaseline";
import NavBar from "./components/Navbar";
import { Box, ThemeProvider } from "@mui/material";
import { AllWalletsProvider } from "./services/wallets/AllWalletsProvider";
import { TokensProvider } from "./contexts/TokenInfoContext";
import { theme } from "./theme";
import BubbleBackground from "./components/BubbleBackground/BubbleBackground.tsx";
import Content from "./components/Content";
import LoadingOverlay from "./components/LoadingScreen.tsx";
import { useState } from "react";
function App() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastStakes, setLastStakes] = useState<any>([]);
  return (
    <ThemeProvider theme={theme}>
      <TokensProvider>
        <AllWalletsProvider>
          <CssBaseline />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100dvh",
              minWidth: "100vw",
              position: "relative",
              overflow: "hidden",
              backgroundColor: "#222222",
            }}
          >
            <BubbleBackground lastStakes={lastStakes} />
            <Box
              sx={{
                marginTop: 0,
                minHeight: "100dvh",
                maxHeight: "100dvh",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                zIndex: 1,
                overflowY: { xs: "auto", sm: "hidden", md: "hidden" },
              }}
            >
              <NavBar setIsLoading={setIsLoading} />

              {/* THIS BOX GROWS AND CENTERS ITS CONTENT */}
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Content
                  setIsLoading={setIsLoading}
                  setLastStakes={setLastStakes}
                  lastStakes={lastStakes}
                />
              </Box>

              <Footer />
            </Box>
          </Box>
          <LoadingOverlay open={isLoading} />
        </AllWalletsProvider>
      </TokensProvider>
    </ThemeProvider>
  );
}

export default App;
