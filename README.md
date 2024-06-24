This is a simple Express app discord bot for posting NFT sales after receiving a webhook event of transfer details.

Below will be some brief explanation for setting up. More detailed instructions coming later.

For this bot, I am using [SimpleHash](https://simplehash.com/)'s [contract.transfer](https://docs.simplehash.com/reference/webhook-events) webhook event to receive sales and then create an embedded message to post in discord.

You need the following:

- SimpleHash API Key (free tier is fine for basic stuff)
- SimpleHash Webhook
- Discord Bot (specifically the bot token)

[Create a webhook](https://docs.simplehash.com/reference/create-webhook) with the collection address and the url that you want the webhooks sent to.
For localhost you can use ngrok.
Boot that up and use the public domain given in the webhook creation.

For example:

```
{
    "webhook_url": "{ngrokurl}/sales",
    "event_types": [
        "contract.transfer"
    ],
    "contract_addresses": [
        "ethereum.0x524cab2ec69124574082676e6f654a18df49a048",
        "ethereum.0xed5af388653567af2f388e6224dc7c4b3241c544",
        "ethereum.0x8ff1523091c9517bc328223d50b52ef450200339",
        "ethereum.0xc28313a1080322cd4a23a89b71ba5632d1fc8962"
    ]
}
```

For Discord:

- Get a Channel ID that you want to post in
- Create your discord bot and copy the token over to your .env file
- invite your discord bot to your server

run `node server.js`
on successful boot up, you should receive a message that your discord bot is ready.
Now you just wait for sale events to come through for the collections that you set up in the webhook config.
