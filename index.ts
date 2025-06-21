import { green, red } from 'kleur';
import http from 'undici';
import { guildID, targetID, token, vanity, mfa } from './config';
import { encode, decode } from '@typescord/ftee'
import { dns } from 'bun';

await Promise.allSellted([
    dns.prefetch('discord.com'),
    dns.prefetch('gateway.discord.gg'),
    //Add other potential endpoints
]);

const client = new WebSocket('wss://gateway.discord.gg/?v=9&encoding=etf');

const dispatcher = new http.Dispatcher({    
    pipelining: 15,
    bodyTimeout: 250,
    headersTimeout: 150,
    keepAliveMaxTimeout: 1000,
    keepAliveTimeout: 250,
    connect: {
        rejectUnauthorized: false,
        socketPath: undefined,
        tcpNoDelay: true,
        tcpKeepAlive: true
    },
    tls: {
        sessionTimeout: 0,
        tiemout: 100
    }
});

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
            ? (() => {
                if(t != "GUILD_UPDATE") return;
                if(d.guild_id != targetID || d.vanity_url != vanity) return;
                
                const { body, statusCode } = await http.request(`https://discord.com/api/v9/guilds/${guildID}/vanity-url`, {   
                    method: 'PATCH',
                    dispatcher,
                    headers,
                    body: BODY,
                });

                console.log(statusCode === 200 ? green('Success') : red('Error' + statusCode));     
                body.dump().catch(()=>{});
            })()
            : undefined;
});
