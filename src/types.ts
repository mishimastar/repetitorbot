export type User = {
  uuid: string;
  tg_id: number;
  tg_nickname: string;
  status: "granted" | "rejected";
};

export type Student = {
  group_uuid: string;
} & User;

// export type Prepod = {
//   subjects: string[];
// } & User;

export type Admin = User;

export type Group = {
  uuid: string;
  name: string;
};

// // export type Prepod = {
// //   uuid: string;
// //   tg_id: number;
// //   tg_nickname: string;
// // };
