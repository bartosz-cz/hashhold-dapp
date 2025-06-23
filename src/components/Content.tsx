import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Box,
  Avatar,
  Card,
} from "@mui/material";

import { MirrorNodeClient } from "../services/wallets/mirrorNodeClient";
import { StakingService } from "../services/mirrorNodeClientV2";
import { appConfig } from "../config";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import LoadingOverlay from "./LoadingScreen";
import {
  HederaContractClient,
  WithdrawParams,
} from "../services/contract/HederaContractClient";
import { networkConfig } from "../config/networks";

import ConfirmationDialog, {
  ConfirmationDialogProps,
} from "./confirmationDialog";

import { defaultConfirmationDialogProps } from "../defaults/uiDefaults";
import StakingForm from "./StakingForm";
import StakeInfo from "./StakeInfo";
import ActiveStakes from "./ActiveStakes";

type ContentProps = {
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setLastStakes: React.Dispatch<React.SetStateAction<any>>;
};

const Content: React.FC<ContentProps> = ({ setIsLoading, setLastStakes }) => {
  const { accountId, walletInterface } = useWalletInterface();

  const [contractClient, setContractClient] = useState<HederaContractClient>(
    new HederaContractClient(walletInterface, {
      contractId: networkConfig.testnet.contractId,
    })
  );

  const [accountInfo, setAccountInfo] = useState();
  const [contractTokenBalances, setContractTokenBalances] = useState<{
    all: { [symbol: string]: number };
    user: { [symbol: string]: number };
  }>({
    all: {},
    user: {},
  });

  const [stakedEvents, setStakedEvents] = useState<any[]>([]);
  const [epochInfo, setEpochInfo] = useState<any>({});
  const [rewardInfo, setRewardInfo] = useState<any>({});
  const [view, setView] = useState<"form" | "info">("form");

  const [confirmationDialogProps, setConfirmationDialogProps] =
    useState<ConfirmationDialogProps>(defaultConfirmationDialogProps);
  const mirrorNodeClient = new StakingService(appConfig.networks.testnet);

  useEffect(() => {
    if (accountId) {
      setContractClient(
        new HederaContractClient(walletInterface, {
          contractId: networkConfig.testnet.contractId,
        })
      );
      getStakes(accountId);
    } else {
      resetStakingData();
    }
  }, [accountId]);

  const getStakes = async (accountId: string) => {
    const accountInfo = await mirrorNodeClient.getAccountInfo(accountId);

    await mirrorNodeClient.initializeData(accountInfo.account);
    setAccountInfo(accountInfo);
    // 1. Provide a callback that re-queries the data from the service
    mirrorNodeClient.onDataUpdated = () => {
      const {
        activeStakesList,
        contractTokenBalances,
        epochInfo,
        rewardInfo,
        lastStakes,
      } = mirrorNodeClient.getStakingData();
      setLastStakes(lastStakes);
      setContractTokenBalances({ ...contractTokenBalances });
      setStakedEvents(activeStakesList);
      setEpochInfo(epochInfo);
      setRewardInfo(rewardInfo);
    };

    // 2. Subscribe to events after setting the callback
    mirrorNodeClient.subscribeToEvents(accountInfo?.account);

    // 3. Immediately do one fetch
    mirrorNodeClient.onDataUpdated?.();
  };

  const resetStakingData = () => {
    setAccountInfo(undefined);
    setContractTokenBalances({ all: {}, user: {} });
    setStakedEvents([]);
  };

  const handleWithdraw = async (stakeId: number) => {
    setConfirmationDialogProps((prev) => ({ ...prev, open: false }));
    setIsLoading(true);
    try {
      const withdrawParams: WithdrawParams = { stakeId };

      console.log("withdraw                      " + stakeId);
      const txId = await contractClient.withdrawTokens(withdrawParams);

      if (typeof txId !== "string") {
        // mirrorNodeClient.waitForStakedEvent(accountId);
        setStakedEvents((prev) => prev.filter((ev) => ev.stakeId !== stakeId));
      }
    } catch (error: any) {
      console.error(error);
    }
    setIsLoading(false);
  };

  return (
    <Container>
      <Grid
        container
        alignItems="center"
        justifyContent="center"
        sx={{
          display: "flex",
          flexWrap: "nowrap",
          justifyContent: "center",
          width: "100%",
        }}
        gap={4}
      >
        <Grid
          item
          md={3}
          mb={0}
          sx={{
            mt: 1,
            width: 300,
            minWidth: 300,
            maxWidth: 300,
          }}
        >
          <Grid
            item
            md={3}
            mb={0}
            sx={{ mt: 5, width: 300, minWidth: 300, maxWidth: 300 }}
          >
            {view === "form" ? (
              <StakingForm
                accountInfo={accountInfo}
                setConfirmationDialogProps={setConfirmationDialogProps}
                contractClient={contractClient}
                mirrorNodeClient={mirrorNodeClient}
                setStakedEvents={setStakedEvents}
                setIsLoading={setIsLoading}
              />
            ) : (
              <StakeInfo
                accountInfo={accountInfo}
                mirrorNodeClient={mirrorNodeClient}
                contractClient={contractClient}
                contractTokenBalances={contractTokenBalances}
                epochInfo={epochInfo}
                rewardInfo={rewardInfo}
              />
            )}
          </Grid>

          <Grid container justifyContent="center">
            <Grid item>
              <Grid container justifyContent="center" sx={{ mt: 0 }}>
                <ToggleButtonGroup
                  value={view}
                  exclusive
                  onChange={(_, val) => val && setView(val)}
                  sx={{
                    backgroundColor: "#333",
                    borderRadius: "999px",
                    p: 0.5,
                  }}
                >
                  <ToggleButton
                    value="form"
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      m: 0.5,
                      backgroundColor: view === "form" ? "#7b61ff" : "#888",
                      "&.Mui-selected": {
                        backgroundColor: "#7b61ff",
                      },
                      "&:hover": {
                        backgroundColor: "#a58aff",
                      },
                    }}
                  />
                  <ToggleButton
                    value="info"
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      m: 0.5,
                      backgroundColor: view === "info" ? "#7b61ff" : "#888",
                      "&.Mui-selected": {
                        backgroundColor: "#7b61ff",
                      },
                      "&:hover": {
                        backgroundColor: "#a58aff",
                      },
                    }}
                  />
                </ToggleButtonGroup>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Active Stakes section */}
        {stakedEvents.length > 0 && (
          <Grid
            item
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "550px",
              maxHeight: "550px",
              overflowY: "auto",

              mt: 5,
            }}
          >
            <Card
              sx={{
                mb: 2,

                display: "flex",
                flexDirection: "column",
                backgroundColor: "rgba(18, 18, 18, 0.85)", // 10 % białej mgły
                backdropFilter: "blur(8px)", // właściwy blur
                WebkitBackdropFilter: "blur(8px)", // Safari / iOS
                border: "1px solid rgba(77, 77, 77, 0.25)", // subtelny obrys (opcjonalnie)
              }}
            >
              <Typography variant="h5" align="center" sx={{ m: 1 }}>
                Active Holds
              </Typography>
            </Card>
            <ActiveStakes
              stakedEvents={stakedEvents}
              onUnstake={(ev, info) => {
                const endDate = new Date(ev.endTime * 1000);
                const formattedEnd = endDate.toLocaleString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });
                setConfirmationDialogProps({
                  open: true,
                  title: `Confirm Withdraw`,
                  Content: (
                    <>
                      <Box display="flex" justifyContent="center" mb={2}>
                        <Avatar
                          src={info?.large}
                          sx={{
                            width: 80,
                            height: 80,
                            backgroundColor: "transparent",
                          }}
                        />
                      </Box>
                      <Box textAlign="center" mb={1}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          <strong>{formatCompact(ev.amount)}</strong>{" "}
                          {info.name}
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
                          {formattedEnd}
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
                  onConfirm: () => handleWithdraw(ev.stakeId),
                  onCancel: () =>
                    setConfirmationDialogProps((prev) => ({
                      ...prev,
                      open: false,
                    })),
                });
              }}
            />
          </Grid>
        )}
      </Grid>

      <ConfirmationDialog {...confirmationDialogProps} />
    </Container>
  );
};

export default Content;

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
