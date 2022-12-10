
// You MUST have a file called "token.secret" in the same directory as this file!
// This should be the secret token found in https://dashboard.ngrok.com/
// It will NOT be committed.

// TO START
//   1. Open a terminal and run 'npm start'
//   2. Open another terminal and run 'npm run tunnel'
//   3. Copy/paste the ngrok HTTPS url into the DialogFlow fulfillment.
//
// Your changes to this file will be hot-reloaded!

import fetch from 'node-fetch';
import fs from 'fs';
import ngrok from 'ngrok';
import morgan from 'morgan';
import express from 'express';

// Read and register with secret ngrok token.
ngrok.authtoken(fs.readFileSync("token.secret").toString().trim());

// Start express on port 53705
const app = express();
const port = 53705;

// Accept JSON bodies and begin logging.
app.use(express.json());
app.use(morgan(':date ":method :url" :status - :response-time ms'));

// "Hello World" endpoint.
// You should be able to visit this in your browser
// at localhost:53705 or via the ngrok URL.
app.get('/', (req, res) => {
  res.status(200).send({
    msg: 'Express Server Works!'
  })
})

// Dialogflow will POST a JSON body to /.
// We use an intent map to map the incoming intent to
// its appropriate async functions below.
// You can examine the request body via `req.body`
// See https://cloud.google.com/dialogflow/es/docs/fulfillment-webhook#webhook_request
app.post('/', (req, res) => {
  const intent = req.body.queryResult.intent.displayName;
  
  // A map of intent names to callback functions
  const intentMap = {
    "GetNumUsers": getNumUsers,
    "GetNumMessages": getNumMsgs,
    "GetChatroomMessages": getChatMsgs
  }

  if (intent in intentMap) {
    // Call the appropriate callback function
    intentMap[intent](req, res);
  } else {
    // Uh oh! We don't know what to do with this intent.
    // There is likely something wrong with your code.
    // Double-check your names.
    console.error(`Could not find ${intent} in intent map!`)
    res.status(404).send(JSON.stringify({ msg: "Not found!" }));
  }
})

// Open for business!
app.listen(port, () => {
  console.log(`DialogFlow Handler listening on port ${port}. Use 'npm run tunnel' to expose this.`)
})

// Your turn!
// Each of the async functions below maps to an intent from DialogFlow
// Complete the intent by fetching data from the API and
// returning an appropriate response to DialogFlow.
// See https://cloud.google.com/dialogflow/es/docs/fulfillment-webhook#webhook_response
// Use `res` to send your response; don't return!

async function getNumUsers(req, res) {

  // TODO Fetch data from API using async/await
  const resp = await fetch(`https://www.coletnelson.us/cs571/f22/hw10/api/numUsers`);
  const numUsers = await resp.json();
  let numberOfUsers = numUsers.users;
  res.status(200).send({
    fulfillmentMessages: [
      {
        text: {
          text: [
            `They are ${numberOfUsers} users registered on BadgerChat!`
          ]
        }
      }
    ]
  });
}

async function getNumMsgs(req, res) {
  const params = req.body.queryResult.parameters;
  if(params.roomName){
    const roomNameValue = params.roomName;
    const resp = await fetch(`https://www.coletnelson.us/cs571/f22/hw10/api/chatroom/${roomNameValue}/numMessages`);
    const numMessages = await resp.json();
    let numberOfMessages = numMessages.messages;
    res.status(200).send({
      fulfillmentMessages: [
        {
          text: {
            text: [
              `They are ${numberOfMessages} messages on ${roomNameValue}!`
            ]
          }
        }
      ]
    });
  }
  else{
    const roomNameValue = "BadgerChat";
    const resp = await fetch(`https://www.coletnelson.us/cs571/f22/hw10/api/numMessages`);
    const numMessages = await resp.json();
    let numberOfMessages = numMessages.messages;
    res.status(200).send({
      fulfillmentMessages: [
        {
          text: {
            text: [
              `They are ${numberOfMessages} messages on ${roomNameValue}!`
            ]
          }
        }
      ]
    });
  }
}

async function getChatMsgs(req, res) {
  const params = req.body.queryResult.parameters;
    const roomNameValue = params.roomName;
    //user required number of post
    let numberOfPosts = params.number;
    const resp = await fetch(`https://www.coletnelson.us/cs571/f22/hw10/api/chatroom/${roomNameValue}/messages`);
    const Messages = await resp.json();
    let postToShow = [];
    const stacks = [];
    if(numberOfPosts === ''){
      postToShow = Messages.messages[0];
      res.status(200).send({
        fulfillmentMessages: [
          {
          text: {
            text: [
              `Here is the ${numberOfPosts}latest message from ${roomNameValue}!`
            ]
          }
          },
          {card: {
              title: `${postToShow.title}`,
              subtitle: `${postToShow.poster}`,
              buttons: [
                {
                  text: "READ MORE",
                  postback: `https://www.coletnelson.us/cs571/f22/badgerchat/chatrooms/${roomNameValue}/messages/${postToShow.id}`
                }
              ]
            }
          }
        ]
      });
    }
    else if(numberOfPosts > 5){
      numberOfPosts = 5;
      const postToShow = Messages.messages.slice(0, numberOfPosts);
      stacks.push({
          text: {
            text: [
              `Sorry, you can only get up to the latest 5 messages. Here are the 5 latest messages from ${roomNameValue}`
            ]
          } 
          
      })
      postToShow.forEach(element => {
        const card = {
          card: {
            title: element.title,
            subtitle: element.poster,
            buttons: [
              {
                text: "READ MORE",
                postback: `https://www.coletnelson.us/cs571/f22/badgerchat/chatrooms/${roomNameValue}/messages/${element.id}`
              }
            ]
          }
        }
        stacks.push(card);
      });
      
      res.status(200).send({
        fulfillmentMessages: stacks
      });
    }else{
      const postToShow = Messages.messages.slice(0, numberOfPosts);
      stacks.push({
          text: {
            text: [
              `Here is the ${numberOfPosts} latest message from ${roomNameValue}!`
            ]
          } 
          
      })
      postToShow.forEach(element => {
        const card = {
          card: {
            title: element.title,
            subtitle: element.poster,
            buttons: [
              {
                text: "READ MORE",
                postback: `https://www.coletnelson.us/cs571/f22/badgerchat/chatrooms/${roomNameValue}/messages/${element.id}`
              }
            ]
          }
        }
        stacks.push(card);
      });

      res.status(200).send({
        fulfillmentMessages: stacks
      });
    }
}
