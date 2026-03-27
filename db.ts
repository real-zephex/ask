import {Database} from "bun:sqlite";
import {homedir} from "os";
import {join} from "path";

const dbPath = join(homedir(), "history.sqlite");
const db = new Database(dbPath, { create: true, strict: true });

db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA foreign_keys = ON;");

db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      response_from TEXT,
      content TEXT,
      created_at TEXT DEFAULT (datetime('now'))
  )
`);

export type Message = {
  id: number;
  response_from: "assistant" | "user";
  content: string;
  created_at: string;
}

// Apparently prepared queries are better for performance (acc to Claude)
const insertMessage = db.prepare<Message, ["assistant" | "user", string]>(
  "INSERT INTO messages (response_from, content) VALUES (?, ?) RETURNING *"
);

const readMessages = db.prepare<Message, [number]>(
  "SELECT * FROM messages ORDER BY id DESC LIMIT ?"
);

const deleteMessages = db.prepare("DELETE FROM messages");


export const putMessage = ({ data } : { data: Omit<Message, "id" | "created_at"> }) => {
  try {
    insertMessage.get(data.response_from, data.content);
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("Error while writing message to the database: ", errorMessage);
  }
}

export const getMessages = (limit: number = 20) => {
  try {
    const messages = readMessages.all(limit);
    return messages.reverse();
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("Error while reading message from database: ", errorMessage);
    return [];
  }
}

export const clearMessages = () => {
  try {
    deleteMessages.run();
    console.log("History cleared.");
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("Error while clearing messages: ", errorMessage);
  }
}

