const express = require('express');
const app = express();
require('dotenv').config();

app.use(express.json());

console.log("retrieve Front Variables")
// Front
const FRONT_CHANNEL_NAME=process.env.FRONT_CHANNEL_NAME
const FRONT_CHANNEL_API_ENDPOINT=process.env.FRONT_CHANNEL_API_ENDPOINT
const FRONT_API_TOKEN=process.env.FRONT_API_TOKEN
//Vonage
const VONAGE_API_KEY=process.env.VONAGE_API_KEY
const VONAGE_API_SECRET=process.env.VONAGE_API_SECRET
const VONAGE_MESSAGES_API_ENDPOINT=process.env.VONAGE_MESSAGES_API_ENDPOINT
const VONAGE_APPLICATION_ID=process.env.VONAGE_APPLICATION_ID // not needed
const VONAGE_APPLICATION_PRIVATE_KEY=process.env.VONAGE_APPLICATION_PRIVATE_KEY // not needed
const VONAGE_LVN=process.env.VONAGE_LVN

//Server
const SERVER_PORT=process.env.SERVER_PORT

console.log("FRONT_CHANNEL_NAME="+FRONT_CHANNEL_NAME)
console.log("FRONT_CHANNEL_API_ENDPOINT="+FRONT_CHANNEL_API_ENDPOINT)
console.log("FRONT_API_TOKEN="+FRONT_API_TOKEN)


app
  .route('/webhook/inbound')
  .post(handleInboundMessage)


app
  .route('/webhook/event')
  .post(handleInboundEvent)

  app
  .route('/webhook/sendmessage')
  .post(handleSendMessage)

async function handleInboundMessage(request, response) 
{
    // handle inbound message SMS and WhatsApp
    let requestData;
    const params = Object.assign(request.query, request.body)
    console.log(params)

    switch(params.channel )
    {
        case 'whatsapp':
            console.log('whatsapp channel');
            break;
        case 'sms':
                console.log('sms channel');
                break;
        default :
            console.log('channel not supported');
            response.status(200).send({status: 0, message: "Channel not supported"})


    }
    // check message type and create response
    let msg_body = "";
    let sender = "";
    let error_msg = "";
    let json;
    // promise to allow image to be downloaded
    let msgResponse = await new Promise(resolve => {
        switch(params.message_type )
        {
            case 'text':
                console.log('text message');
                msg_body=params.text
                sender=params.from
                json = formatTextMessageToFront(sender,msg_body)
                console.log("requestData");
                console.log(requestData);
                resolve(true)
                break;
            /*    IMAGES TO COME
                case 'image':
                console.log('image message');
                // default 
                msg_body="Image not Supported"
                // download image and convert to base64
                var request = require('request').defaults({ encoding: null });

                
                request.get(params.image.url, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        data = "data:" + response.headers["content-type"] + ";base64," + Buffer.from(body).toString('base64');
                        //console.log(data);
                        if(params.image.hasOwnProperty('caption')){
                            msg_body='<img alt="<image_Name>" src="'+data+'"></img>'
                        }
                        else{
                            msg_body=params.image.caption+'<br/><img alt="<image_Name>" src="'+data+'"></img>'
                        }
                        console.log("set image in base64");
                        resolve(true)
                    }
                    else
                    {
                        console.log("failed to download image");
                        error_msg = 'failed to download image';
                        resolve(false)
                    }
                });
                
                break;
            */
            default :
                console.log('format not supported');
                error_msg = 'format not supported';
                resolve(false)
                


        }
    })
    // successful message input
    if(msgResponse == true )
    {
        var request = require('request').defaults({ encoding: null });

        console.log("data in request");
        let data = {
          'auth': {
            'bearer': FRONT_API_TOKEN
          },
          json,
        }; 
        console.log(data);

        request.post(
          FRONT_CHANNEL_API_ENDPOINT,
          {
            'auth': {
              'bearer': FRONT_API_TOKEN
            },
            json,
          },
          (error, res, body) => {
            if (error) {
              console.error(error)
              console.log("failed to submit message to Front");
              error_msg = 'failed to submit message to Front';
              response.status(200).send({status: 0, message: error_msg});
              return
            }
            else if( res.statusCode > 200 )
            {
              console.log('failed submitted messages to Front')
              console.log(`statusCode: ${res.statusCode}`)
              response.status(200).send({status: 0, message: body});
              console.log(body)
            }
            else
            {
              console.log('successfully submitted messages to Front')
              console.log(`statusCode: ${res.statusCode}`)
              response.status(200).send({status: 1, message: body});
              console.log(body)

            }
          }
        )

    }
    else
    {
        console.log("inbound message not valid");
        error_msg = 'inbound message not valid';
        response.status(200).send({status: 0, message: error_msg});
    }



}

function handleInboundEvent(request, response) 
{
  // dump event message SMS and WhatsApp
  const params = Object.assign(request.query, request.body)
  console.log(params)
  response.status(204).send()

}


function formatTextMessageToFront(sender,msg_body)
{
    console.log("formatting");
    let data = {
      "sender": {
           "handle": sender
      },
      "body_format": "markdown",
      "body": msg_body
 }
 console.log(data);
    return data;

}


async function handleSendMessage(request, response) 
{
    // handle inbound message SMS and WhatsApp
    let requestData;
    const params = Object.assign(request.query, request.body)
    console.log(params)

    // successful message input
 
        var request = require('request').defaults({ encoding: null });
        console.log("data in request");
        
        var json = {
          "message_type": "text",
          "text": params.body,
          "to": params.recipients[1].handle,
          "from": VONAGE_LVN,
          "channel": "sms"
          };
        
        console.log("recipients")
        console.log(params.recipients[1])
        
        let data = {
          auth: {
            username: VONAGE_API_KEY,
            password: VONAGE_API_SECRET
        },
          json,
        }; 
        console.log(data);

        request.post(
          VONAGE_MESSAGES_API_ENDPOINT,
          {
            auth: {
              username: VONAGE_API_KEY,
              password: VONAGE_API_SECRET
          },
            json,
          },
          (error, res, body) => {
            if (error) {
              console.error(error)
              console.log("failed to submit message to Vonage");
              error_msg = 'failed to submit message to Vonage';
              response.status(200).send({status: 0, message: error_msg});
              return
            }
            else if( res.statusCode > 204 )
            {
              console.log('failed submitted messages to Vonage')
              console.log(`statusCode: ${res.statusCode}`)
              response.status(200).send({status: 0, message: body});
              console.log(body)
            }
            else
            {
              console.log('successfully submitted messages to Vonage')
              console.log(`statusCode: ${res.statusCode}`)
              response.status(200).send({status: 1, message: body});
              console.log(body)

            }
          }
        )




}

app.listen(process.env.SERVER_PORT || 3000)