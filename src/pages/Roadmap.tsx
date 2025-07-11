import { Box, Card, Typography, Button } from "@mui/material";

export default function Roadmap() {
  // Use state for the anchor and which card is open

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      gap={2}
      flexWrap="nowrap"
      py={6}
      sx={{
        width: "100%",
        flexDirection: "column",
        overflowY: "none",

        minHeight: 0,
        "@media (min-width:700px)": {
          flexDirection: "row",

          maxHeight: "none",
        },
      }}
    >
      Roadmap
    </Box>
  );
}
