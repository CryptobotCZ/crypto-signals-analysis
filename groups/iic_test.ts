import {
    assertEquals,
    assertNotEquals,
} from "https://deno.land/std@0.188.0/testing/asserts.ts";
import {getFileContent, parseOrderString} from "../src/configurable-parser.ts";

const config: any = getFileContent('./groups/iic.json');

Deno.test(function parseOrderStringHandlesAllFormats() {
    const strings = [
        'APE/USDT\n🟢 LONG\n\nLEVERAGE : 20X \n\nENTRY : - 1.815 - 1.745\n\n📌 Target 1: 1.837\n📌 Target 2: 1.889\n📌 Target 3: 1.945\n📌 Target 4: 1.998\n📌 Target 5: 2.086\n📌 Target 6: 2.158\n\n⭕️ STOP : 1.708',
        'ALICE/USDT\n\nLONG🟢\n\nLeverage : Isolated 20x\n\nEntry : 0.946 - 0.929\n(Plan to use both entries)\n\nTarget 1 - 0.961\nTarget 2 - 0.971\nTarget 3 - 0.994\nTarget 4 - 1.042\nTarget 5 - 1.088\n\nStop Loss: 0.918',
        "APE/USDT SHORT Leverage:  Cross20X Entries: 2.00 - 2.04Targets: 🎯 1.96, 1.92, 1.88, 1.84, 1.80Stop Loss: 2.07",
        "JOEUSDT Long ENTRY 0.3790-0.3710 TARGET 1: 0.3910 TARGET 2: 0.4020 TARGET 3: 0.4150 TARGET 4: 0.4250 ❌ STOPLOSS 0.3640 ⚡️ LEVERAGE (20x CROSS) GEM 💎",
    ];

    strings.forEach((string) => {
        const orderString = parseOrderString(string, config);
        assertNotEquals(orderString, null, `Failed to match ${string}`);
        assertEquals(orderString?.type, "order", `Failed to match ${string}`);
    });
});

Deno.test(function parseOrderStringReturnsCorrectResults() {
    const strings = [
        {
            text: 'APE/USDT\n🟢 LONG\n\nLEVERAGE : 20X \n\nENTRY : - 1.815 - 1.745\n\n📌 Target 1: 1.837\n📌 Target 2: 1.889\n📌 Target 3: 1.945\n📌 Target 4: 1.998\n📌 Target 5: 2.086\n📌 Target 6: 2.158\n\n⭕️ STOP : 1.708',
            expected: {
                coin: "APE/USDT",
                direction: "LONG",
                exchange: null,
                leverage: 20,
                entry: [
                    1.815,
                    1.745,
                ],
                stopLoss: 0.4450,
                targets: [
                    1.837,
                    1.889,
                    1.945,
                    1.998,
                    2.086,
                    2.158,

                ],
                type: "order",
            },
        },
        {
            text:
                "Consider Selling some #LIT here For Short term.\n\nLooking Bearsish here after break. Can show some Bearsish move in Short term.\n\nEntry: Around 1.090$ - 1.140$\n\nTargets: 1.060$,1.040$,1.020$,1.000$,0.950$,0.910$,0.880$,0.850$\n\nStoploss: 1.180$\n\nLeverage: 5x-10x\n\nDo manage your risk well as market is uncertain this days.",
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
