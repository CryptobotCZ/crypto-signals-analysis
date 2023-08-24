import { assertEquals } from "../dev_deps.ts";
import { parseEntryString, parseOrderString, parseTPString } from "./bitsturtle.ts";

Deno.test(function parseOrderStringHandlesAllFormats() {
  // TODO: Fix tests
  console.error('TODO: FIX TESTS'); return;

    const strings = [
        {
            text: 'CRVUSDT\nExchange: Bybit USDT\nLeverage: Cross 10X\nBuy Zone: 0.60732 - 0.6748\nSell: 0.6771618',
            expected: {
                coin: "CRVUSDT",
                direction: "LONG",
                entry: [
                    0.60732,
                    0.6748,
                ],
                exchange: "Bybit USDT",
                leverage: 10,
                stopLoss: null,
                targets: [
                    0.6771618,
                ],
                type: "order",
            },
        },
        {
            text: 'EGLDUSDT\nExchange: Bybit USDT\nLeverage: Cross 10X\nBuy Zone: 35.805 - 32.55\nSell: 32.436075',
            expected: {
                coin: "EGLDUSDT",
                direction: "SHORT",
                entry: [
                    35.805,
                    32.55,
                ],
                exchange: "Bybit USDT",
                leverage: 10,
                stopLoss: null,
                targets: [
                    32.436075,
                ],
                type: "order",
            },
        },
        {
            text: 'STXUSDTExchange: Bybit USDTLeverage: Cross 10XBuy Zone: 0.799117 - 0.72647Sell: 0.72392735',

        }
    ];

    strings.forEach(x => assertEquals(parseOrderString(x.text) as any, x.expected, `Failed to match ${x.text}`));
});

Deno.test(function parseTp() {
    const strings = [
        {
            text: 'ByBit USDT\n#THETA/USDT All take-profit targets achieved 😎\nProfit: 81.3285% 📈\nPeriod: 13 Days 16 Hours 56 Minutes ⏰',
            expected: {
                coin: "THETA/USDT",
                exchange: "ByBit USDT",
                pct: 81.3285,
                pctStr: "81.3285%",
                time: "13 Days 16 Hours 56 Minutes",
                type: "TP",
            },
        }
    ];

    strings.forEach(x => assertEquals(parseTPString(x.text) as any, x.expected, `Failed to match ${x.text}`));
});


Deno.test(function parseEntry() {
    const strings = [
        {
            text: 'ByBit USDT\n#ALGO/USDT Entered entry zone ✅\nPeriod: 2 Minutes ⏰',
            expected: {
                coin: "ALGO/USDT",
                exchange: "ByBit USDT",
                type: "entry",
            },
        },
        {
            text: 'ByBit USDT#HNT/USDT Entered entry zone ✅Period: 2 Minutes ⏰',
            expected: {
                coin: "HNT/USDT",
                exchange: "ByBit USDT",
                type: "entry",
            },
        },
    ];

    strings.forEach(x => assertEquals(parseEntryString(x.text) as any, x.expected, `Failed to match ${x.text}`));
});

Deno.test(function getOrderSignalInfoFullTest() {
//     'BATUSDT\nExchange: Bybit USDT\nLeverage: Cross 10X\nBuy Zone: 0.14814 - 0.1646\nSell: 0.1651761'
//     'ByBit USDT
//     #BAT/USDT Entered entry zone ✅
//     Period: 2 Minutes ⏰'
//
//
//
//     'APEUSDT\nExchange: Bybit USDT\nLeverage: Cross 10X\nBuy Zone: 2.67948 - 2.9772\nSell: 2.9876202'
//
});
