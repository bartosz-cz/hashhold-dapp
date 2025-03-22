import {
  AccountId,
  TransactionId,
  EntityIdHelper,
  TokenId,
} from "@hashgraph/sdk";
import { NetworkConfig } from "../../config";
import { ethers, InterfaceAbi, EventLog } from "ethers";
import BigNumber from "bignumber.js";

export class MirrorNodeClient {
  mirrorNodeUrl: string;
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
    console.log(`${this.mirrorNodeUrl}/api/v1/accounts/${accountId}`);
    const accountInfo = await fetch(
      `${this.mirrorNodeUrl}/api/v1/accounts/${accountId}`,
      { method: "GET" }
    );
    console.log(accountInfo);
    const accountInfoJson = await accountInfo.json();
    console.log(accountInfoJson);
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

              console.log("✅ Caught Event:", eventEntry);
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

  async getActiveUserStakes(accountId: string): Promise<any[]> {
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
      const activeStakes: any[] = [];
      const unstakeIds: number[] = [];
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
            console.log(parsedLog?.args.user);
            console.log(accountId);

            if (parsedLog.name === "Staked" || parsedLog.name === "Unstaked") {
              if (
                parsedLog?.args.user.toLowerCase() ===
                accountAddress.toLowerCase()
              ) {
                if (parsedLog.name === "Unstaked") {
                  const unstakeId = Number(parsedLog?.args.stakeId);
                  unstakeIds.push(unstakeId);
                  console.log(`✅ Added Unsatke: +${unstakeId}`);
                  console.log(`✅ Added Unsatke: +${parsedLog?.args.amount}`);
                } else {
                  const stakedIndex = Number(parsedLog?.args.stakeId);
                  if (!unstakeIds.includes(stakedIndex)) {
                    const tokenAddress = parsedLog?.args.tokenId;
                    let tokenSymbol = "";
                    let tokenDecimals = 0;
                    if (
                      tokenAddress ===
                      "0x0000000000000000000000000000000000000000"
                    ) {
                      tokenSymbol = "Hbar";
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
                      tokenDecimals = tokenInfo.decimals;
                    }
                    console.log(parsedLog?.args.stakeId);
                    const eventEntry = {
                      amount:
                        Number(parsedLog?.args.amount) / 10 ** tokenDecimals,
                      startTime: Number(parsedLog?.args.startTime),
                      endTime: Number(parsedLog?.args.endTime),
                      stakeId: BigNumber(parsedLog?.args.stakeId),
                      symbol: tokenSymbol,
                    };
                    activeStakes.push(eventEntry);
                    console.log(`✅ Added Stake: +${eventEntry.stakeId}`);
                  }

                  // Remove unstaked amounts from active stakes
                }
              }
            }
          } catch (err) {
            console.warn("⚠️ Error parsing log:", err);
          }
        }

        // Check for next page
        nextPageUrl = eventData.links?.next
          ? `${this.mirrorNodeUrl}${eventData.links.next}`
          : null;

        // Prevent rate limit issues
        if (nextPageUrl) await new Promise((res) => setTimeout(res, 500));
      }

      console.log(`🎯 Final Active Stakes:`, activeStakes);
      return activeStakes;
    } catch (error) {
      console.error("🚨 Error fetching staking events:", error);
      return [];
    }
  }
}

function evmToHederaAddress(hederaNativeAddress: string) {
  const { shard, realm, num } = EntityIdHelper.fromString(hederaNativeAddress);
  return "0x" + EntityIdHelper.toSolidityAddress([shard, realm, num]);
}
