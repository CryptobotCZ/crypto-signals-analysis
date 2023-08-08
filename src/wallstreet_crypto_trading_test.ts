import {
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { parseOrderString } from "./wallstreet_crypto_trading.ts";

Deno.test(function parseOrderStringHandlesAllFormats() {
  const strings = [
    "Consider Buying some #EGLD here For Short term.\n\nLooking Bullish here after break. Can show some Bullish move in Short term.\n\nEntry: Around 41.45$ - 40.50$\n\nTargets: 42.20$,43.00$,43.80$,44.80$,46.00$,48.00$\n\nStoploss: 39.50$\n\nLeverage: 5x-10x\n\nDo manage your risk well as market is uncertain this days.",
    "Consider Selling some #LIT here For Short term.\n\nLooking Bearsish here after break. Can show some Bearsish move in Short term.\n\nEntry: Around 1.090$ - 1.140$\n\nTargets: 1.060$,1.040$,1.020$,1.000$,0.950$,0.910$,0.880$,0.850$\n\nStoploss: 1.180$\n\nLeverage: 5x-10x\n\nDo manage your risk well as market is uncertain this days.",
  ];

  strings.forEach((string) =>
    assertNotEquals(parseOrderString(string), null, `Failed to match ${string}`)
  );
});

Deno.test(function parseOrderStringReturnsCorrectResults() {
  const strings = [
    {
      text:
        "Consider Buying some #EGLD here For Short term.\n\nLooking Bullish here after break. Can show some Bullish move in Short term.\n\nEntry: Around 41.45$ - 40.50$\n\nTargets: 42.20$,43.00$,43.80$,44.80$,46.00$,48.00$\n\nStoploss: 39.50$\n\nLeverage: 5x-10x\n\nDo manage your risk well as market is uncertain this days.",
      expected: {
        coin: "GMT/USDT",
        direction: "SHORT",
        exchange: "5-10",
        leverage: 10,
        entry: [
          0.4222,
          0.4350,
        ],
        stopLoss: 0.4450,
        targets: [
          0.4150,
          0.4070,
          0.4000,
          0.3900,
          0.3800,
          0.3700,
        ],
        type: "order",
      },
    },
    {
      text:
        "Consider Selling some #LIT here For Short term.\n\nLooking Bearsish here after break. Can show some Bearsish move in Short term.\n\nEntry: Around 1.090$ - 1.140$\n\nTargets: 1.060$,1.040$,1.020$,1.000$,0.950$,0.910$,0.880$,0.850$\n\nStoploss: 1.180$\n\nLeverage: 5x-10x\n\nDo manage your risk well as market is uncertain this days.",
    },
  ];

  strings.forEach((x) =>
    assertEquals(
      parseOrderString(x.text) as any,
      x.expected,
      `Failed to match ${x.text}`,
    )
  );
});
