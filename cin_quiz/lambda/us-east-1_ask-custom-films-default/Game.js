const env = process.env.NODE_ENV === "dev";

const datasMovies = require("./datas.json");
const natural = require("natural");
const naturalTwo = require("natural");

/**
 * Class Game
 */
class Game {
  /**
   * @param {*} nbJoueur
   */
  constructor(nbJoueurs = 3, nbTour = 5) {
    if (nbJoueurs < 1 || nbJoueurs > 6 || isNaN(nbJoueurs)) {
      throw `Nb de joueurs doit être un nombre compris entre 1 et 6`;
    } else if (nbTour === 0) {
      throw `Le nombre de tour doit être un nombre > 0`;
    }

    this.levels = [10, 20, 30, 40, 50]; // it's depends numbers of laps
    this.nbJoueurs = nbJoueurs;
    this.joueurs = Array(nbJoueurs).fill(0);

    this.nbTour = this.levels.length;
    this.nbIterations = this.nbJoueurs * this.nbTour;

    this.hightScore = 0;
    this.winners = []; // (The) Winner(s)

    this.randomsInteger = []; // 2 dimensions arrays
    this.randomsItems = []; // flatten map
  }

  /**
   * Playing game
   */
  play() {
    this.mapExtracts();
  }

  /**
   * Fill party
   * @param {*} possibilities
   */
  fillParty(possibilities) {
    // Hypothèse:  Nb de sons  >  tours * nbJoueurs
    if (this.nbIterations < possibilities) {
      return Array.from(new Array(possibilities), (val, index) => index + 1)
        .sort((a, b) => 0.5 - Math.random())
        .reduce(
          (chunks, el, i) =>
            (i % this.nbJoueurs
              ? chunks[chunks.length - 1].push(el)
              : chunks.push([el])) && chunks,
          []
        )
        .slice(0, this.nbTour);
    } else {
      // random in array
      return new Array(this.nbIterations)
        .fill(0)
        .map(elt => Math.floor(Math.random() * Math.floor(possibilities)))
        .reduce(
          (chunks, el, i) =>
            (i % this.nbJoueurs
              ? chunks[chunks.length - 1].push(el)
              : chunks.push([el])) && chunks,
          []
        )
        .slice(0, this.nbTour);
    }
  }

  /**
   * Similar strings
   * Sørensen–Dice coefficient: https://en.wikipedia.org/wiki/S%C3%B8rensen%E2%80%93Dice_coefficient
   * Verify accent, specials chars, upper string, phoenetics...
   * @param {*} voice
   * @param {*} response
   */
  verifyString(voice, response) {
    const metaphone = natural.Metaphone;
    const similarity = naturalTwo.DiceCoefficient(
      voice.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ""),
      response.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, "")
    );
    env ? console.log(`Similarity: ${similarity}`.bgGreen) : null;

    return (
      metaphone.compare(voice.toLowerCase(), response.toLowerCase()) ||
      similarity >= 0.6
    );
  }

  /**
   * Fill dismissed values
   */
  verifyFill() {
    let lastElt = this.randomsInteger.slice(-1)[0];
    const nbRest = this.nbJoueurs - lastElt.length;
    if (nbRest > 0) {
      for (let i = 0; i < nbRest; i++) {
        lastElt.push(this.randomsInteger[i][0]);
      }
    }
  }

  /**
   * Get Random all Extracts for players
   */
  mapExtracts() {
    this.randomsInteger = this.fillParty(datasMovies.movies.length - 1);

    for (let i = 0; i < this.nbTour; i++) {
      for (let j = 0; j < this.nbJoueurs; j++) {
        this.randomsItems.push({
          id: datasMovies.movies[this.randomsInteger[i][j]].id,
          title: datasMovies.movies[this.randomsInteger[i][j]].title,
          sample: datasMovies.movies[this.randomsInteger[i][j]].sample,
          joueur: j,
          tour: i
        });
      }
    }
    return this.randomsInteger;
  }

  // go(randomItems = this.randomsItems) {
  //   // console.clear();

  //   console.log(
  //     `Nb iterations ${randomItems.length} extraits à découvrir`.bgBlack
  //   );
  //   const rl = readline.createInterface({
  //     input: process.stdin,
  //     output: process.stdout
  //   });

  //   let compteur = 0;

  //   // Asynchonize operations for several questions & answers
  //   const main = async () => {
  //     for (let i = 0; i < this.nbTour; i++) {
  //       env ? console.log(`Tours ${i + 1}`.bgMagenta) : null;
  //       for (let j = 0; j < this.nbJoueurs; j++) {
  //         env ? console.log(`Joueur ${j + 1} c'est à vous...😀`.green) : null;

  //         // aync/await for Promise...
  //         const question1 = () => {
  //           return new Promise((resolve, reject) => {
  //             rl.question(
  //               `Quel Film? (${randomItems[compteur].title} ?) `,
  //               answer => {
  //                 env
  //                   ? console.log(
  //                       `👉🏻Votre réponse: ${answer} -  La réponse: ${
  //                         randomItems[compteur].title
  //                       }`.bgWhite
  //                     )
  //                   : null;
  //                 if (this.verifyString(answer, randomItems[compteur].title)) {
  //                   env
  //                     ? console.log(
  //                         `👏 Good, vous avez gagné ${this.levels[i]} 😃 !! `
  //                           .bgCyan
  //                       )
  //                     : null;
  //                   this.joueurs[j] += this.levels[i];
  //                   env ? console.log(this.joueurs[j]) : null;
  //                 } else {
  //                   env ? console.log(`👎 Vous avez perdu.. 😭 `.bgRed) : null;
  //                 }

  //                 env
  //                   ? console.log(
  //                       `🔥🔥🔥 Votre score est de: ${this.joueurs[j]} 🔥🔥🔥`
  //                         .bgYellow
  //                     )
  //                   : null;
  //                 env ? console.log(this.joueurs) : null;
  //                 compteur++;
  //                 resolve(); // Resolve a promise to next player
  //               }
  //             );
  //           });
  //         };

  //         await question1();
  //       }
  //     }

  //     rl.close();

  //     console.log(`Fin de la partie...`.cyan);

  //     return this.getWinner();
  //   };

  //   main();

  //   return true;
  // }

  goWithTest(randomItems = this.randomsItems) {
    env
      ? console.log(
          `Nb iterations ${randomItems.length} extraits à découvrir`.bgBlack
        )
      : null;

    let compteur = 0;

    for (let i = 0; i < this.nbTour; i++) {
      env
        ? console.log(
            "**********************************************************************************"
          )
        : null;
      env ? console.log(`Tours ${i + 1}`.bgMagenta) : null;

      for (let j = 0; j < this.nbJoueurs; j++) {
        env ? console.log("\n") : null;
        env ? console.log(`Joueur ${j + 1} c'est à vous...😀`.green) : null;

        let answer = randomItems[compteur].answer;
        env
          ? console.log(
              `Personne: ${answer} \n Réponse: ${randomItems[compteur].title}`
                .rainbow
            )
          : null;

        if (this.verifyString(answer, randomItems[compteur].title)) {
          env
            ? console.log(
                `👏 Good, vous avez gagné ${this.levels[i]} 😃 !! `.bgCyan
              )
            : null;
          this.joueurs[j] += this.levels[i];
        } else {
          env ? console.log(`👎 Vous avez perdu.. 😭 `.bgRed) : null;
        }

        env
          ? console.log(
              `🔥🔥🔥 Votre score est de: ${this.joueurs[j]} 🔥🔥🔥`.bgYellow
            )
          : null;
        compteur++;
      }
    }

    console.log(`Fin de la partie...`.cyan);

    return this.getWinner();
  }

  /**
   * Return the winner of the part
   */
  getWinner() {
    env ? console.log(`\n\n\n`) : null;
    console.log(
      "***************************************** Bilan *****************************************"
    );
    // find exequo
    this.hightScore = Math.max(...this.joueurs);
    console.log(`Tableau des scores ${this.joueurs.join(",")}`.green);
    console.log(`Highest score ${this.hightScore}`.italic);

    this.winners = this.joueurs
      .map((elt, index) => {
        return { score: elt, position: index + 1 };
      })
      .filter(el => el.score === this.hightScore);

    if (this.winners.length > 1) {
      console.log(
        `Les gagnants de cette partie sont les joueurs : ${this.winners
          .map(elt => elt.position)
          .join(",")}`.underline.bold
      );
    } else {
      console.log(
        `Le gagnant de cette partie est le joueur : ${this.winners[0].position}`
          .bgMagenta
      );
    }
  }
}

module.exports = Game;
