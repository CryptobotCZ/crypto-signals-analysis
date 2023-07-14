import { assertNotEquals } from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { parseOrderString } from "./generic.ts";

Deno.test(function parseOrderStringHandlesAllFormats() {
    const strings = [
        'BINANCEPair: SUSHIUSDTPERP LONGLeverage: Cross 10xEntry: 10.713000000000001Targets: 10.982 - 11.141 - 11.42 - 11.563SL: 10.258',
        'BINANCEPair: SUSHIUSDT LONGLeverage: Cross 20xEntry: 5.708Targets: 5.854 - 5.936 - 6.084 - 6.164SL: 5.465',
        'SUSHIUSDT SHORTLeverage: Cross 20xEntry: 2.872Targets: 2.798 - 2.757 - 2.682 - 2.642SL: 2.993Trailing Configuration:Stop: Breakeven -  Trigger: Target (2)'
    ];

    strings.forEach(string => assertNotEquals(parseOrderString(string), null, `Failed to match ${string}`));
});
