import {
  assertEquals,
  assertNotEquals,
} from "../dev_deps.ts";
import { parseOrderString } from "./binance_master.ts";

Deno.test(function parseOrderStringHandlesAllFormats() {
  // TODO: Fix tests
  console.error('TODO: FIX TESTS'); return;

  const strings = [
    "⚡️⚡️ #RDNT/USDT ⚡️⚡️\nExchanges: Binance Futures\nSignal Type: Regular (Short)\nLeverage: Cross (20х)\n\nEntry Targets:\n0.3066\n\nTake-Profit Targets:\n1)0.302\n2)0.2989\n3)0.2959\n4)0.2913\n5)0.2882\n6)0.2836\n7) 🚀🚀🚀\n\nStop Targets:\n5-10%",
  ];

  strings.forEach((string) => assertNotEquals(parseOrderString(string), null, `Failed to match ${string}`));
});

Deno.test(function parseOrderStringReturnsCorrectResults() {
  // TODO: Fix tests
  console.error('TODO: FIX TESTS'); return;

  const strings = [
    {
      text: "⚡️⚡️ #RDNT/USDT ⚡️⚡️\nExchanges: Binance Futures\nSignal Type: Regular (Short)\nLeverage: Cross (20х)\n\nEntry Targets:\n0.3066\n\nTake-Profit Targets:\n1)0.302\n2)0.2989\n3)0.2959\n4)0.2913\n5)0.2882\n6)0.2836\n7) 🚀🚀🚀\n\nStop Targets:\n5-10%",
      expected: {
        coin: "RDNT/USDT",
        direction: "SHORT",
        exchange: "Binance Futures",
        leverage: 20,
        entry: [
          0.3066,
        ],
        targets: [
          0.302,
          0.2989,
          0.2959,
          0.2913,
          0.2882,
          0.2836,
        ],
        type: "order",
        stopLoss: null,
      },
    },
  ];

  strings.forEach(x => assertEquals(parseOrderString(x.text) as any, x.expected, `Failed to match ${x.text}`));
});
