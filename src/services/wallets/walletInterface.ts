import { ContractId, TokenId } from "@hashgraph/sdk";
import { ContractFunctionParameterBuilder } from "./contractFunctionParameterBuilder";

export interface WalletInterface {
  approveTokenAllowance: (
    contractId: ContractId,
    amount: number,
    tokenId: TokenId
  ) => Promise<object | string>;
  executeContractFunction: (
    contractId: ContractId,
    functionName: string,
    functionParameters: ContractFunctionParameterBuilder,
    value: number,
    gasLimit: number
  ) => Promise<object | string>;
  disconnect: () => void;
}
