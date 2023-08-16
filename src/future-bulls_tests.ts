import {
    assertEquals,
    assertNotEquals,
} from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { parseOrderString } from "./future-bulls.ts";

Deno.test(function parseOrderStringHandlesAllFormats() {
    const strings = [
        '💲NEW VIP SIGNAL💲\n\n🔴 Short : BTC/USDT\n\nLEVERAGE Isolated 20X\n\nENTRY 29650 - 29800\nTP1 29330\nTP2 29060\nTP3 28750\nTP4 28450\n❌ STOP 30050\n\n(Use Trailing SL when in profit)\nBy @Future_Bull',
        '💲NEW VIP SIGNAL💲\n\n🔴 SHORT : LPT/USDT\n\nLEVERAGE  10X\n\nENTRY ZONE 5.910- 6.000\nTP1 5.830\nTP2 5.700\nTP3 5.550\nTP4 5.300\n❌ STOP 6.200\n\n(Use Trailing SL when in profit)\nBy @future_bull',
        '💲NEW VIP SIGNAL💲\n\n🔴 Short : BAKE/USDT\n\nLEVERAGE Isolated 10X\n\nENTRY ZONE 0.1160 - 0.1170\nTP1 0.1135\nTP2 0.1110\nTP3 0.1087\nTP4 0.1065\n❌ STOP 0.1201\n\n(Use Trailing SL when in profit)\nBy @future_bull',
        '💲NEW VIP SIGNAL💲\n\n🔴 Short : RUNE/USDT\n\nLEVERAGE Isolated 10X\n\nENTRY 1.570- 1.590\nTP1 1.540\nTP2 1.505\nTP3 1.476\nTP4 1.445\n❌ STOP 1.621\n\n\n(Use Trailing SL when in profit)\nBy @future_bull',
        '💲NEW VIP SIGNAL💲\n\n🔴 Short : BAKE/USDT\n\nLEVERAGE Isolated 10X\n\nENTRY ZONE 0.1380  - 0.1410\n\nTP1 0.1300\nTP2 0.1200\nTP3 0.1100\nTP4 0.1000\n❌ STOP 0.1440\n\n(Use Trailing SL when in profit)\nBy @future_bull',
        '💲NEW VIP SIGNAL💲\n\n🔴 SELL : SOL /USDT\n\nLEVERAGE Isolated 10X\n\nENTRY 18.020-18.150\nTP1 17.790\nTP2 17.450\nTP3 17.100\nTP4 16.700\n❌ STOP 18.400\n\n\n(Use Trailing SL when in profit)\nBy @future_bull',
        '💲NEW VIP SIGNAL💲\n\n🟢 Buy: TOMO/USDT\n\nLEVERAGE Isolated 10X\n\nENTRY  1.1950-1.2100\nTP1 1.2350\nTP2 1.2550\nTP3 1.2800\nTP41.3100\n❌ STOP 1.1785\n\n\n(Use Trailing SL when in profit)\nBy @future_bull',
    ];

    strings.forEach((string) =>
        assertNotEquals(parseOrderString(string), null, `Failed to match ${string}`)
    );
});

Deno.test(function parseOrderStringReturnsCorrectResults() {
    const strings = [
        {
            text: '💲NEW VIP SIGNAL💲\n\n🔴 Short : BTC/USDT\n\nLEVERAGE Isolated 20X\n\nENTRY 29650 - 29800\nTP1 29330\nTP2 29060\nTP3 28750\nTP4 28450\n❌ STOP 30050\n\n(Use Trailing SL when in profit)\nBy @Future_Bull',
            expected: {
                type: "order",
                coin: "BTC/USDT",
                direction: "SHORT",
                leverage: 20,
                exchange: null,
                entry: [
                    29650,
                    29800,
                ],
                targets: [
                    29330,
                    29060,
                    28750,
                    28450,
                ],
                stopLoss: 30050,
            },
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
