import { CamelCasePlugin } from "kysely";
import { Database } from "./types";
import { createKysely } from "@vercel/postgres-kysely";

export const pgDb = createKysely<Database>(
  {},
  {
    plugins: [new CamelCasePlugin()],
  }
);
