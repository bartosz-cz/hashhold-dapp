import React from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Paper,
} from "@mui/material";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { AVAILABLE_TOKENS } from "../config/supportedTokens";
import { StakingService } from "../services/mirrorNodeClientV2";
import { appConfig } from "../config";

interface StakeInfoProps {
  accountInfo: any;
  contractClient: any;
  mirrorNodeClient: any;
  contractTokenBalances: {
    all: { [symbol: string]: number };
    user: { [symbol: string]: number };
  };
  epochInfo: {
    id: number | undefined;
    endTime: number | undefined;
    epochReward: number | undefined;
  };
  rewardInfo: {
    allReward: number | undefined;
    userClaimed: number | undefined;
    userUnclaimed: number | undefined;
  };
}

const StakeInfo: React.FC<StakeInfoProps> = ({
  accountInfo,
  contractClient,
  mirrorNodeClient,
  contractTokenBalances,
  epochInfo,
  rewardInfo,
}) => {
  // Safely convert values
  const currentEpoch = Number(epochInfo?.id || 0);
  const epochEnds = Number(epochInfo?.endTime || 0);
  const lastEpochReward = Number(epochInfo?.epochReward || 0);
  const totalAllReward = Number(rewardInfo?.allReward || 0);
  const userClaimed = Number(rewardInfo?.userClaimed || 0);
  const userUnclaimed = Number(rewardInfo?.userUnclaimed || 0);

  // Format epoch end date
  const formatEpochEnd = (end: number) => {
    if (!end) return "-";
    const date = new Date(end * 1000);
    return date.toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const formatTimeToEpochEnd = (end: number): string => {
    if (!end) return "-";

    const now = Date.now(); // aktualny czas w ms
    const endTime = end * 1000; // zamiana na ms
    const diff = endTime - now;

    if (diff <= 0) return "Ended";

    const totalHours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    const dayLabel = days === 1 ? "day" : "days";
    const hourLabel = hours === 1 ? "hour" : "hours";

    if (days > 0 && hours > 0)
      return `${days} ${dayLabel}, ${hours} ${hourLabel}`;
    if (days > 0) return `${days} ${dayLabel}`;
    return `${hours} ${hourLabel}`;
  };
  const handleClaimReward = async () => {
    // (Optional) re-initialize data if needed
    //const service = new StakingService(appConfig.networks.testnet);
    //await service.initializeData(accountInfo?.account);
    //service.catchEventForTx("RewardClaimed", accountInfo?.account);

    try {
      const txId = await contractClient.claimReward();
    } catch (err) {
      console.error(err);
    }
  };
  console.warn(userUnclaimed);
  return (
    <Card
      sx={{
        mb: 2,
        width: 300,
        height: 510,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "rgba(18, 18, 18, 0.85)", // 10 % białej mgły
        backdropFilter: "blur(8px)", // właściwy blur
        WebkitBackdropFilter: "blur(8px)", // Safari / iOS
        border: "1px solid rgba(77, 77, 77, 0.25)", // subtelny obrys (opcjonalnie)
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          "&:last-child": { pb: 2 },
        }}
      >
        <Typography variant="h6" align="center" sx={{ mb: 2 }}>
          Service Info
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 2,
          }}
        >
          <Paper
            elevation={2}
            sx={{
              p: 1.5,
              opacity: 0.8,
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
          >
            <Typography
              variant="body2"
              color="gray"
              sx={{
                mb: 0.2,
                fontWeight: 500,
                textAlign: "center",
              }}
            >
              Epoch
            </Typography>
            <Typography
              variant="h6" // większy tekst
              sx={{
                fontWeight: 700, // pogrubienie
                textAlign: "center",
              }}
            >
              {currentEpoch || "-"}
            </Typography>
          </Paper>

          <Paper
            elevation={2}
            sx={{
              p: 1.5,
              opacity: 0.8,
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
          >
            <Typography
              variant="body2"
              color="gray"
              sx={{
                mb: 0.2,
                fontWeight: 500,
                textAlign: "center",
              }}
            >
              Ends
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              {formatTimeToEpochEnd(epochEnds)}
            </Typography>
          </Paper>
        </Box>
        <Paper
          elevation={2}
          sx={{
            mb: 2,
            p: 1.5,
            opacity: 0.8,
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            flex: 1, // pozwala Paper wypełnić rodzica (jeśli jego rodzic też ma wysokość!)
            minHeight: 0, // zapobiega przekroczeniu kontenera
          }}
        >
          {/* Nagłówki */}
          <Box
            display="flex"
            justifyContent="space-between"
            px={1}
            mb={1}
            sx={{
              fontWeight: 600,
              borderBottom: "1px solid",
              borderColor: "divider",
              pb: 0.5,
            }}
          >
            <Typography sx={{ width: "33%" }} color="gray">
              Token
            </Typography>
            <Typography sx={{ width: "33%", textAlign: "center" }} color="gray">
              Yours
            </Typography>
            <Typography sx={{ width: "33%", textAlign: "right" }} color="gray">
              Total
            </Typography>
          </Box>

          {/* Lista która wypełnia przestrzeń */}
          <Box
            sx={{
              flex: 1, // <<< KLUCZOWE
              overflowY: "auto",
              pr: 1,
              scrollbarWidth: "thin",
              scrollbarColor: "#ccc transparent",
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#bbb",
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                backgroundColor: "#999",
              },
            }}
          >
            <List dense disablePadding>
              {AVAILABLE_TOKENS.map((token) => {
                const userBalRaw =
                  contractTokenBalances.user[token.name] || 0.0;
                const allBalRaw = contractTokenBalances.all[token.name] || 0.0;

                if (userBalRaw <= 0 && allBalRaw <= 0)
                  return (
                    <ListItem
                      key={token.name}
                      disableGutters
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        px: 1,
                        py: 0.75,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography sx={{ width: "33%" }}>
                        {token.name}
                      </Typography>
                      <Typography
                        sx={{
                          width: "33%",
                          textAlign: "center",
                          fontWeight: 700,
                        }}
                      >
                        -
                      </Typography>
                      <Typography
                        sx={{
                          width: "33%",
                          textAlign: "right",
                          fontWeight: 700,
                        }}
                      >
                        -
                      </Typography>
                    </ListItem>
                  );

                const userBal = formatCompact(userBalRaw);
                const allBal = formatCompact(allBalRaw);

                return (
                  <ListItem
                    key={token.name}
                    disableGutters
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      px: 1,
                      py: 0.75,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography sx={{ width: "33%" }}>{token.name}</Typography>
                    <Typography
                      sx={{
                        width: "33%",
                        textAlign: "center",
                        fontWeight: 700,
                      }}
                    >
                      {userBal}
                    </Typography>
                    <Typography
                      sx={{ width: "33%", textAlign: "right", fontWeight: 700 }}
                    >
                      {allBal}
                    </Typography>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Paper>

        {/* Rewards Info */}
        <Box sx={{ mb: 2 }}>
          {/* Tytuł Rewards */}
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              textAlign: "center",
              mb: 1.5,
            }}
          >
            Rewards
          </Typography>

          {/* Kafelki */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
            }}
          >
            {/* Total */}

            {/* Claimed */}
            <Paper
              elevation={2}
              sx={{
                p: 1.5,
                opacity: 0.8,
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{ mb: 0.2, fontWeight: 500, textAlign: "center" }}
                color="gray"
              >
                Claimed
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, textAlign: "center" }}
              >
                {formatCompact(userClaimed)}ℏ
              </Typography>
            </Paper>

            {/* Unclaimed */}
            <Paper
              elevation={2}
              sx={{
                p: 1.5,
                opacity: 0.8,
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
              }}
            >
              <Typography
                variant="body2"
                color="gray"
                sx={{ mb: 0.2, fontWeight: 500, textAlign: "center" }}
              >
                Unclaimed
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, textAlign: "center" }}
              >
                {formatCompact(userUnclaimed / 1e8)}ℏ
              </Typography>
            </Paper>
          </Box>
        </Box>

        {/* Claim Button */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* put the rest of the panel’s content here */}
          {/* … */}

          <Button
            sx={{ mt: "auto" }} // pushes itself to the bottom
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleClaimReward}
            disabled={!accountInfo || userUnclaimed / 1e8 <= 0}
          >
            Claim Rewards
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StakeInfo;

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

  while (result.replace(".", "").length > maxDigits && decimalPlaces > 0) {
    decimalPlaces--;
    result = shortVal.toFixed(decimalPlaces);
  }

  // Dodaj sufiks jeśli trzeba
  return result + suffix;
};
