import {
    assertEquals,
    assertNotEquals,
} from "../dev_deps.ts";
import {getFileContent, ConfigurableParser} from "../src/configurable-parser.ts";

const config: any = getFileContent('./groups/tat-vip.json');
const parser = new ConfigurableParser(config);

Deno.test(function parseOrderStringHandlesAllFormats() {
    const strings = [
        "🌷 edu/usdt long 445 🌷\n\n\n\n🟢 Tp 471 498\n\n\n\n🟡 Leverage 20x\n\n\n\n🔴 Sl 423\n\n\n\nPublished by @TheAmericanTrader\n\n\n\nOriginal channel @TheAmericanTraders",
    ];

    strings.forEach((string) => {
        const orderString = parser.parseOrderString(string, config);
        assertNotEquals(orderString, null, `Failed to match ${string}`);
        assertEquals(orderString?.type, "order", `Failed to match ${string}`);
    });
});

Deno.test(function parseOrderStringReturnsCorrectResults() {
    const strings = [
        {
            text: "🌷 edu/usdt long 445 🌷\n\n\n\n🟢 Tp 471 498\n\n\n\n🟡 Leverage 20x\n\n\n\n🔴 Sl 423\n\n\n\nPublished by @TheAmericanTrader\n\n\n\nOriginal channel @TheAmericanTraders",
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
        parser.parseOrderString(x.text) as any,
        x.expected,
        `Failed to match ${x.text}`,
    ));
});
