const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:'); // In-memory DB for testing

// Initialize tables
db.serialize(() => {
  db.run("CREATE TABLE accounts (id INTEGER PRIMARY KEY, name TEXT, balance INTEGER)");
  db.run("INSERT INTO accounts (name, balance) VALUES ('A', 5000)");
  db.run("INSERT INTO accounts (name, balance) VALUES ('B', 2000)");
});

module.exports = db;