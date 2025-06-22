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
  return (
    <ThemeProvider theme={theme}>
      <TokensProvider>
        <AllWalletsProvider>
          <CssBaseline />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
              minWidth: "100vw",
              position: "relative",
              overflow: "hidden",
              backgroundColor: "#222222",
            }}
          >
            <BubbleBackground />
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <NavBar setIsLoading={setIsLoading} />
              <Content setIsLoading={setIsLoading} />
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
