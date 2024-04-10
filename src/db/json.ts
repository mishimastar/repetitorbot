import { readFileSync, writeFileSync } from 'fs';
import { Day, Group, Para, Prepod, RawDays, RawGroups, RawParas, RawPrepods, RawSubjects, RawUsers, User } from '../types';

export class JSONDBC {
    #users = new Map<number, User>();
    #prepods = new Map<string, Prepod>();
    #subjects = new Map<string, string>();
    #paras = new Map<string, Para>();
    #groups = new Map<string, Group>();
    #days = new Map<string, Day>();
    // #admins: Map<number, Admin> = new Map();

    constructor() {
        const users = JSON.parse(readFileSync('./jsondb/users.json', 'utf8')) as RawUsers;
        for (const [, u] of Object.entries(users)) this.#users.set(u.tg_id, u);

        const prepods = JSON.parse(readFileSync('./jsondb/prepods.json', 'utf8')) as RawPrepods;
        for (const [, u] of Object.entries(prepods)) this.#prepods.set(u.uuid, u);

        const paras = JSON.parse(readFileSync('./jsondb/paras.json', 'utf8')) as RawParas;
        for (const [uuid, para] of Object.entries(paras)) this.#paras.set(uuid, para);

        const subjects = JSON.parse(readFileSync('./jsondb/subjects.json', 'utf8')) as RawSubjects;
        for (const [uuid, name] of Object.entries(subjects)) this.#subjects.set(uuid, name);

        const groups = JSON.parse(readFileSync('./jsondb/groups.json', 'utf8')) as RawGroups;
        for (const [uuid, group] of Object.entries(groups)) this.#groups.set(uuid, group);

        const days = JSON.parse(readFileSync('./jsondb/days.json', 'utf8')) as RawDays;
        for (const [group_uuid, day] of Object.entries(days)) this.#days.set(group_uuid, day);
    }

    // isAdmin = (id: number) => this.#admins.has(id);
    isUser = (id: number): boolean => this.#users.has(id);
    getUser = (id: number): User | undefined => this.#users.get(id);
    addUser = (user: User) => {
        this.#users.set(user.tg_id, user);
        writeFileSync('./jsondb/users.json', JSON.stringify(Object.fromEntries(this.#users)));
    };
    getPrepod = (uuid: string): Prepod | undefined => this.#prepods.get(uuid);
    *listGroups(): IterableIterator<{ uuid: string; name: Group }> {
        for (const [uuid, group] of this.#groups) yield { uuid, name: group };
    }
    getGroup = (uuid: string): Group | undefined => this.#groups.get(uuid);
    getGroupName = (uuid: string): string | undefined => this.#groups.get(uuid)?.name;
    getSubjectName = (uuid: string): string | undefined => this.#subjects.get(uuid);
    getDay = (uuid: string): Day | undefined => this.#days.get(uuid);
    getPara = (uuid: string): Para | undefined => this.#paras.get(uuid);
}
