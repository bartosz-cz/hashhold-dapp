export type NetworkName = "testnet";
export type ChainId = "0x128";
export type NetworkConfig = {
  network: NetworkName;
  jsonRpcUrl: string;
  mirrorNodeUrl: string;
  chainId: ChainId;
  contractId: string;
  contractAddress: string;
};

// purpose of this file is to define the type of the config object
export type NetworkConfigs = {
  [key in NetworkName]: {
    network: NetworkName;
    jsonRpcUrl: string;
    mirrorNodeUrl: string;
    chainId: ChainId;
    contractId: string;
    contractAddress: string;
  };
};

export type AppConfig = {
  networks: NetworkConfigs;
};
