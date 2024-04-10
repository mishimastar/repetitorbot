export type User = {
    uuid: string; // for future purposes
    tg_id: number;
    tg_nickname: string;
    status: 'granted' | 'rejected';
};

export type RawUsers = Record<string, User>;

// export type Student = {
//     group_uuid: string;
// } & User;

export type Prepod = {
    subjects: string[]; // uuids
    fullName: string;
} & User;

export type RawPrepods = Record<string, Prepod>;

export type Admin = User;

export type Subject = {
    uuid: string;
    name: string;
};

export type RawSubjects = Record<string, string>;

export type Para = {
    uuid: string;
    subject: string; // subject uuid
    prepod: string; // prepod uuid
    location: string; // let it be anything
};

export type RawParas = Record<string, Para>;

export type Day = {
    uuid: string; // for future purposes
    date: string; // 2024-04-10
    pairs: { '1': string; '2': string; '3': string; '4': string; '5': string };
};

export type RawDays = Record<string, Day>;

export type Group = {
    uuid: string;
    name: string;
    shedule: Record<string, string>; // date to uuid
};

export type RawGroups = Record<string, Group>;

// // export type Prepod = {
// //   uuid: string;
// //   tg_id: number;
// //   tg_nickname: string;
// // };
