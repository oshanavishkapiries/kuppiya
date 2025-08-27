const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('acid.db'); // persistent DB

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY, name TEXT, balance INTEGER)");

  db.get("SELECT COUNT(*) as count FROM accounts", (err, row) => {
    if (row.count === 0) {
      db.run("INSERT INTO accounts (name, balance) VALUES ('A', 5000)");
      db.run("INSERT INTO accounts (name, balance) VALUES ('B', 2000)");
    }
  });
});

module.exports = db;