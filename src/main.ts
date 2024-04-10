import { once } from 'node:events';
import { TGBot } from './tg';

async function start() {
    console.log('starting');

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
