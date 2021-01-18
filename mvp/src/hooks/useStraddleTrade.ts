import { BigNumber } from "ethers";
import axios from "axios";
import { Straddle, StraddleTrade, TradeResponse } from "../models";
import { useCallback, useEffect, useState } from "react";

const zero = BigNumber.from("0");

const emptyTrade = {
  venues: [],
  amounts: [],
  totalPremium: zero,
  callPremium: zero,
  callStrikePrice: zero,
  putPremium: zero,
  putStrikePrice: zero,
  buyData: [],
  gasPrice: zero,
};

const SOR_API_URL = "/api/sor";

const scaleFactor = BigNumber.from("10").pow(BigNumber.from("16"));

export const useStraddleTrade = (
  instrumentAddress: string,
  spotPrice: number,
  buyAmount: BigNumber
): StraddleTrade => {
  const [trade, setTrade] = useState<StraddleTrade>(emptyTrade);

  const getBestTrade = useCallback(async () => {
    const spotPriceInWei = BigNumber.from(
      Math.ceil(spotPrice * 100).toString()
    ).mul(scaleFactor);

    const data: Record<string, string> = {
      instrument: instrumentAddress,
      spotPrice: spotPriceInWei.toString(),
      buyAmount: buyAmount.toString(),
    };
    const query = new URLSearchParams(data).toString();
    const url = `${SOR_API_URL}?${query}`;

    try {
      const response = await axios.get(url);
      const trade = convertTradeResponseToStraddleTrade(response.data);
      setTrade(trade);
    } catch (e) {
      throw e;
    }
  }, [instrumentAddress, buyAmount, buyAmount]);

  useEffect(() => {
    if (!buyAmount.isZero() && spotPrice > 0) {
      getBestTrade();
    }
  }, [buyAmount]);

  return trade;
};

const convertTradeResponseToStraddleTrade = (
  response: TradeResponse
): StraddleTrade => {
  const {
    venues,
    totalPremium,
    amounts,
    premiums,
    strikePrices,
    buyData,
    gasPrice,
    optionTypes,
  } = response;

  const putIndex = optionTypes.findIndex((o) => o === 1);
  const callIndex = optionTypes.findIndex((o) => o === 2);
  const putExists = putIndex !== -1;
  const callExists = callIndex !== -1;

  return {
    venues,
    totalPremium: BigNumber.from(totalPremium),
    amounts: amounts.map((a) => BigNumber.from(a)),
    callPremium: callExists ? BigNumber.from(premiums[callIndex]) : zero,
    callStrikePrice: callExists
      ? BigNumber.from(strikePrices[callIndex])
      : zero,
    putPremium: putExists ? BigNumber.from(premiums[putIndex]) : zero,
    putStrikePrice: putExists ? BigNumber.from(strikePrices[putIndex]) : zero,
    buyData,
    gasPrice: BigNumber.from(gasPrice),
  };
};
