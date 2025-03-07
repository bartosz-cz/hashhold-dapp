import {
  AccountId,
  ContractId,
  TokenId,
  TransactionId,
  ContractFunctionResult,
  TransactionReceipt,
  TransactionResponse,
  PublicKey,
  Key,
} from "@hashgraph/sdk";
import { ContractFunctionParameterBuilder } from "./contractFunctionParameterBuilder";
interface walletInterfaceResponse {
  receipt: TransactionReceipt;
  result: TransactionResponse;
}
export interface WalletInterface {
  executeContractFunction: (
    contractId: ContractId,
    functionName: string,
    functionParameters: ContractFunctionParameterBuilder,
    value: number,
    gasLimit: number,
    sessionExecute: boolean
  ) => Promise<walletInterfaceResponse | string>;
  disconnect: () => void;
  createFile: (
    publicKey: Key,
    backendKey: string,
    fileContents: string,
    sessionExecute: boolean
  ) => Promise<walletInterfaceResponse | string>;
  updateFile: (
    fileId: string,
    fileContents: string,
    sessionExecute: boolean
  ) => Promise<walletInterfaceResponse | string>;
  createSessionAccount: () => Promise<Object | string>;
  approveSessionAllowance: (
    allowanceAmount: number
  ) => Promise<Object | string>;
  setOperator: () => void;
  readFile: (fileId: string, sessionExecute: boolean) => Promise<string>;
}
