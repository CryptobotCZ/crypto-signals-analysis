import {
    assertEquals,
    assertNotEquals,
} from "../dev_deps.ts";
import {getFileContent, parseOrderString} from "../src/configurable-parser.ts";

const config: any = getFileContent('./groups/vip-coinsignals.json');

Deno.test(function parseOrderStringHandlesAllFormats() {
    const strings = [
        "➡️ SHORT BTCUSDT (SCALP) ❇️ Entry: 29970.00000000 - 31168.80000000 ☑️ Target 1: 28771.20000000 ☑️ Target 2: 27572.40000000 ☑️ Target 3: 26373.60000000 ☑️ Target 4: 25174.80000000 ⛔ Stoploss: 31792.17600000 💫 Leverage: 5x",
        "📊 ROSE / USDT Breaking Out Entry: 0.064 - 0.062 Target: 0.066 - 0.069 - 0.073 - 0.09 SL: 0.059 Leverage: 5x",
        
    ];

    strings.forEach((string) => {
        const orderString = parseOrderString(string, config);
        assertNotEquals(orderString, null, `Failed to match ${string}`);
        assertEquals(orderString?.type, "order", `Failed to match ${string}`);
    });
});

Deno.test(function parseOrderStringReturnsCorrectResults() {
    const strings = [
        {
            text: "➡️ SHORT BTCUSDT (SCALP) ❇️ Entry: 29970.00000000 - 31168.80000000 ☑️ Target 1: 28771.20000000 ☑️ Target 2: 27572.40000000 ☑️ Target 3: 26373.60000000 ☑️ Target 4: 25174.80000000 ⛔ Stoploss: 31792.17600000 💫 Leverage: 5x",
            expected: {
                coin: "RSR/USDT",
                direction: "LONG",
                exchange: null,
                leverage: 10,
                entry: [
                    0.005805,
                    0.005800,
                ],
                stopLoss: 0.005495,
                targets: [
                    0.005823,
                    0.005860,
                    0.005990,
                ],
                type: "order",
            },
        }
    ];

    strings.forEach((x) => assertEquals(
        parseOrderString(x.text) as any,
        x.expected,
        `Failed to match ${x.text}`,
    ));
});


