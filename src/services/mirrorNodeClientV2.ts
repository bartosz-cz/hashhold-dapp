import { ethers, EventLog, InterfaceAbi, Contract } from "ethers";
import { PriceServiceConnection } from "@pythnetwork/price-service-client";
import BigNumber from "bignumber.js";
import { AccountId } from "@hashgraph/sdk";
import { NetworkConfig } from "../config";
import { Interface } from "ethers";

/** The shape of your local in-memory data. */
interface StakingData {
  activeStakesList: any[];
  contractTokenBalances: {
    all: { [symbol: string]: BigNumber };
    user: { [symbol: string]: BigNumber };
  };
  epochInfo: {
    id: BigNumber;
    endTime: BigNumber;
    epochReward: BigNumber;
    userUnclaimedReward: BigNumber;
  };
  rewardInfo: {
    allReward: BigNumber;
    userShares: BigNumber;
    userUnclaimed: BigNumber;
    userClaimed: BigNumber;
  };
  lastStakes: any[];
}
interface TokenInfo {
  id: string; // np. "0.0.731861"
  symbol: string; // np. "SAUCE"
  decimals: number; // np. 6
  priceUsd: number; // np. 0.0176
}
/**
 * Service that:
 * 1) Fetches logs from Mirror Node (historical).
 * 2) Subscribes to real-time events for the *single user* we care about.
 * 3) Maintains an in-memory snapshot of that user’s staking data.
 */
export class StakingService {
  private provider: ethers.WebSocketProvider;
  private contract: Contract;

  private stakingData: StakingData;
  private evmAddressCache: string = ""; // The user’s EVM address for isUserEvent checks

  // A callback you can set from the outside to re-render UI, etc.
  public onDataUpdated?: () => void;

  // The contract’s ABI
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
        {
          indexed: false,
          internalType: "uint256",
          name: "rewardShares",
          type: "uint256",
        },
      ],
      name: "Staked",
      type: "event",
    },
    {
      name: "Unstaked",
      type: "event",
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
      anonymous: false,
    },
    {
      name: "EpochStarted",
      type: "event",
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
      anonymous: false,
    },
    {
      name: "EpochFinalized",
      type: "event",
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
      anonymous: false,
    },
    {
      name: "RewardClaimed",
      type: "event",
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
      anonymous: false,
    },
  ];

  constructor(private networkConfig: NetworkConfig) {
    // Initialize empty data structures
    this.stakingData = {
      activeStakesList: [],
      contractTokenBalances: { all: {}, user: {} },
      epochInfo: {
        id: new BigNumber(0),
        endTime: new BigNumber(0),
        epochReward: new BigNumber(0),
        userUnclaimedReward: new BigNumber(0),
      },
      rewardInfo: {
        allReward: new BigNumber(0),
        userShares: new BigNumber(0),
        userUnclaimed: new BigNumber(0),
        userClaimed: new BigNumber(0),
      },
      lastStakes: [],
    };

    this.provider = new ethers.WebSocketProvider(this.networkConfig.jsonRpcUrl);
    this.contract = new ethers.Contract(
      this.networkConfig.contractAddress,
      this.abi,
      this.provider
    );
  }

  /**
   * Fetch all logs from the Mirror Node and replay them. Then store
   * final data in `this.stakingData`.
   */
  public async initializeData(accountId: string): Promise<void> {
    this.evmAddressCache = await this.getEvmAddress(accountId);
    console.log(
      "[StakingService] initializeData -> evmAddressCache=",
      this.evmAddressCache
    );

    const {
      activeStakesList,
      contractTokenBalances,
      epochInfo,
      rewardInfo,
      lastStakes,
    } = await this.fetchAllStakingData(accountId);

    this.stakingData.activeStakesList = activeStakesList;
    this.stakingData.contractTokenBalances = contractTokenBalances;
    this.stakingData.epochInfo.id = epochInfo.id;
    this.stakingData.epochInfo.endTime = epochInfo.endTime;
    this.stakingData.rewardInfo.allReward = rewardInfo.allReward;
    this.stakingData.rewardInfo.userUnclaimed = rewardInfo.userUnclaimed;
    this.stakingData.lastStakes = lastStakes;
  }

  /**
   * Subscribe to real-time contract events. We'll only update user data
   * if `this.isUserEvent(...)` returns true.
   */
  public subscribeToEvents(accountId: string): void {
    console.warn("subscribed");
    console.warn(this.provider);
    console.warn(this.contract);
    this.contract.on("Staked", (...rawArgs) => {
      console.warn("stacked");
      const parsedLog = { name: "Staked", args: [...rawArgs] };
      this.processParsedLog(parsedLog, accountId);
    });
    this.contract.on("Unstaked", (...rawArgs) => {
      console.warn("unstacked");
      const parsedLog = { name: "Unstaked", args: [...rawArgs] };
      this.processParsedLog(parsedLog, accountId);
    });
    this.contract.on("EpochStarted", (...rawArgs) => {
      console.warn("EpochStarted");
      const parsedLog = { name: "EpochStarted", args: [...rawArgs] };
      this.processParsedLog(parsedLog, accountId);
    });
    this.contract.on("EpochFinalized", (...rawArgs) => {
      console.warn("EpochFinalized");
      const parsedLog = { name: "EpochFinalized", args: [...rawArgs] };
      this.processParsedLog(parsedLog, accountId);
    });
    this.contract.on("RewardClaimed", (...rawArgs) => {
      console.warn("RewardClaimed");
      const parsedLog = { name: "RewardClaimed", args: [...rawArgs] };
      this.processParsedLog(parsedLog, accountId);
    });
  }

  /**
   * The single funnel for logs (both historical & real-time).
   */
  private async processParsedLog(
    parsedLog: any,
    accountId: string
  ): Promise<void> {
    console.log("[StakingService] processParsedLog ->", parsedLog);
    switch (parsedLog.name) {
      case "Staked":
        await this.handleStakedEvent(
          {
            user: parsedLog.args[0],
            amount: parsedLog.args[1],
            startTime: parsedLog.args[2],
            endTime: parsedLog.args[3],
            stakeId: new BigNumber(parsedLog.args[4].toString()),
            tokenId: parsedLog.args[5],
            rewardShares: parsedLog.args[6],
            event: {} as EventLog,
          },
          accountId
        );
        break;

      case "Unstaked":
        await this.handleUnstakedEvent(
          {
            user: parsedLog.args[0],
            stakeId: parsedLog.args[1],
            unstakeAmount: parsedLog.args[2],
            early: parsedLog.args[3],
            penalty: parsedLog.args[4],
            tokenId: parsedLog.args[5],
            event: {} as EventLog,
          },
          accountId
        );
        break;

      case "EpochStarted":
        this.handleEpochStartedEvent({
          epochId: parsedLog.args[0],
          startTime: parsedLog.args[1],
          endTime: parsedLog.args[2],
          event: {} as EventLog,
        });
        break;

      case "EpochFinalized":
        this.handleEpochFinalizedEvent({
          epochId: parsedLog.args[0],
          totalReward: parsedLog.args[1],
          totalRewardShares: parsedLog.args[2],
          rewardPerShare: parsedLog.args[3],
          event: {} as EventLog,
        });
        break;

      case "RewardClaimed":
        this.handleRewardClaimedEvent(
          {
            user: parsedLog.args[0],
            totalReward: parsedLog.args[1],
            event: {} as EventLog,
          },
          accountId
        );
        break;

      default:
        // ignore unknown events
        break;
    }
  }

  public async fetchLastStakesGlobal(): Promise<any[]> {
    const contractInterface = new ethers.Interface(this.abi);
    const url = `${this.networkConfig.mirrorNodeUrl}/api/v1/contracts/${
      this.networkConfig.contractId
    }/results/logs?limit=${50}&order=desc`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch logs from Mirror Node");
    const data = await response.json();
    const stakes: any[] = [];

    for (const log of data.logs) {
      try {
        const parsedLog = contractInterface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        const { tokenSymbol, tokenDecimals } =
          await this.getTokenSymbolAndDecimals(parsedLog.args.tokenId);
        const amountBN = new BigNumber(parsedLog.args.amount.toString());
        const divisor = new BigNumber(10).pow(tokenDecimals);
        const numericAmountBN = amountBN.dividedBy(divisor);
        if (parsedLog && parsedLog.name === "Staked") {
          // You might want to fetch token symbol/decimals for proper formatting
          stakes.push({
            user: parsedLog.args.user,
            amount: numericAmountBN,
            startTime: Number(parsedLog.args.startTime.toString()),
            endTime: Number(parsedLog.args.endTime.toString()),
            stakeId: parsedLog.args.stakeId,
            tokenId: parsedLog.args.tokenId,
            rewardShares: parsedLog.args.rewardShares,
            symbol: tokenSymbol,
          });
        }
      } catch {}
    }
    return stakes;
  }

  /**
   * Fetch and replay logs from Mirror Node. This is your historical load.
   */
  private async fetchAllStakingData(accountId: string): Promise<StakingData> {
    console.log("[StakingService] fetchAllStakingData -> start");
    const evmAddress = await this.getEvmAddress(accountId);

    const contractInterface = new ethers.Interface(this.abi);
    let nextPageUrl:
      | string
      | null = `${this.networkConfig.mirrorNodeUrl}/api/v1/contracts/${this.networkConfig.contractId}/results/logs?limit=500&order=desc`;

    const parsedEvents: any[] = [];
    const allStakedEvents: any[] = [];

    while (nextPageUrl) {
      const response = await fetch(nextPageUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch logs from Mirror Node");
      }
      const data = await response.json();

      for (const log of data.logs) {
        try {
          const parsedLog = contractInterface.parseLog({
            topics: log.topics,
            data: log.data,
          });
          if (parsedLog) {
            parsedEvents.push(parsedLog);
            if (parsedLog.name === "Staked") {
              const { tokenSymbol, tokenDecimals } =
                await this.getTokenSymbolAndDecimals(parsedLog.args.tokenId);
              const amountBN = new BigNumber(parsedLog.args.amount.toString());
              const divisor = new BigNumber(10).pow(tokenDecimals);
              const numericAmountBN = amountBN.dividedBy(divisor);
              allStakedEvents.push({
                amount: numericAmountBN,
                startTime: Number(parsedLog.args.startTime.toString()),
                endTime: Number(parsedLog.args.endTime.toString()),
                stakeId: parsedLog.args.stakeId,
                symbol: tokenSymbol,
                shares: Number(parsedLog.args.rewardShares),
              });
            }
          }
        } catch (err) {
          // unrecognized log
        }
      }

      if (data.links.next) {
        nextPageUrl = `${this.networkConfig.mirrorNodeUrl}${data.links.next}`;
        // a small delay to avoid rate-limit
        await new Promise((res) => setTimeout(res, 500));
      } else {
        nextPageUrl = null;
      }
    }
    allStakedEvents.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
    const lastStakes = allStakedEvents.slice(0, 50); // get last 50
    // Replay logs from oldest to newest
    for (const log of parsedEvents.reverse()) {
      const shapedLog = { name: log.name, args: { ...log.args } };
      this.evmAddressCache = evmAddress; // so isUserEvent works
      await this.processParsedLog(shapedLog, accountId);
    }

    return {
      activeStakesList: this.stakingData.activeStakesList,
      contractTokenBalances: this.stakingData.contractTokenBalances,
      epochInfo: this.stakingData.epochInfo,
      rewardInfo: this.stakingData.rewardInfo,
      lastStakes,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  //                          EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  private async handleStakedEvent(
    args: {
      user: string;
      amount: ethers.BigNumberish;
      startTime: ethers.BigNumberish;
      endTime: ethers.BigNumberish;
      stakeId: BigNumber;
      tokenId: string;
      rewardShares: ethers.BigNumberish;
      event: EventLog;
    },
    accountId: string
  ) {
    const { tokenSymbol, tokenDecimals } = await this.getTokenSymbolAndDecimals(
      args.tokenId
    );
    const amountBN = new BigNumber(args.amount.toString());
    const divisor = new BigNumber(10).pow(tokenDecimals);
    const numericAmountBN = amountBN.dividedBy(divisor);

    // Always update global "all" if you want the contract total
    const oldAllValBN =
      this.stakingData.contractTokenBalances.all[tokenSymbol] ||
      new BigNumber(0);
    this.stakingData.contractTokenBalances.all[tokenSymbol] =
      oldAllValBN.plus(numericAmountBN);

    // If it’s not our user, skip user updates
    if (!this.isUserEvent(args.user, accountId)) {
      return this.notifyDataUpdate();
    }

    // Otherwise, update user-specific
    const oldUserValBN =
      this.stakingData.contractTokenBalances.user[tokenSymbol] ||
      new BigNumber(0);
    this.stakingData.contractTokenBalances.user[tokenSymbol] =
      oldUserValBN.plus(numericAmountBN);

    // Add to activeStakesList if not exist
    const alreadyHasStake = this.stakingData.activeStakesList.some(
      (st) => st.stakeId.toString() === args.stakeId.toString()
    );
    if (!alreadyHasStake) {
      this.stakingData.activeStakesList.push({
        amount: numericAmountBN,
        startTime: Number(args.startTime.toString()),
        endTime: Number(args.endTime.toString()),
        stakeId: args.stakeId,
        symbol: tokenSymbol,
        shares: Number(args.rewardShares),
      });

      // Bump userShares
      const oldUserShares = this.stakingData.rewardInfo.userShares;
      const newShares = new BigNumber(args.rewardShares.toString());
      const sumOfShares = oldUserShares.plus(newShares);
      this.stakingData.rewardInfo.userShares = sumOfShares;
    }

    // done
    this.notifyDataUpdate();
  }

  private async handleUnstakedEvent(
    args: {
      user: string;
      stakeId: ethers.BigNumberish;
      unstakeAmount: ethers.BigNumberish; // The 90% portion if early
      early: boolean;
      penalty: ethers.BigNumberish; // from the event, ignoring for non-HBAR
      tokenId: string;
      event: EventLog;
    },
    accountId: string
  ) {
    console.log("[StakingService] handleUnstakedEvent ->", args);

    const { tokenSymbol, tokenDecimals } = await this.getTokenSymbolAndDecimals(
      args.tokenId
    );

    // The "unstaked" portion
    let unstakeBN = new BigNumber(args.unstakeAmount.toString());

    // The contract-provided penalty, might be swapped to HBAR if non-HBAR
    let penaltyBN = new BigNumber(args.penalty.toString());

    // If it's an early unstake with a non-HBAR token, recalc penalty as 10%
    if (
      args.early &&
      args.tokenId !== "0x0000000000000000000000000000000000000000"
    ) {
      penaltyBN = unstakeBN.dividedBy(9);
    }

    const divisor = new BigNumber(10).pow(tokenDecimals);
    const numericAmountBN = unstakeBN.plus(penaltyBN).dividedBy(divisor);

    // Update global "all"
    const oldAllValBN =
      this.stakingData.contractTokenBalances.all[tokenSymbol] ||
      new BigNumber(0);
    const newAllValBN = oldAllValBN.minus(numericAmountBN);
    if (newAllValBN.isZero()) {
      delete this.stakingData.contractTokenBalances.all[tokenSymbol];
    } else {
      this.stakingData.contractTokenBalances.all[tokenSymbol] = newAllValBN;
    }

    // If it's not our user, skip
    if (!this.isUserEvent(args.user, accountId)) {
      return this.notifyDataUpdate();
    }

    // Otherwise, update user data
    const oldUserValBN =
      this.stakingData.contractTokenBalances.user[tokenSymbol] ||
      new BigNumber(0);
    const newUserValBN = oldUserValBN.minus(numericAmountBN);

    // remove stake from active list
    const stakeIdNum = Number(args.stakeId);
    this.stakingData.activeStakesList =
      this.stakingData.activeStakesList.filter((st) => {
        if (Number(st.stakeId) === stakeIdNum) {
          const oldUserShares = this.stakingData.rewardInfo.userShares;
          const newShares = new BigNumber(st.shares);
          const plusOfShares = oldUserShares.minus(newShares);
          this.stakingData.rewardInfo.userShares = plusOfShares;

          return false;
        }
        return true;
      });

    if (newUserValBN.isZero()) {
      delete this.stakingData.contractTokenBalances.user[tokenSymbol];
    } else {
      this.stakingData.contractTokenBalances.user[tokenSymbol] = newUserValBN;
    }

    this.notifyDataUpdate();
  }

  private handleEpochStartedEvent(args: {
    epochId: ethers.BigNumberish;
    startTime: ethers.BigNumberish;
    endTime: ethers.BigNumberish;
    event: EventLog;
  }) {
    console.log("[StakingService] handleEpochStartedEvent ->", args);

    const newEndTime = new BigNumber(args.endTime.toString());
    if (newEndTime.gt(this.stakingData.epochInfo.endTime)) {
      this.stakingData.epochInfo.id = new BigNumber(args.epochId.toString());
      this.stakingData.epochInfo.endTime = newEndTime;
      // If needed, reset epochReward or userUnclaimedReward here
    }

    this.notifyDataUpdate();
  }

  private handleEpochFinalizedEvent(args: {
    epochId: ethers.BigNumberish;
    totalReward: ethers.BigNumberish;
    totalRewardShares: ethers.BigNumberish;
    rewardPerShare: ethers.BigNumberish;
    event: EventLog;
  }) {
    console.log("[StakingService] handleEpochFinalizedEvent ->", args);
    console.log(
      "[StakingService] handleEpochFinalizedEvent ->",
      Number(this.stakingData.rewardInfo.userShares)
    );

    const scaledRewardPerShare = new BigNumber(args.rewardPerShare.toString());
    const realRewardPerShare = scaledRewardPerShare.dividedBy(1e8);

    const userShares = new BigNumber(this.stakingData.rewardInfo.userShares);

    const newReward = realRewardPerShare.multipliedBy(userShares);
    console.log(
      "[StakingService] handleEpochFinalizedEvent -> dataaaa  ",
      realRewardPerShare +
        "   " +
        userShares +
        "   " +
        newReward.decimalPlaces(0)
    );
    const oldRewardValue = new BigNumber(
      this.stakingData.rewardInfo.userUnclaimed
    );
    const newRewardValue = oldRewardValue.plus(newReward.decimalPlaces(0));
    this.stakingData.rewardInfo.userUnclaimed = newRewardValue;
    console.log(
      "[StakingService] handleEpochFinalizedEvent ->",
      Number(newRewardValue)
    );
    // store epochReward if needed
    this.stakingData.epochInfo.epochReward = new BigNumber(
      args.totalReward.toString()
    );

    // track allReward
    const oldAllReward = this.stakingData.rewardInfo.allReward;
    const newAllReward = oldAllReward.plus(
      new BigNumber(args.totalReward.toString()).dividedBy(1e8)
    );
    this.stakingData.rewardInfo.allReward = newAllReward;

    this.notifyDataUpdate();
  }

  private handleRewardClaimedEvent(
    args: { user: string; totalReward: ethers.BigNumberish; event: EventLog },
    accountId: string
  ) {
    console.log("[StakingService] handleRewardClaimedEvent ->", args);

    if (!this.isUserEvent(args.user, accountId)) {
      return;
    }

    const claimAmount = new BigNumber(args.totalReward.toString());
    const oldClaimed = this.stakingData.rewardInfo.userClaimed;
    // The contract's totalReward in "RewardClaimed" might be scaled?
    // If so, do `.dividedBy(1e8)`.
    // But if it's already in HBAR units, no scaling.
    const newClaimed = oldClaimed.plus(claimAmount.dividedBy(1e8));

    this.stakingData.rewardInfo.userClaimed = newClaimed;

    const oldUnclaimed = this.stakingData.rewardInfo.userUnclaimed;
    const newUnclaimed = oldUnclaimed.minus(claimAmount);

    this.stakingData.rewardInfo.userUnclaimed = newUnclaimed;
    console.log(
      "[StakingService] handleEpochFinalizedEvent ->Claimed ",
      Number(claimAmount)
    );
    // Possibly also reduce userUnclaimed
    // this.stakingData.rewardInfo.userUnclaimed =
    //   this.stakingData.rewardInfo.userUnclaimed.minus(claimAmount.dividedBy(1e8));

    this.notifyDataUpdate();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //                               HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  /** Returns true if the event's user address matches our user. */
  private isUserEvent(eventUserAddress: string, accountId: string): boolean {
    if (!this.evmAddressCache) {
      return false;
    }
    return (
      eventUserAddress.toLowerCase() === this.evmAddressCache.toLowerCase()
    );
  }

  /** Notifies watchers that data has changed. */
  private notifyDataUpdate() {
    if (this.onDataUpdated) {
      this.onDataUpdated();
    }
  }

  /** Convert 0.0.x style account to EVM address via Mirror Node. */
  private async getEvmAddress(accountId: string): Promise<string> {
    const resolvedId = AccountId.fromString(accountId);
    const url = `${this.networkConfig.mirrorNodeUrl}/api/v1/accounts/${resolvedId}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(
        `[StakingService] getEvmAddress: fetch error for ${accountId}`
      );
    }
    const data = await resp.json();
    return data.evm_address;
  }

  /** Fetch decimals & symbol from Mirror Node for the token. */
  private async getTokenSymbolAndDecimals(tokenAddress: string): Promise<{
    tokenSymbol: string;
    tokenDecimals: number;
  }> {
    if (tokenAddress === "0x0000000000000000000000000000000000000000") {
      return { tokenSymbol: "HBAR", tokenDecimals: 8 };
    }
    try {
      const tokenId = AccountId.fromEvmAddress(0, 0, tokenAddress);
      const url = `${this.networkConfig.mirrorNodeUrl}/api/v1/tokens/${tokenId}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const tokenInfo = await resp.json();
        return {
          tokenSymbol: tokenInfo.symbol.toUpperCase(),
          tokenDecimals: tokenInfo.decimals,
        };
      }
    } catch (err) {
      console.warn("[StakingService] getTokenSymbolAndDecimals: error =>", err);
    }
    // fallback
    return { tokenSymbol: "UNKNOWN", tokenDecimals: 8 };
  }

  /** Return the final snapshot of data. */
  public getStakingData(): StakingData {
    return this.stakingData;
  }

  /** Mirror Node call for basic account info. */
  public async getAccountInfo(accountId: string | AccountId) {
    const resp = await fetch(
      `${this.networkConfig.mirrorNodeUrl}/api/v1/accounts/${accountId}`
    );
    if (!resp.ok) {
      throw new Error(
        `[StakingService] getAccountInfo: fetch error for ${accountId}`
      );
    }
    return resp.json();
  }
}
