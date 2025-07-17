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
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import About from "./pages/About.tsx";
import Welcome from "./pages/Welcome.tsx";
import { AliveScope, KeepAlive } from "react-activation";
import Roadmap from "./pages/Roadmap.tsx";
import "@fontsource/orbitron";
import "@fontsource/orbitron/800.css";
function App() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastStakes, setLastStakes] = useState<any>([]);
  return (
    <ThemeProvider theme={theme}>
      <TokensProvider>
        <AllWalletsProvider>
          <CssBaseline />
          <AliveScope>
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
                  overflowY: { xs: "auto", sm: "auto", md: "hidden" },
                  overflowX: "hidden",
                }}
              >
                <Router>
                  <NavBar setIsLoading={setIsLoading} />
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Routes>
                      <Route
                        path="/hold"
                        element={
                          <KeepAlive>
                            <Content
                              setIsLoading={setIsLoading}
                              setLastStakes={setLastStakes}
                              lastStakes={lastStakes}
                            />
                          </KeepAlive>
                        }
                      />
                      <Route path="/about" element={<About />} />
                      <Route path="/" element={<Welcome />} />
                      <Route path="/roadmap" element={<Roadmap />} />
                    </Routes>
                  </Box>
                  <Footer />
                </Router>
              </Box>
            </Box>
          </AliveScope>
          <LoadingOverlay open={isLoading} />
        </AllWalletsProvider>
      </TokensProvider>
    </ThemeProvider>
  );
}

export default App;
