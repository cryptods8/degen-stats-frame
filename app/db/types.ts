import { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface Database {
  degen_tip: DegenTipTable;
}

export interface DegenTipTable {
  id: Generated<number>;
  createdAt: Date;

  fromFid: string;
  toFid: string;
  value: number;
  originalText: string;
  castHash: string;
  parentCastHash: string | null;
  castTimestamp: Date;
  rootParentUrl: string | null;
  parentUrl: string | null;
}

export type DBDegenTip = Selectable<DegenTipTable>;
export type DBDegenTipInsert = Insertable<DegenTipTable>;
export type DBDegenTipUpdate = Updateable<DegenTipTable>;
