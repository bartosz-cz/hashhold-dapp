import {
  ContractId,
  TransactionReceipt,
  TransactionResponse,
  AccountId,
  PrivateKey,
} from "@hashgraph/sdk";

import { WalletInterface } from "../wallets/walletInterface";
import { ContractFunctionParameterBuilder } from "../wallets/contractFunctionParameterBuilder";
import { MirrorNodeClient } from "../wallets/mirrorNodeClient";
import { appConfig } from "../../config";
import { networkConfig } from "../../config/networks";
import { decrypt } from "eciesjs";
import { ethers, JsonRpcProvider } from "ethers";

const mirrorNodeClient = new MirrorNodeClient(appConfig.networks.testnet);

interface WalletResponse {
  receipt: TransactionReceipt;
  result: TransactionResponse;
}

interface HederaClientOptions {
  contractId: string;
  hermesEndpoint?: string;
}

interface Message {
  id: number;
  sender: "user" | "assistant";
  text: string;
}

interface SessionData {
  privateKey: string;
  publicKey: string;
  accountId: string;
}

export class HederaContractClient {
  private contractId: ContractId;
  private hermesEndpoint: string;
  private wallet: WalletInterface | null;

  constructor(wallet: WalletInterface | null, options: HederaClientOptions) {
    this.contractId = ContractId.fromString(options.contractId);
    this.hermesEndpoint =
      options.hermesEndpoint || "https://hermes.pyth.network";
    this.wallet = wallet;
  }

  public async startSession(accountId: string, message: string) {
    const sessionPrivateKeyObj = PrivateKey.generateECDSA();
    const sessionPublicKey = sessionPrivateKeyObj.publicKey.toStringRaw();
    const sessionPrivateKey = sessionPrivateKeyObj.toStringRaw();

    sessionStorage.setItem("sessionPrivateKey", sessionPrivateKey);
    sessionStorage.setItem("sessionPublicKey", sessionPublicKey);

    if (!this.wallet) throw new Error("Wallet interface not available.");

    const params = new ContractFunctionParameterBuilder().addParam({
      type: "string",
      name: "publicKey",
      value: sessionPublicKey,
    });

    await this.wallet.executeContractFunction(
      this.contractId,
      "depositAndNotifyBackend",
      params,
      5,
      2_500_000,
      false
    );

    return await this.listenForSessionCreation(
      sessionPrivateKey,
      accountId,
      message
    );
  }

  private async listenForSessionCreation(
    sessionPrivateKey: string,
    accountId: string,
    message: string
  ): Promise<any> {
    return await new Promise((resolve, reject) => {
      const provider = new JsonRpcProvider(networkConfig.testnet.jsonRpcUrl);

      const contract = new ethers.Contract(
        networkConfig.testnet.contractAddress,
        [
          "event SessionAccountCreated(address indexed user, string sessionData)",
          "event DataUploaded(address indexed user, string hfsFileId)",
        ],
        provider
      );

      contract.once("SessionAccountCreated", async (user, sessionData) => {
        try {
          const decrypted = await this.decryptSessionData(
            sessionData,
            sessionPrivateKey
          );

          sessionStorage.setItem("sessionPrivateKey", decrypted.privateKey);
          sessionStorage.setItem("sessionPublicKey", decrypted.publicKey);
          sessionStorage.setItem("sessionAccountId", decrypted.accountId);

          if (!this.wallet) return resolve(null);

          await this.wallet.setOperator();

          const info = await mirrorNodeClient.getAccountInfo(
            AccountId.fromString(accountId)
          );

          const fileResponse = await this.wallet.createFile(
            info.key,
            networkConfig.testnet.backendKey,
            message,
            true
          );

          if (typeof fileResponse === "string") return resolve(fileResponse);

          const fileId = fileResponse.receipt.fileId?.toString() || "";
          sessionStorage.setItem("fileId", fileId);

          const uploadParams = new ContractFunctionParameterBuilder()
            .addParam({
              type: "address",
              name: "owner",
              value: info.evm_address,
            })
            .addParam({ type: "string", name: "hfsFileId", value: fileId });

          await this.wallet.executeContractFunction(
            this.contractId,
            "uploadMedicalData",
            uploadParams,
            0,
            2_500_000,
            true
          );
          contract.on(
            "DataUploaded",
            async (user: string, hfsFileId: string) => {
              if (user.toLowerCase() !== info.evm_address.toLowerCase()) {
                try {
                  const response = await this.wallet?.readFile(hfsFileId, true);
                  if (response) {
                    const lines = response.trim().split("\n");
                    return resolve(lines[lines.length - 1]);
                  }
                } catch (error: any) {
                  console.error("Error reading file:", error);
                  return reject(error);
                }
              }
            }
          );
        } catch (error) {
          console.error("❌ Error during session creation:", error);
          reject(error);
        }
      });
    });
  }

  private async decryptSessionData(
    sessionData: string,
    sessionPrivateKey: string
  ): Promise<SessionData> {
    const userPrivateKeyBuffer = ethers.getBytes("0x" + sessionPrivateKey);
    const encryptedBuffer = Uint8Array.from(atob(sessionData), (c) =>
      c.charCodeAt(0)
    );
    const decryptedBuffer = await decrypt(
      userPrivateKeyBuffer,
      encryptedBuffer
    );
    return JSON.parse(new TextDecoder().decode(decryptedBuffer));
  }

  public async uploadMedicalData(accountId: string, messages: Message[]) {
    if (!this.wallet) return "No wallet";

    const userMessagesText = messages
      .filter((m) => m.sender === "user")
      .map((m) => m.text.replace(/\n/g, " "))
      .join("\n");

    if (!sessionStorage.getItem("sessionAccountId")) {
      return this.startSession(accountId, userMessagesText);
    }

    const sessionId = sessionStorage.getItem("sessionAccountId")!;

    const events = await mirrorNodeClient.getContractEventsbyAccount(sessionId);
    const fileId = events.flat().find((ev) => ev.name === "DataUploaded")
      ?.args.hfsFileId;

    if (!fileId) throw new Error("No file ID found.");

    const response = await this.wallet.updateFile(
      fileId,
      userMessagesText,
      true
    );

    if (typeof response === "string") return response;

    const info = await mirrorNodeClient.getAccountInfo(
      AccountId.fromString(accountId)
    );

    const uploadParams = new ContractFunctionParameterBuilder()
      .addParam({ type: "address", name: "owner", value: info.evm_address })
      .addParam({ type: "string", name: "hfsFileId", value: fileId });
    console.log("started uploadMedicalData");
    await this.wallet.executeContractFunction(
      this.contractId,
      "uploadMedicalData",
      uploadParams,
      0,
      2_500_000,
      true
    );
    console.log("started primise");
    return await new Promise((resolve, reject) => {
      const provider = new JsonRpcProvider(networkConfig.testnet.jsonRpcUrl);

      const contract = new ethers.Contract(
        networkConfig.testnet.contractAddress,
        [
          "event SessionAccountCreated(address indexed user, string sessionData)",
          "event DataUploaded(address indexed user, string hfsFileId)",
        ],
        provider
      );

      console.log("sterted waiting");
      contract.on("DataUploaded", async (user: string, hfsFileId: string) => {
        console.log("upl:  " + user);
        console.log("upl:  " + info.evm_address.toLowerCase());
        if (user.toLowerCase() !== info.evm_address.toLowerCase()) {
          try {
            const response = await this.wallet?.readFile(hfsFileId, true);
            if (response) {
              const lines = response.trim().split("\n");
              return resolve(lines[lines.length - 1]);
            }
          } catch (error: any) {
            console.error("Error reading file:", error);
            return reject(error);
          }
        }
      });
    });
  }

  public async getMedicalData(): Promise<string> {
    if (this.wallet !== null) {
      let wallet: number = 0;

      const paramBuilder = new ContractFunctionParameterBuilder();

      try {
        const response = await this.wallet.executeContractFunction(
          this.contractId,
          "getMedicalData",
          paramBuilder,
          0,
          2_500_000,
          true
        );
        console.log("after get medical data");
        if (typeof response === "string") {
          return "FAILED";
        } else {
          return response.result.toString();
        }
      } catch (error: any) {
        return "FAILED";
      }
    } else {
      return "No wallet";
    }
  }
}
