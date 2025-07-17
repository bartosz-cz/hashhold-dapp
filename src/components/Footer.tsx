import { Box, Card, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box
      className="footer"
      sx={{
        flexDirection: "column",
        height: "50px",
        width: "100%",

        display: {
          xs: "flex", // widoczne tylko <600 px
          sm: "none",
          md: "none",
        },
      }}
    >
      <Card
        sx={{
          height: "100%",
          display: "flex",
          width: "100%",
          backgroundColor: "rgba(18, 18, 18, 0.85)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 1,
        }}
      >
        <Typography variant="caption" color="gray" fontSize={12}>
          Network: Hedera Testnet
        </Typography>
        <Typography variant="caption" color="gray" fontSize={12}>
          © 2025 HashHold. All rights reserved.
        </Typography>
      </Card>
    </Box>
  );
}
