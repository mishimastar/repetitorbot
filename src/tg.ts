import TelegramBot from 'node-telegram-bot-api';
import { User } from './types';
import { randomUUID } from 'crypto';
import { DB } from './globals';
import { readFileSync } from 'fs';

// replace the value below with the Telegram token you receive from @BotFather
const token = readFileSync('./.token', 'utf-8').trim();

// Create a bot that uses 'polling' to fetch new updates
// const bot = new TelegramBot(token, { polling: true });
// const whitelist = new Set([857880458]);
// const chatwhitelist = new Set([-4166982055, 857880458]);

const registerUserIfNeeds = (msg: TelegramBot.Message): User => {
    let u = DB.getUser(msg.chat.id);
    if (u) return u;
    u = {
        status: 'granted', // hardcoded
        tg_id: msg.chat.id,
        tg_nickname: msg.chat.username ?? '@unknown',
        uuid: randomUUID()
    };
    DB.addUser(u);
    return u;
};

// eslint-disable-next-line @typescript-eslint/no-misused-promises

// Listen for any kind of message. There are different kinds of
// messages.
// bot.on('message', async (msg) => {
//     if (!msg.from?.id || !whitelist.has(msg.from?.id)) return;
//     //   if (!msg.chat.id || !chatwhitelist.has(msg.chat.id)) return;

//     const chatId = msg.chat.id;

//     // send a message to the chat acknowledging receipt of their message
//     await bot.sendMessage(chatId, 'че ты хочишь');
// });

const encodeMD2 = (inc: string) => inc.replaceAll('-', '\\-');

const buildGroupListKB = (): TelegramBot.InlineKeyboardButton[][] => {
    const out: TelegramBot.InlineKeyboardButton[][] = [];
    for (const { uuid, name: gr } of DB.listGroups()) out.push([{ text: gr.name, callback_data: `days ${uuid}` }]);
    return out;
};

const calculateTodayAndTomorrow = (): [string, string] => {
    const now = new Date();
    const tom = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return [now.toISOString().slice(0, 10), tom.toISOString().slice(0, 10)];
};

const buildDaysList = (uuid: string): TelegramBot.InlineKeyboardButton[][] => {
    const out: TelegramBot.InlineKeyboardButton[][] = [];
    const [tod, tom] = calculateTodayAndTomorrow();
    if (DB.getGroup(uuid)?.shedule[tod]) out.push([{ text: tod, callback_data: `shedule ${uuid} ${tod}` }]);
    if (DB.getGroup(uuid)?.shedule[tom]) out.push([{ text: tom, callback_data: `shedule ${uuid} ${tom}` }]);
    return out;
};

export const TGBot = new (class {
    #bot: TelegramBot;
    constructor() {
        this.#bot = new TelegramBot(token);
    }
    start = async () => {
        await this.#bot.startPolling();
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.#bot.onText(/^\/start$/, this.#handleStart);
        this.#bot.on('text', console.log);
        this.#bot.on('callback_query', async (q) => {
            console.log(q.data);
            switch (true) {
                case q.data?.startsWith('days '):
                    const uuid = q.data!.replace('days ', '');
                    const kb = buildDaysList(uuid);
                    await this.#bot.editMessageText(
                        kb.length
                            ? `На какой день вы хотите посмотреть расписание для группы ${DB.getGroupName(uuid)}?`
                            : `Расписание для группы ${DB.getGroupName(uuid)} не найдено`,
                        {
                            message_id: q.message?.message_id,
                            chat_id: q.message?.chat.id,
                            reply_markup: { inline_keyboard: kb }
                        }
                    );
                    break;
                case q.data?.startsWith('shedule'):
                    const [, id, date] = q.data!.split(' ');
                    if (!id || !date) throw new Error('bad callback');
                    const day_id = DB.getGroup(id)?.shedule?.[date];
                    if (!day_id) throw new Error('no day_id');
                    const day = DB.getDay(day_id);
                    if (!day) throw new Error('no day');
                    const ps = Object.entries(day.pairs).map(([ord, uid]) => {
                        const para = DB.getPara(uid);
                        if (!para) throw new Error('no para');
                        const subj = DB.getSubjectName(para.subject);
                        if (!subj) throw new Error('no subj');
                        const prep = DB.getPrepod(para.prepod)?.fullName;
                        if (!prep) throw new Error('no prep');

                        return { subj, prep, loc: para.location, ord };
                    });
                    let sh = '';
                    for (const p of ps) sh += `${p.ord} пара\n${p.subj}\n${p.prep}\n${p.loc}\n\n`;
                    await this.#bot.sendMessage(
                        q.message!.chat.id,
                        `Расписание для группы ${DB.getGroupName(id)} на ${day.date}

${sh ? sh : 'ПАР НЕТ!!!'}`
                    );
                    break;

                default:
                    break;
            }
            return;
        });
    };
    stop = async () => await this.#bot.stopPolling();

    #handleStart = async (msg: TelegramBot.Message) => {
        console.log(msg);
        const userProfile = registerUserIfNeeds(msg);
        await this.#bot.sendMessage(
            msg.chat.id,
            `Вы зареганы как **${userProfile.tg_nickname}**
Телеграм чат айди ${userProfile.tg_id}
Уникальный идентификатор ${encodeMD2(userProfile.uuid)}`,
            { parse_mode: 'MarkdownV2', reply_markup: { inline_keyboard: buildGroupListKB() } }
        );
    };
})();
