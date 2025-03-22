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
} from "@mui/material";
import StakingDurationSelector from "./StakingDurationSelector";
import { AVAILABLE_TOKENS } from "../config/supportedTokens";
import { ConfirmationDialogProps } from "./confirmationDialog";
import { StakeParams } from "../services/contract/HederaContractClient";

interface StakingFormProps {
  accountInfo: any;
  setConfirmationDialogProps: (val: ConfirmationDialogProps) => void;
  contractClient: any;
  mirrorNodeClient: any;
  setStakedEvents: React.Dispatch<React.SetStateAction<any[]>>;
}

const preventInvalidKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (["e", "E", "-", "+"].includes(e.key)) {
    e.preventDefault();
  }
};

const textFieldStyle = {
  mb: 2,
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
  return unlockTime.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StakingForm: React.FC<StakingFormProps> = React.memo(
  ({
    accountInfo,
    setConfirmationDialogProps,
    contractClient,
    mirrorNodeClient,
    setStakedEvents,
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

    const normalized = stakeAmount.trim().replace(",", ".");
    const isAmountInvalid =
      normalized === "" || isNaN(Number(normalized)) || Number(normalized) <= 0;

    const handleStake = async () => {
      setConfirmationDialogProps((prev) => ({ ...prev, open: false }));
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
          const response = await contractClient.stakeTokens(stakeParams);
          if (typeof response === "string") {
            setStatus("FAILED");
          } else {
            setStatus("SUCCESS");
            const newStake = await mirrorNodeClient.catchContractEvent(
              accountInfo.account,
              "Staked"
            );
            setStakedEvents((prev) => [...prev, newStake]);
          }
        } catch (error: any) {
          alert(`Staking failed: ${error.message}`);
        } finally {
          setConfirmationDialogProps((prev) => ({ ...prev, open: false }));
        }
      }
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
      <Card sx={{ mb: 2, width: 300 }}>
        <CardContent>
          <Typography variant="h6" align="center" sx={{ mb: 2 }}>
            Stake Tokens
          </Typography>

          {/* Token Select */}
          <FormControl fullWidth sx={textFieldStyle}>
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
                  {token.name}
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
              const raw = e.target.value.replace(",", ".");
              setStakeAmount(raw);

              setStatus(""); // Reset on change
            }}
            error={isAmountInvalid}
            helperText={isAmountInvalid ? "Amount must be greater than 0" : " "}
            onKeyDown={preventInvalidKeys}
            InputProps={numberInputProps}
            sx={textFieldStyle}
            FormHelperTextProps={{ sx: { ml: 0, alignSelf: "center" } }}
          />

          {/* Duration */}
          <StakingDurationSelector
            stakeDuration={stakeDuration}
            setStakeDuration={(val) => {
              setStakeDuration(val);
              setStatus(""); // Reset on change
            }}
          />

          {/* Stake Button */}
          <Button
            variant="contained"
            fullWidth
            disabled={isAmountInvalid || !accountInfo}
            onClick={() => {
              const durationSeconds = parseInt(stakeDuration, 10);
              const readableDuration = formatDuration(durationSeconds);
              const unlockDate = formatUnlockDate(durationSeconds);
              setConfirmationDialogProps({
                open: true,
                title: `Confirm Staking`,
                message: (
                  <>
                    You're about to stake <strong>{stakeAmount}</strong>{" "}
                    <strong>{selectedToken?.name}</strong> for{" "}
                    <strong>{readableDuration}</strong>.
                    <br />
                    <br />
                    This amount will be locked until{" "}
                    <strong>{unlockDate}</strong> and cannot be unstaked earlier
                    without a penalty.
                    <br />
                    <br />
                    Do you want to proceed?
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
            STAKE
          </Button>

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
