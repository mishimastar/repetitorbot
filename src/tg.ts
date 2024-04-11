import TelegramBot from 'node-telegram-bot-api';
import { User } from './types';
import { randomUUID } from 'crypto';
import { inspect } from 'util';
import { JSONDBC } from './db/json';

export interface TGBotI {
    start: () => Promise<void>;
    stop: () => Promise<void>;
}

export class TGBotC implements TGBotI {
    #bot: TelegramBot;
    #db: JSONDBC;
    constructor(token: string, db: JSONDBC) {
        this.#bot = new TelegramBot(token);
        this.#db = db;
    }

    start = async () => {
        await this.#bot.startPolling();
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.#bot.onText(/^\/start$/, this.#handleStart);
        // this.#bot.on('text', console.log);
        this.#bot.on('callback_query', async (q) => {
            console.log(q.data);
            switch (true) {
                case q.data === 'grouplist':
                    await this.#handleBackToGrouopList(q);
                    break;
                case q.data?.startsWith('days '):
                    await this.#handleDays(q);
                    break;
                case q.data?.startsWith('shedule'):
                    await this.#handleShedule(q);
                    break;

                default:
                    break;
            }
            return undefined;
        });
    };

    stop = async () => await this.#bot.stopPolling();

    #handleStart = async (msg: TelegramBot.Message) => {
        console.log(msg);
        const userProfile = this.#registerUserIfNeeds(msg);
        await this.#bot.sendMessage(
            msg.chat.id,
            `Вы зареганы как **${userProfile.tg_nickname}**
Телеграм чат айди ${userProfile.tg_id}
Уникальный идентификатор ${this.#encodeMD2(userProfile.uuid)}`,
            { parse_mode: 'MarkdownV2', reply_markup: { inline_keyboard: this.#buildGroupListKB() } }
        );
    };

    #handleBackToGrouopList = async (q: TelegramBot.CallbackQuery) => {
        const userProfile = this.#registerUserIfNeeds(q.message!);
        await this.#bot.editMessageText(
            `Вы зареганы как **${userProfile.tg_nickname}**
Телеграм чат айди ${userProfile.tg_id}
Уникальный идентификатор ${this.#encodeMD2(userProfile.uuid)}`,
            {
                message_id: q.message?.message_id,
                chat_id: q.message?.chat.id,
                reply_markup: { inline_keyboard: this.#buildGroupListKB() },
                parse_mode: 'MarkdownV2'
            }
        );
    };

    #handleDays = async (q: TelegramBot.CallbackQuery) => {
        const uuid = q.data!.replace('days ', '');
        const kb = this.#buildDaysList(uuid);
        console.log(inspect(kb, true, 3, true));
        await this.#bot.editMessageText(
            kb.length > 1
                ? `На какой день вы хотите посмотреть расписание для группы ${this.#db.getGroupName(uuid)}?`
                : `Расписание для группы ${this.#db.getGroupName(uuid)} не найдено`,
            {
                message_id: q.message?.message_id,
                chat_id: q.message?.chat.id,
                reply_markup: { inline_keyboard: kb }
            }
        );
    };

    #handleShedule = async (q: TelegramBot.CallbackQuery) => {
        const [, id, date] = q.data!.split(' ');
        if (!id || !date) throw new Error('bad callback');
        const day_id = this.#db.getGroup(id)?.shedule?.[date];
        if (!day_id) throw new Error('no day_id');
        const day = this.#db.getDay(day_id);
        if (!day) throw new Error('no day');
        const ps = Object.entries(day.pairs).map(([ord, uid]) => {
            const para = this.#db.getPara(uid);
            if (!para) throw new Error('no para');
            const subj = this.#db.getSubjectName(para.subject);
            if (!subj) throw new Error('no subj');
            const prep = this.#db.getPrepod(para.prepod)?.fullName;
            if (!prep) throw new Error('no prep');

            return { subj, prep, loc: para.location, ord };
        });
        let sh = '';
        for (const p of ps) sh += `${p.ord} пара\n${p.subj}\n${p.prep}\n${p.loc}\n\n`;
        await this.#bot.editMessageText(
            `Расписание для группы ${this.#db.getGroupName(id)} на ${day.date}

${sh ? sh : 'ПАР НЕТ!!!'}`,
            {
                reply_markup: { inline_keyboard: this.#buildBackToDayKB(id) },
                chat_id: q.message!.chat.id,
                message_id: q.message?.message_id
            }
        );
    };

    #registerUserIfNeeds = (msg: TelegramBot.Message): User => {
        let u = this.#db.getUser(msg.chat.id);
        if (u) return u;
        u = {
            status: 'granted', // hardcoded
            tg_id: msg.chat.id,
            tg_nickname: msg.chat.username ?? '@unknown',
            uuid: randomUUID()
        };
        this.#db.addUser(u);
        return u;
    };

    #encodeMD2 = (inc: string) => inc.replaceAll('-', '\\-');

    #buildGroupListKB = (): TelegramBot.InlineKeyboardButton[][] => {
        const out: TelegramBot.InlineKeyboardButton[][] = [];
        for (const { uuid, name: gr } of this.#db.listGroups())
            out.push([{ text: gr.name, callback_data: `days ${uuid}` }]);
        return out;
    };

    #calculateTodayAndTomorrow = (): [string, string] => {
        const now = new Date();
        const tom = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return [now.toISOString().slice(0, 10), tom.toISOString().slice(0, 10)];
    };

    #buildDaysList = (group_uuid: string): TelegramBot.InlineKeyboardButton[][] => {
        const out: TelegramBot.InlineKeyboardButton[][] = [];
        const [tod, tom] = this.#calculateTodayAndTomorrow();
        if (this.#db.getGroup(group_uuid)?.shedule[tod])
            out.push([{ text: `Сегодня (${tod})`, callback_data: `shedule ${group_uuid} ${tod}` }]);
        if (this.#db.getGroup(group_uuid)?.shedule[tom])
            out.push([{ text: `Завтра (${tom})`, callback_data: `shedule ${group_uuid} ${tom}` }]);
        out.push([{ text: 'Назад', callback_data: 'grouplist' }]);
        return out;
    };

    #buildBackToDayKB = (group_uuid: string): TelegramBot.InlineKeyboardButton[][] => {
        const out: TelegramBot.InlineKeyboardButton[][] = [];
        out.push([{ text: 'Назад', callback_data: `days ${group_uuid}` }]);
        return out;
    };
}
