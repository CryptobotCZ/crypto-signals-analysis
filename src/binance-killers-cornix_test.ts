import { assertEquals, assertNotEquals } from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { parseOrderString } from "./altsignals.ts";

Deno.test(function parseOrderStringHandlesAllFormats() {
    const strings = [
        'OPUSDT LONGLeverage: 10.0XEntry Targets:1) 2.475Take-Profit Targets:1) 2.5085Stop Targets:1) 2.4125',
        'CFXUSDT LONGLeverage : 3xEntry : 0.4280 - 0.36Targets : 0.43 0.47 0.72 1.2Stoploss : 0.345',
        'AGIXUSDT SHORTLeverage :3xEntry : 0.3913 - 0.42Targets : 0.38681 0.352 0.29Stoploss : 0.43',
        'ARPAUSDT LONGLeverage : 3xEntry : 0.037 - 0.03332Targets: 0.03843 - 0.06Stoploss : 0.0327',
        'VETUSDT LONGLeverage : 5xEntry : 0.02481 - 0.02311Targets : 0.02526 - 0.02689 - 0.03163Stoploss: 0.02168',
        'ETCUSDT LONGLeverage : 5xEntry : 21.28 - 20Target: 22 , 25 , 27 , 30Stoploss: 19.23',
        'Coin: DYDX/USDT LONGLEVERAGE:2xEntry: 2.403 - 2.911Target: 2.990 - 3.116 - 3.673 - 4.2Stoploss: 2.264',
        'GTCUSDT LONGLeverage : 5xEntry :1.838 - 1.650Target: 1.878 - 1.96 - 2.3Stoploss:1.6',
        'GTCUSDT LONGLeverage : 3XEntry: 1.47 - 1.398Target:1.55 - 1.75 - 2.3Stoploss:1.32',
        'ALGO/USDT SHORTLeverage 5xEntry: 0.1978 - 0.2069Targets: 0.1958 - 0.1919 - 0.1808Stoploss: 0.21',
        //        'Pair: XRPUSDT ShortLeverage: Cross x3Entry: 0.7454Targets: 0.6506 - 0.514 - 0.4181Stop loss: 0.8253'
        //         'AVAX/USDT Leverage 5xEntry: 12.73 – 11.51Targets: 13 – 13.35– 14.01 – 18.00Stoploss: 11.3',
        "AVAXUSDT SHORTLeverage: Cross 50xEntry: 11.570Target 1: 11.508Target 2: 11.392Target 3: 11.194Stoploss: 11.833",
        "SANDUSDT SHORTLeverage: Cross 10xEntry: 0.5230 - 0.5422Target 1: 0.5095Target 2: 0.4973Target 3 : 0.4690Stoploss: 0.5520",
        "Coin: KAVA/USDT LONGLeverage : 10x Entry: 0.9050 - 0.8700$Target: 0.9250 - 0.9450 - 0.9650 - 1.0200  - 1.100Stoploss: 0.8500$",
        "Coin: BAT/USDT LONGLeverage : 10x Entry: 0.2355-0.2180Target: 0.2400 - 0.2491 - 0.2601 - 0.2762 - 0.3360Stoploss: 0.2080$",
        "UNI/USDTLeverage:10x Entry: 6.083 - 5.700$Target: 6.200 - 6.325 - 6.600 - 6.900 - 7.200  - 7.600$Stoploss: 5.500$",
        "Coin Name: #APE/USDT (SHORT) Entry: 3.92Leverage: cross 3xTargets:3.8908 - 3.8415 - 3.7430 - 3.5460 - 3.3490Stoploss: 4.1370"

    ];

    strings.forEach(string => assertNotEquals(parseOrderString(string), null, `Failed to match ${string}`));
});
