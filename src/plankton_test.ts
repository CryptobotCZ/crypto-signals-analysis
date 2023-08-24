import {
  assertEquals,
  assertNotEquals,
} from "../dev_deps.ts";
import { parseOrderString } from "./plankton.ts";

Deno.test(function parseOrderStringHandlesAllFormats() {
  const strings = [
    "💎 New Plancton's VIP Signal! 💎\n\nPAIR #STORJUSDT\nStrategy: MTB,CPS (Academy)\nPosition: Short 📉\n\nRISKY TRADE, FOMC TODAY\n\n👀 ENTRY ZONE:\n- 0.3665\n- 0.3774\n\nTake Profits\n- 🤑 TP #1: 0.3558\n- 🚀 TP #2: 0.3407\n- 🔥 TP #3: 0.3240\n- 🦐 TP #4: 0.2906\n\nStop loss\n- 🚨 0.4048\n...",
  ];

  strings.forEach((string) =>
    assertNotEquals(parseOrderString(string), null, `Failed to match ${string}`)
  );
});

Deno.test(function parseOrderStringReturnsCorrectResults() {
  const strings = [
    {
      text: "💎 New Plancton's VIP Signal! 💎\n\nPAIR #STORJUSDT\nStrategy: MTB,CPS (Academy)\nPosition: Short 📉\n\nRISKY TRADE, FOMC TODAY\n\n👀 ENTRY ZONE:\n- 0.3665\n- 0.3774\n\nTake Profits\n- 🤑 TP #1: 0.3558\n- 🚀 TP #2: 0.3407\n- 🔥 TP #3: 0.3240\n- 🦐 TP #4: 0.2906\n\nStop loss\n- 🚨 0.4048\n...",
      expected: {
        coin: "STORJUSDT",
        direction: "SHORT",
        exchange: null,
        leverage: 1,
        entry: [
          0.3665,
          0.3774,
        ],
        stopLoss: 0.4048,
        targets: [
          0.3558,
          0.3407,
          0.324,
          0.2906,
        ],
        type: "order",
      },
    }
  ];

  strings.forEach((x) =>
    assertEquals(
      parseOrderString(x.text) as any,
      x.expected,
      `Failed to match ${x.text}`,
    )
  );
});
