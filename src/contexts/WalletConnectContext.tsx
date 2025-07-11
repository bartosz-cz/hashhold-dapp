import { createContext, useState, ReactNode } from "react";

const defaultValue = {
  accountId: "",
  setAccountId: (newValue: string) => {
    console.log(newValue);
  },
  isConnected: false,
  setIsConnected: (newValue: boolean) => {
    console.log(newValue);
  },
};

export const WalletConnectContext = createContext(defaultValue);

export const WalletConnectContextProvider = (props: {
  children: ReactNode | undefined;
}) => {
  const [accountId, setAccountId] = useState(defaultValue.accountId);
  const [isConnected, setIsConnected] = useState(defaultValue.isConnected);

  return (
    <WalletConnectContext.Provider
      value={{
        accountId,
        setAccountId,
        isConnected,
        setIsConnected,
      }}
    >
      {props.children}
    </WalletConnectContext.Provider>
  );
};
