import { assertNotEquals } from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { parseOrderString } from "./kat-crypto-street.ts";

Deno.test(function parseOrderStringHandlesAllFormats() {
  const strings = [
      'https://www.tradingview.com/x/tziCAB0O\n\n1inch/usdt\n\nLong\n\nLeverage:10x\n\nEntry zone:0.4520-0.4300\n\nTake-Profit-Target:0.46-0.48-0.50-0.52-0.55-0.60-0.65-0.70-0.75-0.80-0.85-0.90\n\nStoploss:0.3200',
      'https://www.tradingview.com/x/hAgpXyjF\n\nBnb/usdt\n\nShort\n\nLeverage:10x\n\nEntry zone:241-250\n\nTake-Profit-Target:238-235-225-215-205-200-190-180\n\nStoploss:265',
      'https://www.tradingview.com/x/7tdRnSFg\nDot/USDT\n\nSHORT\n\nLEVERAGE:10x\n\nEntry zone:5.24-5.60\n\nTake-Profit-target:5.15-5.10-5-4.90-4.70-4.50-4.30-4.20\n\nStoploss:6',
      'Bnb/USDTShortLeverage:20xEntry:276-278Take-Profit-Targets:270-268-265-260-258-255-250StopLoss:285',
      
  ];

  strings.forEach((string) => assertNotEquals(parseOrderString(string), null, `Failed to match ${string}`));
});
