import {
    assertEquals,
    assertNotEquals,
} from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { parseOrderString } from "./8bit-algoz.ts";

Deno.test(function parseOrderStringHandlesAllFormats() {
    const strings = [
        '👽 8BIT SIGNAL 👽\n\nSymbol: ️#HOT/USDT ️️\nLeverage: 5X\nEntry Zone: 0.00131-0.00123\nTake Profit Targets:\n1) 0.001333 - 12.5%\n2) 0.00134 - 12.5%\n3) 0.001353 - 12.5%\n4) 0.001366 - 12.5%\n5) 0.00138 - 12.5%\n6) 0.001393 - 12.5%\n7) 0.001406 - 12.5%\n8) 0.001419 - 12.5%\nStop Targets:\n1) 0.00120\n\nCopy signals and make money from trading with:\n@Eight_Bit_Algoz ™ 👾👾',
        '👾👽 ️#UNI/USDT 👽👾️️️\nClient: 8bit Algoz Free\nTrade Type: Long\nLeverage: Cross (5.0X)\nEntry Zone: 5.7996-5.636\n\nTake Profit Targets:\n1) 5.90538 - 12.5%\n2) 5.93476 - 12.5%\n3) 5.99352 - 12.5%\n4) 6.05228 - 12.5%\n5) 6.11104 - 12.5%\n6) 6.1698 - 12.5%\n7) 6.22856 - 12.5%\n8) 6.28732 - 12.5%\n\nStop Targets:\n1) 5.62756 - 100.0%\n\nPublished By: @Eight_bit_algoz',
        '⚡️⚡️ #MDX ⚡️⚡\nClient: 8bit Algoz️\nTrade Type: Spot\nEntry Zone: 397.683 - 386.1\n\nTake Profit Targets:\n1) 480 - 16.667%\n2) 540 - 16.667%\n3) 600 - 16.667%\n4) 700 - 16.667%\n5) 800 - 16.667%\n6) 1000 - 16.667%\n\nStop Targets:\n1) -7%',
        '👾👽 ️#RUNE/USDT 👽👾️️️\nLeverage: Cross (5.0X)\nEntry Zone: 1.3058-1.26894\n\nTake Profit Targets:\n1) 1.329615 - 12.5%\n2) 1.33623 - 12.5%\n3) 1.349459 - 12.5%\n4) 1.36269 - 12.5%\n5) 1.37592 - 12.5%\n6) 1.38915 - 12.5%\n7) 1.40238 - 12.5%\n8) 1.41561 - 12.5%\n\nStop Targets:\n1) 1.26706 - 100.0%',
    ];

    strings.forEach((string) => assertNotEquals(parseOrderString(string), null, `Failed to match ${string}`));
});

Deno.test(function parseOrderStringReturnsCorrectResults() {
    const strings = [
        {
            text: '👽 8BIT SIGNAL 👽\n\nSymbol: ️#HOT/USDT ️️\nLeverage: 5X\nEntry Zone: 0.00131-0.00123\nTake Profit Targets:\n1) 0.001333 - 12.5%\n2) 0.00134 - 12.5%\n3) 0.001353 - 12.5%\n4) 0.001366 - 12.5%\n5) 0.00138 - 12.5%\n6) 0.001393 - 12.5%\n7) 0.001406 - 12.5%\n8) 0.001419 - 12.5%\nStop Targets:\n1) 0.00120\n\nCopy signals and make money from trading with:\n@Eight_Bit_Algoz ™ 👾👾',
            expected: {
                coin: "HOT/USDT",
                direction: undefined,
                exchange: null,
                leverage: 5,
                entry: [
                    0.00131,
                    0.00123,
                ],
                targets: [
                    0.001333,
                    0.00134,
                    0.001353,
                    0.001366,
                    0.00138,
                    0.001393,
                    0.001406,
                    0.001419,
                ],
                type: "order",
                stopLoss: 0.0012,
            },
        },
        {
            text: '⚡️⚡️ #MDX ⚡️⚡\nClient: 8bit Algoz️\nTrade Type: Spot\nEntry Zone: 397.683 - 386.1\n\nTake Profit Targets:\n1) 480 - 16.667%\n2) 540 - 16.667%\n3) 600 - 16.667%\n4) 700 - 16.667%\n5) 800 - 16.667%\n6) 1000 - 16.667%\n\nStop Targets:\n1) -7%',
            expected: {
                coin: "MDX",
                exchange: null,
                entry: [
                    397.683,
                    386.1,
                ],
                stopLoss: '-7%',
                targets: [
                    480,
                    540,
                    600,
                    700,
                    800,
                    1000,
                ],
                type: "spotOrder",
            },
        }
    ];

    strings.forEach(x => assertEquals(parseOrderString(x.text) as any, x.expected, `Failed to match ${x.text}`));
});
