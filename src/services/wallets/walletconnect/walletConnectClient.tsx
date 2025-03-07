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
  name: "Hedera CRA Template",
  description: "Hedera CRA Template",
  url: window.location.origin,
  icons: [window.location.origin + "/logo192.png"],
};
let sessionPrivateKey: PrivateKey;
let sessionPublicKey: PublicKey;
let sessionAccountId: AccountId;
const sessionClient = Client.forTestnet();
if (sessionStorage.getItem("sessionAccountId")) {
  console.log(sessionStorage.getItem("sessionPrivateKey"));
  console.log(sessionStorage.getItem("sessionPublicKey"));
  console.log(sessionStorage.getItem("sessionAccountId"));
  sessionPrivateKey = PrivateKey.fromStringDer(
    sessionStorage.getItem("sessionPrivateKey") || ""
  );
  sessionPublicKey = PublicKey.fromString(
    sessionStorage.getItem("sessionPublicKey") || ""
  );
  sessionClient.setOperator(
    AccountId.fromString(sessionStorage.getItem("sessionAccountId") || ""),
    sessionPrivateKey
  );
}

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

  async createFile(
    publicKey: Key,
    backendKey: string,
    fileContents: string,
    sessionExecute: boolean = true
  ) {
    try {
      const signer = this.getSigner();

      // Ensure that inputPublicKey is a proper PublicKey instance.
      // If it's a string, convert it.
      console.log("test");
      console.log(publicKey);
      console.log(backendKey);
      const backendKeyBytes = Uint8Array.from(
        Buffer.from("04" + backendKey, "hex")
      );

      // Import as an ECDSA public key (using fromBytesECDSA)
      const backKey = PublicKey.fromBytesECDSA(backendKeyBytes);
      console.log("test");
      const properPublicKey = PublicKey.fromStringECDSA((publicKey as any).key);
      console.log("test2");
      const publicKeyList = [sessionPublicKey, properPublicKey, backKey];
      console.log("test3");
      const thresholdKey = new KeyList(publicKeyList, 1); // Only 1 key (frontend OR backend) needed
      console.log("test4");
      console.log("afterrrrr");
      // Create a new FileCreateTransaction and set all fields.
      const transaction = new FileCreateTransaction()
        .setKeys([thresholdKey])
        .setContents(fileContents)
        .setMaxTransactionFee(new Hbar(2));

      console.log(
        "Is transaction frozen before freezeWithSigner()? ",
        transaction.isFrozen()
      );
      let txResult;
      if (sessionExecute) {
        console.log(sessionClient);
        const frozenTx = await transaction.freezeWith(sessionClient);
        txResult = await frozenTx.execute(sessionClient);
      } else {
        const frozenTx = await transaction.freezeWithSigner(signer);
        txResult = await frozenTx.executeWithSigner(signer);
      }

      // Fetch the transaction receipt.
      const receipt = await new TransactionReceiptQuery()
        .setTransactionId(txResult.transactionId)
        .execute(hederaClient);
      console.log("Transaction Receipt:", receipt);

      if (receipt && receipt.fileId) return { receipt, result: txResult };
      else return "FAILED";
    } catch (error) {
      console.error("Transaction failed with error:", error);
      return "FAILED";
    }
  }
  async setOperator() {
    console.log(sessionStorage.getItem("sessionPrivateKey"));
    console.log(sessionStorage.getItem("sessionPublicKey"));
    console.log(sessionStorage.getItem("sessionAccountId"));
    sessionPrivateKey = PrivateKey.fromStringECDSA(
      sessionStorage.getItem("sessionPrivateKey") || ""
    );
    sessionPublicKey = PublicKey.fromString(
      sessionStorage.getItem("sessionPublicKey") || ""
    );
    sessionClient.setOperator(
      AccountId.fromString(sessionStorage.getItem("sessionAccountId") || ""),
      sessionPrivateKey
    );
  }
  async updateFile(
    fileId: string,
    fileContents: string,
    sessionExecute: boolean = true
  ) {
    console.log(fileId);
    try {
      const signer = this.getSigner();
      const transaction = await new FileUpdateTransaction()
        .setFileId(FileId.fromString(fileId))
        .setContents(fileContents)
        .setMaxTransactionFee(new Hbar(2));

      console.log(
        "Is transaction frozen before freezeWithSigner()? ",
        transaction.isFrozen()
      );
      let txResult;
      if (sessionExecute) {
        const frozenTx = await transaction.freezeWith(sessionClient);
        txResult = await frozenTx.execute(sessionClient);
      } else {
        const frozenTx = await transaction.freezeWithSigner(signer);
        txResult = await frozenTx.executeWithSigner(signer);
      }
      // Fetch the transaction receipt.
      const receipt = await new TransactionReceiptQuery()
        .setTransactionId(txResult.transactionId)
        .execute(hederaClient);
      console.log("Transaction Receipt:", receipt);

      if (receipt) return { receipt, result: txResult };
      else return "FAILED";
    } catch (error) {
      console.error("Transaction failed with error:", error);
      return "FAILED";
    }
  }

  async readFile(fileId: string) {
    try {
      console.log(
        "Using operator:",
        sessionClient.operatorAccountId?.toString()
      );
      console.log(fileId);
      const balance = await new AccountBalanceQuery()
        .setAccountId(sessionClient.operatorAccountId!)
        .execute(sessionClient);
      console.log("Session Account Balance:", balance.hbars.toString());

      // Use hederaClient (standard client) for the query
      const fileQuery = await new FileContentsQuery()
        .setFileId(FileId.fromString(fileId))
        .setMaxQueryPayment(new Hbar(4)); // Optional: set max query payment

      const cost = await fileQuery.getCost(sessionClient);
      console.log("Estimated query cost:", cost.toString());
      const fileContents = await fileQuery.execute(sessionClient);
      const contentText = Buffer.from(fileContents).toString("utf-8");
      console.log("File Content:", contentText);
      return contentText;
    } catch (error) {
      console.error("Error reading file content:", error);
      throw error;
    }
  }

  async createSessionAccount() {
    try {
      const signer = walletConnectWallet.getSigner(); // Main wallet signer
      const transaction = new AccountCreateTransaction()
        .setKey(sessionPublicKey)
        .setInitialBalance(new Hbar(1));

      // Freeze the transaction with the operator's signer
      const frozenTx = await transaction.freezeWithSigner(signer);

      // Sign the transaction with the session's private key (required for new account creation)
      const signedTx = await frozenTx.sign(sessionPrivateKey);

      // Execute the transaction with the operator's signer
      const txResult = await signedTx.executeWithSigner(signer);

      // Retrieve the receipt for the transaction
      const receipt = await new TransactionReceiptQuery()
        .setTransactionId(txResult.transactionId)
        .execute(hederaClient);

      if (receipt.accountId) {
        console.log(
          "New session account created:",
          receipt.accountId.toString()
        );
        sessionAccountId = AccountId.fromString(receipt.accountId.toString());
        sessionClient.setOperator(sessionAccountId, sessionPrivateKey);
        sessionStorage.setItem("sessionAccountId", sessionAccountId.toString());
        return receipt.accountId;
      } else {
        throw new Error("Failed to create session account");
      }
    } catch (error) {
      console.error("Allowance approval failed:", error);
      return "FAILED";
    }
  }
  async approveSessionAllowance(allowanceAmount: number) {
    try {
      const signer = walletConnectWallet.getSigner();
      const ownerAccountId = walletConnectWallet.getAccountId();

      const allowanceTx = new AccountAllowanceApproveTransaction()
        .approveHbarAllowance(
          ownerAccountId,
          sessionAccountId,
          new Hbar(allowanceAmount)
        )
        .setMaxTransactionFee(new Hbar(1));

      const frozenTx = await allowanceTx.freezeWithSigner(signer);
      const signedTx = await frozenTx.signWithSigner(signer);
      const txResult = await signedTx.executeWithSigner(signer);

      const receipt = await new TransactionReceiptQuery()
        .setTransactionId(txResult.transactionId)
        .execute(hederaClient);
      console.log("Allowance przyznany:", receipt);
      return receipt;
    } catch (error) {
      console.error("Przyznanie allowance nie powiodło się:", error);
      return "FAILED";
    }
  }
  async executeContractFunction(
    contractId: ContractId,
    functionName: string,
    functionParameters: ContractFunctionParameterBuilder,
    value: number,
    gasLimit: number,
    sessionExecute: boolean = true
  ) {
    try {
      const tx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(gasLimit)
        .setFunction(functionName, functionParameters.buildHAPIParams())
        .setPayableAmount(new Hbar(value / 100000000));

      const signer = this.getSigner();
      let txResult;
      if (sessionExecute) {
        await tx.freezeWith(sessionClient);
        txResult = await tx.execute(sessionClient);
      } else {
        await tx.freezeWithSigner(signer);
        txResult = await tx.executeWithSigner(signer);
      }

      const receipt = await new TransactionReceiptQuery()
        .setTransactionId(txResult.transactionId)
        .execute(hederaClient);
      console.log("Transaction Receipt:", receipt);
      if (receipt) return { receipt: receipt, result: txResult };
      else return "FAILED";
    } catch (error) {
      //console.error("Transaction failed with error:", error);
      // Handle specific Hedera errors if possible
      return "FAILED";
    }
  }
  disconnect() {
    dappConnector.disconnectAll().then(() => {
      sessionStorage.setItem("sessionAccountId", "");
      sessionStorage.setItem("sessionPublicKey", "");
      sessionStorage.setItem("sessionPrivateKey", "");
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
