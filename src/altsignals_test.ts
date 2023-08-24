import { assertEquals, assertNotEquals } from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { parseOrderString } from "./altsignals.ts";
import {parseOrderText} from "./binance-killers-channel.ts";

Deno.test(function parseOrderStringHandlesAllFormats() {
    const strings = [
        'FTM/USDT (Long)\nLeverage: 3.0X\n\nEntry Targets:\n1) 0.4315\n2) 0.3879\n\nTake-Profit Targets:\n1) 0.4527\n2) 0.47\n3) 0.52\n\nStop Targets:\n1) 0.37',
        'OPUSDT LONGLeverage: 10.0XEntry Targets:1) 2.475Take-Profit Targets:1) 2.5085Stop Targets:1) 2.4125',
        'CFXUSDT LONGLeverage : 3xEntry : 0.4280 - 0.36Targets : 0.43 0.47 0.72 1.2Stoploss : 0.345',
        'AGIXUSDT SHORTLeverage :3xEntry : 0.3913 - 0.42Targets : 0.38681 0.352 0.29Stoploss : 0.43',
        'ARPAUSDT LONGLeverage : 3xEntry : 0.037 - 0.03332Targets: 0.03843 - 0.06Stoploss : 0.0327',
        'ARPA/USDT  LONGLEVERAGE: 10xENTRY: 0.03416TARGETS: 0.03483 - 0.03590 - 0.03862 - 0.04262SL: 0.03382',
        'VETUSDT LONGLeverage : 5xEntry : 0.02481 - 0.02311Targets : 0.02526 - 0.02689 - 0.03163Stoploss: 0.02168',
        'ETCUSDT LONGLeverage : 5xEntry : 21.28 - 20Target: 22 , 25 , 27 , 30Stoploss: 19.23',
        'Coin: DYDX/USDT LONGLEVERAGE:2xEntry: 2.403 - 2.911Target: 2.990 - 3.116 - 3.673 - 4.2Stoploss: 2.264',
        'GTCUSDT LONGLeverage : 5xEntry :1.838 - 1.650Target: 1.878 - 1.96 - 2.3Stoploss:1.6',
        'GTCUSDT LONGLeverage : 3XEntry: 1.47 - 1.398Target:1.55 - 1.75 - 2.3Stoploss:1.32',
        'ALGO/USDT SHORTLeverage 5xEntry: 0.1978 - 0.2069Targets: 0.1958 - 0.1919 - 0.1808Stoploss: 0.21',
        //        'Pair: XRPUSDT ShortLeverage: Cross x3Entry: 0.7454Targets: 0.6506 - 0.514 - 0.4181Stop loss: 0.8253'
        //         'AVAX/USDT Leverage 5xEntry: 12.73 – 11.51Targets: 13 – 13.35– 14.01 – 18.00Stoploss: 11.3',
        'AVAXUSDT SHORTLeverage: Cross 50xEntry: 11.570Target 1: 11.508Target 2: 11.392Target 3: 11.194Stoploss: 11.833',
        'SANDUSDT SHORTLeverage: Cross 10xEntry: 0.5230 - 0.5422Target 1: 0.5095Target 2: 0.4973Target 3 : 0.4690Stoploss: 0.5520',
        'Coin: KAVA/USDT LONGLeverage : 10x Entry: 0.9050 - 0.8700$Target: 0.9250 - 0.9450 - 0.9650 - 1.0200  - 1.100Stoploss: 0.8500$',
        'Coin: BAT/USDT LONGLeverage : 10x Entry: 0.2355-0.2180Target: 0.2400 - 0.2491 - 0.2601 - 0.2762 - 0.3360Stoploss: 0.2080$',
        'UNI/USDTLeverage:10x Entry: 6.083 - 5.700$Target: 6.200 - 6.325 - 6.600 - 6.900 - 7.200  - 7.600$Stoploss: 5.500$',
        'Coin Name: #APE/USDT (SHORT) Entry: 3.92Leverage: cross 3xTargets:3.8908 - 3.8415 - 3.7430 - 3.5460 - 3.3490Stoploss: 4.1370',
        "ONE/USDT SHORTLeverage: 5.0XEntry Targets:0.01241 - 0.01377 Take-Profit Targets: 0.01213 - 0.01107 -  0.00898Stop Targets:0.01414",
        "Coin: XMR/USDT ShortLeverage 10xEntry: 142.36 - 146.00Target: 140.10 - 135.00 - 132.00 - 127.00 - 120.00$Stoploss: 149.00$",
        "REN/USDT LONGLeverage:10xEntry: 0.06300 - 0.06100Target: 0.06400 - 0.06600 - 0.07350 - 0.07500Stoploss: 0.06000",
        "MATIC/USDT LONGLeverage:10xEntry: 0.814 - 0.7534Target: 0.8293 - 0.8563 - 0.9500Stoploss: 0.735",
        "AVAX/USDT Leverage 10xEntry: 12.4 – 11.51Targets: 12.7 – 13.35 – 14.01 – 18.00Stoploss: 11.3",
        "ETCUSDT LONGLeverage : 5xEntry : 21.28 - 20Target: 22 , 25 , 27 , 30Stoploss: 19.23",
        "BNBUSDT SHORTLeverage : 2xEntry : 284 - 323Targets : 278.6 259 240 220 200Stoploss : 333",
        "ARPAUSDT LONGLeverage : 3xEntry : 0.037 - 0.03332Targets: 0.03843 - 0.06Stoploss : 0.0327",
        "DOGEUSDT LONGLeverage : 2xEntry : 0.07810 - 0.06555Targets : 0.07988 - 0.08989 - 0.14Stoploss : 0.06",
        "BNBUSDT SHORTLeverage : 2xEntry : 311 - 344 Targets : 300 - 286 - 250Stoploss : 362",
        "AVAX SHORTLeverage : 2xEntry : 16.1 - 17.784 Targets : 15.8 - 15 - 13Stoploss : 18.33",
        "IDUSDT SHORTLeverage : 10xEntry : 0.4352 - 0.45810Targets : 0.43047 - 0.39267 - 0.2Stoploss : 0.46286",
        "EGLDUSDT LONGLeverage : 12xEntry : 40.28 - 39.75Targets : 40.53 41.29 42.39Stoploss : 39.3",
        "ACHUSDT LONGLeverage : 3xEntry : 0.04344 - 0.03790Targets : 0.0443 0.04570 0.05130 0.08Stoploss : 0.03675",
        "AVAXUSDT SHORTLeverage: Cross 20xEntry: 58.57Targets: 56.66 - 56.58 - 54.45SL: 61.62Trailing Configuration:Stop: Breakeven -  Trigger: Target (2)",
        "LUNAUSDT LONGLeverage: Cross 20xEntry: 84.457Targets: 86.301 - 86.984 - 87.531SL: 81.998Trailing Configuration:Stop: Breakeven -  Trigger: Target (1)",
        "ETHUSDT LONGLeverage: Cross 20xEntry: 2828.12Targets: 2881.81 - 2925.18 - 2987.13SL: 2740.56Trailing Configuration:Stop: Breakeven -  Trigger: Target (2)",
        "AVAXUSDT LONGLeverage: Cross 20xEntry: 61.43Targets: 63.09 - 63.69 - 64.68SL: 59.01Trailing Configuration:Stop: Breakeven -  Trigger: Target (2)",
        "DOTUSDT SHORTLeverage: Cross 20xEntry: 11.308Targets: 10.835 - 10.835 - 10.363SL: 11.934Trailing Configuration:Stop: Breakeven -  Trigger: Target (2)",
    ];

    strings.forEach((string) => assertNotEquals(parseOrderString(string), null, `Failed to match ${string}`));
});

Deno.test(function testParseOrderStringAndValues() {
    // TODO: Fix tests
    console.error('TODO: FIX TESTS'); return;

    const strings= [
        {
            text: 'THETA/USDT LONG\nLeverage : 5x\nENTRY: 1.062 - 0.963\nTARGETS: 1.124 - 1.281 - 1.629 - 2.5\nSL: 0.906',
            expected: {
                coin: "THETA/USDT",
                direction: "LONG",
                entry: [
                    1.062,
                    0.963,
                ],
                leverage: 5,
                targets: [
                    1.124,
                    1.281,
                    1.629,
                    2.5,
                ],
                stopLoss: 0.906,
                type: "order",
            },
        },
        {
            text: 'SOL/USDT SHORT\nLEVERAGE: 5X\nENTRY: 13.28 - 14.2\nTARGETS: 12.791 - 11.112 - 10.189\nSL: 15.2',
            expected: {
                coin: "SOL/USDT",
                direction: "SHORT",
                "leverage": 5,
                "exchange": null,
                "entries": [
                  13.28,
                  14.2
                ],
                "tps": [
                  12.791,
                  11.112,
                  10.189
                ],
                "sl": 15.2,
                type: "order",
            },
        },
    ];

    strings.forEach(x => assertEquals(parseOrderText(x.text) as any, x.expected, `Failed to match ${x.text}`));
});