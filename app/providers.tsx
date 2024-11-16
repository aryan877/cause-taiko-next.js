"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { taikoHekla } from "./chains";

const config = createConfig({
  chains: [taikoHekla, mainnet],
  transports: {
    [taikoHekla.id]: http(),
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

const apolloClient = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
  cache: new InMemoryCache(),
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
