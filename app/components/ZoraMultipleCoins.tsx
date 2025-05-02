import { getCoins } from "@zoralabs/coins-sdk";
import { base } from "viem/chains";

const ZoraMultipleCoins = () => {
  async function fetchMultipleCoins() {
    const response = await getCoins({
      coins: [
        {
          chainId: base.id,
          collectionAddress: "0x60913F9123aB478f009dc3A2b922ebE93B1c8abD",
        },
        {
          chainId: base.id,
          collectionAddress: "0xd769d56f479e9e72a77bb1523e866a33098feec5",
        },
        {
          chainId: base.id,
          collectionAddress: "0x25c7f09f43cd5f5a5e4dfc41378def3c8d500377",
        },
      ],
    });

    response.data?.zora20Tokens?.forEach((coin: any, index: number) => {
      console.log(`Coin ${index + 1}: ${coin.name} (${coin.symbol})`);
      console.log(`- Market Cap: ${coin.marketCap}`);
      console.log(`- 24h Volume: ${coin.volume24h}`);
      console.log(`- Holders: ${coin.uniqueHolders}`);
      console.log("--------------------------------");
    });

    return response;
  }

  return (
    <>
      <h2>Zora Multiple Coins</h2>
      <button className="px-4 py-2 bg-[red] font-white border-md" onClick={fetchMultipleCoins}>Trigger!!!</button>
    </>
  );
};

export default ZoraMultipleCoins;
