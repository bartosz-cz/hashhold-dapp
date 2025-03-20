import { ContractId, AccountId } from "@hashgraph/sdk";
import { TokenId } from "@hashgraph/sdk/lib/transaction/TransactionRecord";
import { ethers } from "ethers";
import { useContext, useEffect } from "react";
import { appConfig } from "../../../config";
import { MetamaskContext } from "../../../contexts/MetamaskContext";
import { ContractFunctionParameterBuilder } from "../contractFunctionParameterBuilder";
import { WalletInterface } from "../walletInterface";

const currentNetworkConfig = appConfig.networks.testnet;

export const switchToHederaNetwork = async (ethereum: any) => {
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: currentNetworkConfig.chainId }],
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("4902")) {
      // Chain not found
      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [currentNetworkConfig],
        });
      } catch (addError) {
        console.error(addError);
      }
    }
    console.error(error);
  }
};

const { ethereum } = window as any;
let globalProvider: ethers.providers.Web3Provider | null = null;

const getProvider = (): ethers.providers.Web3Provider => {
  if (!globalProvider) {
    if (!ethereum) {
      throw new Error(
        "MetaMask is not installed! Please install the MetaMask extension!"
      );
    }
    globalProvider = new ethers.providers.Web3Provider(ethereum);
  }
  return globalProvider;
};

// returns a list of accounts
// otherwise empty array
export const connectToMetamask = async () => {
  const provider = getProvider();

  // keep track of accounts returned
  let accounts: string[] = [];

  try {
    await switchToHederaNetwork(ethereum);
    accounts = await provider.send("eth_requestAccounts", []);
    console.log(accounts);
  } catch (error: any) {
    if (error.code === 4001) {
      // EIP-1193 userRejectedRequest error
      console.warn("Please connect to Metamask.");
    } else {
      console.error(error);
    }
  }

  return accounts;
};

class MetaMaskWallet implements WalletInterface {
  private convertAccountIdToSolidityAddress(accountId: AccountId): string {
    const accountIdString =
      accountId.evmAddress !== null
        ? accountId.evmAddress.toString()
        : accountId.toSolidityAddress();

    return `0x${accountIdString}`;
  }

  async approveTokenAllowance() {
    try {
      return "FAILED";
    } catch (error) {
      return "FAILED";
    }
  }
  // Purpose: build contract execute transaction and send to hashconnect for signing and execution
  // Returns: Promise<TransactionId | null>
  async executeContractFunction(
    contractId: ContractId,
    functionName: string,
    functionParameters: ContractFunctionParameterBuilder,
    value: number,
    gasLimit: number
  ) {
    const provider = getProvider();
    const signer = await provider.getSigner();
    const payableModifier = ethers.BigNumber.from(value).isZero()
      ? ""
      : "payable";
    const abi = [
      `function ${functionName}(${functionParameters.buildAbiFunctionParams()}) external ${payableModifier}`,
    ];

    // create contract instance for the contract id
    // to call the function, use contract[functionName](...functionParameters, ethersOverrides)
    const contract = new ethers.Contract(
      `0x${contractId.toSolidityAddress()}`,
      abi,
      signer
    );
    console.log(contractId.toSolidityAddress());
    const params = functionParameters.buildEthersParams();
    try {
      console.log(value);
      const overrides = {
        gasLimit: gasLimit === -1 ? undefined : gasLimit,
        ...(payableModifier
          ? { value: ethers.BigNumber.from(value.toString()) }
          : {}), // Include value if provided
      };
      console.log("start function");
      console.log(`Calling function: ${functionName}`);
      console.log("Params:", params);
      console.log("Overrides:", overrides);
      const txResult = await contract[functionName](...params, overrides);
      console.log("start receipt");
      const receipt = await txResult.wait();
      console.log("log receipt");
      console.log(receipt);
      return { receipt: receipt, result: txResult };
    } catch (error: any) {
      console.warn(error.message ? error.message : error);
      return "FAILED";
    }
  }

  disconnect() {
    alert("Please disconnect using the Metamask extension.");
  }
}

export const metamaskWallet = new MetaMaskWallet();

export const MetaMaskClient = () => {
  const { setMetamaskAccountAddress } = useContext(MetamaskContext);
  useEffect(() => {
    // set the account address if already connected
    console.log("use effect");
    try {
      const provider = getProvider();
      provider.listAccounts().then((signers) => {
        if (signers.length !== 0) {
          setMetamaskAccountAddress(signers[0]);
        } else {
          setMetamaskAccountAddress("");
        }
      });
      // listen for account changes and update the account address
      ethereum.on("accountsChanged", (accounts: string[]) => {
        console.log("fireeeeeed2");
        if (accounts.length !== 0) {
          setMetamaskAccountAddress(accounts[0]);
        } else {
          setMetamaskAccountAddress("");
        }
      });

      // cleanup by removing listeners
      return () => {
        console.log("removed");
        provider.removeAllListeners("accountsChanged");
      };
    } catch (error: any) {
      console.error(error.message ? error.message : error);
    }
  }, [setMetamaskAccountAddress]);

  return null;
};
