import { green, red } from 'kleur';
import http from 'undici';
import { guildID, targetID, token, vanity, mfa } from './config';

const client = new WebSocket('wss://gateway.discord.gg/?v=v9&encoding=json');
http.connect
const dispatcher = new http.Agent({    
    pipelining: 0,
    bodyTimeout: 2000,
    headersTimeout: 2000,
    keepAliveMaxTimeout: 5000,
    keepAliveTimeout: 1000,
});

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const headers = { 
    'Authorization': `${token}`,
    'user-agent': '',
    'X-Super-Properties': 'ewogICJvcyI6ICJXaW5kb3dzIiwKICAiY2xpZW50X2J1aWxkX251bWJlciI6IDE1MjQ1MAp9',
    'X-Discord-Mfa-Authorization': mfa
};

client.onmessage = (({ data }) => {
    const x = typeof data === 'string' ? data : decoder.decode(data as Buffer);
    const { op, d, t } = JSON.parse(x)

    op == 10
        ? (() => {
            setInterval(() => client.send(encoder.encode('{"op": 1, "d": null}')), d.heartbeat_interval);
            client.send(`{"op": 2, "d":{"token": "${token}", "intents": 37376,"properties": { "$os":"linux", "$browser":"bun", "$device": "bun"}}}`);
        })()
        : op == 0
            ? setImmediate(async () => {
                if(t != "GUILD_UPDATE") return;
                if(d.guild_id != targetID || d.vanity_url != vanity) return;

                
                const { body, statusCode } = await http.request(
                    `https://discord.com/api/v9/guilds/${guildID}/vanity-url`,
                    {   
                        method: 'PATCH',
                        dispatcher,
                        headers,
                        body: `"{ "code": ${vanity} }"`
                });

                await body.dump();
                console.log(statusCode === 200 ? green('Success') : red('Error' + statusCode));     
            })
            : undefined;
});