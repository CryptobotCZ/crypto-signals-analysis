import {
    assertEquals,
    assertNotEquals,
} from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { parseOrderString } from "./future-bulls.ts";

Deno.test(function parseOrderStringHandlesAllFormats() {
    const strings = [
        '💲NEW VIP SIGNAL💲\n\n🔴 Short : BTC/USDT\n\nLEVERAGE Isolated 20X\n\nENTRY 29650 - 29800\nTP1 29330\nTP2 29060\nTP3 28750\nTP4 28450\n❌ STOP 30050\n\n(Use Trailing SL when in profit)\nBy @Future_Bull',
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
