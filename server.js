const bodyParser = require('body-parser');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();
const { ethers } = require('ethers');
const express = require('express');

const app = express();
app.use(bodyParser.json());

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ]
});

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SIMPLEHASH_KEY = process.env.SIMPLEHASH_KEY;
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    client.login(DISCORD_BOT_TOKEN);
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

app.post('/sales', async (req, res) => {
    const event = req.body;
    const channel = await client.channels.fetch(CHANNEL_ID);

    try {
        const sale = event.data.sale_details;
        if (!sale) return;

        const valueInWei = BigInt(sale.total_price);
        const price = ethers.formatEther(valueInWei);
        const contractAddress = event.data.contract_address;
        const tokenId = event.data.token_id;
        const url = `https://api.simplehash.com/api/v0/nfts/ethereum/${contractAddress}/${tokenId}`;
        const options = {
            method: 'GET',
            headers: { accept: 'application/json', 'X-API-KEY': SIMPLEHASH_KEY }
        };
        let nft = await (await fetch(url, options)).json();

        if (price == 0) {
            return;
        }

        const ensUrl = `https://api.simplehash.com/api/v0/ens/reverse_lookup?wallet_addresses=${nft.last_sale.from_address}%2C${nft.last_sale.to_address}`;
        const ensOptions = {
            method: 'GET',
            headers: { accept: 'application/json', 'X-API-KEY': SIMPLEHASH_KEY }
        };

        let ensNames = await (await fetch(ensUrl, ensOptions)).json();

        const embed = new EmbedBuilder()
            .setColor(nft.last_sale.payment_token.symbol == "ETH" ? 0x1FCA77 : 0xFF0000)
            .setTitle(`${nft.collection.name} #${nft.token_id}`)
            .setURL(`https://magiceden.io/collections/ethereum/${contractAddress}?evmItemDetailsModal=1%7E${contractAddress}%7E${tokenId}`)
            .addFields(
                { name: "Price", value: ` \`${price} ETH (${formatCurrency(sale.unit_price_usd_cents)})\`` },
                { name: 'From', value: `[${ensNames[0]?.ens != null ? `${ensNames[0].ens} ` : ensNames[0].address.substring(0, 6) + '...' + ensNames[0].address.substring(ensNames[0].address.length - 5, ensNames[0].address.length - 1)}](https://magiceden.io/u/${ensNames[0].address}?chain=ethereum)`, inline: true },
                { name: 'To', value: `[${ensNames[1]?.ens != null ? `${ensNames[1].ens} ` : ensNames[1].address.substring(0, 6) + '...' + ensNames[1].address.substring(ensNames[1].address.length - 5, ensNames[1].address.length - 1)}](https://magiceden.io/u/${ensNames[1].address}?chain=ethereum)`, inline: true },
                { name: "Transaction", value: `[${nft.last_sale.transaction.substring(0, 6) + '...' + nft.last_sale.transaction.substring(nft.last_sale.transaction.length - 5, nft.last_sale.transaction.length - 1)}](https://etherscan.io/tx/${nft.last_sale.transaction})` },
            )
            .setImage(nft.image_url)
            .setTimestamp()
            .setFooter({ text: sale.marketplace_name });

        await channel.send({ embeds: [embed] });

        res.status(200).send('Event received');
    } catch (exception) {
        console.error('Error fetching NFT metadata or sending message to Discord:', exception);
        res.status(500).send('Internal Server Error');
    }
});



function formatCurrency(amount) {
    amount /= 100;

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    });

    return formatter.format(amount);
}