const csvFilePath = require("./datas.json");

// all items title
const shuffleArray = csvFilePath.movies.map(({ title }) => title);
const uniqMovies = [...new Set(shuffleArray)];

console.log(uniqMovies);
