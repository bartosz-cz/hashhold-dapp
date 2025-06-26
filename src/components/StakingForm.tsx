import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  OutlinedInputProps,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Box,
  Avatar,
  Paper,
} from "@mui/material";
import StakingDurationSelector from "./StakingDurationSelector";
import { AVAILABLE_TOKENS } from "../config/supportedTokens";
import { ConfirmationDialogProps } from "./confirmationDialog";
import { StakeParams } from "../services/contract/HederaContractClient";
import {
  useRewardShares,
  useTokenUsdValue,
} from "../contexts/TokenInfoContext";
interface StakingFormProps {
  accountInfo: any;
  setConfirmationDialogProps: (val: ConfirmationDialogProps) => void;
  contractClient: any;
  mirrorNodeClient: any;
  setStakedEvents: React.Dispatch<React.SetStateAction<any[]>>;
  setIsLoading: any;
}

const preventInvalidKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (["e", "E", "-", "+"].includes(e.key)) {
    e.preventDefault();
  }
};

const textFieldStyle = {
  "& input:-webkit-autofill": {
    WebkitBoxShadow: "0 0 0 1000px #1e1e1e inset !important",
    WebkitTextFillColor: "#fff !important",
  },
  "& input:-webkit-autofill:focus": {
    WebkitBoxShadow: "0 0 0 1000px #1e1e1e inset !important",
  },
};

function formatAmountToIntegerString(input: string, decimals: number): string {
  const sanitized = input.replace(",", ".").trim();
  if (!sanitized || isNaN(Number(sanitized))) return "0";
  const [intPart, fracPart = ""] = sanitized.split(".");
  const cleanFrac = fracPart.slice(0, decimals).padEnd(decimals, "0");
  const result = `${intPart}${cleanFrac}`.replace(/^0+(?=\d)/, "");
  return result || "0";
}

const formatDuration = (seconds: number): string => {
  const weeks = Math.floor(seconds / (7 * 24 * 60 * 60));
  const years = Math.floor(weeks / 52);
  const months = Math.floor((weeks % 52) / 4);
  const remainingWeeks = weeks % 4;

  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  if (remainingWeeks > 0)
    parts.push(`${remainingWeeks} ${remainingWeeks === 1 ? "week" : "weeks"}`);

  return parts.length > 0 ? parts.join(", ") : "2 weeks";
};

// Helper to format the unlock date
const formatUnlockDate = (secondsFromNow: number): string => {
  const unlockTime = new Date(Date.now() + secondsFromNow * 1000);
  return unlockTime.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const StakingForm: React.FC<StakingFormProps> = React.memo(
  ({
    accountInfo,
    setConfirmationDialogProps,
    contractClient,
    mirrorNodeClient,
    setStakedEvents,
    setIsLoading,
  }) => {
    const [stakeAmount, setStakeAmount] = useState("10");

    const [stakeToken, setStakeToken] = useState(
      "0x0000000000000000000000000000000000000000"
    );
    const [stakeDuration, setStakeDuration] = useState("14515200");
    const [boostAmount, setBoostAmount] = useState("0");
    const [status, setStatus] = useState("");

    const selectedToken = AVAILABLE_TOKENS.find(
      (t) => t.addressEVM === stakeToken
    );

    const decimals = selectedToken?.decimals ?? 0;
    const humanAmount = stakeAmount.replace(",", ".").trim(); // "0.000000"
    const asNumber = Number(humanAmount); // 0
    const smallestUnit = Math.round(asNumber * 10 ** decimals); // 0
    const amountBigInt = BigInt(smallestUnit);
    const rewardShares = useRewardShares(
      selectedToken?.address,
      amountBigInt,
      BigInt(stakeDuration || 0),
      BigInt(boostAmount || 0)
    );
    const tokensValue = useTokenUsdValue(selectedToken?.address, amountBigInt);
    console.warn(tokensValue);
    console.log("Reward");
    console.log(rewardShares);
    const normalized = stakeAmount.trim().replace(",", ".");
    const isAmountInvalid =
      normalized === "" || isNaN(Number(normalized)) || Number(normalized) <= 0;

    const handleStake = async () => {
      setConfirmationDialogProps((prev) => ({ ...prev, open: false }));
      setIsLoading(true);
      if (accountInfo?.account) {
        try {
          const stakeParams: StakeParams = {
            tokenId: stakeToken,
            amount: parseInt(
              formatAmountToIntegerString(stakeAmount, decimals),
              10
            ),
            duration: Math.round(parseInt(stakeDuration, 10) / 500000),
            boostTokenAmount: parseInt(boostAmount, 10),
            priceIds: [
              "3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd",
            ],
          };
          //mirrorNodeClient.waitForStakedEvent(accountInfo.account);
          const response = await contractClient.stakeTokens(stakeParams);

          console.warn(response);
          if (typeof response === "string") {
            setStatus("FAILED");
          } else {
            setStatus("SUCCESS");

            //setStakedEvents((prev) => [...prev, newStake]);
          }
        } catch (error: any) {
          console.error(error);
        } finally {
          setConfirmationDialogProps((prev) => ({ ...prev, open: false }));
        }
      }
      console.warn("stopped stacking");
      setIsLoading(false);
    };

    const getTokenBalance = (): number => {
      if (selectedToken?.address === "0") {
        return accountInfo?.balance?.balance || 0;
      }
      const token = accountInfo?.balance?.tokens?.find(
        (t: any) => t.token_id === selectedToken?.address
      );
      return token?.balance || 0;
    };

    const handleSetPercentage = (percentage: number) => {
      const rawBalance = getTokenBalance();
      const humanBalance = rawBalance / Math.pow(10, decimals);
      setStakeAmount((humanBalance * percentage).toFixed(decimals));
      setStatus(""); // Reset status on change
    };

    const numberInputProps: Partial<OutlinedInputProps> = {
      inputProps: {
        min: 0,
        style: { appearance: "none" as const },
      },
      sx: {
        "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
          {
            display: "none",
          },
        "& input[type=number]": { MozAppearance: "textfield" as const },
      },
      endAdornment: (
        <InputAdornment position="end">
          <Button
            variant="outlined"
            size="small"
            sx={{ mr: 1, minWidth: "10px", p: "2px 4px" }}
            onClick={() => handleSetPercentage(0.5)}
          >
            50%
          </Button>
          <Button
            variant="outlined"
            size="small"
            sx={{ minWidth: "10px", p: "2px 4px" }}
            onClick={() => handleSetPercentage(1)}
          >
            MAX
          </Button>
        </InputAdornment>
      ),
    };

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
            Hold Tokens
          </Typography>

          {/* Token Select */}
          <FormControl fullWidth sx={{ ...textFieldStyle, mb: 2 }}>
            <InputLabel id="select-label">Select Token</InputLabel>
            <Select
              labelId="select-label"
              label="Select Token"
              value={
                AVAILABLE_TOKENS.find((t) => t.addressEVM === stakeToken)
                  ?.address || ""
              }
              onChange={(e) => {
                const selected = AVAILABLE_TOKENS.find(
                  (t) => t.address === e.target.value
                );
                if (selected) {
                  setStakeToken(selected.addressEVM);
                  setStakeAmount("10");
                  setStatus("");
                }
              }}
              variant="outlined"
            >
              {AVAILABLE_TOKENS.map((token) => (
                <MenuItem key={token.address} value={token.address}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar
                      src={token.thumb}
                      alt={"ICON"}
                      sx={{ width: 24, height: 24 }}
                    />
                    {token.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Amount Input */}
          <TextField
            fullWidth
            type="number"
            label="Amount"
            variant="outlined"
            value={stakeAmount}
            onChange={(e) => {
              if (e.target.value.length > 16) return;
              const raw = e.target.value.replace(",", ".");
              setStakeAmount(raw);
              setStatus(""); // reset błędu
            }}
            error={isAmountInvalid || (tokensValue < 1 && tokensValue != 0)}
            helperText={
              tokensValue < 1 && tokensValue != 0
                ? `Token value must be greater than $1 ($${(
                    Math.floor(tokensValue * 100) / 100
                  ).toFixed(2)})`
                : tokensValue != 0
                ? `$${(Math.floor(tokensValue * 100) / 100).toFixed(2)}`
                : "\u00a0"
            }
            onKeyDown={preventInvalidKeys}
            InputProps={numberInputProps}
            sx={{
              ...textFieldStyle,
              mb: 0,
            }}
            FormHelperTextProps={{
              sx: {
                ml: 0,
                alignSelf: "center",
                color: isAmountInvalid ? "error.main" : "text.secondary",
              },
            }}
          />

          {/* Duration */}
          <StakingDurationSelector
            stakeDuration={stakeDuration}
            setStakeDuration={(val) => {
              setStakeDuration(val);
              setStatus(""); // Reset on change
            }}
          />
          <Paper
            elevation={2}
            sx={{
              p: 1,
              mb: 2,
              borderRadius: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              mt: 0,
              opacity: 0.8,
            }}
          >
            <Box
              textAlign="center"
              flexDirection="row"
              display="flex"
              flex={1}
              justifyContent="center"
              alignItems="center"
              sx={{
                gap: 1,
              }}
            >
              <Typography variant="body2" color="gray" display="inline">
                Reward Shares:&nbsp;
              </Typography>
              <Typography variant="body1" fontWeight="bold" display="inline">
                {formatCompact(Number(rewardShares))}
              </Typography>
            </Box>
          </Paper>
          <Box mt="auto">
            <Button
              variant="contained"
              fullWidth
              disabled={isAmountInvalid || !accountInfo || tokensValue < 1}
              onClick={() => {
                const durationSeconds = parseInt(stakeDuration, 10);
                const readableDuration = formatDuration(durationSeconds);
                const unlockDate = formatUnlockDate(durationSeconds);
                setConfirmationDialogProps({
                  open: true,
                  title: `Confirm Holding`,
                  Content: (
                    <>
                      <Box display="flex" justifyContent="center" mb={2}>
                        <Avatar
                          src={selectedToken?.large}
                          sx={{
                            width: 80,
                            height: 80,
                            backgroundColor: "transparent",
                          }}
                        />
                      </Box>
                      <Box textAlign="center" mb={1}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          <strong>{formatCompact(stakeAmount)}</strong>{" "}
                          {selectedToken?.name}
                        </Typography>
                      </Box>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        bgcolor="#2a2a2a"
                        borderRadius={2}
                        px={2}
                        py={1}
                        my={2}
                        minWidth={250}
                      >
                        <Typography variant="body2" color="gray">
                          Ends on:
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {unlockDate}
                        </Typography>
                      </Box>
                      <Typography
                        textAlign="center"
                        variant="caption"
                        color="gray"
                        marginBottom={2}
                      >
                        Early withdrawal during the hold period
                        <br />
                        will result in a <strong>10% penalty</strong>.
                      </Typography>
                    </>
                  ),
                  onConfirm: handleStake,
                  onCancel: () =>
                    setConfirmationDialogProps((prev) => ({
                      ...prev,
                      open: false,
                    })),
                });
              }}
            >
              HOLD
            </Button>
          </Box>

          {/* Status */}
          {status !== "" && (
            <Typography
              variant="body2"
              align="center"
              sx={{ mt: 3 }}
              color={status === "FAILED" ? "error" : "primary"}
            >
              {status}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  }
);

export default StakingForm;

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
