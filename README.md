# Telegram WebWallet bot

A cryptocurrency web wallet bot for telegram

Work with any client with rpc commands based on bitcoin

Commands:

 - /help: get info about commands
 - /newaddress [type (legacy,segwit,bech32)]: generate new public address
 - /sendto [address] [amount] [(optional) confirmations] [(optional) comment]: send n units to x address and return txid
 - /alladdress: return all generated address
 - /balance: return confirmed balance
 - /reqpay [amount] [(optional) comment]: return payment request string and respective qr code
 - /qr [text]: return a qr code with these text
 - /features (admin only): send the text of file `features.txt` to all registred users

Before do anything, rename the file `settings.template.json` to `settings.json` and edit it.

## Obtain certificates for webhook using lets encrypt
You have to run a http server on port 80 to verify you own of the domain. Follow these commands

```shell
git clone https://github.com/certbot/certbot
cd certbot
chmod a+x certbot-auto 
./certbot-auto certonly --manual --email mail@example.com -d domain.com
cd ..
```

Follow the instructions.

This creates a directory: `/etc/letsencrypt/live/domain.com/` containing cert files:

- cert.pem
- chain.pem
- fullchain.pem
- privkey.pem

Next, execute these commands:

```shell
ln -s /etc/letsencrypt/live/example.com/privkey.pem key.pem
ln -s /etc/letsencrypt/live/example.com/cert.pem cert.pem
ln -s /etc/letsencrypt/live/example.com/chain.pem ca.pem
```

And these for auto renew:

```shell
crontab -e

#Write this at end of crontab file
43 6 * * * /location/of/certbot/certbot-auto renew
```

Then, set `CA` to `true` in `settings.json`

## Using self signed cert

```shell
openssl req -newkey rsa:2048 -sha256 -nodes -keyout key.pem -x509 -days 1024 -out cert.pem -subj "/C=US/ST=New York/L=Brooklyn/O=Example Brooklyn Company/CN=domain.com"
```

Or execute `npm start`, cert and key is auto generated if not exists.


(Sorry for my bad english :P)