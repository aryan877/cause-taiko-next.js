export const taikoHekla = {
  id: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? "167009"),
  name: "Taiko Hekla",
  network: "taiko-hekla",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    public: { http: ["https://rpc.hekla.taiko.xyz"] },
    default: { http: ["https://rpc.hekla.taiko.xyz"] },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://explorer.hekla.taiko.xyz" },
  },
  testnet: true,
} as const;

// Type-safe request parameters for adding Taiko network
export type AddEthereumChainParameter = {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
};

export function getTaikoAddChainParameters(): AddEthereumChainParameter {
  return {
    chainId: `0x${taikoHekla.id.toString(16)}`,
    chainName: taikoHekla.name,
    nativeCurrency: taikoHekla.nativeCurrency,
    rpcUrls: [taikoHekla.rpcUrls.default.http[0]],
    blockExplorerUrls: [taikoHekla.blockExplorers.default.url],
  };
}
export interface EthereumProvider {
  request: (args: {
    method: string;
    params?: AddEthereumChainParameter[];
  }) => Promise<void>;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}
