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

## How to contribute

### Adding new channel

1. Export channel history from telegram
2. Open the latest message.html file in a browser and find the order message
3. Right click on it and select `inspect` in a browser menu
4. Find and select `<div class="text">` in elements inspector window
5. Open a console
6. Write `$0.innerText` and copy the value
7. Write a regular expression for parsing that value
   - [Regex101](https://regex101.com) can help a lot!
   - Make sure to have named capture groups
   - Here is sample regex:
       ```regexp
      (?<coin>.+) (?<direction>.+)\n?Leverage: (?<leverage>.+)\n?Entry: (?<entry>[\d\.,]+)\n?(?<targets>Target \d+: .+)\n?Stoploss: (?<sl>.+)
      ```
8. Copy `generic.ts` and `generic_test.ts` and use them as a template for the new group.
9. Update [parse.ts](./src/commands/parse.ts) file 
   - add new import
   - add new case into pattern matching in `parse` function
10. Update [main.ts](./main.ts) file
    - add new group to `signals` array
11. Test parsing messages for new channel.
    - you will see message like this one:
    ```text
    Parsed messages statistics:
    {"messageStats":{"unknown":885,"order":159}}
    ```
    - if the `"order"` part is missing, there is probably something wrong with the regex
12. Create a pull request

It is not needed to make regular expressions for all channel messages, orders are the most important ones.
If you do the work and make regular expressions for all messages, it will be highly appreciated and it will make it possible 
 to do basic testing using this tool and it will be able to calculate the PnL based on parsed data.

If only orders are parsed, using the [crypto-trade-backtracker](https://github.com/CryptobotCZ/crypto-trade-backtracker)
 is needed to do the backtracking and calculating the PnL.
