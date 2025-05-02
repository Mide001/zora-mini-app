import * as React from "react";
import { createCoinCall } from "@zoralabs/coins-sdk";
import { Address } from "viem";
import { useWriteContract, useSimulateContract, useWaitForTransactionReceipt } from "wagmi";

const ZoraComponent: React.FC = () => {
  // State to store contract call parameters after resolution
  const [contractParams, setContractParams] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  // State to store transaction hash
  const [txHash, setTxHash] = React.useState<`0x${string}` | undefined>(undefined);

  // Load contract parameters on component mount
  React.useEffect(() => {
    const loadContractParams = async () => {
      try {
        // Define coin parameters
        const coinParams = {
          name: "My Awesome Coin",
          symbol: "MAC",
          uri: "ipfs://bafybeigoxzqzbnxsn35vq7lls3ljxdcwjafxvbvkivprsodzrptpiguysy",
          payoutRecipient: "0x1A1625e640Ca30410FFc9B51Fed0D1FB39fe6D85" as Address,
          platformReferrer: "0x0000000000000000000000000000000000000000" as Address,
        };
        // Await the promise from createCoinCall
        const params = await createCoinCall(coinParams);
        setContractParams(params);
      } catch (error) {
        console.error("Failed to create coin call:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContractParams();
  }, []);

  // Only use the hooks when contractParams is available
  const { data: simulateData, error: simulateError } = useSimulateContract(
    contractParams ? contractParams : undefined,
  );
  
  const {
    writeContract,
    status,
    isPending,
    error: writeError,
    data: writeData, // Transaction hash when successful
  } = useWriteContract();

  // Track transaction receipt
  const { 
    data: txReceipt,
    isLoading: isWaitingForReceipt,
    isSuccess: isTxSuccess,
    error: receiptError 
  } = useWaitForTransactionReceipt({
    hash: txHash,
    confirmations: 1, // Wait for 1 confirmation
  });

  // Log transaction receipt when it's successful
  React.useEffect(() => {
    if (isTxSuccess && txReceipt) {
      console.log("Transaction successful! Receipt:", txReceipt);
      
      // Additional useful info
      console.log("Transaction hash:", txHash);
      console.log("Block number:", txReceipt.blockNumber);
      console.log("Block hash:", txReceipt.blockHash);
      console.log("Gas used:", txReceipt.gasUsed);
      
      // Event logs could contain token address or other useful information
      if (txReceipt.logs && txReceipt.logs.length > 0) {
        console.log("Event logs:", txReceipt.logs);
      }
    }
  }, [isTxSuccess, txReceipt, txHash]);

  // Set transaction hash when write is successful
  React.useEffect(() => {
    if (writeData) {
      setTxHash(writeData);
    }
  }, [writeData]);
  
  const handleCreateCoin = React.useCallback(() => {
    if (simulateData?.request) {
      writeContract(simulateData.request);
    }
  }, [simulateData?.request, writeContract]);

  if (isLoading) {
    return <div>Loading contract parameters...</div>;
  }

  return (
    <>
      <h2>ZoraComponent</h2>
      <button
        disabled={!simulateData?.request || isPending || isWaitingForReceipt}
        onClick={handleCreateCoin}
      >
        {isPending ? "Creating..." : isWaitingForReceipt ? "Processing..." : "Create Coin"}
      </button>
      
      {/* Transaction status display */}
      {txHash && (
        <div style={{ marginTop: "10px" }}>
          <p>Transaction hash: {txHash}</p>
          <p>Status: {isWaitingForReceipt ? "Processing..." : isTxSuccess ? "Success!" : "Complete"}</p>
        </div>
      )}
      
      {isTxSuccess && txReceipt && (
        <div style={{ marginTop: "10px", color: "green" }}>
          <p>Transaction successful!</p>
          <p>Block: {txReceipt.blockNumber.toString()}</p>
          <p>Gas used: {txReceipt.gasUsed.toString()}</p>
        </div>
      )}
      
      {(simulateError || writeError || receiptError) && (
        <div style={{ color: "red", marginTop: "10px" }}>
          Error: {(simulateError || writeError || receiptError)?.message}
        </div>
      )}
    </>
  );
};

export default ZoraComponent;