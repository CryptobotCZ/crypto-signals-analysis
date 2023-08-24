import {
  assertEquals,
  assertNotEquals,
} from "../dev_deps.ts";
import { parseOrderString } from "./accountant.ts";

Deno.test(function parseOrderStringHandlesAllFormats() {
  const strings = [
    '⭐️ VIP Signal ⭐️\n\n🟢 Long\n\nName: #CFXUSDT\nLeverage: Cross (20x)\n\n↪️ Entry Price (USDT): 0.2066\n\n🎯 Targets in USDT:\n\n1️⃣ 0.2097\n2️⃣ 0.2118\n3️⃣ 0.2138\n4️⃣ 0.2169\n5️⃣ 0.2273\n6️⃣ 🌙\n\n🛑 StopLoss: 0.1859',
  ];

  strings.forEach((string) => assertNotEquals(parseOrderString(string), null, `Failed to match ${string}`));
});

Deno.test(function parseOrderStringReturnsCorrectResults() {
  const strings = [
    {
      text: '⭐️ VIP Signal ⭐️\n\n🟢 Long\n\nName: #CFXUSDT\nLeverage: Cross (20x)\n\n↪️ Entry Price (USDT): 0.2066\n\n🎯 Targets in USDT:\n\n1️⃣ 0.2097\n2️⃣ 0.2118\n3️⃣ 0.2138\n4️⃣ 0.2169\n5️⃣ 0.2273\n6️⃣ 🌙\n\n🛑 StopLoss: 0.1859',
      expected: {
        coin: "CFXUSDT",
        direction: "LONG",
        exchange: "",
        leverage: 20,
        entry: [
          0.2066,
        ],
        targets: [
          0.2097,
          0.2118,
          0.2138,
          0.2169,
          0.2273,
        ],
        type: "order",
        stopLoss: 0.1859,
      },
    },
  ];

  strings.forEach(x => assertEquals(parseOrderString(x.text) as any, x.expected, `Failed to match ${x.text}`));
});
