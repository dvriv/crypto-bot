const axios = require('axios');
const crypto = require('crypto'); 

const cryptopiaConfig = {
  API_KEY: 'YOUR_API_KEY',
  API_SECRET: 'YOUR_API_SECRET',
  HOST_URL: 'https://www.cryptopia.co.nz/api',
};

const buildAuth = (data, config, path) => {
  const nonce = crypto.randomBytes(64).toString('hex');
  const md5 = crypto.createHash('md5').update(JSON.stringify(data)).digest('base64');
  const signature = `${config.API_KEY}POST${encodeURIComponent(config.HOST_URL + path).toLowerCase()}${nonce}${md5}`;
  const hmac = crypto.createHmac('sha256', new Buffer(config.API_SECRET, "base64")).update(signature).digest('base64');
  return `amx ${config.API_KEY}:${hmac}:${nonce}`;
};

const privateRequest = async (data, path) => {
  const requestConfig = {
    method: 'POST',
    url: cryptopiaConfig.HOST_URL + path,
    data: data,
    headers: {
      'Authorization': buildAuth(data, cryptopiaConfig, path),
      'Content-Type': 'application/json; charset=utf-8',
    },
  };

  try {
    const response = await axios(requestConfig);
    return response;
  }
  catch (err) {
    return err;
  }
};

const publicRequest = async (path) => {
  const requestConfig = {
    method: 'GET',
    url: cryptopiaConfig.HOST_URL + path,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    responseType: 'json',
  };

  try {
    const response = await axios(requestConfig);
    return response;
  }

  catch (err) {
    return err;
  }
};


const getCurrentMarketPrice = async (pair) => {
  try {
    const currentMarketPrice = await publicRequest(`/getmarket/${pair}`);
    return {
      buyPrice: currentMarketPrice.data.Data.AskPrice,
      sellPrice: currentMarketPrice.data.Data.BidPrice,
    };
  }
  catch (err) {
    return err;
  }
};

const checkCoinBalance = async (coin) => {
  const data = {
    Currency: coin,
  };
  try {
    const balance = await privateRequest(data, '/getbalance');
    return balance.data.Data[0].Available;
  }
  catch (err) {
    return err;
  }

};

const putOrder = async (pair, price, amount, type) => {
  const data = {
    Market: pair,
    Type: type,
    Rate: price,
    Amount: amount,
  };

  const response = await privateRequest(data, '/submittrade');
  // console.log('putOrderResponse', response);
  return response;
};

const autoBuyAndSell = async (coin, market, buyPercent, sellPercent, amount) => {
  try {
    const pair = `${coin}_${market}`;
    const buyFee = (amount * 0.002).toFixed(8);
    const currentMarketPrice = await getCurrentMarketPrice(pair);
    console.log('buyFee: ', buyFee);
    console.log('maker price', currentMarketPrice);
    const orderBuyPrice = (currentMarketPrice.buyPrice * buyPercent).toFixed(8);
    console.log('orderBuyPrice', orderBuyPrice);
    const orderBuyAmount = ((amount - buyFee) / orderBuyPrice).toString().match(/^-?\d+(?:\.\d{0,8})?/)[0];
    console.log('order buy amount', orderBuyAmount);
    const orderSellPrice = (currentMarketPrice.sellPrice * sellPercent).toString().match(/^-?\d+(?:\.\d{0,8})?/)[0];
    console.log('order sell price', orderSellPrice);
    const orderSellAmount = await checkCoinBalance(coin);
    console.log('order sell amount', orderSellAmount);
    const newBuyOrder = await putOrder(pair, orderBuyPrice, orderBuyAmount, 'Buy');
    // const newSellOrder = await putOrder(pair, orderSellPrice, orderSellAmount, 'Sell');
    return newBuyOrder;
  }
  catch (err) {
    return err;
  }
};

module.exports = autoBuyAndSell;
