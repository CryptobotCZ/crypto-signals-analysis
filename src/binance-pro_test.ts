import {
    assertEquals,
    assertNotEquals,
} from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { parseOrderString } from "./binance-pro.ts";

Deno.test(function parseOrderStringHandlesAllFormats() {
    const strings = [
        '🔥 #BTCDOM/USDT | Long📈, x20 | 🔥\n\n💷 Entry Target = 1770.2\nSL - 25-30%\n\nTake Profits =\n☑️ 1806.3265 | 40% of profit |\n☑️ 1824.9485 | 60% of profit |\n☑️ 1843.9583 | 80% of profit |\n🚀 1863.3684 | 100% of profit |\n\n=-=-=-=-=-=-=-=-=-=-=-=-=-=-='
    ];

    strings.forEach((string) => assertNotEquals(parseOrderString(string), null, `Failed to match ${string}`));
});

Deno.test(function parseOrderStringReturnsCorrectResults() {
    const strings = [
        {
            text: '🔥 #BTCDOM/USDT | Long📈, x20 | 🔥\n\n💷 Entry Target = 1770.2\nSL - 25-30%\n\nTake Profits =\n☑️ 1806.3265 | 40% of profit |\n☑️ 1824.9485 | 60% of profit |\n☑️ 1843.9583 | 80% of profit |\n🚀 1863.3684 | 100% of profit |\n\n=-=-=-=-=-=-=-=-=-=-=-=-=-=-=',
            expected: {
                coin: "BTCDOM/USDT",
                direction: "LONG",
                exchange: null,
                leverage: 20,
                entry: [
                    1770.2,
                ],
                targets: [
                    1806.3265,
                    1824.9485,
                    1843.9583,
                    1863.3684,
                ],
                type: "order",
                stopLoss: null,
            },
        },
    ];

    strings.forEach(x => assertEquals(parseOrderString(x.text) as any, x.expected, `Failed to match ${x.text}`));
});
