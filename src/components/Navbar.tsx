import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { NavLink } from "react-router-dom";
import useMediaQuery from "@mui/material/useMediaQuery";
import MobileMenu from "./MobileMenu";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import {
  initializeWalletConnect,
  dappConnector,
} from "../services/wallets/walletconnect/walletConnectClient";

import Logo from "../assets/logo.svg";

type NavBarProps = {
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

/* ───────────────────────── helpery ───────────────────────── */
const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "active" : undefined;

const activeSX = {
  color: "#8F5BFF",
  fontWeight: "bold",
  borderBottom: "2px solid #8F5BFF",
  background: "rgba(143,91,255,0.10)",
};

/* ───────────────────────── komponent ─────────────────────── */
const NavBar: React.FC<NavBarProps> = ({ setIsLoading }) => {
  const { accountId, walletInterface } = useWalletInterface();

  const isMobile = useMediaQuery("(max-width:699px)");
  const isVeryMobile = useMediaQuery("(max-width:550px)");

  const [drawerOpen, setDrawerOpen] = useState(false);

  /* ----- connect / disconnect ----- */
  const handleConnect = async () => {
    if (accountId) return walletInterface.disconnect();

    setIsLoading(true);
    await initializeWalletConnect();

    const hostObserver = new MutationObserver(() => {
      const host = document.querySelector("wcm-modal");
      if (!host) return;
      hostObserver.disconnect();

      const inner = host.shadowRoot
        ?.querySelector("#wcm-modal")
        ?.querySelector(".wcm-container");
      if (!inner) return setIsLoading(false);

      const sizeObs = new ResizeObserver((e) => {
        if (e[0].contentRect.height > 0) {
          setIsLoading(false);
          sizeObs.disconnect();
        }
      });
      sizeObs.observe(inner);
    });
    hostObserver.observe(document.body, { childList: true, subtree: true });

    const wc: any = (dappConnector as any).walletConnectClient;
    const finish = () => {
      hostObserver.disconnect();
      setIsLoading(false);
    };
    wc.once("session_approve", finish);
    wc.once("session_delete", finish);
    wc.once("proposal_expire", finish);
    dappConnector.openModal().catch(finish);
  };

  /* ===== render ===== */
  return (
    <AppBar
      position="relative"
      sx={{
        backgroundColor: "rgba(18, 18, 18, 0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        mb: 2,
        zIndex: 100,
      }}
    >
      <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
        {/* ---------- logo ---------- */}
        <NavLink
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <img src={Logo} alt="Logo" style={{ height: 48 }} />
          <Typography
            variant="h6"
            noWrap
            component="div"
            pl={1}
            mr={3}
            sx={{ display: "flex", alignItems: "center" }}
          >
            <Box component="span" sx={{ color: "#8F5BFF", fontWeight: "bold" }}>
              Hash
            </Box>
            <Box component="span" sx={{ color: "#fff" }}>
              Hold
            </Box>
          </Typography>
        </NavLink>

        {/* ---------- menu desktop ---------- */}
        {!isVeryMobile && (
          <Box sx={{ display: "flex" }}>
            {[
              { label: "Hold", path: "/hold" },
              { label: "About", path: "/about" },
              { label: "Roadmap", path: "/roadmap" },
            ].map(({ label, path }) => (
              <Button
                key={label}
                component={NavLink}
                to={path}
                end
                className={linkClass}
                sx={{
                  height: 64,
                  width: 100,
                  px: 3,
                  "&.active": activeSX,
                }}
              >
                {label}
              </Button>
            ))}
          </Box>
        )}

        {/* ---------- wallet button ---------- */}
        <Button
          variant="contained"
          onClick={handleConnect}
          sx={{
            ml: "auto",
            minWidth: isMobile ? 40 : 120,
            fontSize: isMobile ? 12 : 15,
            px: isMobile ? 1 : 3,
            background: "linear-gradient(90deg, #a47aff 30%, #8F5BFF 100%)",
            fontWeight: "bold",
            color: "#fff",
            boxShadow: "0 2px 16px 0 #8F5BFF44",
            transition:
              "filter .3s cubic-bezier(.4,0,.2,1),color .2s,box-shadow .2s",
            "&:hover": { filter: "brightness(.65)" },
            "&.Mui-disabled": {
              background: (t) => t.palette.action.disabledBackground,
              color: (t) => t.palette.action.disabled,
              boxShadow: "none",
            },
          }}
        >
          {accountId
            ? isMobile
              ? accountId
              : `Connected: ${accountId}`
            : isMobile
            ? "Wallet"
            : "Connect Wallet"}
        </Button>

        {/* ---------- burger menu mobile ---------- */}
        {isVeryMobile && <MobileMenu />}
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
