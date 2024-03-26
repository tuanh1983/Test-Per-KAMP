import http from "k6/http";
import { SharedArray } from "k6/data";
import papaparse from "https://jslib.k6.io/papaparse/5.1.1/index.js";
import { sleep } from "k6";

const filePath = `./Data/KAMP_${getRandomNumber()}.csv`;

const csvData = new SharedArray("ListRange", function () {
  return papaparse.parse(open(filePath), {
    header: true,
  }).data;
});

export const options = {
  vus: 500,
  //iterations: 500,
  duration: "30m",
};

//const startTime = new Date();

const baseUrl = "https://kamp.test.klimatilpasning.dk/data/flatgeobuf/2024/";

const vej_stykke_paavirket = "vej_stykke_paavirket.fgb";
const bygning_paavirket = "bygning_paavirket.fgb";
const timeout = '300s';

const commonHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Encoding": "identity",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache, no-store",
  Cookie:
    "ai_user=6ti8SF6lcPwbdjXAhDoATr|2024-03-18T06:02:46.106Z; ai_session=0dt5oy8KckSxLZDtCTaT0H|1710752231070|1710752483144",
  Referer:
    "https://kamp.test.klimatilpasning.dk/frahavet/havvandpaaland?value=havvandpaaland_2_8",
  "Request-Context": "appId=cid-v1:ab04ffb7-e8c7-4d4b-82ec-b39b59088297",
  "Request-Id": "|939dd7a1a5d34a6e8d847351180d316c.067f141fda9444ac",
  "Sec-Ch-Ua":
    '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": "Windows",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  Traceparent: "00-939dd7a1a5d34a6e8d847351180d316c-067f141fda9444ac-01",
};

export default function () {
  var requests = [];
  csvData.forEach((item) => {
    if (isValidByteRange(item.vej_stykke_paavirket)) {
      //console.log(item.vej_stykke_paavirket);
      requests.push({
        method: "GET",
        url: baseUrl + vej_stykke_paavirket,
        params: {
          cookies: {},
          headers: Object.assign({}, commonHeaders, {
            Range: item.vej_stykke_paavirket,
          }),
          //set timeout
          timeout: timeout, 
        },
      });
    }

    if (isValidByteRange(item.bygning_paavirket)) {
      //console.log(item.bygning_paavirket);
      requests.push({
        method: "GET",
        url: baseUrl + bygning_paavirket,
        params: {
          cookies: {},
          headers: Object.assign({}, commonHeaders, {
            Range: item.bygning_paavirket,
          }),
        },
      });
    }
  });

  const responses = http.batch(requests);

  responses.forEach((res, index) => {
    // Exit if failed
    //console.log(res.headers["X-Cache"] == 'TCP_HIT' );
    if (res.status !== 206 || res.headers["X-Cache"] != 'TCP_HIT') {
      console.log("---------------");      
      console.error(
        `
        Response status: ${JSON.stringify(res.status)}
        Response headers: ${JSON.stringify(res.headers["X-Cache"])}
        Response size :  ${JSON.stringify(res.size)}
        Response :  ${JSON.stringify(res.body.length)}

        `
      );
    }
    //console.log(`${res.headers["X-Cache"]}`)
  });

  //const endTime = new Date();
  //const duration = endTime - startTime;
  //console.log(`Transaction took ${duration} ms`);
  sleep(3)
}

function isValidByteRange(str) {
  const regex = /^(bytes=\d+-\d+)|(\d+-\d+\/\d+)$/;
  return regex.test(str);
}

function getRandomNumber() {
  const randomNumber = Math.floor(Math.random() * 20);
  const formattedNumber =
    randomNumber < 10 ? "0" + randomNumber : String(randomNumber);
  return formattedNumber;
}