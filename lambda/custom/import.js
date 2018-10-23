const csvtojsonV2 = require("csvtojson/v2");
const csvFilePath = "./import.csv";

csvtojsonV2()
  .fromFile(csvFilePath)
  .then(jsonObj => {
    const tab = jsonObj.map((elt, index) => {
      return {
        id: index + 1,
        title: elt.title,
        level: 2,
        sample: `https://s3.eu-west-3.amazonaws.com/musicdefilms/${elt.title
          .toLowerCase()
          .replace(/\s/g, "")}_1.mp3`
      };
    });
    console.log(tab);
  });
