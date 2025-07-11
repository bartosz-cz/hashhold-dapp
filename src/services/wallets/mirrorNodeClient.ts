//import { AccountId, EntityIdHelper } from "@hashgraph/sdk";
//import { NetworkConfig } from "../../config";
//import { ethers, InterfaceAbi } from "ethers";
//import BigNumber from "bignumber.js";

export class MirrorNodeClient {
  /* mirrorNodeUrl: string;
  contractId: string;
  contractAddress: string;
  jsonRpcUrl: string;
  constructor(networkConfig: NetworkConfig) {
    this.mirrorNodeUrl = networkConfig.mirrorNodeUrl;
    this.contractId = networkConfig.contractId;
    this.jsonRpcUrl = networkConfig.jsonRpcUrl;
    this.contractAddress = networkConfig.contractAddress;
  }

  private abi: InterfaceAbi = [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "startTime",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "endTime",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "stakeId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "tokenId",
          type: "address",
        },
      ],
      name: "Staked",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "stakeId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
        { indexed: false, internalType: "bool", name: "early", type: "bool" },
        {
          indexed: false,
          internalType: "uint256",
          name: "penalty",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "tokenId",
          type: "address",
        },
      ],
      name: "Unstaked",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "epochId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "totalHBARDistributed",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "totalRewardTokenDistributed",
          type: "uint256",
        },
      ],
      name: "RewardsDistributed",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "epochId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "startTime",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "endTime",
          type: "uint256",
        },
      ],
      name: "EpochStarted",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "epochId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "totalReward",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "totalRewardShares",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "rewardPerShare",
          type: "uint256",
        },
      ],
      name: "EpochFinalized",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "tokenId",
          type: "address",
        },
      ],
      name: "TokenAssociated",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "totalReward",
          type: "uint256",
        },
      ],
      name: "RewardClaimed",
      type: "event",
    },
  ];

  async getAccountInfo(accountId: string | AccountId) {
    const accountInfo = await fetch(
      `${this.mirrorNodeUrl}/api/v1/accounts/${accountId}`,
      { method: "GET" }
    );

    const accountInfoJson = await accountInfo.json();

    return accountInfoJson;
  }

  async catchContractEvent(accountId: string, eventName: string): Promise<any> {
    const accountInfo = await this.getAccountInfo(
      AccountId.fromString(accountId)
    );
    const accountAddress = accountInfo.evm_address.toLowerCase(); // Ensure lowercase comparison
    return new Promise((resolve, reject) => {
      try {
        const provider = new ethers.JsonRpcProvider(this.jsonRpcUrl);
        const contract = new ethers.Contract(
          this.contractAddress,
          this.abi,
          provider
        );

        // 🔹 Get account info (Convert Hedera ID to EVM address)

        contract.once(eventName, async (...args: any[]) => {
          try {
            if (args[0].toLowerCase() === accountAddress) {
              const tokenAddress = args[5];
              let tokenSymbol = "";
              let tokenDecimals = 0;

              if (
                tokenAddress === "0x0000000000000000000000000000000000000000"
              ) {
                tokenSymbol = "Hbar";
                tokenDecimals = 8;
              } else {
                try {
                  const tokenId = AccountId.fromEvmAddress(0, 0, tokenAddress);
                  const tokenInfoResponse = await fetch(
                    `${this.mirrorNodeUrl}/api/v1/tokens/${tokenId}`
                  );
                  if (tokenInfoResponse.ok) {
                    const tokenInfo = await tokenInfoResponse.json();
                    tokenSymbol = tokenInfo.symbol;
                    tokenDecimals = tokenInfo.decimals;
                  } else {
                    console.warn(
                      `⚠️ Failed to fetch token info for ${tokenId}`
                    );
                  }
                } catch (error) {
                  console.warn(`⚠️ Invalid token address: ${tokenAddress}`);
                }
              }

              const eventEntry = {
                amount: Number(args[1]) / 10 ** tokenDecimals,
                startTime: Number(args[2]),
                endTime: Number(args[3]),
                stakeId: BigNumber(args[4]),
                symbol: tokenSymbol,
              };
              resolve(eventEntry);
            }
          } catch (error) {
            console.error("❌ Błąd podczas przetwarzania eventu:", error);
            resolve({});
          }
        });
      } catch (error) {
        console.error("🚨 Error setting up event listener:", error);
        reject(error);
      }
    });
  }

  async getActiveUserStakes(accountId: string): Promise<{
    activeStakesList: any[];
    contractTokenBalances: {
      all: { [symbol: string]: number };
      user: { [symbol: string]: number };
    };
    epochInfo: {
      id: BigNumber;
      endTime: BigNumber;
    };
    rewardInfo: {
      allReward: BigNumber;
      userUnclaimed: BigNumber;
    };
  }> {
    try {
      console.log(`🔵 Fetching staking events for user: ${accountId}`);

      // Convert EVM address to Hedera Account ID if needed

      const accountInfo = await this.getAccountInfo(
        AccountId.fromString(accountId)
      );
      const accountAddress = accountInfo.evm_address;
      let nextPageUrl: string | null = `${
        this.mirrorNodeUrl
      }/api/v1/contracts/${
        this.contractId
      }/results/logs?limit=${500}&order=desc`;

      const contractInterface = new ethers.Interface(this.abi);
      const activeStakesList: any[] = [];
      const allTokenBalances: Record<string, number> = {};
      // For user tokens
      const userTokenBalances: Record<string, number> = {};
      const unstakeIds: number[] = [];
      let allShares = 0;
      let userShares = 0;
      const epochInfo: {
        id: BigNumber;
        endTime: BigNumber;
      } = { id: BigNumber(0), endTime: BigNumber(0) };
      const rewardInfo: {
        allReward: BigNumber;
        userUnclaimed: BigNumber;
      } = { allReward: BigNumber(0), userUnclaimed: BigNumber(0) };
      while (nextPageUrl) {
        console.log(`📡 Fetching logs from: ${nextPageUrl}`);
        const response = await fetch(nextPageUrl);
        if (!response.ok) throw new Error("Failed to fetch event logs");

        const eventData = await response.json();
        const logs = eventData.logs;
        for (const log of logs) {
          try {
            const parsedLog = contractInterface.parseLog({
              topics: log.topics,
              data: log.data,
            });
            if (
              parsedLog &&
              (parsedLog.name === "Staked" || parsedLog.name === "Unstaked")
            ) {
              const isUser =
                parsedLog?.args.user.toLowerCase() ===
                accountAddress.toLowerCase();
              const tokenAddress = parsedLog?.args.tokenId;
              let tokenSymbol = "";
              let tokenDecimals = 0;
              if (
                tokenAddress === "0x0000000000000000000000000000000000000000"
              ) {
                tokenSymbol = "HBAR";
                tokenDecimals = 8;
              } else {
                const tokenId = AccountId.fromEvmAddress(
                  0,
                  0,
                  parsedLog?.args.tokenId
                );
                const tokenInfoResponse = await fetch(
                  `${this.mirrorNodeUrl}/api/v1/tokens/${tokenId}`
                );
                const tokenInfo = await tokenInfoResponse.json();
                tokenSymbol = tokenInfo.symbol;
                tokenSymbol = tokenSymbol.toUpperCase();

                tokenDecimals = tokenInfo.decimals;
              }
              if (parsedLog.name === "Unstaked") {
                console.log("Unstake");
                console.log(parsedLog?.args);
                allTokenBalances[tokenSymbol] =
                  (allTokenBalances[tokenSymbol] | 0) -
                  Number(parsedLog?.args.amount) / 10 ** tokenDecimals;

                if (isUser) {
                  userTokenBalances[tokenSymbol] =
                    (userTokenBalances[tokenSymbol] | 0) -
                    Number(parsedLog?.args.amount) / 10 ** tokenDecimals;
                  const unstakeId = Number(parsedLog?.args.stakeId);
                  unstakeIds.push(unstakeId);

                  if (parsedLog?.args.early) {
                    rewardInfo.userUnclaimed = BigNumber(
                      (Number(rewardInfo.userUnclaimed) | 0) +
                        Number(parsedLog?.args.penalty)
                    );
                  }
                }

                if (parsedLog?.args.early) {
                  rewardInfo.allReward = BigNumber(
                    (Number(rewardInfo.allReward) | 0) +
                      Number(parsedLog?.args.penalty) / 10 ** 8
                  );
                }
              } else {
                console.log("Stake");
                console.log(parsedLog?.args);
                allTokenBalances[tokenSymbol] =
                  (allTokenBalances[tokenSymbol] | 0) +
                  Number(parsedLog?.args.amount) / 10 ** tokenDecimals;
                const stakedIndex = Number(parsedLog?.args.stakeId);

                if (isUser) {
                  userTokenBalances[tokenSymbol] =
                    (userTokenBalances[tokenSymbol] | 0) +
                    Number(parsedLog?.args.amount) / 10 ** tokenDecimals;
                  if (!unstakeIds.includes(stakedIndex)) {
                    const eventEntry = {
                      amount:
                        Number(parsedLog?.args.amount) / 10 ** tokenDecimals,
                      startTime: Number(parsedLog?.args.startTime),
                      endTime: Number(parsedLog?.args.endTime),
                      stakeId: BigNumber(parsedLog?.args.stakeId),
                      symbol: tokenSymbol,
                      rewardShares: BigNumber(parsedLog?.args.rewa),
                    };

                    activeStakesList.push(eventEntry);
                  }
                }
              }
            } else if (
              parsedLog?.name === "EpochStarted" &&
              parsedLog?.args.endTime > epochInfo["endTime"]
            ) {
              epochInfo["id"] = parsedLog?.args.epochId;
              epochInfo["endTime"] = parsedLog?.args.endTime;
            } else if (
              parsedLog?.name === "RewardClaimed" &&
              parsedLog?.args.user.toLowerCase() ===
                accountAddress.toLowerCase()
            ) {
              rewardInfo.userUnclaimed = BigNumber(
                Number(rewardInfo.userUnclaimed) -
                  Number(parsedLog?.args.totalReward)
              );
            }
          } catch (err) {
            console.warn("⚠️ Error parsing log:", err);
          }
        }

        nextPageUrl = eventData.links?.next
          ? `${this.mirrorNodeUrl}${eventData.links.next}`
          : null;

        if (nextPageUrl) await new Promise((res) => setTimeout(res, 500));
      }
      return {
        activeStakesList,
        contractTokenBalances: {
          all: allTokenBalances,
          user: userTokenBalances,
        },
        epochInfo,
        rewardInfo,
      };
    } catch (error) {
      console.error("🚨 Error fetching staking events:", error);
      return {
        activeStakesList: [],
        contractTokenBalances: {
          all: {},
          user: {},
        },
        epochInfo,
        rewardInfo,
      };
    }
  }*/
}

/*function evmToHederaAddress(hederaNativeAddress: string) {
  const { shard, realm, num } = EntityIdHelper.fromString(hederaNativeAddress);
  return "0x" + EntityIdHelper.toSolidityAddress([shard, realm, num]);
}*/

//new version
