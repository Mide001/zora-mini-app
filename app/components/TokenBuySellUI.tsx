import React, { useState, useEffect, SetStateAction } from "react";
import { ArrowDown, RefreshCw, Zap } from "lucide-react";

interface Token {
  symbol: string;
  priceUsd: string;
}

const TokenBuySellUI = ({ token }: { token: Token }) => {
  const [activeTab, setActiveTab] = useState("buy");
  const [amount, setAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [usdcBalance, setUsdcBalance] = useState(1000); // Mock USDC balance
  const [tokenBalance, setTokenBalance] = useState(0); // Mock token balance
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [slippageTolerance, setSlippageTolerance] = useState(0.5); // Default 0.5%

  // Mock exchange rate - in a real app this would come from an API
  const exchangeRate = token?.priceUsd ? parseFloat(token.priceUsd) : 0.001;

  useEffect(() => {
    // Calculate the token amount based on USDC input
    if (amount && activeTab === "buy") {
      const calculatedTokens = parseFloat(amount) / exchangeRate;
      setTokenAmount(calculatedTokens.toFixed(6));
    }
    // Calculate the USDC amount based on token input
    else if (tokenAmount && activeTab === "sell") {
      const calculatedUsdc = parseFloat(tokenAmount) * exchangeRate;
      setAmount(calculatedUsdc.toFixed(2));
    }
  }, [amount, tokenAmount, exchangeRate, activeTab]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      if (activeTab === "sell") {
        setTokenAmount("");
      }
    }
  };
  const handleTokenAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setTokenAmount(value);
      if (activeTab === "buy") {
        setAmount("");
      }
    }
  };

  const handleMaxClick = () => {
    if (activeTab === "buy") {
      setAmount(usdcBalance.toString());
    } else {
      setTokenAmount(tokenBalance.toString());
    }
  };

  const handleSubmit = () => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (activeTab === "buy") {
        setTokenBalance((prev) => prev + parseFloat(tokenAmount));
        setUsdcBalance((prev) => prev - parseFloat(amount));
        setSuccessMessage(
          `Success! Bought ${parseFloat(tokenAmount).toFixed(4)} ${token?.symbol}`,
        );
      } else {
        setTokenBalance((prev) => prev - parseFloat(tokenAmount));
        setUsdcBalance((prev) => prev + parseFloat(amount));
        setSuccessMessage(
          `Success! Sold ${parseFloat(tokenAmount).toFixed(4)} ${token?.symbol}`,
        );
      }

      setLoading(false);
      setAmount("");
      setTokenAmount("");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    }, 1500);
  };

  const isButtonDisabled = () => {
    if (loading) return true;
    if (activeTab === "buy") {
      return (
        !amount || parseFloat(amount) <= 0 || parseFloat(amount) > usdcBalance
      );
    } else {
      return (
        !tokenAmount ||
        parseFloat(tokenAmount) <= 0 ||
        parseFloat(tokenAmount) > tokenBalance
      );
    }
  };

  const handleSlippageChange = (value: SetStateAction<number>) => {
    setSlippageTolerance(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4">
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            {token?.symbol} Trading
          </h2>
          <p className="text-xs text-gray-500">Trade with USDC</p>
        </div>
        {/* Mobile-friendly price display */}
        <div className="text-right">
          <div className="text-xs text-gray-500">Current Price</div>
          <div className="text-sm font-medium">${exchangeRate.toFixed(6)}</div>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {/* Tab Selector - More touch-friendly for mobile */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-3">
          <button
            onClick={() => setActiveTab("buy")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-md ${
              activeTab === "buy"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-200"
            } transition-colors duration-200`}
          >
            Buy
          </button>
          <button
            onClick={() => setActiveTab("sell")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-md ${
              activeTab === "sell"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-200"
            } transition-colors duration-200`}
          >
            Sell
          </button>
        </div>

        {/* Balance Display - Mobile optimized layout */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-xs text-gray-500">USDC Balance</div>
            <div className="text-sm font-medium">${usdcBalance.toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-xs text-gray-500">{token?.symbol} Balance</div>
            <div className="text-sm font-medium text-right">
              {tokenBalance.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Trade Form */}
        <div className="space-y-3">
          {/* First Input (USDC for Buy, Token for Sell) */}
          <div>
            <label className="flex justify-between text-xs font-medium text-gray-700 mb-1">
              <span>{activeTab === "buy" ? "You pay" : "You sell"}</span>
              <button
                onClick={handleMaxClick}
                className="text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded text-xs"
              >
                MAX
              </button>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">
                  {activeTab === "buy" ? "$" : ""}
                </span>
              </div>
              <input
                type="text"
                inputMode="decimal"
                className="w-full pl-6 pr-16 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all duration-200 text-base"
                value={activeTab === "buy" ? amount : tokenAmount}
                onChange={
                  activeTab === "buy"
                    ? handleAmountChange
                    : handleTokenAmountChange
                }
                placeholder={activeTab === "buy" ? "0.00" : "0.00"}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className="text-xs font-medium bg-gray-200 py-1 px-2 rounded-md">
                  {activeTab === "buy" ? "USDC" : token?.symbol}
                </span>
              </div>
            </div>
          </div>

          {/* Exchange Rate Arrow - Mobile friendly */}
          <div className="flex items-center justify-center py-1">
            <div className="bg-gray-100 rounded-full p-1">
              <ArrowDown className="text-gray-400" size={16} />
            </div>
          </div>

          {/* Second Input (Token for Buy, USDC for Sell) */}
          <div>
            <label className="flex justify-between text-xs font-medium text-gray-700 mb-1">
              <span>{activeTab === "buy" ? "You receive" : "You receive"}</span>
              <span className="text-gray-500 text-xs">
                Rate: 1 {token?.symbol} = ${exchangeRate.toFixed(4)}
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">
                  {activeTab === "sell" ? "$" : ""}
                </span>
              </div>
              <input
                type="text"
                readOnly
                className="w-full pl-6 pr-16 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-800 text-base"
                value={activeTab === "buy" ? tokenAmount : amount}
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className="text-xs font-medium bg-gray-200 py-1 px-2 rounded-md">
                  {activeTab === "buy" ? token?.symbol : "USDC"}
                </span>
              </div>
            </div>
          </div>

          {/* Slippage Selector - Mobile optimized */}
          <div className="pt-1 pb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600">Slippage Tolerance</span>
              <span className="text-xs font-medium">{slippageTolerance}%</span>
            </div>
            <div className="flex space-x-2">
              {[0.1, 0.5, 1.0].map((value) => (
                <button
                  key={value}
                  onClick={() => handleSlippageChange(value)}
                  className={`text-xs py-1.5 flex-1 rounded-md ${
                    slippageTolerance === value
                      ? "bg-blue-100 text-blue-600 font-medium"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {value}%
                </button>
              ))}
            </div>
          </div>

          {/* Action Button - Larger touch target for mobile */}
          <button
            onClick={handleSubmit}
            disabled={isButtonDisabled()}
            className={`w-full py-3.5 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 ${
              isButtonDisabled()
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : activeTab === "buy"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
            } transition-colors duration-200 shadow-sm text-base`}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Zap size={18} />
                <span>
                  {activeTab === "buy"
                    ? `Buy ${token?.symbol}`
                    : `Sell ${token?.symbol}`}
                </span>
              </>
            )}
          </button>

          {/* Success Message */}
          {successMessage && (
            <div className="text-center py-2.5 px-3 bg-green-100 text-green-700 rounded-lg text-sm mt-2">
              {successMessage}
            </div>
          )}
        </div>
      </div>

      <div className="p-2.5 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
        Trade directly with USDC. No fees. Fast transactions.
      </div>
    </div>
  );
};

export default TokenBuySellUI;
