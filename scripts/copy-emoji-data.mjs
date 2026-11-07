// The emoji picker reads its data from our own server, so it never calls a public CDN.
import { cpSync, mkdirSync } from "node:fs";

mkdirSync("public/emoji-data/en", { recursive: true });
for (const file of ["data.json", "messages.json"]) {
  cpSync(`node_modules/emojibase-data/en/${file}`, `public/emoji-data/en/${file}`);
}
