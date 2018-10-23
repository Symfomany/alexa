/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require("ask-sdk-core");
const datas = require("./datas.json");
const natural = require("natural");
const naturalTwo = require("natural");
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
        Deviner les extraits de chaque film et remporter un maximum de point! <break time='400ms'/> Combien de joueur pour cette partie?
        <break time='200ms'/> 
    </speak>`;

    respeechText = `
    <speak>
       Je n'ai pas bien compris... Combien de joueur voulez-vous à cette partie? <break time='200ms'/> 
    </speak>`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(respeechText)
      .getResponse();
  }
};

const NbIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.intent.name === "NbIntent";
  },
  handle(handlerInput) {
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const number = parseInt(slots["nbjoueurs"].value);

    const movies = datas.movies;
    const Ids = movies
      .map((elt, index) => index)
      .sort((a, b) => 0.5 - Math.random())
      .slice(0, number * 5);

    const attributesManager = handlerInput.attributesManager;
    let sessionAttributes = attributesManager.getSessionAttributes();

    /**
     * Init Session with:
     * 1 - Array of Ids limited by Nb(t) * Nb(p)
     * 2 - Points of Levels
     * 3 - Laps (0)
     * 4 - HightScore
     * 5 - Winners
     */
    sessionAttributes.ids = Ids;
    sessionAttributes.levels = [10, 20, 30, 40, 50];
    sessionAttributes.winners = [];
    sessionAttributes.hightScore = 0;
    sessionAttributes.playing = 0;
    sessionAttributes.playingJoueur = 0;
    sessionAttributes.laps = 1;
    sessionAttributes.lapsTotal = 5;
    sessionAttributes.nbjoueurs = number;
    sessionAttributes.joueurs = Array(number).fill(0);

    attributesManager.setSessionAttributes(sessionAttributes);

    const extrait =
      movies[sessionAttributes.ids[sessionAttributes.playing]].sample;

    const speechText = `
    <speak>  <break time='500ms'/> 
      C'est partis pour ${number} joueurs ! Vous êtes prêt joueur 1 ?<break time='200ms'/> Alors on y va! <break time='500ms'/>
      <audio src="${extrait}"></audio>
    </speak>`;
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const DontKnowHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.intent.name === "DontKnowIntent"
    );
  },
  handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    let sessionAttributes = attributesManager.getSessionAttributes();
    const movies = datas.movies;

    const extrait =
      movies[sessionAttributes.ids[sessionAttributes.playing]].title;

    sessionAttributes.playing = parseInt(sessionAttributes.playing) + 1;

    const extraitTwo =
      movies[sessionAttributes.ids[sessionAttributes.playing]].sample;

    const speechText = `<speak> Ce n'est pas grave. le nom du film était ${extrait}. 
    Joueur ${sessionAttributes.playing + 1} c'est à vous <break time='200ms'/> 
      <audio src="${extraitTwo}"></audio> </speak>`;
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
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

    const extrait =
      movies[sessionAttributes.ids[sessionAttributes.playing]].sample;

    const speechText = `
    <speak>
      <audio src="${extrait}"></audio>
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

    const extrait =
      movies[sessionAttributes.ids[sessionAttributes.playing]].title;

    sessionAttributes.playing = parseInt(sessionAttributes.playing) + 1;

    const extraitTwo =
      movies[sessionAttributes.ids[sessionAttributes.playing]].sample;

    const speechText = `<speak> Dommage! Tu aurais pus au moins essayer! Le film c'était ${extrait}. Joueur ${sessionAttributes.playing +
      1} c'est à vous <break time='200ms'/> 
      <audio src="${extraitTwo}"></audio>
    </speak>`;
    return handlerInput.responseBuilder.speak(speechText).getResponse();
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
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const reponseJoueur = slots["reponseJoueur"].value;

    const attributesManager = handlerInput.attributesManager;
    let sessionAttributes = attributesManager.getSessionAttributes();
    const movies = datas.movies;

    const extrait =
      movies[sessionAttributes.ids[sessionAttributes.playing]].title;

    if (sessionAttributes.playingJoueur >= sessionAttributes.nbjoueurs - 1) {
      sessionAttributes.playingJoueur = 0;
      sessionAttributes.laps = sessionAttributes.laps + 1;
    }

    verifyString = (voice, response) => {
      const metaphone = natural.Metaphone;
      const similarity = naturalTwo.DiceCoefficient(
        voice.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ""),
        response.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, "")
      );
      return (
        metaphone.compare(voice.toLowerCase(), response.toLowerCase()) ||
        similarity >= 0.6
      );
    };

    let speechText = "";

    if (verifyString(reponseJoueur, extrait)) {
      sessionAttributes.joueurs[sessionAttributes.playingJoueur] =
        parseInt(sessionAttributes.joueurs[sessionAttributes.playingJoueur]) +
        sessionAttributes.levels[sessionAttributes.laps - 1];

      speechText = `<speak>Répondu: ${reponseJoueur}. 
    Bravo, c'est exact ! Vous rapportez ${
      sessionAttributes.levels[sessionAttributes.laps - 1]
    } points, ce qui vous fait un total de ${
        sessionAttributes.joueurs[sessionAttributes.playingJoueur]
      } points.<break time='200ms'/> `;
    } else {
      speechText = `<speak>Répondu: ${reponseJoueur}. 
      Non, ce n'est pas ça du tout! <break time='200ms'/> Le film était ${extrait}. <break time='200ms'/>
      Tu restes à ${
        sessionAttributes.joueurs[sessionAttributes.playingJoueur]
      } points.<break time='200ms'/> `;
    }

    if (sessionAttributes.laps <= sessionAttributes.lapsTotal) {
      //not sure
      sessionAttributes.playing = parseInt(sessionAttributes.playing) + 1;
      sessionAttributes.playingJoueur =
        parseInt(sessionAttributes.playingJoueur) + 1;

      const extraitTwo =
        movies[sessionAttributes.ids[sessionAttributes.playing]].sample;

      speechText += `Joueur ${sessionAttributes.playingJoueur +
        1} c'est à vous <break time='200ms'/> 
      <audio src="${extraitTwo}"></audio> </speak>`;
    } else {
      speechText += `C'est terminé!<break time='200ms'/>   Voici les scores:</speak>`;
    }

    // response
    if (sessionAttributes.laps <= sessionAttributes.lapsTotal) {
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .getResponse();
    } else {
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
    const speechText = "You can say hello to me!";

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
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
    const speechText = "A bientôt pour plus de films!";

    return handlerInput.responseBuilder.speak(speechText).getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "SessionEndedRequest";
  },
  handle(handlerInput) {
    console.log(
      `Session a terminée à cause de: ${
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
        "Oups!<break time='300ms'/> J'ai rencontré un problème... tu peux me relancer?"
      )
      .reprompt(
        "Oups!<break time='300ms'/> J'ai rencontré un problème... tu peux me relancer?"
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
    DontKnowHandler,
    NextHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
