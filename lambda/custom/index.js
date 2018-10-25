/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require("ask-sdk-core");
const datas = require("./datas.json");
const natural = require("natural");
const naturalTwo = require("natural");

/**
 * Get Extrait of Movies
 * @param {*} movies
 * @param {*} sessionAttributes
 */
const getExtrait = (movies, sessionAttributes) =>
  movies[sessionAttributes.ids[sessionAttributes.playing]];

/**
 * Verify between Voice input and Response of Title
 * 1 - Phoenetic
 * 2 - Similarité (https://fr.wikipedia.org/wiki/Indice_de_S%C3%B8rensen-Dice)
 * http://igm.univ-mlv.fr/ens/Master/M2/2007-2008/TAL/cours/mstal-1-3-m2.pdf
 */
verifyString = (voice, response) => {
  const metaphone = natural.Metaphone;
  const similarity = naturalTwo.DiceCoefficient(
    voice.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ""),
    response.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, "")
  );
  return (
    metaphone.compare(voice.toLowerCase(), response.toLowerCase()) ||
    similarity >= 0.7
  );
};

/**
 * Init Session for Game
 * Return Session Attributes
 */
const initGame = (attributesManager, number = 3) => {
  const movies = datas.movies;

  let sessionAttributes = attributesManager.getSessionAttributes();

  // all index of
  const Ids = movies
    .map((elt, index) => index)
    .sort((a, b) => 0.5 - Math.random())
    .slice(0, number * 5);

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
  sessionAttributes.lapsTotal = 3;
  sessionAttributes.nbjoueurs = number;
  sessionAttributes.joueurs = Array(number).fill(0);
  sessionAttributes.ids = Ids;

  attributesManager.setSessionAttributes(sessionAttributes);

  return sessionAttributes;
};

/****************************
 ***************************************** All Handler to response Intents ***************************************************************
 *****************************/

/**
 * Documentation :
 * https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs/blob/2.0.x/ask-sdk-core/lib/response/ResponseBuilder.ts
 */
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "LaunchRequest";
  },
  handle(handlerInput) {
    const speechText = `
    <speak>
        Bienvenue sur le grand Quizz des Films! <break time='200ms'/> 
        Devines les extraits de films, et remportes un maximum de points pour gagner la partie! <break time='400ms'/> Combien de joueurs pour cette partie?
        <break time='200ms'/> 
    </speak>`;

    respeechText = `
    <speak>
       Je n'ai pas bien compris... <break time='200ms'/>  Combien de joueur voulez-vous à cette partie? <break time='200ms'/> 
    </speak>`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(respeechText)
      .getResponse();
  }
};

/**
 * Nb Intent
 */
const NbIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.intent.name === "NbIntent";
  },
  handle(handlerInput) {
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const number = parseInt(slots["nbjoueurs"].value);
    const movies = datas.movies;

    let sessionAttributes = initGame(handlerInput.attributesManager, number);

    const extrait = getExtrait(movies, sessionAttributes);

    const speechText = `
    <speak>  <break time='500ms'/> 
      C'est partis ! Vous êtes prêt joueur 1 ?<break time='200ms'/> Alors on y va! <break time='300ms'/>  Premier extrait pour 10 points <break time='500ms'/>
      <audio src="${extrait.sample}"></audio>
    </speak>`;

    const respeechText = `
    <speak>  Joueur 1, premier extrait pour 10 points <break time='500ms'/>
      <audio src="${extrait.sample}"></audio>
    </speak>`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(respeechText)
      .getResponse();
  }
};

const RepeatHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.RepeatIntent"
    );
  },
  handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    let sessionAttributes = attributesManager.getSessionAttributes();
    const movies = datas.movies;

    const extrait = getExtrait(movies, sessionAttributes);

    const speechText = `
    <speak>
      <audio src="${extrait.sample}"></audio>
    </speak>`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const NextHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.NextIntent"
    );
  },
  handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    let sessionAttributes = attributesManager.getSessionAttributes();
    const movies = datas.movies;

    let speechText = "<speak>";
    const extrait = getExtrait(movies, sessionAttributes);

    //control current playing
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

      speechText += `Dommage. <break time='200ms'/> Cela te coûte rien d'essayer!<break time='200ms'/>
      Le film c'était ${
        extrait.title
      }. Joueur ${sessionAttributes.playingJoueur + 1} c'est à vous pour ${
        sessionAttributes.levels[sessionAttributes.laps - 1]
      } points. <break time='200ms'/> 
        <audio src="${extraitTwo.sample}"></audio> </speak>`;

      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .getResponse();
    } else {
      // if it's over the laps
      speechText += ` <break time='500ms'/> C'est terminé!<break time='200ms'/>   Voici les scores. <break time='600ms'/>`;

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
        "<break time='500ms'/>Merci pour cette belle partie et à bientôt sur Quizz de Film.<break time='200ms'/> n'oubliez pas de mettre une petite note de notre application sur Google Assistant Store. A bientôt!</speak>";

      return handlerInput.responseBuilder.speak(speechText).getResponse();
    }
  }
};

/**
 * Reponse of Players
 */
const ReponseJoueurHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.intent.name === "ReponseJoueurIntent"
    );
  },
  handle(handlerInput) {
    let speechText = "<speak>";

    const attributesManager = handlerInput.attributesManager;
    let sessionAttributes = attributesManager.getSessionAttributes();

    // get the respon se of the user
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const reponseJoueur = slots["reponseJoueur"].value;

    const movies = datas.movies;

    // get the current extract (playing is the current cursor of playing game)
    const extrait = getExtrait(movies, sessionAttributes);

    // If the response is ok
    if (verifyString(reponseJoueur, extrait.title)) {
      // Increase his score by levels
      sessionAttributes.joueurs[sessionAttributes.playingJoueur] =
        parseInt(sessionAttributes.joueurs[sessionAttributes.playingJoueur]) +
        sessionAttributes.levels[sessionAttributes.laps - 1];

      speechText += `
        Bravo, c'est exact !. Vous rapportez ${
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
      } points.<break time='300ms'/> `;
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
      <audio src="${extraitTwo.sample}"></audio> </speak>`;

      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .getResponse();
    } else {
      // if it's over the laps
      speechText += ` <break time='500ms'/> C'est terminé!<break time='200ms'/>   Voici les scores. <break time='600ms'/>`;

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
        "<break time='500ms'/>Merci pour cette belle partie et à bientôt sur Quizz de Film.<break time='200ms'/> n'oubliez pas de mettre une petite note de notre application sur Google Assistant Store. A bientôt!</speak>";

      return handlerInput.responseBuilder.speak(speechText).getResponse();
    }
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    let sessionAttributes = attributesManager.getSessionAttributes();
    const movies = datas.movies;

    const extrait = getExtrait(movies, sessionAttributes);

    const speechText = `Ma première lettre est un ${
      extrait.title[0]
    },  <break time='200ms'/> 
    Ma dernière lettre est un ${
      extrait.title[extrait.title.length - 1]
    }  <break time='200ms'/> , 
    le tout fait ${extrait.title.length} lettres.`;

    const respeechText = `Je répète l'incide. <break time='400ms'/> ${speechText}`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(respeechText)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      (handlerInput.requestEnvelope.request.intent.name ===
        "AMAZON.CancelIntent" ||
        handlerInput.requestEnvelope.request.intent.name ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    const speechText = "Merci d'avoir jouer avec Quizz de Films et à bientôt!";

    return handlerInput.responseBuilder.speak(speechText).getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "SessionEndedRequest";
  },
  handle(handlerInput) {
    console.log(
      `Votre Session de jeu a terminée. Veillez relancer l'application. ${
        handlerInput.requestEnvelope.request.reason
      }`
    );

    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak(
        "Oups!<break time='300ms'/> j'ai rencontré un problème...<break time='300ms'/> Tu peux répéter ta dernière intention?"
      )
      .reprompt(
        "Oups!<break time='300ms'/> j'ai rencontré un problème...<break time='300ms'/> Tu peux répéter ta dernière intention?"
      )
      .getResponse();
  }
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    HelpIntentHandler,
    NbIntentHandler,
    ReponseJoueurHandler,
    RepeatHandler,
    NextHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
