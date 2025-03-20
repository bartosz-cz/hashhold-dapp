import { AppBar, Button, Toolbar, Typography } from "@mui/material";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { openWalletConnectModal } from "../services/wallets/walletconnect/walletConnectClient";

export default function NavBar() {
  const { accountId, walletInterface } = useWalletInterface();

  const handleConnect = async () => {
    if (accountId) {
      walletInterface.disconnect();
    } else {
      openWalletConnectModal();
    }
  };

  return (
    <AppBar position="relative">
      <Toolbar>
        <Typography variant="h6" color="white" pl={1} noWrap>
          HashHold
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
}
