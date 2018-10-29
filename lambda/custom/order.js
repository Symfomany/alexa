"use strict";
const fs = require("fs");

const csvFilePath = require("./datas.json");

const tab = csvFilePath.movies.map((element, key) => {
  return {
    id: key + 1,
    title: element.title.toLowerCase(),
    sample: element.sample
  };
});

console.log(tab);

let data = JSON.stringify(tab);
fs.writeFileSync("datas.json", data);
