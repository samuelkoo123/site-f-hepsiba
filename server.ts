
import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("hephzibah.db");

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    subject TEXT,
    message TEXT,
    status TEXT,
    date TEXT
  );

  CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    category TEXT,
    title TEXT,
    author TEXT,
    description TEXT,
    fileUrl TEXT,
    date TEXT
  );

  CREATE TABLE IF NOT EXISTS guestbook (
    id TEXT PRIMARY KEY,
    author TEXT,
    message TEXT,
    date TEXT
  );

  CREATE TABLE IF NOT EXISTS testimonies (
    id TEXT PRIMARY KEY,
    author TEXT,
    title TEXT,
    content TEXT,
    date TEXT
  );

  CREATE TABLE IF NOT EXISTS sponsorships (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    amount INTEGER,
    type TEXT,
    message TEXT,
    date TEXT
  );

  CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    date TEXT,
    type TEXT
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Migration: Assign IDs to legacy records missing them
  const tables = ["inquiries", "resources", "guestbook", "testimonies", "sponsorships", "calendar_events"];
  tables.forEach(table => {
    try {
      const rows = db.prepare(`SELECT rowid, * FROM ${table} WHERE id IS NULL OR id = ''`).all();
      rows.forEach((row: any) => {
        const newId = Math.random().toString(36).substr(2, 9);
        db.prepare(`UPDATE ${table} SET id = ? WHERE rowid = ?`).run(newId, row.rowid);
      });
    } catch (e) {
      console.error(`Migration error for ${table}:`, e);
    }
  });

  app.use(express.json());

  // API Routes
  app.get("/api/data", (req, res) => {
    try {
      const inquiries = db.prepare("SELECT * FROM inquiries ORDER BY date DESC").all();
      const resources = db.prepare("SELECT * FROM resources ORDER BY date DESC").all();
      const guestbook = db.prepare("SELECT * FROM guestbook ORDER BY date DESC").all();
      const testimonies = db.prepare("SELECT * FROM testimonies ORDER BY date DESC").all();
      const sponsorships = db.prepare("SELECT * FROM sponsorships ORDER BY date DESC").all();
      const calendarEvents = db.prepare("SELECT * FROM calendar_events ORDER BY date ASC").all();

      res.json({
        inquiries,
        resources,
        guestbook,
        testimonies,
        sponsorships,
        calendarEvents
      });
    } catch (error) {
      console.error("Fetch Error:", error);
      res.status(500).json({ error: "Failed to fetch data" });
    }
  });

  app.post("/api/save", (req, res) => {
    const { dbCategory, ...data } = req.body;
    
    try {
      let table = "";
      let columns = "";
      let placeholders = "";
      let values: any[] = [];

      // Ensure ID and Date exist
      const id = data.id || Math.random().toString(36).substr(2, 9);
      const date = data.date || new Date().toISOString().split('T')[0];

      if (dbCategory === "inquiry") {
        table = "inquiries";
        columns = "id, name, email, subject, message, status, date";
        placeholders = "?, ?, ?, ?, ?, ?, ?";
        values = [id, data.name, data.email, data.subject, data.message, data.status || 'pending', date];
      } else if (dbCategory === "resource") {
        table = "resources";
        columns = "id, category, title, author, description, fileUrl, date";
        placeholders = "?, ?, ?, ?, ?, ?, ?";
        values = [id, data.category, data.title, data.author, data.description, data.fileUrl, date];
      } else if (dbCategory === "guestbook") {
        table = "guestbook";
        columns = "id, author, message, date";
        placeholders = "?, ?, ?, ?";
        values = [id, data.author, data.message, date];
      } else if (dbCategory === "testimony") {
        table = "testimonies";
        columns = "id, author, title, content, date";
        placeholders = "?, ?, ?, ?, ?";
        values = [id, data.author, data.title, data.content, date];
      } else if (dbCategory === "sponsorship") {
        table = "sponsorships";
        columns = "id, name, phone, amount, type, message, date";
        placeholders = "?, ?, ?, ?, ?, ?, ?";
        values = [id, data.name, data.phone, data.amount, data.type, data.message, date];
      } else if (dbCategory === "calendar") {
        table = "calendar_events";
        columns = "id, title, description, date, type";
        placeholders = "?, ?, ?, ?, ?";
        values = [id, data.title, data.description, data.date, data.type];
      }

      if (table) {
        const stmt = db.prepare(`INSERT OR REPLACE INTO ${table} (${columns}) VALUES (${placeholders})`);
        stmt.run(...values);
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "Invalid category" });
      }
    } catch (error) {
      console.error("Save Error:", error);
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  app.post("/api/delete", (req, res) => {
    const { id, type } = req.body;
    if (!id) {
      return res.status(400).json({ error: "ID is required for deletion" });
    }
    
    try {
      let table = "";
      if (type === "inquiry") table = "inquiries";
      else if (type === "resource") table = "resources";
      else if (type === "guestbook") table = "guestbook";
      else if (type === "testimony") table = "testimonies";
      else if (type === "sponsorship") table = "sponsorships";
      else if (type === "calendar") table = "calendar_events";

      if (table) {
        const stmt = db.prepare(`DELETE FROM ${table} WHERE id = ?`);
        const result = stmt.run(id);
        if (result.changes > 0) {
          res.json({ success: true });
        } else {
          // If not found by ID, try to find by other fields if it's a legacy record with null ID
          // But since ID is PRIMARY KEY, this is tricky. 
          // Let's just return success if the query ran without error, 
          // but the user said it "doesn't delete", so we should be honest if 0 rows were changed.
          res.status(404).json({ error: "Record not found" });
        }
      } else {
        res.status(400).json({ error: "Invalid type" });
      }
    } catch (error) {
      console.error("Delete Error:", error);
      res.status(500).json({ error: "Failed to delete data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
