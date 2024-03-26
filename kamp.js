import http from "k6/http";
import { SharedArray } from "k6/data";
import papaparse from "https://jslib.k6.io/papaparse/5.1.1/index.js";
import { sleep } from "k6";

//const filePath = `./Data/KAMP_${getRandomNumber()}.csv`;
const filePath = `./Data/KAMP_01.csv`;

// Those params for environment setting
const evn = 'test.'
const baseUrl = `https://kamp.${evn}klimatilpasning.dk/data/flatgeobuf/2024/`;
const vej_stykke_paavirket = "vej_stykke_paavirket.fgb";
const bygning_paavirket = "bygning_paavirket.fgb";
const timeout = '30m';
const thinktime = '15s';
const maxUser = 400;
const duration_rampUp = '10m',duration_rampDown = '10m',duration = '10m';
//const maxUser = 1;
//const duration_rampUp = '1ms',duration_rampDown = '1ms',duration = '1ms';

// This param should be update base on relase version

const commonHeaders = {
  //"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Cache-Control": "no-cache, no-store",
  Referer: `https://kamp.${evn}klimatilpasning.dk/frahavet/havvandpaaland?value=havvandpaaland_4_9`,
  "Request-Context": "appId=cid-v1:ab04ffb7-e8c7-4d4b-82ec-b39b59088297",
  "Request-Id": "|f64b6d00c81a4df589d004826523f7bb.a6621cce5d994a56",
  "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": "Windows",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  Traceparent: "00-f64b6d00c81a4df589d004826523f7bb-a6621cce5d994a56-01",
};



export const options = {
  stages: [
    // Warm-up stage: ramp up to 100 virtual users over 1 minute
    { duration: duration_rampUp, target: maxUser },
    
    // Sustained load stage: maintain 100 virtual users for 5 minutes
    { duration: duration, target: maxUser },
    
    // Ramp-down stage: gradually decrease the number of virtual users to 0 over 1 minute
    { duration: duration_rampDown, target: 0 },
  ],
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
          //set timeout
          timeout: timeout, 
        },
      });
    }
  });
  // Those params for Debug ONLY
  //const startTime = new Date(); 
  // Those params for Debug ONLY
  const responses = http.batch(requests);

  responses.forEach((res, index) => {
    if (res.status !== 206 || res.headers["X-Cache"] != 'TCP_HIT'
    || res.body.length < 100) {      
      console.error(
        `
        ------------------------------
        Response status: ${JSON.stringify(res.status)}
        Response headers: ${JSON.stringify(res.headers["X-Cache"])}
        Response size :  ${JSON.stringify(res.size)}        
        ------------------------------
        `
      );
    }
    
   });
  // Those params for Debug ONLY
  // const endTime = new Date();
  // const duration = endTime - startTime;
  // console.log(`Transaction took ${duration} ms`);
  // Those params for Debug ONLY


  sleep(thinktime)
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
const csvData = new SharedArray("ListRange", function () {
  return papaparse.parse(open(filePath), {
    header: true,
  }).data;
});