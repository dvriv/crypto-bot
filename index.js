#!/usr/bin/env node
const { argv } = require('yargs');
// const cryptopia = require('./cryptopia');
const binance = require('./binance');
const axios = require('axios');
const { performance } = require('perf_hooks');

const axiosTime = (instance, callback) => {
  instance.interceptors.request.use((request) => {
    request.ts = performance.now();
    return request;
  });

  instance.interceptors.response.use((response) => {
    callback(Number(performance.now() - response.config.ts));
    return response;
  });
};

axiosTime(axios, console.log);

binance(argv.coin, argv.market, argv.buyDecimal, argv.sellDecimal, argv.marketAvailableAmount).then((price) => {
  console.log(price);
});

//  index.js --coin='ARK' --market='BTC' --buyDecimal='0.90' --sellDecimal='1.10' --marketAvailableAmount='0.00051854'
// This is the command you have to use to excecute an order.