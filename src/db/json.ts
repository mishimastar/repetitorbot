import { readFileSync } from "fs";
import { Admin, User } from "../types";

export class JSONDBC {
  #users: Map<number, User> = new Map();
  #admins: Map<number, Admin> = new Map();

  constructor() {
    const users = JSON.parse(readFileSync("./users.json", "utf8")) as User[];
    for (const u of users) this.#users.set(u.tg_id, u);

    const admins = JSON.parse(readFileSync("./admins.json", "utf8")) as Admin[];
    for (const u of admins) this.#admins.set(u.tg_id, u);
  }

  isAdmin = (id: number) => this.#admins.has(id);
  isUser = (id: number) => this.#users.has(id);
}
