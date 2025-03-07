import {
  AccountId,
  ContractId,
  TransactionId,
  EntityIdHelper,
} from "@hashgraph/sdk";
import { NetworkConfig } from "../../config";
import { ethers, ContractInterface } from "ethers";
import { strict } from "assert";

export class MirrorNodeClient {
  url: string;
  contractId: string;
  constructor(networkConfig: NetworkConfig) {
    this.url = networkConfig.mirrorNodeUrl;
    this.contractId = networkConfig.contractId;
  }

  private abi: ContractInterface = [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "backend",
          type: "address",
        },
      ],
      name: "BackendAuthorized",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "backend",
          type: "address",
        },
      ],
      name: "BackendRevoked",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "requester",
          type: "address",
        },
        {
          indexed: false,
          internalType: "string",
          name: "hfsFileId",
          type: "string",
        },
      ],
      name: "DataAccessed",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
      ],
      name: "DataDeleted",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          indexed: false,
          internalType: "string",
          name: "hfsFileId",
          type: "string",
        },
      ],
      name: "DataUploaded",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "newBalance",
          type: "uint256",
        },
      ],
      name: "MessageProcessed",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "PaymentReceived",
      type: "event",
    },
  ];

  async getAccountInfo(accountId: AccountId) {
    console.log(`${this.url}/api/v1/accounts/${accountId}`);
    const accountInfo = await fetch(
      `${this.url}/api/v1/accounts/${accountId}`,
      { method: "GET" }
    );
    console.log(accountInfo);
    const accountInfoJson = await accountInfo.json();
    console.log(accountInfoJson);
    return accountInfoJson;
  }

  async getEpochId(accountId: AccountId) {
    const accountInfo = await fetch(
      `${this.url}/api/v1/accounts/${accountId}`,
      { method: "GET" }
    );
    const accountInfoJson = await accountInfo.json();
    return accountInfoJson;
  }

  async getContractTransactionEvents(
    transactionId: TransactionId,
    delay: number
  ) {
    console.log(transactionId);
    let id = transactionId.toString().replace("@", "-");
    const lastDotIndex = id.lastIndexOf(".");
    id = id.substring(0, lastDotIndex) + "-" + id.substring(lastDotIndex + 1);
    console.log(`${this.url}/api/v1/contracts/results/${id}`);
    const result = await fetch(`${this.url}/api/v1/contracts/results/${id}`, {
      method: "GET",
    });

    return await parseEvents(result, this.abi, this.contractId);
  }

  async getContractEventsbyAccount(accountId: string | null) {
    let formattedAccountId = accountId;
    if (accountId && accountId.length === 42) {
      console.log(`${this.url}/api/v1/accounts/${accountId}`);
      const response = await fetch(`${this.url}/api/v1/accounts/${accountId}`);

      if (!response.ok) {
        console.error(
          "Error fetching account from Mirror Node:",
          response.statusText
        );
      }
      const resData = await response.json();
      if (resData.account) {
        console.log(resData);
        formattedAccountId = resData.account; // Return the Hedera AccountId (e.g., "0.0.12345")
      } else {
        console.warn("No account found for EVM address.");
      }
    }

    console.log(`${this.url}/api/v1/transactions/?account.id=${formattedAccountId}&limit=100&transactiontype=CONTRACTCALL
`);
    const result = await fetch(
      `${this.url}/api/v1/transactions/?account.id=${formattedAccountId}&limit=100&transactiontype=CONTRACTCALL
`,

      {
        method: "GET",
      }
    );

    const data = await result.json();
    const transactions = data.transactions;

    // Filter client-side by `entity_id`:
    const filteredTransactions = transactions.filter(
      (tx: any) => tx.entity_id === this.contractId
      // ||  tx.entity_id === "0.0.15058" ||
      //  tx.entity_id === "0.0.359" ||
      //  tx.entity_id === null
    );
    let events = [];
    console.log(filteredTransactions);
    for (const tx of filteredTransactions) {
      console.log(tx);
      console.log(tx.transaction_id);
      let resultResponse;

      console.log(`${this.url}/api/v1/contracts/results/${tx.transaction_id}`);
      const contractResultUrl = `${this.url}/api/v1/contracts/results/${tx.transaction_id}`;
      resultResponse = await fetch(contractResultUrl, {
        method: "GET",
      });
      console.log(resultResponse);

      if (resultResponse.status === 404) {
        continue;
      }

      const event = await parseEvents(
        resultResponse,
        this.abi,
        this.contractId
      );
      //console.log(event);
      events.push(event);
      //console.log(events);
      console.log("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
    }
    console.log(events);
    return events;
  }

  /*async getTransactionIdByHashId(
    hashId: string,
  ) {
   
      const base64Hash = hexToBase64(hashId);
      console.log(`${this.url}/api/v1/contracts/results/${tx.transaction_id}`);
      const contractResultUrl = `${this.url}/api/v1/contracts/results/${tx.transaction_id}`;
      const resultResponse = await fetch(contractResultUrl, { method: "GET" });
      console.log(resultResponse);
      const event = await parseEvents(resultResponse, this.abi);
      console.log(event);
      events.push(event);
      console.log(events);
   
    return events;
  }*/
}

/*function hexToBase64(hexString: string) {
  // remove leading 0x
  const hex = hexString.replace(/^0x/, '');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return btoa(String.fromCharCode(...bytes));
}*/

function evmToHederaAddress(hederaNativeAddress: string) {
  const { shard, realm, num } = EntityIdHelper.fromString(hederaNativeAddress);
  return "0x" + EntityIdHelper.toSolidityAddress([shard, realm, num]);
}

async function parseEvents(
  response: any,
  abi: ContractInterface,
  contractId: string
) {
  const jResponse = await response.json();
  const abiInterface = new ethers.Interface(JSON.stringify(abi));
  let events: any[] = [];
  let evmAddress = evmToHederaAddress(contractId);
  //console.log(jResponse.logs);
  //console.log(evmAddress);
  await jResponse.logs
    .filter((log: any) => log.contract_id === contractId)
    .forEach((log: any) => {
      try {
        const logRequest = {
          data: log.data,
          topics: log.topics,
        };
        const event = abiInterface.parseLog(logRequest);
        console.log(event);
        console.log(event.args);
        events.push(event);
        return event.args;
      } catch (err) {
        console.error("Error decoding log:", err);
      }
    });
  console.log(events);
  return events;
}
