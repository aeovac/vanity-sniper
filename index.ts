import { green, red } from 'kleur';
import http, { setGlobalDispatcher } from 'undici';
import { guildID, targetID, token, vanity, mfa } from './config';
import { encode, decode } from '@typescord/ftee'
import { dns } from 'bun';

await Promise.allSettled([
    dns.prefetch('discord.com'),
    dns.prefetch('gateway.discord.gg'),
    //Add other potential endpoints
]);

const client = new WebSocket('wss://gateway.discord.gg/?v=9&encoding=etf');

const dispatcher = new http.Agent({    
    pipelining: 20,
    connections: 1500,
    bodyTimeout: 150,
    headersTimeout: 100,
    keepAliveTimeout: 100,
    connect: {
        rejectUnauthorized: false,
        socketPath: undefined,
        noDelay: true,
        keepAlive: true
    }
});

// setGlobalDispatcher(dispatcher);

const headers = { 
    'Authorization': `${token}`,
    'Content-Type': 'application/json',
    'X-Super-Properties': 'ewogICJvcyI6ICJXaW5kb3dzIiwKICAiY2xpZW50X2J1aWxkX251bWJlciI6IDE1MjQ1MAp9',
    'X-Discord-Mfa-Authorization': mfa,
    'Connection': 'keep-alive',
    'Keep-alive': 'timeout=5,max=100'
};

const HEARTBEAT = encode('{"op": 1, "d": null}');
const IDENTIFY = encode(`{"op": 2, "d":{"token": "${token}", "intents": 37376,"properties": { "$os":"linux", "$browser":"bun", "$device": "bun"}}}`);
const BODY =  Buffer.from(`"{ "code": ${vanity} }"`);

Bun.gc(true);

client.onmessage = (({ data }) => {
    const x = decode(data);
    if(typeof x !== 'object') return;

    const { op, d, t }: any = x;

    op == 10
        ? (() => {
            setInterval(() => client.send(HEARTBEAT), 30_000);
            client.send(IDENTIFY);
        })()
        : op == 0
            ? (async () => {
                if(t != "GUILD_UPDATE") return;
                if(d.guild_id != targetID || d.vanity_url != vanity) return;
                
                const { body, statusCode } = await http.request(`https://discord.com/api/v9/guilds/${guildID}/vanity-url`, {   
                    method: 'PATCH',
                    dispatcher,
                    headers,
                    body: BODY
                });

                console.log(statusCode === 200 ? green('Success') : red('Error' + statusCode));     
                body.dump().catch(()=>{});
            })()
            : undefined;
});
