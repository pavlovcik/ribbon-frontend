import React from "react";
import { Row, Col, Statistic } from "antd";
import { StyledCard } from "../../designSystem";
import {
  computeStraddleValue,
  computeBreakeven,
  computeBreakevenPercent,
} from "../../utils/straddle";
import { useETHPriceInUSD } from "../../hooks/useEthPrice";
import { Straddle } from "../../models";
import { timeToExpiry } from "../../utils/time";
import { useStraddleTrade } from "../../hooks/useStraddleTrade";
import { BigNumber } from "ethers";

const StyledStatistic = (title: string, value: string) => {
  return (
    <Statistic
      valueStyle={{ fontSize: 15, fontWeight: "bold", paddingBottom: "15px" }}
      title={title}
      value={value}
    />
  );
};

type Props = {
  straddle: Straddle;
  amount: number;
};

const ProductInfo: React.FC<Props> = ({ straddle, amount }) => {
  const ethPrice = useETHPriceInUSD();
  const { totalPremium } = useStraddleTrade(
    straddle.address,
    ethPrice,
    BigNumber.from(amount.toString())
  );

  const [straddleUSD, straddleETH] = computeStraddleValue(
    totalPremium,
    ethPrice
  );
  const [lowerBreakeven, upperBreakeven] = computeBreakeven(
    straddleUSD,
    ethPrice
  );
  const expiryTimestamp = new Date(
    straddle.expiryTimestamp * 1000
  ).toLocaleDateString();

  const expiry = `${expiryTimestamp} (${timeToExpiry(
    expiryTimestamp
  )} remaining)`;

  const totalCostUSD = (parseFloat(straddleUSD) * amount).toFixed(2);
  const totalCostETH = (parseFloat(straddleETH) * amount).toFixed(2);

  return (
    <StyledCard style={{ height: "100%" }}>
      <Row>{StyledStatistic("Expiry", expiry)}</Row>
      <Row>
        {StyledStatistic(
          "Total Cost",
          `$${totalCostUSD} (${totalCostETH} ETH)`
        )}
      </Row>
      <Row>
        <Col span={12}>
          {StyledStatistic(
            "Breakeven Price",
            `≤ $${lowerBreakeven} or ≥ $${upperBreakeven}`
          )}
        </Col>
        <Col span={12}>
          {StyledStatistic(
            "To Breakeven",
            `(±${computeBreakevenPercent(straddleUSD, ethPrice)}%)`
          )}
        </Col>
      </Row>
    </StyledCard>
  );
};

export default ProductInfo;
