### Refactorisation et Optimisation

!! Quand cela plante 'Quelle étit votre dernière intention ?' !!

Autour des Handler qui gere les Intentions:

Classe GameHandler gérant

- Une fonction qui prends speechText, respeechText,
- Une fonction boot qui demare l'initialisation + lancement du jeu
- Une fonction initialisation de la Session
- Une fonction next() qui controle le curseur, controle le laps, control le joueur existant
- Une fonction qui dit si cela est terminé ou pas en fonction du nb de tours total
- Une fonction de comparaisons de chaine
- Une fonction bilan pour donner le gagnant
- Une fonction qui en fonction de la position retourn l'objet movie
- Une fonction qui joue emit de play la partie
- Voulez vous rejouer le game: slot(query) relance de boot()

##################################################################################################################################################################

Tips

APIS in Services Alexa

https://ask-sdk-for-nodejs.readthedocs.io/en/latest/Calling-Alexa-Service-APIs.html

# Request Attributes

https://ask-sdk-for-nodejs.readthedocs.io/en/latest/Processing-Request.html

```
const Alexa = require('ask-sdk-core');

const skill = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    FooHandler,
    BarHandler,
    BazHandler)
  .create();
```

# Building a Response

https://ask-sdk-for-nodejs.readthedocs.io/en/latest/Building-Response.html

# Alexa Image Helper

https://ask-sdk-for-nodejs.readthedocs.io/en/latest/Building-Response.html#image-and-text-helpers

```
const Alexa = require('ask-sdk-core');

const myImage = new Alexa.ImageHelper()
  .withDescription('FooDescription')
  .addImageInstance('http://BarImageSource')
  .getImage();
```

# Manage Attributes

DynamoDbPersistenceAdapter - DynamoDb Adapater

https://ask-sdk-for-nodejs.readthedocs.io/en/latest/Managing-Attributes.html

# DefaultApiClient

ask-sdk-core package provides a DefaultApiClient which is an implemenntation of ApiClient using the Node.js native https client.

```
    new DefaultApiClient() => object
```

https://developer.amazon.com/blogs/alexa/post/a9ef18b2-ef68-44d4-86eb-dbdb293853bb/alexa-skill-recipe-making-http-requests-to-get-data-from-an-external-api

```
    const request = require('request');

    'GetNumberFactIntent': function () {
        const theNumber = this.event.request.intent.slots.number.value;
        var myRequest = parseInt(theNumber);
        const url = `http://numbersapi.com/${theNumber}`;

        request.get(url, (error, response, body) => {
            // let json = JSON.parse(body);
            console.log('error:', error); // Print the error if one occurred
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            console.log('body:', body); // Print the body

            const theFact = body;
            const speechOutput = theFact;
            this.response.cardRenderer(SKILL_NAME, theFact);
            this.response.speak(speechOutput + " Would you like another fact?").listen("Would you like another fact?");
            this.emit(':responseReady');
        });
    }
```

# Adresse API

https://developer.amazon.com/docs/custom-skills/device-address-api.html

```
const GetAddressIntent = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;

    return request.type === 'IntentRequest' && request.intent.name === 'GetAddressIntent';
  },
  async handle(handlerInput) {
    const { requestEnvelope, serviceClientFactory, responseBuilder } = handlerInput;
    const consentToken = requestEnvelope.context.System.user.permissions
        && requestEnvelope.context.System.user.permissions.consentToken;
    if (!consentToken) {
      return responseBuilder
        .speak('Please enable Location permissions in the Amazon Alexa app.')
        .withAskForPermissionsConsentCard(['read::alexa:device:all:address'])
        .getResponse();
    }

    try {
      const { deviceId } = requestEnvelope.context.System.device;
      const deviceAddressServiceClient = serviceClientFactory.getDeviceAddressServiceClient();
      const address = await deviceAddressServiceClient.getFullAddress(deviceId);

      console.log('Address successfully retrieved, now responding to user.');

      let response;
      if (address.addressLine1 === null && address.stateOrRegion === null) {
        response = responseBuilder
          .speak(`It looks like you don't have an address set. You can set your address from the companion app.`)
          .getResponse();
      } else {
        const ADDRESS_MESSAGE = `Here is your full address: ${address.addressLine1}, ${address.stateOrRegion}, ${address.postalCode}`;
        response = responseBuilder
          .speak(ADDRESS_MESSAGE)
          .getResponse();
      }
      return response;
    } catch (error) {
      if (error.name !== 'ServiceError') {
        const response = responseBuilder
          .speak('Uh Oh. Looks like something went wrong.')
          .getResponse();

        return response;
      }
      throw error;
    }
  },
};
```

# Manage State of Application (State Management) at the top of the application

```
    // Status of list, either active or completed
    const STATUS = {
        ACTIVE: 'active',
        COMPLETED: 'completed',
    };
```

# Handler several intents

```
const SkillEventHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (request.type === 'AlexaSkillEvent.SkillEnabled' ||
      request.type === 'AlexaSkillEvent.SkillDisabled' ||
      request.type === 'AlexaSkillEvent.SkillPermissionAccepted' ||
      request.type === 'AlexaSkillEvent.SkillPermissionChanged' ||
      request.type === 'AlexaSkillEvent.SkillAccountLinked');
  },
```

# Handle several actions since intents triggered

```
handle(handlerInput) {
    const userId = handlerInput.requestEnvelope.context.System.user.userId;
    let acceptedPermissions;
    switch (handlerInput.requestEnvelope.request.type) {
      case 'AlexaSkillEvent.SkillEnabled':
        console.log(`skill was enabled for user: ${userId}`);
        break;
      case 'AlexaSkillEvent.SkillDisabled':
        console.log(`skill was disabled for user: ${userId}`);
        break;
      case 'AlexaSkillEvent.SkillPermissionAccepted':
        acceptedPermissions = JSON.stringify(handlerInput.requestEnvelope.request.body.acceptedPermissions);
        console.log(`skill permissions were accepted for user ${userId}. New permissions: ${acceptedPermissions}`);
        break;
      case 'AlexaSkillEvent.SkillPermissionChanged':
        acceptedPermissions = JSON.stringify(handlerInput.requestEnvelope.request.body.acceptedPermissions);
        console.log(`skill permissions were changed for user ${userId}. New permissions: ${acceptedPermissions}`);
        break;
      case 'AlexaSkillEvent.SkillAccountLinked':
        console.log(`skill account was linked for user ${userId}`);
        break;
      default:
        console.log(`unexpected request type: ${handlerInput.requestEnvelope.request.type}`);
    }
  },
```

# Async await to wait a operation with Promise and resolve

```
const ListEventHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (request.type === 'AlexaHouseholdListEvent.ListCreated' ||
      request.type === 'AlexaHouseholdListEvent.ListUpdated' ||
      request.type === 'AlexaHouseholdListEvent.ListDeleted');
  },
  async handle(handlerInput) {
    const listClient = handlerInput.serviceClientFactory.getListManagementServiceClient();
    const listId = handlerInput.requestEnvelope.request.body.listId;
    const status = STATUS.ACTIVE;

    if (handlerInput.requestEnvelope.request.type === 'AlexaHouseholdListEvent.ListDeleted') {
      console.log(`list ${listId} was deleted`);
    } else {
      const list = await listClient.getList(listId, status);
      switch (handlerInput.requestEnvelope.request.type) {
        case 'AlexaHouseholdListEvent.ListCreated':
          console.log(`list ${list.name} was created`);
          break;
        case 'AlexaHouseholdListEvent.ListUpdated':
          console.log(`list ${list.name} was updated`);
          break;
        default:
          console.log(`unexpected request type ${handlerInput.requestEnvelope.request.type}`);
      }
    }
  },
};
```

### Alexa Play features

https://github.com/alexa/alexa-cookbook/tree/master/feature-demos

### Intents

What I’ve just described are two intents for your skill. An intent is basically an event handler for a skill that can be triggered by the user saying a command that Alexa recognizes. If you’ve done any Android programming, the term intent will be very familiar to you and it applies the same way here.

“Alexa, open Hello World” will trigger your LaunchRequest intent. This is a pre-configured intent that you don’t have to wire-up when you configure your skill’s intents. There are a few other intents that are baked in such as AMAZON.HelpIntent, AMAZON.CancelIntent and AMAZON.StopIntent.

## Utterances

Continuing on our example of the “say” intent being triggered by the phrase “Alexa, ask Hello World to say hello”, the phrase triggering “say” is what Alexa calls an utterance and when you configure your intent, you map it to one or more utterances that will trigger it. You can add different permutations of this phrase to ensure that your users can trigger it casually as if they were talking to a real person.

## Slots

In the phrase “Alexa, ask Hello World to say hello” we could be doing two things — asking Alexa to give us a canned welcome greeting or asking it (her?) to literally say the word “hello”. Let’s go with the latter. A user-supplied parameter for an intent is called a slot and a slot within an utterance will be interpolated into the string. So instead of our utterance being “to say hello”, our utterance is “to say {message}” and it accepts a parameter that is mapped to the message slot.

### Tips interessants

```
    alexa.response.speak(output).listen(welcomeMessage);
    this.emit(':responseReady');
```

SSML Builder:
https://github.com/mandnyc/ssml-builder

Integration with DynamoDB
https://medium.com/@randika/how-to-create-an-alexa-skill-with-aws-lambda-and-dynamodb-59d3402a3e9

Store The State Management with Firebase
https://chariotsolutions.com/blog/post/alexa-node-sdk-firebase/

### Session-Level State Management

To better understand session-level state management, let's start with a definition of an Alexa session. The blue lights on your Alexa device are your friend! An Alexa session starts when the user invokes your skill, turning on the light ring. This is the request. Your skill will formulate a response which will then be spoken to the user.

With this response, you control what happens next. Your skill's response will include the shouldEndSession boolean parameter.

When set to true, the session ends with the delivery of the response, turning off the blue lights.

But if this parameter is false, you're indicating that Alexa should open the stream for another request following the delivery of the response. The blue light will be on, and your session remains active.

If the user doesn't respond, the reprompt that you specified will be delivered and the stream will remain open for one last chance at a new request.
If the user still doesn't respond, the stream will close and the session will end when the blue light turns off.

During this time while your skill's session is active, requests sent to Alexa are directed to the sandbox of your skill.
You'll notice that even utterances like "volume up" are directed to your skill. This is true until your session ends.

One exception to the above is the use of the AudioPlayer interface.

If your skill uses this interface, your skill session ends as soon as your skill sends a play directive.
Your skill may get reinvoked through one of the built-in intents for playback control or any other invocation pattern, but this results in a new skill session.

You can manage state within the context of your Alexa session using the session object.

LaunchRequest, IntentRequest, and SessionEndedRequest all include a session object in the JSON definition.

Any session-level data that you need to track can be sent with your response object in the sessionAttributes property as key/value pairs. They will be passed back to you with the next request object.

- UserId is automatically generated by the Alexa service when the user enables your skill. As a result, this value can be used to track the same user from one session to the next. However, if the user disables and re-enables your skill, they will appear to be a new user to you.

- AccessToken is returned to you only if your skill uses account linking (and the user has successfully linked your skill to their account).

# Session State vs. User State

If you have a simple multi-turn game, you may be fine using the Alexa session state to persist the game state while the session is in progress.
If you are only relying on the Alexa session state, each new session means the start of a new game.
