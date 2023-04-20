const { validationResult } = require("express-validator");
const createError = require("http-errors");
const moment = require("moment/moment");
const axios = require("axios");
const Cron = require("croner");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { executablePath } = require("puppeteer");
const faucetPayAddressesModel = require("../models/faucetPayAddressesModel");

// ######################## SCRAPE URL FROM WEBSITE ##############################
const scraper1 = async (req, res, next) => {
  try {
    let from = moment().format();
    // let to = moment(from).add(10, "s").format();
    let to = moment(from).add(30, "s").format();
    const job = new Cron(to, {}, (job) => {
      let url = "http://localhost:3001/api/v1/scrape";
      axios
        .post(
          url,
          {
            url: "https://cryptofuture.co.in/ripple/",
            coinSymbol: "xrp",
          },
          {
            headers: {
              // "content-type": "application/json",
            },
          }
        )
        .then(async (response) => {
          if (response.status) {
            console.log("Successful Cron Job!");
          } else {
            console.log(response.message);
          }
        })
        .catch(async (error) => {
          console.log(error);
        });
    });

    puppeteer.use(StealthPlugin());
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(500, errorMessage));
    }
    let { url, coinSymbol } = req.body;

    const browser = await puppeteer.launch({
      args: ["--no-sandbox"],
      headless: false,
      ignoreHTTPSErrors: true,
      executablePath: executablePath(),
    });

    const page = await browser.newPage();

    await page.goto(url);

    await page.waitForTimeout(25000);
    // await page.screenshot({ path: "testresult.png", fullPage: true });

    // const data = await page.evaluate(
    //   () => document.querySelector("*").outerHTML
    // );
    // console.log("data", data);
    let addresses = await scrapeTechnique1(page);
    let currentAddresses = await faucetPayAddressesModel.findOne({
      coinSymbol: coinSymbol,
    });
    if (!currentAddresses) {
      await faucetPayAddressesModel.create({
        coinSymbol: coinSymbol,
        addresses: addresses,
      });
      browser.close();
      return res.json({
        status: true,
        message: "URL Scraped! Addresses Created!",
      });
    }
    let tempAddresses = addresses.concat(currentAddresses.addresses);

    let updateAddresses = await faucetPayAddressesModel.updateOne(
      { coinSymbol: coinSymbol },
      {
        $set: { addresses: tempAddresses },
      }
    );
    if (updateAddresses.modifiedCount === 0) {
      browser.close();
      return next(createError(401, "Some Error Occured!"));
    }
    browser.close();
    return res.json({
      status: true,
      message: "URL Scraped! Addresses Updated!",
    });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

// ######################## GET ADDRESSES ##############################
const getAddresses = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(500, errorMessage));
    }
    const { coinSymbol, startIndex, endIndex } = req.query;

    let data = await faucetPayAddressesModel.findOne({
      coinSymbol: coinSymbol,
    });

    if (!data) {
      return next(createError(500, "No Addresses Found for this Coin!"));
    }

    console.log("data", data);

    let selectedAddresses = data.addresses.slice(startIndex, endIndex);
    return res.json({
      status: true,
      data: {
        coinSymbol: coinSymbol,
        totalAddressesCount: data.addresses.length,
        fetchedAddressesCount: selectedAddresses.length,
        addresses: selectedAddresses,
      },
    });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

module.exports = { scraper1, getAddresses };

const scrapeTechnique1 = async (page) => {
  console.log("scrape started");
  // let addresses = await page.$$eval(
  //   "table tbody .text-break",
  //   (allAddresses) => {
  //     console.log("allAddresses", allAddresses);
  //     return allAddresses.map((address) => {
  //       // console.log("address", address[0].textContent);
  //       return address.textContent;
  //     });
  //   }
  // );

  const data = await page.$$eval("table tbody td", (divs) => {
    return divs.map((div) => {
      return div.textContent;
    });
  });
  console.log("data", data);
  let count = 0;
  let scrapeData = [];
  data.map((item) => {
    if (count === 0) {
      scrapeData.push({ address: item });
      count++;
      return;
    } else if (count === 1) {
      let currentData = scrapeData[scrapeData.length - 1];
      scrapeData[scrapeData.length - 1] = {
        ...currentData,
        amount: Number(item.slice(0, -8)),
      };
      count++;
      return;
    } else if (count === 2) {
      count = 0;
      return;
    }
  });

  return scrapeData;
};
