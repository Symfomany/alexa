const csvFilePath = require("./datas.json");

const IdsUniqByMovies = (movies, limit = 5) => {
  // results pushed
  let pusheded = [];

  // all items shuffled
  const shuffleArrayItems = movies.sort(() => Math.random() - 0.5);

  // all items title
  const shuffleArray = shuffleArrayItems.map(({ title }) => title);

  // uniq shuffled movies
  const uniqMovies = [...new Set(shuffleArray)];

  // last uniq shuffled movies
  const lastMovies = uniqMovies.slice(0, limit);

  // grouped by title for selected  right movies
  let groupByMoviesItems = movies.reduce(
    (h, a) => Object.assign(h, { [a.title]: (h[a.title] || []).concat(a) }),
    {}
  );

  // // we loop all group of movies
  for (let elt in groupByMoviesItems) {
    if (lastMovies.includes(elt)) {
      pusheded.push(groupByMoviesItems[elt]);
    }
  }

  return pusheded.map(
    (elt, key) => elt[Math.floor(Math.random() * elt.length)].id
  );
};

console.log(IdsUniqByMovies(csvFilePath.movies, 15));
