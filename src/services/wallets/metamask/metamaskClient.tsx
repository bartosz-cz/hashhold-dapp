import { ContractId } from "@hashgraph/sdk";

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
//let globalProvider: ethers.providers.Web3Provider | null = null;

//const getProvider = (): ethers.providers.Web3Provider => {
/* if (!globalProvider) {
    if (!ethereum) {
      throw new Error(
        "MetaMask is not installed! Please install the MetaMask extension!"
      );
    }
    globalProvider = new ethers.providers.Web3Provider(ethereum);
  }
  return globalProvider;*/
//};

// returns a list of accounts
// otherwise empty array
export const connectToMetamask = async () => {
  // const provider = getProvider();

  // keep track of accounts returned
  //let accounts: string[] = [];

  try {
    await switchToHederaNetwork(ethereum);
    // accounts = await provider.send("eth_requestAccounts", []);
    // console.log(accounts);
  } catch (error: any) {
    if (error.code === 4001) {
      // EIP-1193 userRejectedRequest error
      console.warn("Please connect to Metamask.");
    } else {
      console.error(error);
    }
  }

  return "";
};

class MetaMaskWallet implements WalletInterface {
  async approveTokenAllowance() {
    try {
      return "FAILED";
    } catch (error) {
      console.log(error);
      return "error";
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
    console.log(functionParameters);
    return contractId + functionName + value + gasLimit;
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
      // const provider = getProvider();

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
      };
    } catch (error: any) {
      console.error(error.message ? error.message : error);
    }
  }, [setMetamaskAccountAddress]);

  return null;
};
