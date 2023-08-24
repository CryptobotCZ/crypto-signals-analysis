import { assertEquals, assertNotEquals } from "../dev_deps.ts";
import { parseOrderString } from "./wallstreet_queen.ts";

Deno.test(function parseOrderStringHandlesAllFormats() {
    const strings = [
        'Coin: #GMT/USDT\n\nShort Set-up\n\nLev: 5-10x\n\n#GMT already Breaked down the Descending Traingle and looking bearsish.\n\nEntry: 0.4222 - 0.4350$(Enter partially)\n\nTarget: 0.4150 - 0.4070 - 0.4000 - 0.3900 - 0.3800 - 0.3700$(Short term)\n\nStoploss: 0.4450$',
        'Coin: #MANA/USDT\n\nShort Set-Up\n\nLev: 5-10x\n\n#MANA already braked down the descending traingle and looking bearish.\n\nEntry: 0.6000 - 0.6250$(Enter Partially)\n\nTargets: 0.5900 - 0.5800 - 0.5700 - 0.5600 - 0.5400 - 0.5200 - 0.5000 - 0.4800 - 0.4500$(Short-mid term)\n\nStop-loss: 0.6600$',
        'Coin: #ETC/USDT\n\nShort Set-Up\n\nLev: 5-10x\n\n#ETC already breakdown the neckline of the Head and Shoulder pattern and looking bearish. So we expect a moves towards support zone.\n\nEntry: 19.820 - 20.700$(Enter Partially)\n\nTargets: 19.500 - 19.100 - 18.800 - 18.400 - 17.800 - 17.400 - 17.000$(Short term)\n\nStop-loss: 21.400$',
    ];

    strings.forEach(string => assertNotEquals(parseOrderString(string), null, `Failed to match ${string}`));
});

Deno.test(function parseOrderStringReturnsCorrectResults() {
    const strings = [
        {
            text: 'Coin: #GMT/USDT\n\nShort Set-up\n\nLev: 5-10x\n\n#GMT already Breaked down the Descending Traingle and looking bearsish.\n\nEntry: 0.4222 - 0.4350$(Enter partially)\n\nTarget: 0.4150 - 0.4070 - 0.4000 - 0.3900 - 0.3800 - 0.3700$(Short term)\n\nStoploss: 0.4450$',
            expected: {
                coin: "GMT/USDT",
                direction: "SHORT",
                exchange: "5-10",
                leverage: 10,
                entry: [
                    0.4222,
                    0.4350,
                ],
                stopLoss: 0.4450,
                targets: [
                    0.4150,
                    0.4070,
                    0.4000,
                    0.3900,
                    0.3800,
                    0.3700
                ],
                type: "order",
            },
        },
    ];

    strings.forEach(x => assertEquals(parseOrderString(x.text) as any, x.expected, `Failed to match ${x.text}`));
});
