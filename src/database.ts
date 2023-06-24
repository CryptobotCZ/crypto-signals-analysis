import { Schema } from "https://deno.land/x/cotton/mod.ts";
import { DB } from "https://deno.land/x/sqlite@v3.7.2/mod.ts";

export async function up(schema: Schema) {
    await schema.createTable("users", (table) => {
      table.id();
      table.varchar("name");
    });
  }

export async function down(schema: Schema) {
    await schema.dropTable("users");
}

export const db = new DB("test.db");
