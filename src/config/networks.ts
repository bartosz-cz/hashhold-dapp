import { NetworkConfigs } from "./type";

export const networkConfig: NetworkConfigs = {
  testnet: {
    network: "testnet",
    jsonRpcUrl:
      "wss://sparkling-tame-hexagon.hedera-testnet.quiknode.pro/7b4cef2bcdf815674d64e9085ce1c2e805d81188/",
    mirrorNodeUrl: "https://testnet.mirrornode.hedera.com",
    chainId: "0x128",
    contractId: "0.0.5777008",
    contractAddress: "0x86aaF9064F1Ea0361C02aCc57D37109F54F33041",
  },
};

//jsonRpcUrl: "https://pool.arkhia.io/hedera/testnet/json-rpc/v1/ICo6x86I1456oa6M4di2661M848MddoV",
// jsonRpcUrl: "https://296.rpc.thirdweb.com",
