import { assertNotEquals } from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { parseOrderString } from "./cryptokey.ts";

Deno.test(function parseOrderStringHandlesAllFormats() {
  // TODO: Fix tests
  console.error('TODO: FIX TESTS'); return;

    const strings = [
        '🟥 HIGH/USDT SHORT\n⏱ 15m Mid Term\n👉 Entry : 1.113 - 1.131\n\n⏳ Signal details:\n🎯 Target 1 : 1.10187\n🎯 Target 2 : 1.096305\n🎯 Target 3 : 1.09074\n🎯 Target 4 : 1.07961\n_____\n❌ Stoploss : 1.163085\n💡 Leverage : 10x cross',
        'AR/USDT SHORT\nEntry Zone: 8.267 - 8.776\n\nSignal details:\nTarget 1:  8.2049975\nTarget 2:  8.142994999999999\nTarget 3:  8.080992499999999\nTarget 4:  7.894984999999999\n\nStop-Loss: 8.86376\nLeverage: 10x cross'
    ];

    strings.forEach(string => assertNotEquals(parseOrderString(string), null, `Failed to match ${string}`));
});
