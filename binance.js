const axios = require('axios');
const crypto = require('crypto');
const qs = require('qs');

const binanceConfig = {
  API_KEY: 'YOUR_API_KEY',
  API_SECRET: 'YOUR_API_SECRET',
  HOST_URL: 'https://api.binance.com',
};

const buildSign = (data, config) => {
  return crypto.createHmac('sha256', config.API_SECRET).update(data).digest('hex');
};

const privateRequest = async (data, endPoint, type, signed) => {
  let dataQueryString = qs.stringify(data);
  if (signed) {
    const signature = buildSign(dataQueryString, binanceConfig);
    dataQueryString += '&signature=' + signature;
  }
  const requestConfig = {
    method: type,
    url: binanceConfig.HOST_URL + endPoint + '?' + dataQueryString,
    headers: {
      'X-MBX-APIKEY': binanceConfig.API_KEY,
    },
  };

  try {
    const response = await axios(requestConfig);
    return response;
  }
  catch (err) {
    console.log(err);
    return err;
  }
};

const getCurrentMarketPrice = async (pair) => {
  const data = {
    symbol: pair,
  }

  try {
    const currentMarketPrice = await privateRequest(data, '/api/v3/ticker/bookTicker', 'GET');
    return {
      buyPrice: currentMarketPrice.data.askPrice,
      sellPrice: currentMarketPrice.data.bidPrice,
    };
  }
  catch (err) {
    console.log(err);
    return err;
  }
};

const putOrder = async (pair, amount, side) => {
  const data = {
    symbol: pair,
    side: side,
    type: 'market',
    quantity: amount,
    newOrderRespType: 'FULL',
    recvWindow: 25000,
    timestamp: Date.now(),
  };

  const response = await privateRequest(data, '/api/v3/order', 'POST', true);
  // console.log('putOrderResponse', response);
  return response.data;
};

const autoBuyAndSell = async (coin, market, buyPercent, sellPercent, amount) => {
  try {
    const pair = coin + market;
    const buyFee = (amount * 0.001).toFixed(8);
    const currentMarketPrice = await getCurrentMarketPrice(pair);
    console.log('buyFee: ', buyFee);
    console.log('maker price', currentMarketPrice);
    const orderBuyPrice = (currentMarketPrice.buyPrice * buyPercent).toFixed(8);
    console.log('orderBuyPrice', orderBuyPrice);
    const orderBuyAmount = (Math.floor(((amount) / orderBuyPrice)));
    console.log('order buy amount', orderBuyAmount);
    // const orderSellPrice = (currentMarketPrice.sellPrice * sellPercent).toString().match(/^-?\d+(?:\.\d{0,8})?/)[0];
    // console.log('order sell price', orderSellPrice);
    // const orderSellAmount = await checkCoinBalance(coin);
    // console.log('order sell amount', orderSellAmount);
    const newBuyOrder = await putOrder(pair, orderBuyAmount, 'BUY');
    // const newSellOrder = await putOrder(pair, orderSellPrice, orderSellAmount, 'Sell');
    return newBuyOrder;
  }
  catch (err) {
    return err;
  }
};

module.exports = autoBuyAndSell;
