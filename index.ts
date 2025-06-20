import { green, red } from 'kleur';
import http from 'undici';
import { guildID, targetID, token, vanity, mfa } from './config';
import erl from '@typescord/ftee'

const client = new WebSocket('wss://gateway.discord.gg/?v=v9&encoding=json');

const dispatcher = new http.Agent({    
    pipelining: 0,
    bodyTimeout: 2000,
    headersTimeout: 2000,
    keepAliveMaxTimeout: 5000,
    keepAliveTimeout: 1000,
});

const headers = { 
    'Authorization': `${token}`,
    'user-agent': '',
    'X-Super-Properties': 'ewogICJvcyI6ICJXaW5kb3dzIiwKICAiY2xpZW50X2J1aWxkX251bWJlciI6IDE1MjQ1MAp9',
    'X-Discord-Mfa-Authorization': mfa
};

const HEARTBEAT = erl.encode('{"op": 1, "d": null}');
const IDENTIFY =  erl.encode(`{"op": 2, "d":{"token": "${token}", "intents": 37376,"properties": { "$os":"linux", "$browser":"bun", "$device": "bun"}}}`);
const BODY =  erl.encode(`"{ "code": ${vanity} }"`);

client.onmessage = (({ data }) => {
    const x = erl.decode(data);
    if(typeof x !== 'object') return;

    const { op, d, t }: any = x;

    op == 10
        ? (() => {
            setInterval(() => client.send(HEARTBEAT), d.heartbeat_interval);
            client.send(IDENTIFY);
        })()
        : op == 0
            ? setImmediate(async () => {
                if(t != "GUILD_UPDATE") return;
                if(d.guild_id != targetID || d.vanity_url != vanity) return;
                
                const { body, statusCode } = await http.request(`https://discord.com/api/v9/guilds/${guildID}/vanity-url`, {   
                    method: 'PATCH',
                    dispatcher,
                    headers,
                    body: BODY
                });

                await body.dump();
                console.log(statusCode === 200 ? green('Success') : red('Error' + statusCode));     
            })
            : undefined;
});
