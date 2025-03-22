import React, { useState, useEffect } from "react";
import { Container, Grid, Typography, Button } from "@mui/material";

import { MirrorNodeClient } from "../services/wallets/mirrorNodeClient";
import { appConfig } from "../config";
import { useWalletInterface } from "../services/wallets/useWalletInterface";

import {
  HederaContractClient,
  StakeParams,
  WithdrawParams,
} from "../services/contract/HederaContractClient";
import { networkConfig } from "../config/networks";

import ConfirmationDialog, {
  ConfirmationDialogProps,
} from "./confirmationDialog";

import { defaultConfirmationDialogProps } from "../defaults/uiDefaults";
import StakingForm from "./StakingForm";
import ActiveStakes from "./ActiveStakes";

const Content: React.FC = () => {
  const { accountId, walletInterface } = useWalletInterface();

  const [contractClient, setContractClient] = useState<HederaContractClient>(
    new HederaContractClient(walletInterface, {
      contractId: networkConfig.testnet.contractId,
    })
  );

  const [accountInfo, setAccountInfo] = useState();

  const [stakedEvents, setStakedEvents] = useState<any[]>([]);

  const [confirmationDialogProps, setConfirmationDialogProps] =
    useState<ConfirmationDialogProps>(defaultConfirmationDialogProps);
  const mirrorNodeClient = new MirrorNodeClient(appConfig.networks.testnet);
  useEffect(() => {
    setContractClient(
      new HederaContractClient(walletInterface, {
        contractId: networkConfig.testnet.contractId,
      })
    );
    if (accountId) {
      getStakes(accountId);
    } else {
      setAccountInfo(undefined);
      setStakedEvents([]);
    }
  }, [accountId]);

  const getStakes = async (accountId: string) => {
    const accountInfo = await mirrorNodeClient.getAccountInfo(accountId);
    setAccountInfo(accountInfo);
    const stakes = await mirrorNodeClient.getActiveUserStakes(accountId);
    setStakedEvents(stakes);
  };

  const handleWithdraw = async (stakeId: number) => {
    try {
      const withdrawParams: WithdrawParams = { stakeId };
      const txId = await contractClient.withdrawTokens(withdrawParams);
      if (typeof txId !== "string") {
        setStakedEvents((prev) => prev.filter((ev) => ev.stakeId !== stakeId));
      } else {
        alert("Withdraw failed: No Transaction ID returned.");
      }
    } catch (error: any) {
      alert(`Withdraw failed: ${error.message}`);
    }
  };

  const handleClaimReward = async () => {
    try {
      const txId = await contractClient.claimReward();
      if (txId) {
        alert(`Reward claim submitted with transaction ID: ${txId}`);
      } else {
        alert("Reward claim failed: No Transaction ID returned.");
      }
    } catch (error: any) {
      alert(`Reward claim failed: ${error.message}`);
    }
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
      >
        <Grid
          item
          md={3}
          mb={0}
          sx={{
            mt: 5,
            width: 300,
            minWidth: 300,
            maxWidth: 300,
          }}
        >
          <StakingForm
            accountInfo={accountInfo}
            setConfirmationDialogProps={setConfirmationDialogProps}
            contractClient={contractClient}
            mirrorNodeClient={mirrorNodeClient}
            setStakedEvents={setStakedEvents}
          />

          <Grid container justifyContent="center">
            <Grid item xs={6}>
              <Button variant="outlined" fullWidth onClick={handleClaimReward}>
                CLAIM REWARD
              </Button>
            </Grid>
          </Grid>
        </Grid>

        {/* Active Stakes section */}
        {stakedEvents.length > 0 && (
          <Grid
            item
            xs={12}
            md={12}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              maxHeight: "600px",
              overflowY: "auto",
              ml: 5,
            }}
          >
            <Typography variant="h5" align="center" sx={{ mb: 2, mt: 10 }}>
              Active Stakes
            </Typography>
            <ActiveStakes
              stakedEvents={stakedEvents}
              onUnstake={handleWithdraw}
            />
          </Grid>
        )}
      </Grid>

      <ConfirmationDialog {...confirmationDialogProps} />
    </Container>
  );
};

export default Content;
