"use strict";

const { dialogflow } = require("actions-on-google");
const functions = require("firebase-functions");
const datas = require("./datas.json");
const natural = require("natural");
const naturalTwo = require("natural");
const app = dialogflow();

/**
 * Get Extract
 * @param {*} movies
 * @param {*} sessionAttributes
 */
const getExtrait = (movies, sessionAttributes) =>
  movies[sessionAttributes.ids[sessionAttributes.playing]];

/**
 * Uniq Movies
 * @param {*} movies
 * @param {*} limit
 */
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

const speakAudio = extrait => `<audio src="${extrait.sample}"></audio>`;

const verifyString = (voice, response) => {
  // const metaphone = natural.Metaphone;
  const reg = /[^a-zA-Z0-9áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ._-\s ]/g;
  const voicex = voice.toLowerCase().replace(reg, "");
  const responsex = response.toLowerCase().replace(reg, "");

  const similarity = naturalTwo.DiceCoefficient(voicex, responsex);
  return voicex === responsex || similarity >= 0.8;
};

/**
 * Init Session for Game
 * Return Session Attributes
 */
const initGame = (sessionAttributes, number = 3) => {
  const movies = datas.movies;

  // all index of ID
  const Ids = IdsUniqByMovies(movies, number * 5);

  /**
   * Init Session with:
   * 1 - Array of Ids limited by Nb(t) * Nb(p)
   * 2 - Points of Levels
   * 3 - Laps (0)
   * 4 - HightScore
   * 5 - Winners
   */
  sessionAttributes.levels = [10, 20, 30, 40, 50];
  sessionAttributes.winners = [];
  sessionAttributes.hightScore = 0;
  sessionAttributes.playing = 0;
  sessionAttributes.playingJoueur = 0;
  sessionAttributes.laps = 1;
  sessionAttributes.lapsTotal = 5;
  sessionAttributes.nbjoueurs = number;
  sessionAttributes.joueurs = Array(number).fill(0);
  sessionAttributes.ids = Ids;

  return sessionAttributes;
};

app.intent("Default Welcome Intent", conv => {
  return conv.ask(
    `<speak>Bienvenue sur Le grand quiz de films les plus connus! <break time="1s"/>. Combien de joueurs pour cette partie?</speak>`
  );
});

app.intent("Default Fallback Intent", conv => {
  return conv.ask(`<speak>J'ai  pas bien compris, tu peux répéter?</speak>`);
});

app.intent("NbJoueursIntent", (conv, { nbjoueurs }) => {
  const number = parseInt(nbjoueurs);
  const movies = datas.movies;

  if (conv.data.laps) {
    const speechText = `
    <speak>
       Je n'ai pas bien compris... <break time='200ms'/>  Peux-tu répéter la réponse? <break time='200ms'/> 
    </speak>`;

    return conv.ask(speechText);
  }

  if (number < 1 || number > 4) {
    const speechText = `
        <speak> 
            Le nombre de  joueurs doit être compris entre 1 et 4.
            Combien de joueur dans cette partie?
        </speak>`;

    return conv.ask(speechText);
  }

  const sessionAttributes = initGame(conv.data, nbjoueurs);
  const extrait = getExtrait(movies, sessionAttributes);

  const speechText = `
  <speak> <break time='500ms'/> 
    C'est partis pour ${number}! Vous êtes prêt joueur 1 ?<break time='200ms'/> Alors on y va! <break time='300ms'/>  Premier extrait pour 10 points <break time='500ms'/>
    ${speakAudio(extrait)}
  </speak>`;

  // extract the num parameter as a local string variable
  return conv.ask(speechText);
});

/**
 * Response User
 */
app.intent("ResponsetIntent", (conv, { reponseJoueur }) => {
  // extract the num parameter as a local string variable

  let speechText = "<speak>";

  const movies = datas.movies;
  let sessionAttributes = conv.data;

  // get the current extract (playing is the current cursor of playing game)
  const extrait = getExtrait(movies, sessionAttributes);

  // If the response is ok
  if (verifyString(reponseJoueur, extrait.title)) {
    //     // Increase his score by levels
    sessionAttributes.joueurs[sessionAttributes.playingJoueur] =
      parseInt(sessionAttributes.joueurs[sessionAttributes.playingJoueur]) +
      sessionAttributes.levels[sessionAttributes.laps - 1];

    speechText += ` Bravo, c'est exact. Vous rapportez ${
      sessionAttributes.levels[sessionAttributes.laps - 1]
    } points, ce qui vous fait un total de ${
      sessionAttributes.joueurs[sessionAttributes.playingJoueur]
    } points.<break time='300ms'/> `;
  } else {
    speechText += `
        C'est faux! <break time='200ms'/> Le film était ${
          extrait.title
        }. <break time='200ms'/>
        Tu restes à ${
          sessionAttributes.joueurs[sessionAttributes.playingJoueur]
        } points. <break time='300ms'/> `;
  }

  // reset the current players, remake a lap
  if (sessionAttributes.playingJoueur == sessionAttributes.nbjoueurs - 1) {
    sessionAttributes.playingJoueur = 0; // reset in ZERO (eg: 0-1-2)
    sessionAttributes.laps = sessionAttributes.laps + 1; //inscrease the laps
  } else {
    // next player to game
    sessionAttributes.playingJoueur =
      parseInt(sessionAttributes.playingJoueur) + 1;
  }

  // if laps is not over total of laps (it's not finish...)
  if (sessionAttributes.laps <= sessionAttributes.lapsTotal) {
    // increase the cursor for playing the next extract
    sessionAttributes.playing = parseInt(sessionAttributes.playing) + 1;

    // next extract for next player
    const extraitTwo = getExtrait(movies, sessionAttributes);

    speechText += `Joueur ${sessionAttributes.playingJoueur +
      1} c'est à vous pour ${
      sessionAttributes.levels[sessionAttributes.laps - 1]
    } points. <break time='200ms'/>
        ${speakAudio(extraitTwo)} </speak>`;

    return conv.ask(speechText);
  } else {
    // if it's over the laps
    speechText += ` <break time='500ms'/> C'est terminé! <break time='200ms'/> Voici les scores. <break time='600ms'/>`;

    sessionAttributes.joueurs.forEach((element, index) => {
      speechText += `Joueur ${index +
        1} : ${element} points. <break time='400ms'/>`;
    });

    speechText += `<break time='500ms'/>`;
    sessionAttributes.joueurs = sessionAttributes.joueurs
      .map((elt, index) => {
        return { score: elt, position: index + 1 };
      })
      .sort((a, b) => b.score - a.score);

    // hight score
    sessionAttributes.hightScore = sessionAttributes.joueurs[0].score;

    sessionAttributes.winners = sessionAttributes.joueurs.filter(
      el => el.score === sessionAttributes.hightScore
    );

    // get winners
    if (sessionAttributes.winners.length > 1) {
      speechText += `Les gagnants ex aequo à cette partie sont les joueurs  ${sessionAttributes.winners
        .map(elt => elt.position)
        .join("<break time='200ms'/>  ")}.`;
    } else {
      speechText += `Le grand gagnant de cette partie avec ${
        sessionAttributes.hightScore
      } points est le joueur ${sessionAttributes.winners[0].position}.`;
    }
    speechText +=
      "<break time='500ms'/> Merci pour cette belle partie et à bientôt sur Quizz de Film.<break time='200ms'/> n'oubliez pas de mettre une petite note de notre application sur Google Assistant  Store. A bientôt!</speak>";
  }

  return conv.ask(speechText);
});

app.intent("RepeatIntent", (conv, { reponseJoueur }) => {
  const movies = datas.movies;

  const extrait = getExtrait(movies, sessionAttributes);

  const speechText = `
      <speak>
        ${speakAudio(extrait)}
      </speak>`;

  return conv.ask(speechText);
});

app.intent("HelpIntent", conv => {
  return conv.ask(
    `<speak> 
          Voici de l'aide
      </speak>`
  );
});

exports.app = functions.https.onRequest(app);
