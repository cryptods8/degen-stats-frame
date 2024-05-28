import { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface Database {
  degen_tip: DegenTipTable;
  degen_raindrop: DegenRaindropTable;
}

interface BaseDegenCast {
  id: Generated<number>;
  createdAt: Date;

  fromFid: string;
  value: number;
  originalText: string;
  castHash: string;
  castTimestamp: Date;
  rootParentUrl: string | null;
  parentUrl: string | null;
}

export interface DegenTipTable extends BaseDegenCast {
  toFid: string;
  parentCastHash: string | null;
}

export interface DegenRaindropTable extends BaseDegenCast {
}

export type DBDegenTip = Selectable<DegenTipTable>;
export type DBDegenTipInsert = Insertable<DegenTipTable>;
export type DBDegenTipUpdate = Updateable<DegenTipTable>;

export type DBDegenRaindrop = Selectable<DegenRaindropTable>;
