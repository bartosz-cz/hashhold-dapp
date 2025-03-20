import React, { useState, useEffect } from "react";
import { MirrorNodeClient } from "../services/wallets/mirrorNodeClient";
import { appConfig } from "../config";
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Collapse,
} from "@mui/material";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import {
  HederaContractClient,
  SetPoolFeeParams,
  StakeParams,
  TokenAssociateParams,
  WithdrawParams,
} from "../services/contract/HederaContractClient";
import { networkConfig } from "../config/networks";
interface Pool {
  token1: string;
  token2: string;
  fee: number;
}

const ContractUi: React.FC = () => {
  const { accountId, walletInterface } = useWalletInterface();
  const [contractClient, setContractClient] = useState<HederaContractClient>(
    new HederaContractClient(walletInterface, {
      contractId: networkConfig.testnet.contractId,
    })
  );

  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [stakeToken, setStakeToken] = useState<string>("");
  const [stakeDuration, setStakeDuration] = useState<string>("");
  const [boostAmount, setBoostAmount] = useState<string>("");
  const [status, setStatus] = useState({ stake: "", associate: "", fee: "" });
  const [stakedEvents, setStakedEvents] = useState<any[]>([]);
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [pool, setPool] = useState<Pool>({
    token1: "",
    token2: "",
    fee: 0,
  });

  useEffect(() => {
    setContractClient(
      new HederaContractClient(walletInterface, {
        contractId: networkConfig.testnet.contractId,
      })
    );
    if (accountId) {
      getStakes(accountId);
    } else {
      setStakedEvents([]);
    }
  }, [accountId]);

  const mirrorNodeClient = new MirrorNodeClient(appConfig.networks.testnet);

  const handleStake = async () => {
    if (accountId) {
      try {
        const stakeParams: StakeParams = {
          tokenId: stakeToken,
          amount: parseInt(stakeAmount, 10),
          duration: parseInt(stakeDuration, 10),
          boostTokenAmount: parseInt(boostAmount, 10),
          priceIds: [
            "3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd",
          ],
        };
        setStatus({ ...status, stake: "" });
        const response = await contractClient.stakeTokens(stakeParams);
        if (typeof response === "string") {
          setStatus({ ...status, stake: "FAILED" });
        } else {
          setStatus({ ...status, stake: "SUCCESS" });

          const newStake = await mirrorNodeClient.catchContractEvent(
            accountId,
            "Staked"
          );
          setStakedEvents([...stakedEvents, newStake]);
        }
      } catch (error: any) {
        alert(`Staking failed: ${error.message}`);
      }
    }
  };

  const getStakes = async (accountId: string) => {
    const stakes = await mirrorNodeClient.getActiveUserStakes(accountId);
    setStakedEvents(stakes);
  };

  const handleWithdraw = async (stakeId: number) => {
    try {
      const withdrawParams: WithdrawParams = {
        stakeId: stakeId,
      };
      const txId = await contractClient.withdrawTokens(withdrawParams);
      if (typeof txId !== "string") {
        let filteredEvents = stakedEvents.filter(
          (ev: any) => ev.stakeId !== stakeId
        );
        setStakedEvents(filteredEvents);
      } else {
        alert("Withdraw failed: No Transaction ID returned.");
      }
    } catch (error: any) {
      alert(`Withdraw failed: ${error.message}`);
    }
  };

  const handleSetPoolFee = async () => {
    try {
      const SetPoolFeeParams: SetPoolFeeParams = {
        token1: pool.token1,
        token2: pool.token2,
        fee: pool.fee,
      };
      const txId = await contractClient.setPoolFee(SetPoolFeeParams);
      if (typeof txId === "string") {
        setStatus({ ...status, fee: "FAILED" });
      } else {
        setStatus({ ...status, fee: "SUCCESS" });
      }
    } catch (error: any) {
      alert(`Withdraw failed: ${error.message}`);
    }
  };

  const handleAssociateToken = async () => {
    try {
      const TokenAssociateParams: TokenAssociateParams = {
        tokenAddress: tokenAddress,
      };
      const txId = await contractClient.associateToken(TokenAssociateParams);
      if (typeof txId === "string") {
        setStatus({ ...status, associate: "FAILED" });
      } else {
        setStatus({ ...status, associate: "SUCCESS" });
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
          flexWrap: "nowrap", // Ensures staking form and stakes stay in one row
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
          <Grid container direction="row" spacing={2}>
            {advancedOpen ? (
              <Grid item>
                <Grid container direction="row" spacing={2}>
                  <div
                    style={{
                      maxHeight: "300px",
                      overflowY: "auto",
                      marginTop: "16px",
                    }}
                  >
                    {/* Associate Token */}
                    <Card sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                          Associate Token
                        </Typography>
                        <TextField
                          fullWidth
                          label="Token Address"
                          variant="outlined"
                          value={tokenAddress}
                          onChange={(e) => setTokenAddress(e.target.value)}
                          sx={{ mb: 2 }}
                        />
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={handleAssociateToken}
                          sx={{ mb: 2 }}
                        >
                          ASSOCIATE
                        </Button>
                        <Typography variant="body2" align="center">
                          {status.associate}
                        </Typography>
                      </CardContent>
                    </Card>

                    {/* Set Pool Fees */}
                    <Card sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                          Set Pool Fees
                        </Typography>
                        <TextField
                          fullWidth
                          label="Token 1"
                          variant="outlined"
                          value={pool.token1}
                          onChange={(e) =>
                            setPool({ ...pool, token1: e.target.value })
                          }
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          label="Token 2"
                          variant="outlined"
                          value={pool.token2}
                          onChange={(e) =>
                            setPool({ ...pool, token2: e.target.value })
                          }
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          label="Fee"
                          variant="outlined"
                          value={pool.fee}
                          onChange={(e) =>
                            setPool({ ...pool, fee: Number(e.target.value) })
                          }
                          sx={{ mb: 2 }}
                        />
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={handleSetPoolFee}
                          sx={{ mb: 2 }}
                        >
                          SET FEES
                        </Button>
                        <Typography variant="body2" align="center">
                          {status.fee}
                        </Typography>
                      </CardContent>
                    </Card>
                  </div>
                </Grid>
              </Grid>
            ) : (
              <Grid item></Grid>
            )}

            <Grid item>
              <Card sx={{ mb: 2, width: 300, minWidth: 300, maxWidth: 300 }}>
                <CardContent>
                  <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                    Stake Tokens
                  </Typography>
                  <TextField
                    fullWidth
                    label="Token Address"
                    variant="outlined"
                    value={stakeToken}
                    onChange={(e) => setStakeToken(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Amount"
                    variant="outlined"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Duration (seconds)"
                    variant="outlined"
                    value={stakeDuration}
                    onChange={(e) => setStakeDuration(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Boost Token Amount"
                    variant="outlined"
                    value={boostAmount}
                    onChange={(e) => setBoostAmount(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleStake}
                    sx={{ mb: 2 }}
                  >
                    STAKE
                  </Button>
                  <Typography variant="body2" align="center">
                    {status.stake}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button variant="outlined" fullWidth onClick={handleClaimReward}>
                REWARD
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setAdvancedOpen(!advancedOpen)}
              >
                ADVANCED
              </Button>
            </Grid>
          </Grid>
        </Grid>

        {stakedEvents.length > 0 ? (
          <Grid
            item
            xs={12}
            md={12} // Ensures "Active Stakes" takes up available space
            sx={{
              display: "flex",
              flexDirection: "column", // Keeps the title above the cards
              alignItems: "center",
              maxHeight: "600px", // Centers the title
              overflowY: "auto",
              ml: 5,
            }}
          >
            <Typography variant="h5" align="center" sx={{ mb: 2, mt: 10 }}>
              Active Stakes
            </Typography>

            {/* Card Grid */}
            <Grid
              container
              spacing={2}
              justifyContent="center" // Ensures even spacing
              sx={{
                display: "flex",
                flexWrap: "wrap", // Allows cards to wrap naturally
                justifyContent: "center", // Centers wrapped cards
              }}
            >
              {stakedEvents.map((ev, index) => {
                const amount = ev.amount.toString();
                const startDate = new Date(ev.startTime * 1000);
                const endDate = new Date(ev.endTime * 1000);
                const formattedStartDate = startDate.toLocaleString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });
                const formattedEndDate = endDate.toLocaleString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });

                return (
                  <Grid item key={index}>
                    <Card
                      sx={{
                        width: "250px",
                        minWidth: "250px",
                        maxWidth: "250px",
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" align="center" noWrap>
                          {amount} {ev.symbol}
                        </Typography>
                        <br />
                        <Typography
                          variant="body2"
                          align="center"
                          color="textSecondary"
                        >
                          Staked: {formattedStartDate}
                          <br />
                          Ends: {formattedEndDate}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => handleWithdraw(ev.stakeId)}
                          fullWidth
                        >
                          Unstake
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        ) : (
          <div></div>
        )}
      </Grid>
    </Container>
  );
};

export default ContractUi;
