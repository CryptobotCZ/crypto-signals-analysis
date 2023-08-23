import {
    assertEquals,
    assertNotEquals,
} from "https://deno.land/std@0.188.0/testing/asserts.ts";
import {getFileContent, parseOrderString} from "../src/configurable-parser.ts";

const config: any = getFileContent('./groups/crypto-trading-club.json');

Deno.test(function parseOrderStringHandlesAllFormats() {
    const strings = [
        "RSR/USDT 📈 BUY  🛫Enter above: 0.005800- 0.005805  💰TP1 0.005823 💰TP2 0.005860 💰TP3 0.005990 ✖️SL 0.005495  🔎Leverage 10x  🔘Respect the entry zone.",
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
            text: "RSR/USDT 📈 BUY  🛫Enter above: 0.005800- 0.005805  💰TP1 0.005823 💰TP2 0.005860 💰TP3 0.005990 ✖️SL 0.005495  🔎Leverage 10x  🔘Respect the entry zone.",
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
