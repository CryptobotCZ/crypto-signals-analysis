import {
    assertEquals,
    assertNotEquals,
} from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { parseOrderString } from "./rnmkr-free.ts";

Deno.test(function parseOrderStringHandlesAllFormats() {
    const strings = [
        '⛈️🤖 ️#STORJUSDT 🤖⛈️\nClient: VWAP Strategy 1h\nExchange: Bybit USDT\nTrade Type: Long\nLeverage: Cross (10.0X)\nEntry Zone: 0.408-0.4035\n\nTake Profit Targets:\n1) 0.424 - 12.5%\n2) 0.4305 - 12.5%\n3) 0.4485 - 12.5%\n4) 0.4735 - 12.5%\n5) 0.5 - 12.5%\n6) 0.5245 - 12.5%\n7) 0.5535 - 12.5%\n8) 0.574 - 12.5%\n\nStop Targets:\n1) 0.3995 - 100.0%\n\nPublished By: @RNMKRBot'    ];

    strings.forEach((string) => assertNotEquals(parseOrderString(string), null, `Failed to match ${string}`));
});

Deno.test(function parseOrderStringReturnsCorrectResults() {
    const strings = [
        {
            text: '⛈️🤖 ️#STORJUSDT 🤖⛈️\nClient: VWAP Strategy 1h\nExchange: Bybit USDT\nTrade Type: Long\nLeverage: Cross (10.0X)\nEntry Zone: 0.408-0.4035\n\nTake Profit Targets:\n1) 0.424 - 12.5%\n2) 0.4305 - 12.5%\n3) 0.4485 - 12.5%\n4) 0.4735 - 12.5%\n5) 0.5 - 12.5%\n6) 0.5245 - 12.5%\n7) 0.5535 - 12.5%\n8) 0.574 - 12.5%\n\nStop Targets:\n1) 0.3995 - 100.0%\n\nPublished By: @RNMKRBot',
            expected: {
                coin: "STORJUSDT",
                direction: "LONG",
                exchange: "Bybit USDT",
                leverage: 10,
                entry: [
                    0.408,
                    0.4035,
                ],
                targets: [
                    0.424,
                    0.4305,
                    0.4485,
                    0.4735,
                    0.5,
                    0.5245,
                    0.5535,
                    0.574,
                ],
                type: "order",
                stopLoss: 0.3995,
            },
        },
    ];

    strings.forEach(x => assertEquals(parseOrderString(x.text) as any, x.expected, `Failed to match ${x.text}`));
});
