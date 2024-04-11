import { once } from 'node:events';
import { TGBotC } from './tg';
import { JSONDBC } from './db/json';
import { readFileSync } from 'node:fs';

const token = readFileSync('./.token', 'utf-8').trim();

async function start() {
    console.log('starting');
    const db = new JSONDBC();
    const TGBot = new TGBotC(token, db);

    await TGBot.start();

    await Promise.race([once(process, 'SIGINT'), once(process, 'SIGTERM')]);

    console.log('shutting down');

    await TGBot.stop();

    console.log('stopped');
}

start().catch((error) => {
    console.error('tg shedule bot: fatal error', { error });
    process.exit(1);
});
