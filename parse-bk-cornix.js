function parseDate(dateString) {
    const parts = dateString.split(" ");
    const dateParts = parts[0].split(".");
    const timeParts = parts[1].split(":");
    const timezonePart = parts[2].substring(3); // Extract the timezone offset without "UTC" prefix

    const year = parseInt(dateParts[2], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Month is zero-based in JavaScript Date object
    const day = parseInt(dateParts[0], 10);
    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    const second = parseInt(timeParts[2], 10);

    // Construct the date object
    const date = new Date(Date.UTC(year, month, day, hour, minute, second));

    // Apply the timezone offset
    const timezoneOffset = parseInt(timezonePart, 10);
    date.setHours(date.getHours() - timezoneOffset);

    return date;
}

function getReferencedMessageId(messageDiv) {
    const replyTo = messageDiv.getElementsByClassName('reply_to');
    if (replyTo.length > 0) {
      const a = Array.from(Array.from(replyTo)[0].getElementsByTagName('a'));

      if (a.length > 0) {
          const link = a[0].getAttribute('href').split('go_to_');

          if (link.length == 2) {
              return link[1];
          }
      }
    }

    return null;
}

function parseOrder(messageDiv) {
    const pattern = /COIN: (.+)Direction: (.+)Exchange: (.+)Leverage: (.+)ENTRY: (.+)TARGETS: (.+)STOP LOSS: (.+)/g;

    const message = messageDiv.textContent;

    const match = pattern.exec(message.trim());
    if (match) {
      const coin = match[1];
      const direction = match[2];
      const exchange = match[3];
      const leverage = match[4];
      const entry = match[5].trim().split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
      const targets = match[6].trim().split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
      const stopLoss = parseFloat(match[7].trim().replace(",", ""));

      const parsedMessage = {
        type: 'order',
        coin: coin,
        direction: direction,
        exchange: exchange,
        leverage: leverage,
        entry: entry,
        targets: targets,
        stopLoss: stopLoss,
      };

    return parsedMessage;
  }

  return null;
}

function parseOrder2(messageDiv) {
    const pattern = /COIN: (.+)\nDirection: (.+)\nExchange: (.+)\nLeverage: (.+)\n\nENTRY: (.+)\nOTE: (.+)\n\nTARGETS\nShort Term: (.+)\nMid Term: (.+)\n\nSTOP LOSS: (.+)/g;

    const message = messageDiv.textContent;

    const match = pattern.exec(message);
    if (match) {
      const coin = match[1];
      const direction = match[2];
      const exchange = match[3];
      const leverage = match[4];
      const entry = match[5].trim().split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
      const ote = parseFloat(match[6].trim().replace(",", ""));
      const shortTermTargets = match[7].split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
      const midTermTargets = match[8].split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
      const targets = [ ...shortTermTargets, ...midTermTargets ];
      const stopLoss = parseFloat(match[9].trim().replace(",", ""));

      const parsedMessage = {
        type: 'order',
        coin: coin,
        direction: direction,
        exchange: exchange,
        leverage: leverage,
        entry: entry,
        ote,
        targets: targets,
        shortTermTargets,
        midTermTargets,
        stopLoss: stopLoss,
      };

    return parsedMessage;
  }

  return null;
}


function parseSpotOrder(messageDiv) {
    const pattern = /COIN: (.+)Direction: (.+)(.+)ENTRY: (.+)TARGETS: (.+)STOP LOSS: (.+)/g;

    const message = messageDiv.textContent;

    const match = pattern.exec(message.trim());
    if (match) {
      const coin = match[1].trim();
      const direction = match[2].trim();
      const entry = match[4].trim().split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
      const targets = match[5].trim().split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
      const stopLoss = parseFloat(match[6].trim().replace(",", ""));

      const parsedMessage = {
        type: 'spotOrder',
        coin: coin,
        direction: direction,
        entry: entry,
        targets: targets,
        stopLoss: stopLoss,
      };

    return parsedMessage;
  }

  return null;
}

function parseEntry(messageDiv) {
    const entryPattern = /(.*)\n(.*) Entry (?:target )?(\d+).*\nAverage Entry Price: (\d*\.?\d*)/gm;
    const message = messageDiv.getElementsByClassName('text')[0].innerText.trim();

    const entryMatch = entryPattern.exec(message);
    if (entryMatch) {
        const coin = entryMatch[2];
        const exchange = entryMatch[1];
        const entry = parseInt(entryMatch[3].trim());
        const price = parseFloat(entryMatch[4].trim().replace(",", ""));

        const referencedMessageId = getReferencedMessageId(messageDiv);

        const parsedEntry = {
              relatedTo: referencedMessageId,
              type: 'entry',
              coin: coin,
              exchange,
              entry,
              price
          };

        return parsedEntry;
    }

    return null;
}

function parseEntryAll(messageDiv) {
    const entryPattern = /(.*)\n(.*) All entry targets achieved\nAverage Entry Price: (\d*\.?\d*)/gm;
    const message = messageDiv.getElementsByClassName('text')[0].innerText.trim();

    const entryMatch = entryPattern.exec(message);
    if (entryMatch) {
        const referencedMessageId = getReferencedMessageId(messageDiv);

        const coin = entryMatch[2];
        const exchange = entryMatch[1];
        const price = parseFloat(entryMatch[3].trim().replace(",", ""));

        const parsedEntry = {
            relatedTo: referencedMessageId,
            type: 'entryAll',
            coin: coin,
            exchange,
            price
        };

        return parsedEntry;
    }

    return null;
}

function parseClose(messageDiv) {
    const entryPattern = /CLOSE (.*)/;
    const message = messageDiv.getElementsByClassName('text')[0].innerText.trim();

    const match = entryPattern.exec(message);
    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const coin = match[1];

        const parsedEntry = {
              relatedTo: referencedMessageId,
              type: 'close',
              coin: coin
        };

        return parsedEntry;
    }

    return null;
}

function parseCancelled(messageDiv) {
    const entryPattern = /(.*)\n(.*) Cancelled ❌\nTarget achieved before entering the entry zone/;
    const message = messageDiv.getElementsByClassName('text')[0].innerText.trim();

    const match = entryPattern.exec(message);
    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match[1];
        const coin = match[2];

        const parsedEntry = {
            relatedTo: referencedMessageId,
            type: 'cancelled',
            coin,
            exchange
        };

        return parsedEntry;
    }

    return null;
}

function parseOpposite(messageDiv) {
    const pattern = /(.*)\n(.*) Closed due to opposite direction signal.*/gm;
    const message = messageDiv.getElementsByClassName('text')[0].innerText.trim();

    const match = pattern.exec(message);
    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match[1];
        const coin = match[2];

        const parsedEntry = {
            relatedTo: referencedMessageId,
            type: 'close',
            coin: coin,
            exchange
        };

        return parsedEntry;
    }

    return null;
}

function parseSLAfterTP(messageDiv) {
    const pattern = /(.*)\n(.*) Closed at stoploss after reaching take profit/gm;
    const message = messageDiv.getElementsByClassName('text')[0].innerText.trim();

    const match = pattern.exec(message);

    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match[1];
        const coin = match[2];

        const parsedEntry = {
              relatedTo: referencedMessageId,
              type: 'SLTP',
              coin: coin,
              exchange
          };

        return parsedEntry;
    }

    return null;
}

function parseSL(messageDiv) {
    const pattern = /(.*)\n(.*) Stoploss ⛔\nLoss: ([\d\.\%]+) 📉/gm;
    const message = messageDiv.getElementsByClassName('text')[0].innerText.trim();

    const match = pattern.exec(message);

    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match[1];
        const coin = match[2];
        const pctStr = match[3];
        const pct = parseFloat(pctStr.replace("%", ""));

        const parsedEntry = {
              relatedTo: referencedMessageId,
              type: 'SL',
              coin: coin,
              exchange,
              pct
          };

        return parsedEntry;
    }

    return null;
}


function parseTP(messageDiv) {
    const pattern = /(.*)\n(.*) Take-Profit target (\d+) ✅\nProfit: ([\d\.\%]+) 📈\nPeriod: (.*) ⏰/gm;
    const message = messageDiv.getElementsByClassName('text')[0].innerText.trim();

    const match = pattern.exec(message);

    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match[1];
        const coin = match[2];
        const tp = parseInt(match[3]);
        const pctStr = match[4];
        const pct = parseFloat(pctStr.replace("%", ""));
        const time = match[5];

        const parsedEntry = {
              relatedTo: referencedMessageId,
              type: 'TP',
              coin: coin,
              exchange,
              tp,
              pctStr,
              pct,
              time
          };

        return parsedEntry;
    }

    return null;
}

function parseTPAll(messageDiv) {
    const pattern = /(.*)\n(.*) All take-profit targets achieved 😎\nProfit: ([\d\.\%]+) .*\nPeriod: (.*) ⏰/gm;
    const message = messageDiv.getElementsByClassName('text')[0].innerText.trim();

    const match = pattern.exec(message);

    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match[1];
        const coin = match[2];
        const pctStr = match[3];
        const pct = parseFloat(match[3].replace("%", ''));
        const time = match[4];

        const parsedEntry = {
            relatedTo: referencedMessageId,
            type: 'TPAll',
            coin: coin,
            exchange,
            pctStr,
            pct,
            time
        };

        return parsedEntry;
    }

    return null;
}


function parseMessage(messageDiv) {
    const messageId = messageDiv.getAttribute('id');
    const date = parseDate(messageDiv.getElementsByClassName('date')[0].getAttribute('title'));
    const message = messageDiv.getElementsByClassName('text')[0].innerText.trim();

    let result = parseOrder(messageDiv)
        ?? parseOrder2(messageDiv)
        ?? parseSpotOrder(messageDiv)
        ?? parseEntry(messageDiv)
        ?? parseEntryAll(messageDiv)
        ?? parseClose(messageDiv)
        ?? parseOpposite(messageDiv)
        ?? parseSLAfterTP(messageDiv)
        ?? parseSL(messageDiv)
        ?? parseTP(messageDiv)
        ?? parseTPAll(messageDiv)
        ?? parseCancelled(messageDiv)
        ?? { text: message, 'type': 'unknown' };

    return { ...result, messageId, date };
}

function getOrderSignalInfoFull(signal, groupedSignals) {
    const relatedSignals = groupedSignals[signal.messageId];

    const order = relatedSignals.find(x => x.type == 'order' || x.type == 'spotOrder'); //  relatedSignals.find(x => x.type == 'order' && x.exchange == 'Binance Futures');
    const entries = relatedSignals.filter(x => x.type === 'entry'); // relatedSignals.filter(x => x.type === 'entry' && x.exchange == 'Binance Futures');
    const tps = relatedSignals.filter(x => x.type == 'TP');
    const sl = relatedSignals.filter(x => x.type == 'SL');
    const other = relatedSignals.filter(x => x.type !== 'spotOrder' && x.type !== 'order' && x.type !== 'entry' && x.type !== 'TP' && x.type !== 'SL');

    if (order == null) {
        return {
            order,
            entries,
            tps,
            sl,
            other
        };
    }

    const avgEntryPrice = entries.map(x => x.price).reduce((sum, entry) => entry + sum, 0) / entries.length;

    const maxReachedEntry = Math.max(...entries.map(x => x.entry));
    const tpsAsInt = tps.map(x => x.tp);
    const maxReachedTp = Math.max(...tpsAsInt);

    const lev = order.leverage ? parseInt(order.leverage.replace('x', '')) : 1;

    const orderTps = order.targets.map(x => x);
    const avgTpValue = orderTps.filter((x, idx) => idx + 1 <= maxReachedTp)
        .reduce((sum, x) => sum + x, 0) / maxReachedTp;

    const sumProfitPct = orderTps.filter((x, idx) => idx + 1 <= maxReachedTp)
        .reduce((sum, x) => sum + Math.abs(x - avgEntryPrice), 0) / maxReachedTp / avgEntryPrice * lev * 100;

    const sumLossPct = Math.abs(order.stopLoss - avgEntryPrice) / avgEntryPrice * lev * 100;

    const pnl = tps.length === 0 && sl.length > 0
        ? -sumLossPct
        : sumProfitPct;

    const closed = tps.length === order.targets.length || sl.length > 0;

    const data = {
        order,
        entries,
        tps,
        sl,
        other,
        maxReachedEntry,
        maxReachedTp,
        avgEntryPrice,
        avgTpValue,
        pnl,
        closed,
        lev
    };

    return data;
}

function updateOrderDetailWithSL(orderDetail, sl) {
    orderDetail.sl.push(sl);

    // it doesn't make any sense to reach full SL without reaching all entry points first, assume all entries were entered
    const entries = orderDetail.order.entry;
    const avgEntryPrice = entries.reduce((sum, entry) => entry + sum, 0) / entries.length;
    const maxReachedEntry = entries.length;
    const lev = orderDetail.order.leverage ? parseInt(orderDetail.order.leverage.replace('x', '')) : 1;

    const sumLossPct = Math.abs(orderDetail.order.stopLoss - avgEntryPrice) / avgEntryPrice * lev * 100;

    const pnl = -sumLossPct;

    orderDetail.avgEntryPrice = avgEntryPrice;
    orderDetail.maxReachedEntry = maxReachedEntry;
    orderDetail.pnl = pnl;
    orderDetail.closed = true;
}

function groupRelatedSignals(signals) {
    const mappedSignals = signals.reduce((acc, x) => { acc[x.messageId] = [ x ]; return acc; }, {});

    signals.filter(x => x.relatedTo != null).forEach(x => {
        const oldValues = mappedSignals.hasOwnProperty(x.relatedTo) ? mappedSignals[x.relatedTo] : [];
        mappedSignals[x.relatedTo] = [ ...oldValues, x ];
    });

    return mappedSignals;
}

function getRootSignals(groupedSignals) {
    const uniqueSignals = Object.keys(groupedSignals).map(x => groupedSignals[x][0]);
    const rootSignalIds = new Set(uniqueSignals.filter(x => x.relatedTo == null).map(x => x.messageId));
    const rootSignals = Array.from(rootSignalIds).map(x => groupedSignals[x]).filter(x => x != null).map(x => x[0]);

    return rootSignals;
}

function getOrderSignals(groupedSignals) {
    return groupedSignals.filter(x => x.type == 'order' || x.type == 'spotOrder');
}

function mapSLToOrder(slSignal, orderSignals, groupedSignals, allSignals) {
    console.log(slSignal);

    const originallyMappedOrder = groupedSignals[slSignal.relatedTo]?.[0];

    if (originallyMappedOrder == null) {
        // this is tricky, but probably rare, skip for now and check the impact later
    } else {
        const timeDiffMax2MinInMs = 2 * 60 * 1000;
        const ordersWithTheSameCoin = orderSignals.filter(x => x.order.coin === originallyMappedOrder.coin);
        const probablyRelatedOrders = orderSignals.filter(x => x.order.coin === originallyMappedOrder.coin &&
            (x.order.date - originallyMappedOrder.date) <= timeDiffMax2MinInMs && x.order.stopLoss === originallyMappedOrder.stopLoss)
            .filter(x => x.order.messageId !== originallyMappedOrder.messageId);

        probablyRelatedOrders.forEach((x, index) => {
            const slCopy =  { ...slSignal, relatedTo: x.order.messageId, messageId: `${slSignal.messageId}-${index + 1}`, exchange: x.order.exchange };
            groupedSignals[slCopy.messageId] = slCopy;
            groupedSignals[x.order.messageId].push(slCopy);

            updateOrderDetailWithSL(x, slCopy);

            allSignals.push(slCopy);
        });
    }
}

let messages = $$('.message.default').map(x => parseMessage(x));

const savedMessages = localStorage.getItem('bk2') ?? '[]';
const parsedSavedMessages = JSON.parse(savedMessages);
const allMessages = [ ...parsedSavedMessages, ...messages ].sort((x, y) => x.date = y.date);
localStorage.setItem('bk2', JSON.stringify(allMessages));

const messagesWithFixedDate = allMessages.map(x => {
    if (typeof x.date === 'string') {
        return { ...x, date: new Date(x.date) };
    }

    return x;
});
const groupedSignals = groupRelatedSignals(messagesWithFixedDate);
const orderSignals = getOrderSignals(messagesWithFixedDate).map(x => getOrderSignalInfoFull(x, groupedSignals));

const slSignals = messagesWithFixedDate.filter(x => x.type == 'SL');
slSignals.forEach(x => mapSLToOrder(x, orderSignals, groupedSignals, messagesWithFixedDate));

const binanceFuturesSignals = orderSignals.filter(x => x.order?.exchange == "Binance Futures");

const binanceFuturesProfitable = binanceFuturesSignals.filter(x => x.tps.length > 1);

const sumTpPcts = binanceFuturesProfitable.reduce((sum, x) => sum + x.tps[x.tps.length - 1].pct, 0);
const avgTpPcts =  sumTpPcts / binanceFuturesProfitable.length;

const binanceFuturesSL = binanceFuturesSignals.filter(x => x.sl.length > 1);

// filter(x => x.type == 'entry')
// const mappedSignals = data.reduce((acc, x) => { acc[x.messageId] = [ x ]; return acc; }, {});
// const uniqueSignals = Object.keys(mappedSignals).map(x => mappedSignals[x][0]);
// // const rootSignalIds = new Set(uniqueSignals.filter(x => x.relatedTo != null).map(x => x.relatedTo));
// const rootSignalIds = new Set(uniqueSignals.filter(x => x.relatedTo == null).map(x => x.messageId));
// const rootSignals = Array.from(rootSignalIds).map(x => mappedSignals[x]).filter(x => x != null).map(x => x[0]);
//
// uniqueSignals.filter(x => x.relatedTo != null).forEach(x => {
//     const oldValues = mappedSignals.hasOwnProperty(x.relatedTo) ? mappedSignals[x.relatedTo] : [];
//     mappedSignals[x.relatedTo] = [ ...oldValues, x ];
// });



let interestingData = orderSignals.filter(x => x.order.exchange?.toLowerCase() === 'Binance Futures'.toLowerCase()); //.map(x => getSignalInfoFull(x));
Object.keys(groupedSignals).map(x => groupedSignals[x]).filter(x => x.length == 1).map(x => x[0]).filter(x => x.type == 'TP' && x.exchange.match('Binance'))


/**
 * Issues:
 *
 * 1) BK doesn't post SL for each exchange. They tend to post SL on SPOT or ByBit, where leverage is lower then on Binance
 *  and loss doesn't look so bad.

 * 2) PnL % is percentage of signal, doesn't say the actual amount you would gain, needs to be calculated based on entry
 *  points and can differ a lot based on the configuration.
 */
