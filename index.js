var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()
var pg = require('pg')
var questions = ["Hello Ed! I'm going to ask you some questions to find someone who might be able to help you find a good project. Please choose a subject of interest", "What is your role?", "How many hours can you commit per week?"]
var interests = [{
            type: "postback",
            title: "Academia",
            payload: "1ACADEMIA"
          },
          {
            type: "postback",
            title: "Education",
            payload: "1EDUCATION"
          },
          {
            type: "postback",
            title: "Government",
            payload: "1GOVERNMENT"
          }]
var roles = [{
            type: "postback",
            title: "Project Manager",
            payload: "2PM"
          },
          {
            type: "postback",
            title: "Developer",
            payload: "2DEVELOPER"
          },
          {
            type: "postback",
            title: "Designer",
            payload: "2DESIGNER"
          }]
var hours = [{
            type: "postback",
            title: "Less than 5",
            payload: "3lessthan"
          },
          {
            type: "postback",
            title: "Between 5 and 10",
            payload: "3between"
          },
          {
            type: "postback",
            title: "Between 10 and 20",
            payload: "3lots"
          },
          {
            type: "postback",
            title: "Full time",
            payload: "3fulltime"
          }]

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})


var token = "EAAIXZAyl0LY0BAACWcBYw7umnEWwIqWl4FC49KsyZCXwKuPV6Sr2VVmW33x7jszqyavVvpGdD6YMQpsrrV88q9BZBdU95SpR6QqNCQeLVviDkXzl2dpCJEDEZBYjpZAJUfmGzafsgW80ZBAUbK12GB32v2ZBZCAdptOVLl2od7RlwAZDZD"


function sendTextMessage(sender, text) {
    messageData = {
        text:text
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

function sendGenericMessage(sender) {
    messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "First card",
                    "subtitle": "Element #1 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
                    "buttons": [{
                        "type": "web_url",
                        "url": "https://www.messenger.com",
                        "title": "web url"
                    }, {
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for first element in a generic bubble",
                    }],
                }, {
                    "title": "Second card",
                    "subtitle": "Element #2 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
                    "buttons": [{
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for second element in a generic bubble",
                    }],
                }]
            }
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

app.post('/webhook/', function (req, res) {
    messaging_events = req.body.entry[0].messaging
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i]
        sender = event.sender.id
        if (event.message && event.message.text) {
            text = event.message.text
            if (text === 'Generic') {
                sendTextMessage(sender, "Hi Dave, this is Hal" + text.substring(0, 200))
                continue
            }
            sendButtonMessage(sender, questions[0], interests)
        }

        if (event.postback && event.postback.payload.includes('1')) {
            secondQuestion(event, 1)
        }
        if (event.postback && event.postback.payload.includes('2')) {
            secondQuestion(event, 2)
            console.log("anything")
        }
        if (event.postback && event.postback.payload.includes('3')) {
            sendTextMessage(sender, "Great. You should get in touch with Joe Bloggs!")
            continue
        }
    }
    res.sendStatus(200)
});

app.get('/db', function (request, response) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    console.log(err);
    client.query('SELECT * FROM test_table', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { response.send({results: result.rows} ); }
    });
  });

});

function sendButtonMessage(recipientId, question_text, buttons) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: question_text,
          buttons: buttons
        }
      }
    }
  }; 
  callSendAPI(messageData);
};

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: token },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s", 
          messageId, recipientId);
      } else {
      console.log("Successfully called Send API for recipient %s", 
        recipientId);
      }
    } else {
      console.error(response.error);
    }
  });  
}

function secondQuestion(event, index) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  sendButtonMessage(sender, questions[index], roles);
}

function thirdQuestion(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  sendButtonMessage(sender, questions[2], hours);
}