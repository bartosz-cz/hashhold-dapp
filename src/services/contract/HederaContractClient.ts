import {
  ContractId,
  Hbar,
  TransactionReceipt,
  TransactionId,
  AccountAllowanceApproveTransaction,
  TokenId,
} from "@hashgraph/sdk";

import { WalletInterface } from "../wallets/walletInterface";
import { ContractFunctionParameterBuilder } from "../wallets/contractFunctionParameterBuilder";
export interface StakeParams {
  tokenId: string; // Address of the token (Use "0x00..." for native HBAR)
  amount: number; // Amount of tokens to stake
  duration: number; // Duration in seconds for staking
  boostTokenAmount: number; // Boost token amount
  priceIds: string[]; // Price feed IDs to fetch from Hermes/Pyth
}

export interface WithdrawParams {
  stakeId: number;
}

export interface TokenAssociateParams {
  tokenAddress: string;
}

export interface SetPoolFeeParams {
  token1: string;
  token2: string;
  fee: number;
}

export interface StartNewEpochParams {
  endTime: number; // Unix timestamp in seconds
}

export interface FinalizeEpochParams {
  epochId: number;
}

/**
 * Interface for initializing HederaContractClient.
 */
export interface HederaClientOptions {
  contractId: string;
  hermesEndpoint?: string; // Defaults to "https://hermes.pyth.network"
}

/**
 * HederaContractClient is responsible for interacting with a Hedera-based smart contract.
 * It uses a provided WalletInterface to sign and send transactions.
 */
export class HederaContractClient {
  private contractId: ContractId;
  private hermesEndpoint: string;
  private walletInterface: WalletInterface | null;

  constructor(
    walletInterface: WalletInterface | null,
    options: HederaClientOptions
  ) {
    const { contractId, hermesEndpoint = "https://hermes.pyth.network" } =
      options;
    this.contractId = ContractId.fromString(contractId);
    this.hermesEndpoint = hermesEndpoint;
    this.walletInterface = walletInterface;
  }

  private async getPriceUpdates(priceIds: string[]): Promise<Uint8Array[]> {
    const timestamp = Math.floor(Date.now() / 1000) - 5;
    const baseURL = "https://hermes.pyth.network/v2/updates/price";
    const id =
      "0x3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd";
    const url = `${baseURL}/${timestamp}?ids[]=${id}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const res = await response.json();
    const data = res.binary.data.map((d: string) => {
      if (typeof d === "string") {
        return new Uint8Array(
          d
            .replace(/^0x/, "")
            .match(/.{1,2}/g)!
            .map((byte) => parseInt(byte, 16))
        );
      } else {
        throw new Error("Unsupported data format in priceUpdates.binary.data");
      }
    });

    console.log(res);
    return data;
  }

  public async stakeTokens(params: StakeParams): Promise<object | string> {
    console.log(params);
    if (this.walletInterface !== null) {
      let tokenDecimals = 0;

      const { tokenId, amount, duration, boostTokenAmount, priceIds } = params;
      console.log(params);
      let payableValue: number = 0;
      let priceUpdateData: Uint8Array[] = [];
      if (tokenId === "0x0000000000000000000000000000000000000000") {
        tokenDecimals = 8;
        priceUpdateData = await this.getPriceUpdates(priceIds);
        payableValue = amount;
      } else {
        tokenDecimals = 6;
        await this.walletInterface.approveTokenAllowance(
          this.contractId,
          amount,
          TokenId.fromSolidityAddress(tokenId)
        );
      }
      console.log("calllllllllllllllll");
      const paramBuilder = new ContractFunctionParameterBuilder()
        .addParam({ type: "address", name: "tokenId", value: tokenId })
        .addParam({
          type: "uint256",
          name: "amount",
          value: amount,
        })
        .addParam({ type: "uint256", name: "duration", value: duration })
        .addParam({
          type: "uint256",
          name: "boostTokenAmount",
          value: boostTokenAmount,
        })
        .addParam({
          type: "bytes[]",
          name: "priceUpdate",
          value: priceUpdateData,
        });

      try {
        const response = await this.walletInterface.executeContractFunction(
          this.contractId,
          "stake",
          paramBuilder,
          payableValue,
          2_500_000
        );

        return response;
      } catch (error: any) {
        console.error(
          "Error executing stake transaction:",
          error.message || error
        );
        throw error;
      }
    } else {
      return "No wallet";
    }
  }

  public async withdrawTokens(
    params: WithdrawParams
  ): Promise<object | string> {
    console.log("withraw stake id " + this.walletInterface);
    if (this.walletInterface !== null) {
      const { stakeId } = params;
      console.log(stakeId);
      console.log("withraw stake id " + stakeId);
      // Build parameters using the provided builder
      const paramBuilder = new ContractFunctionParameterBuilder().addParam({
        type: "uint256",
        name: "stakeId",
        value: stakeId,
      });

      // Execute the contract function via the wallet interface
      try {
        const txId = await this.walletInterface.executeContractFunction(
          this.contractId,
          "Unstake",
          paramBuilder,
          0, // value=0 since 'withdraw' is non-payable
          2_500_000 // Example gas limit; adjust as necessary
        );

        return txId;
      } catch (error: any) {
        console.error(
          "Error executing withdraw transaction:",
          error.message || error
        );
        throw error;
      }
    } else {
      return "No wallet";
    }
  }

  public async associateToken(
    params: TokenAssociateParams
  ): Promise<object | string> {
    if (this.walletInterface !== null) {
      const { tokenAddress } = params;

      const paramBuilder = new ContractFunctionParameterBuilder().addParam({
        type: "address",
        name: "tokenId",
        value: tokenAddress,
      });

      try {
        const txId = await this.walletInterface.executeContractFunction(
          this.contractId,
          "tokenAssociate",
          paramBuilder,
          0,
          2_500_000
        );

        return txId;
      } catch (error: any) {
        console.error(
          "Error executing withdraw transaction:",
          error.message || error
        );
        throw error;
      }
    } else {
      return "No wallet";
    }
  }

  public async setPoolFee(params: SetPoolFeeParams): Promise<object | string> {
    if (this.walletInterface !== null) {
      const { token1, token2, fee } = params;

      const paramBuilder = new ContractFunctionParameterBuilder()
        .addParam({
          type: "address",
          name: "token1",
          value: token1,
        })
        .addParam({
          type: "address",
          name: "token2",
          value: token2,
        })
        .addParam({
          type: "uint24",
          name: "newFee",
          value: fee,
        });

      try {
        const txId = await this.walletInterface.executeContractFunction(
          this.contractId,
          "setPoolFees",
          paramBuilder,
          0,
          2_500_000
        );

        return txId;
      } catch (error: any) {
        console.error(
          "Error executing withdraw transaction:",
          error.message || error
        );
        throw error;
      }
    } else {
      return "No wallet";
    }
  }

  public async claimReward(): Promise<object | string> {
    if (this.walletInterface !== null) {
      const paramBuilder = new ContractFunctionParameterBuilder();
      try {
        const txId = await this.walletInterface.executeContractFunction(
          this.contractId,
          "claimReward",
          paramBuilder,
          0,
          1_000_000
        );
        console.log("ClaimReward transaction submitted:", txId);
        return txId;
      } catch (error: any) {
        console.error(
          "Error executing claimReward transaction:",
          error.message || error
        );
        throw error;
      }
    } else {
      return "No wallet";
    }
  }
}
