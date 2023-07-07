import { assertEquals, assertNotEquals } from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { parseOrderText, parseTPString } from "./binance-killers-channel.ts";

Deno.test(function parseTpHandlesAllFormats() {
  const strings = [
    '📍SIGNAL ID: #0980📍\nCOIN: $ETH/USDT (5-10x)\nDirection: SHORT📉\n➖➖➖➖➖➖➖\nShort Term Target 1: 1,880✅\nShort Term Target 2: 1,850✅\nShort Term Target 3: 1,810✅\n\n🔥47.1% Profit (10x)🔥\n\nVIP EXCLUSIVE: 3 targets destroyed just as expected, profits taken and stops moved to entries.\n➖➖➖➖➖➖➖\n- Binance Killers®',
    '📍SIGNAL ID: #1035📍\nCOIN: $INJ/USDT (3-5x)\nDirection: LONG📈\n➖➖➖➖➖➖➖\nTarget 1: 5.82✅\nTarget 2: 5.93✅\nTarget 3: 6.07✅\nTarget 4: 6.20✅\nTarget 5: 6.35✅\nTarget 6: 6.60✅\n\n🔥98.2% Profit (5x)🔥\n\nJust as expected!!🚀😘\n➖➖➖➖➖➖➖\n- Binance Killers®',
    '📍SIGNAL ID: #1047📍\nCOIN: $LTC/USDT (3-5x)\nDirection: SHORT\n➖➖➖➖➖➖➖\nTarget 1: 90✅\nTarget 2: 88.7✅\nTarget 3: 86.5✅\n\n🔥52.9% Profit (5x)🔥\n\nAnother quick win Killers!! Profits taken and stops moved to entries\n➖➖➖➖➖➖➖\n- Binance Killers®',
    '📍SIGNAL ID: #1019📍\nCOIN: $BTC/USDT (3-5x)\nDirection: LONG📈\n➖➖➖➖➖➖➖\nTarget 1: 25900✅\nTarget 2: 26300✅\nTarget 3: 27000✅\nTarget 4: 27500✅\nTarget 5: 28000✅\nTarget 6: 28700✅\nTarget 7: 29600✅\nTarget 8: 30000✅\nTarget 9: 31000✅\n\n🔥121.8% Profit (5x)🔥\n\nAll targets blown up, that’s what we call a Killer move!!🔥🔥\n➖➖➖➖➖➖➖\n- Binance Killers®',
//    '📍SIGNAL ID: #0700📍COIN: $ICP/USDT (1-3x)Direction: LONG📈➖➖➖➖➖➖➖Target 1: 5.95✅Target 2: 6.15✅Target 3: 6.40✅Target 4: 6.75✅Target 5: 7.50✅Target 6: 8.70✅High Reached: 9.80✅🔥302.3% Profit (3x)🔥'
  ];

  strings.forEach(string => assertNotEquals(parseTPString(string), null, `Failed to match ${string}`));
});

Deno.test(function parseTpReturnsCorrectResults() {
  const strings= [
    {
        text:     '📍SIGNAL ID: #0980📍\nCOIN: $ETH/USDT (5-10x)\nDirection: SHORT📉\n➖➖➖➖➖➖➖\nShort Term Target 1: 1,880✅\nShort Term Target 2: 1,850✅\nShort Term Target 3: 1,810✅\n\n🔥47.1% Profit (10x)🔥\n\nVIP EXCLUSIVE: 3 targets destroyed just as expected, profits taken and stops moved to entries.\n➖➖➖➖➖➖➖\n- Binance Killers®',
        expected: {},
    },
    {
        text:     '📍SIGNAL ID: #1035📍\nCOIN: $INJ/USDT (3-5x)\nDirection: LONG📈\n➖➖➖➖➖➖➖\nTarget 1: 5.82✅\nTarget 2: 5.93✅\nTarget 3: 6.07✅\nTarget 4: 6.20✅\nTarget 5: 6.35✅\nTarget 6: 6.60✅\n\n🔥98.2% Profit (5x)🔥\n\nJust as expected!!🚀😘\n➖➖➖➖➖➖➖\n- Binance Killers®',
        expected: {},

    },
    {
        text:     '📍SIGNAL ID: #1047📍\nCOIN: $LTC/USDT (3-5x)\nDirection: SHORT\n➖➖➖➖➖➖➖\nTarget 1: 90✅\nTarget 2: 88.7✅\nTarget 3: 86.5✅\n\n🔥52.9% Profit (5x)🔥\n\nAnother quick win Killers!! Profits taken and stops moved to entries\n➖➖➖➖➖➖➖\n- Binance Killers®',
        expected: {},
    },
    {
      text:     '📍SIGNAL ID: #1019📍\nCOIN: $BTC/USDT (3-5x)\nDirection: LONG📈\n➖➖➖➖➖➖➖\nTarget 1: 25900✅\nTarget 2: 26300✅\nTarget 3: 27000✅\nTarget 4: 27500✅\nTarget 5: 28000✅\nTarget 6: 28700✅\nTarget 7: 29600✅\nTarget 8: 30000✅\nTarget 9: 31000✅\n\n🔥121.8% Profit (5x)🔥\n\nAll targets blown up, that’s what we call a Killer move!!🔥🔥\n➖➖➖➖➖➖➖\n- Binance Killers®',
      expected: {},
    }
  ];

  strings.forEach(x => assertEquals(parseTPString(x.text) as any, x.expected, `Failed to match ${x.text}`));
});


Deno.test(function parseOrderStringHandlesAllFormats() {
    const strings = [
        "📍SIGNAL ID: #0715📍\nCOIN: $SAND/USDT (1x)\nDirection: LONG📈\n➖➖➖➖➖➖➖\nENTRY: 1.02 - 1.25\nOTE: 1.115\n\nTARGETS\nShort Term: 1.28 - 1.31 - 1.37 - 1.44 - 1.55 - 1.75\nMid Term: 2.05 - 2.60 - 3.40 - 4.40 - 5.55\n\nSTOP LOSS: 0.87\n➖➖➖➖➖➖➖\nThis message cannot be forwarded or replicated\n- Binance Killers®",
        "📍SIGNAL ID: #1009📍\nCOIN: $MANA/USDT (3-5x)\nDirection: LONG📈\n➖➖➖➖➖➖➖\nReasoning: Key mid term support, decreased selling volume.\n\nENTRY: 0.418 - 0.4675\nOTE: 0.440\n\nTARGETS\nShort Term: 0.477 - 0.49 - 0.51 - 0.54 - 0.59 - 0.65\nMid Term: 0.75 - 0.87 - 1.00 - 1.13\n\nSTOP LOSS: 0.394\n➖➖➖➖➖➖➖\nThis message cannot be forwarded or replicated\n- Binance Killers®",
        "📍SIGNAL ID: 0212📍\nCOIN: $SXP/USDT (1-3x)\nTerm: SHORT TERM\n➖➖➖➖➖➖➖\nSXP already made us a 300%+ profit on our last entry and it has now retested on of its strongest support levels at $3.035 before heading back up. Now that it's showing relative strength against its $3.80 level, we can see a retest of it in the next couple of hours before an up continuation. Placing some orders there.\n\nENTRY: 3.55 - 3.80\nOTE: 3.80\n\nTARGETS\nShort Term: 3.90 - 4.00 - 4.20 - 4.40\nMid Term: 4.70 - 5.00 - 5.50 - 6.00 - 7.00\n\nSTOP LOSS: Below 3.10\n➖➖➖➖➖➖➖\nThis message cannot be forwarded or replicated\n- Binance Killers®",
        '📍SIGNAL ID: #0997📍\nCOIN: $ETC/USDT (5-10x)\nDirection: LONG📈\n➖➖➖➖➖➖➖\nReasoning: Lower time frame fib support.\n\nENTRY: 17.25 - 18.35\nOTE: 17.75\n\nTARGETS\nShort Term: 18.55 - 18.80 - 19.10 - 19.50 - 20.20\nMid Term: 21 - 22 - 23.4 - 25.4\n\nSTOP LOSS: 16.58\n➖➖➖➖➖➖➖\nThis message cannot be forwarded or replicated\n- Binance Killers®',
        '📍SIGNAL ID: 0486📍\nCOIN: $CVC/USDT (1-3x)\nDirection: LONG📈\n➖➖➖➖➖➖➖\nLaddering VIP Killer orders for the weekend move that’s about to make our months😘\n\nENTRY: 0.44 - 0.481\nOTE: 0.466\n\nTARGETS\nShort Term: 0.49 - 0.51 - 0.53 - 0.56 - 0.59\nMid Term: 0.65 - 0.71 - 0.78 - 0.84 - 0.94\n\nSTOP LOSS: 0.394\n➖➖➖➖➖➖➖\nThis message cannot be forwarded or replicated\n- Binance Killers®',
        '📍SIGNAL ID:#0941📍\nCOIN: $BTC/USDT (5-10x)\nDirection: SHORT📉\n➖➖➖➖➖➖➖\nENTRY: 27,400 - 29,020\nOTE: 27,871\n\nTARGETS\nShort Term: 27,150 - 26,900 - 26,600 - 26,200 - 25,500\nMid Term: 24,500 - 23,000 - 21,200 - 20,000 - 17,800\n\nSTOP LOSS: 30,025\n➖➖➖➖➖➖➖\nThis message cannot be forwarded or replicated\n- Binance Killers®'
    ];

    strings.forEach(string => assertNotEquals(parseOrderText(string), null, `Failed to match ${string}`));
});

Deno.test(function testParseOrderStringAndValues() {
    const strings= [
        {
            text: '📍SIGNAL ID: #0997📍\nCOIN: $ETC/USDT (5-10x)\nDirection: LONG📈\n➖➖➖➖➖➖➖\nReasoning: Lower time frame fib support.\n\nENTRY: 17.25 - 18.35\nOTE: 17.75\n\nTARGETS\nShort Term: 18.55 - 18.80 - 19.10 - 19.50 - 20.20\nMid Term: 21 - 22 - 23.4 - 25.4\n\nSTOP LOSS: 16.58\n➖➖➖➖➖➖➖\nThis message cannot be forwarded or replicated\n- Binance Killers®',
            expected: {
                coin: "ETC/USDT",
                direction: "LONG",
                entry: [
                    17.25,
                    18.35
                ],
                exchange: "",
                leverage: "(5-10x)",
                midTermTargets: [
                    21,
                    22,
                    23.4,
                    25.4
                ],
                ote: 17.75,
                shortTermTargets: [
                    18.55,
                    18.80,
                    19.10,
                    19.50,
                    20.20
                ],
                signalId: "0997",
                stopLoss: 16.58,
                targets: [
                    18.55,
                    18.80,
                    19.10,
                    19.50,
                    20.20,
                    21,
                    22,
                    23.4,
                    25.4
                ],
                type: "order",
            },
        },
        {
            text: "📍SIGNAL ID: 0212📍\nCOIN: $SXP/USDT (1-3x)\nTerm: SHORT TERM\n➖➖➖➖➖➖➖\nSXP already made us a 300%+ profit on our last entry and it has now retested on of its strongest support levels at $3.035 before heading back up. Now that it's showing relative strength against its $3.80 level, we can see a retest of it in the next couple of hours before an up continuation. Placing some orders there.\n\nENTRY: 3.55 - 3.80\nOTE: 3.80\n\nTARGETS\nShort Term: 3.90 - 4.00 - 4.20 - 4.40\nMid Term: 4.70 - 5.00 - 5.50 - 6.00 - 7.00\n\nSTOP LOSS: Below 3.10\n➖➖➖➖➖➖➖\nThis message cannot be forwarded or replicated\n- Binance Killers®",
            expected: {
                 coin: "SXP/USDT",
                 direction: "",
                 entry: [
                   3.55,
                   3.8,
                 ],
                 exchange: "",
                 leverage: "(1-3x)",
                 midTermTargets: [
                   4.7,
                   5,
                   5.5,
                   6,
                   7,
                 ],
                 ote: 3.8,
                 shortTermTargets: [
                   3.9,
                   4,
                   4.2,
                   4.4,
                 ],
                 signalId: "0212",
                 stopLoss: 3.1,
                 targets: [
                   3.9,
                   4,
                   4.2,
                   4.4,
                   4.7,
                   5,
                   5.5,
                   6,
                   7,
                 ],
                 type: "order",
            },
        },
        {
            text: '📍SIGNAL ID:#0941📍\nCOIN: $BTC/USDT (5-10x)\nDirection: SHORT📉\n➖➖➖➖➖➖➖\nENTRY: 27,400 - 29,020\nOTE: 27,871\n\nTARGETS\nShort Term: 27,150 - 26,900 - 26,600 - 26,200 - 25,500\nMid Term: 24,500 - 23,000 - 21,200 - 20,000 - 17,800\n\nSTOP LOSS: 30,025\n➖➖➖➖➖➖➖\nThis message cannot be forwarded or replicated\n- Binance Killers®',
            expected: {
                    coin: "BTC/USDT",
                    direction: "",
                    entry: [
                      27400,
                      29020,
                    ],
                    exchange: "",
                    leverage: "(5-10x)",
                    midTermTargets: [
                      24500,
                      23000,
                      21200,
                      20000,
                      17800,
                    ],
                    ote: 27871,
                    shortTermTargets: [
                      27150,
                      26900,
                      26600,
                      26200,
                      25500,
                    ],
                    signalId: "0941",
                    stopLoss: 25,
                    targets: [
                      27150,
                      26900,
                      26600,
                      26200,
                      25500,
                      24500,
                      23000,
                      21200,
                      20000,
                      17800,
                    ],
                    type: "order",
                  },
        }
    ];

    strings.forEach(x => assertEquals(parseOrderText(x.text) as any, x.expected, `Failed to match ${x.text}`));
});
