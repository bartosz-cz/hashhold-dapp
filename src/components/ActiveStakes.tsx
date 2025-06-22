import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  CardActions,
  Button,
  Box,
  Paper,
  Avatar,
} from "@mui/material";

import { AVAILABLE_TOKENS } from "../config/supportedTokens";

interface ActiveStakesProps {
  stakedEvents: any[];
  onUnstake: (stakeId: any, info: any) => void;
}

const ActiveStakes: React.FC<ActiveStakesProps> = ({
  stakedEvents,
  onUnstake,
}) => {
  return (
    <Box justifyContent="center" display="flex" flexWrap="wrap" gap={2}>
      {stakedEvents.map((ev, index) => {
        const amount = ev.amount.toString();
        const startDate = new Date(ev.startTime * 1000);
        const endDate = new Date(ev.endTime * 1000);

        const formattedStart = startDate.toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        const formattedEnd = endDate.toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        const tokenInfo = AVAILABLE_TOKENS.find(
          (t) => t.name.toLowerCase() === ev.symbol.toLowerCase()
        );

        return (
          <Box
            key={index}
            sx={{
              width: 250,
              flexShrink: 0,
            }}
          >
            <Card
              sx={{
                width: "100%",
                backgroundColor: "rgba(18, 18, 18, 0.85)", // 10 % białej mgły
                backdropFilter: "blur(8px)", // właściwy blur
                WebkitBackdropFilter: "blur(8px)", // Safari / iOS
                border: "1px solid rgba(77, 77, 77, 0.25)",
              }}
            >
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1}
                  ml={1}
                  mr={1}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar
                      src={tokenInfo?.thumb}
                      alt={ev.symbol}
                      sx={{ width: 24, height: 24 }}
                    />
                    <Typography variant="h6" fontWeight={600} noWrap>
                      {ev.symbol}
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={700} noWrap>
                    {formatCompact(ev.amount)}
                  </Typography>
                </Box>

                <Paper
                  elevation={2}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    opacity: 0.8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    mt: 2,
                  }}
                >
                  <Box textAlign="center" flex={1}>
                    <Typography variant="body2" color="gray">
                      Started:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formattedStart}
                    </Typography>
                  </Box>
                  <Box textAlign="center" flex={1}>
                    <Typography variant="body2" color="gray">
                      Ends:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formattedEnd}
                    </Typography>
                  </Box>
                </Paper>
              </CardContent>

              <CardActions>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => onUnstake(ev, tokenInfo)}
                  fullWidth
                >
                  Withdraw
                </Button>
              </CardActions>
            </Card>
          </Box>
        );
      })}
    </Box>
  );
};

export default ActiveStakes;

const formatCompact = (value: number): string => {
  if (value === 0) return "0.0000";

  const abs = Math.abs(value);
  let suffix = "";
  let divider = 1;

  if (abs >= 1e9) {
    suffix = "B";
    divider = 1e9;
  } else if (abs >= 1e6) {
    suffix = "M";
    divider = 1e6;
  } else if (abs >= 1e3) {
    suffix = "k";
    divider = 1e3;
  }

  const shortVal = value / divider;

  const maxDigits = 5;
  const integerPart = Math.floor(Math.abs(shortVal)).toString();
  let decimalPlaces = Math.max(0, maxDigits - integerPart.length);

  let result = shortVal.toFixed(decimalPlaces);

  // Jeśli mimo to przekracza 5 cyfr (bez przecinka), zmniejsz precyzję
  while (result.replace(".", "").length > maxDigits && decimalPlaces > 0) {
    decimalPlaces--;
    result = shortVal.toFixed(decimalPlaces);
  }

  // Dodaj sufiks jeśli trzeba
  return result + suffix;
};
