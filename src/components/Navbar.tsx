import { AppBar, Button, Toolbar, Typography, Box } from "@mui/material";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import {
  openWalletConnectModal,
  initializeWalletConnect,
  dappConnector,
} from "../services/wallets/walletconnect/walletConnectClient";
import Logo from "../assets/logo.svg";
import LoadingOverlay from "./LoadingScreen";
import React, { useState, useRef } from "react";
import useEnhancedEffect from "@mui/material/utils/useEnhancedEffect";
import { ariaHidden } from "@mui/material/Modal/ModalManager";
type NavBarProps = {
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const NavBar: React.FC<NavBarProps> = ({ setIsLoading }) => {
  const { accountId, walletInterface } = useWalletInterface();
  const handleConnect = async () => {
    if (accountId) return walletInterface.disconnect();

    setIsLoading(true); // spinner ON
    await initializeWalletConnect(); // bootstrap SDK

    /* 1️⃣ MutationObserver – host <wcm-modal> pojawił się w DOM-ie */
    const hostObserver = new MutationObserver(() => {
      const host = document.querySelector("wcm-modal");
      console.log(host);
      if (!host) return;

      /* 2️⃣ przełączamy się na ResizeObserver wewnątrz shadowRoot */
      hostObserver.disconnect();
      const inner = host.shadowRoot
        ?.querySelector("#wcm-modal")
        ?.querySelector(".wcm-container");

      if (!inner) {
        // fallback: gdyby klasa się zmieniła
        setIsLoading(false);
        return;
      }

      const sizeObs = new ResizeObserver((e) => {
        const h = e[0].contentRect.height;
        console.log(h);
        if (h > 0) {
          setIsLoading(false); // spinner OFF – modal widoczny
          sizeObs.disconnect();
        }
      });
      sizeObs.observe(inner as Element);
    });

    hostObserver.observe(document.body, { childList: true, subtree: true });

    /* 3️⃣ safety-nety: approve / reject / expire przed wyrenderowaniem */
    const wc: any = (dappConnector as any).walletConnectClient;
    const finish = () => {
      hostObserver.disconnect();
      setIsLoading(false);
    };
    wc.once("session_approve", finish);
    wc.once("session_delete", finish);
    wc.once("proposal_expire", finish);

    /* 4️⃣ otwieramy modal (nie czekamy na resolve) */
    dappConnector.openModal().catch(finish);
  };
  return (
    <AppBar
      position="relative"
      sx={{
        backgroundColor: "rgba(18, 18, 18, 0.85)", // ~ MUI primary z przezroczystością
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <Toolbar>
        <img src={Logo} alt="Logo" style={{ height: 48 }} />
        <Typography variant="h6" noWrap component="div" pl={1}>
          <Box component="span" sx={{ color: "#8F5BFF", fontWeight: "bold" }}>
            Hash
          </Box>
          <Box component="span" sx={{ color: "white" }}>
            Hold
          </Box>
        </Typography>
        <Button
          variant="contained"
          sx={{
            ml: "auto",
          }}
          onClick={handleConnect}
        >
          {accountId ? `Connected: ${accountId}` : "Connect Wallet"}
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
