# crypto-signals-analysis

Tool for parsing and analyzing signals from crypto signal groups.

## Requirements

- [deno](https://deno.land/)

## How to use

1. Open the signal group telegram channel (if it has separate cornix channel like Binance Killers have, prefer the cornix channel)
2. Export chat history
3. Use `deno run --allow-read --allow-write main.ts`

### Commands

- `deno run --allow-read --allow-write main.ts` - this will show help with all available commands

- init - Initializes the database
- verify - Verifies the database version
- parse - Parses the signals
- import - Imports signal into DB
- export - Exports signals from DB to .csv file
- export-from-source - Exports signals from the source .html files

## Currently supported signal groups

- Binance Killers - cornix channel
- Binance Killers - VIP channel - can be used to fill in missing information (like signal id)
- BitsTurtle
- Any group that uses the same format as BK

### Supported signal format

Order

```text
COIN: $BTC/USDT
Direction: Long
Exchange: ByBit USDT
Leverage: 10x

ENTRY: 32000 - 30000 - 28000

TARGETS: 34000 - 34500 - 35000 - 35500 - 36000 - 37000 - 37500 - 38000 - 38500

STOP LOSS: 26000
```

Entry

```text
ByBit USDT
#BTC/USDT Entry 1 ✅
Average Entry Price: 32000 💵
```

TP

```text
ByBit USDT
#BTC/USDT Take-Profit target 1 ✅
Profit: 62.5% 📈
Period: 2 Days 17 Hours 55 Minutes ⏰
```

SL after TP

```text
ByBit USDT
#BTC/USDT Closed at stoploss after reaching take profit ⚠️
```

SL

```text
ByBit USDT
#BTC/USDT Stoploss ⛔️
Loss: 133.3% 📉
```
