import { WalletConnectContext } from "../../../contexts/WalletConnectContext";
import { useCallback, useContext, useEffect } from "react";
import { WalletInterface } from "../walletInterface";
import { MirrorNodeClient } from "../mirrorNodeClient";
import { ethers, ContractInterface } from "ethers";
import {
  AccountId,
  ContractExecuteTransaction,
  ContractId,
  LedgerId,
  TokenAssociateTransaction,
  TokenId,
  Transaction,
  TransactionId,
  TransferTransaction,
  TransactionReceiptQuery,
  Client,
  Hbar,
  FileId,
  ContractCallQuery,
  TransactionRecordQuery,
  FileCreateTransaction,
  AccountAllowanceApproveTransaction,
  AccountInfoQuery,
  FileUpdateTransaction,
  PublicKey,
  SignatureMap,
  Key,
  PrivateKey,
  AccountCreateTransaction,
  KeyList,
  FileContentsQuery,
  AccountBalanceQuery,
} from "@hashgraph/sdk";
import { ContractFunctionParameterBuilder } from "../contractFunctionParameterBuilder";
import { appConfig } from "../../../config";
import { SignClientTypes } from "@walletconnect/types";
import {
  DAppConnector,
  HederaJsonRpcMethod,
  HederaSessionEvent,
  HederaChainId,
  SignAndExecuteTransactionParams,
  transactionToBase64String,
} from "@hashgraph/hedera-wallet-connect";
import EventEmitter from "events";
import { networkConfig } from "../../../config/networks";
import { sign } from "crypto";

// Created refreshEvent because `dappConnector.walletConnectClient.on(eventName, syncWithWalletConnectContext)` would not call syncWithWalletConnectContext
// Reference usage from walletconnect implementation https://github.com/hashgraph/hedera-wallet-connect/blob/main/src/lib/dapp/index.ts#L120C1-L124C9
const refreshEvent = new EventEmitter();

// Create a new project in walletconnect cloud to generate a project id
const walletConnectProjectId = "377d75bb6f86a2ffd427d032ff6ea7d3";
const currentNetworkConfig = appConfig.networks.testnet;
const hederaNetwork = currentNetworkConfig.network;
const hederaClient = Client.forName(hederaNetwork);

// Adapted from walletconnect dapp example:
// https://github.com/hashgraph/hedera-wallet-connect/blob/main/src/examples/typescript/dapp/main.ts#L87C1-L101C4
const metadata: SignClientTypes.Metadata = {
  name: "Hashhold DApp",
  description: "smart contract call",
  url: window.location.origin,
  icons: [window.location.origin + "/logo192.png"],
};

class WalletConnectWallet implements WalletInterface {
  private getSigner() {
    if (dappConnector.signers.length === 0) {
      throw new Error("No signers found!");
    }
    return dappConnector.signers[0];
  }
  private getAccountId() {
    // Need to convert from walletconnect's AccountId to hashgraph/sdk's AccountId because walletconnect's AccountId and hashgraph/sdk's AccountId are not the same!
    return AccountId.fromString(this.getSigner().getAccountId().toString());
  }

  async approveTokenAllowance(
    contractId: ContractId,
    amount: number,
    tokenId: TokenId
  ): Promise<string> {
    try {
      const signer = this.getSigner();
      const accountId = this.getAccountId();
      // Build the allowance transaction
      const allowanceTx = await new AccountAllowanceApproveTransaction()
        .approveTokenAllowance(tokenId, accountId, contractId, amount) // Approve contract to spend tokens
        .freezeWithSigner(signer);

      // Sign the transaction

      // Execute the transaction
      const response = await allowanceTx.executeWithSigner(signer);

      // Get transaction receipt
      const receipt = await new TransactionReceiptQuery()
        .setTransactionId(response.transactionId)
        .execute(hederaClient);
      //const record = await response.getRecord(hederaClient);
      //const qr = new TransactionRecordQuery()
      //.setTransactionId(response.transactionId);

      //console.log("Record  " + record);
      //console.log("Transaction Result:", result);
      if (receipt.status.toString() !== "SUCCESS") {
        throw new Error(`Token allowance failed: ${receipt.status}`);
      }

      console.log("SUCCESS");
      return "SUCCESS";
    } catch (error) {
      console.error("Error in approveTokenAllowance:", error);
      return "FAILED";
    }
  }
  async executeContractFunction(
    contractId: ContractId,
    functionName: string,
    functionParameters: ContractFunctionParameterBuilder,
    value: number,
    gasLimit: number
  ) {
    try {
      const tx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(gasLimit)
        .setFunction(functionName, functionParameters.buildHAPIParams())
        .setPayableAmount(new Hbar(value));

      const signer = this.getSigner();

      await tx.freezeWithSigner(signer);
      console.log("executed start");
      const txResult = await tx.executeWithSigner(signer);
      console.log("executed end");
      const receipt = await new TransactionReceiptQuery()
        .setTransactionId(txResult.transactionId)
        .execute(hederaClient);
      console.log("Transaction Receipt:", receipt);

      if (receipt) return { receipt: receipt, trId: txResult.transactionId };
      else return "FAILED";
    } catch (error) {
      console.error("Transaction failed with error:", error);
      // Handle specific Hedera errors if possible
      return "FAILED";
    }
  }

  disconnect() {
    dappConnector.disconnectAll().then(() => {
      refreshEvent.emit("sync");
    });
  }
}

export const walletConnectWallet = new WalletConnectWallet();

const dappConnector = new DAppConnector(
  metadata,
  LedgerId.fromString(hederaNetwork),
  walletConnectProjectId,
  Object.values(HederaJsonRpcMethod),
  [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
  [HederaChainId.Testnet]
);

// ensure walletconnect is initialized only once
let walletConnectInitPromise: Promise<void> | undefined = undefined;
const initializeWalletConnect = async () => {
  if (walletConnectInitPromise === undefined) {
    walletConnectInitPromise = dappConnector.init();
  }
  await walletConnectInitPromise;
};

export const openWalletConnectModal = async () => {
  await initializeWalletConnect();
  await dappConnector.openModal().then((x) => {
    refreshEvent.emit("sync");
  });
};

export const WalletConnectClient = () => {
  const { setAccountId, setIsConnected } = useContext(WalletConnectContext);

  // Function to sync accountId and connection state.
  const syncWithWalletConnectContext = useCallback(() => {
    const accountId = dappConnector.signers[0]?.getAccountId()?.toString();
    if (accountId) {
      setAccountId(accountId);
      setIsConnected(true);
    } else {
      setAccountId("");
      setIsConnected(false);
    }
  }, [setAccountId, setIsConnected]);

  useEffect(() => {
    // Listen for refresh events.
    refreshEvent.addListener("sync", syncWithWalletConnectContext);

    // Handler for disconnect events.
    const handleDisconnect = (error: any, payload: any) => {
      console.log("WalletConnect disconnected:", error, payload);
      setAccountId("");
      setIsConnected(false);
    };

    // Initialize wallet connect and sync state.
    initializeWalletConnect().then(() => {
      syncWithWalletConnectContext();
    });

    // Also poll for connection changes (optional, every 3 seconds).
    const interval = setInterval(() => {
      syncWithWalletConnectContext();
    }, 3000);

    // Cast walletConnectClient to any to bypass type restrictions for additional events.
    const wcClient = dappConnector.walletConnectClient as any;
    if (dappConnector.walletConnectClient !== undefined) {
      // Add event listeners for disconnect events.
      wcClient.on("disconnect", handleDisconnect);
      wcClient.on("session_delete", handleDisconnect);
    }

    return () => {
      refreshEvent.removeListener("sync", syncWithWalletConnectContext);
      console.log("return part fired:  " + wcClient);
      if (wcClient !== undefined) {
        wcClient.off("disconnect", handleDisconnect);
        wcClient.off("session_delete", handleDisconnect);
      }

      clearInterval(interval);
    };
  }, [syncWithWalletConnectContext, setAccountId, setIsConnected]);

  return null;
};
