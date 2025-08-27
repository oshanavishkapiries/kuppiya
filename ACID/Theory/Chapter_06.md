# 📘 Chapter 6: Project Setup – Node.js ACID Simulation Playground

## 🎯 Goal

මේ chapter එකේදි අපි හදන්නේ **ගොඩක් ACID principles එකටම test කරන්න පුළුවන් Node.js backend service එකක්**.

👉 Features:

* Separate APIs for **Atomicity, Consistency, Isolation, Durability**
* One central **SQLite database**
* Reusable transaction helper functions
* Playground environment: ඔයාට edge cases simulate කරලා problems/debugging කරන්න පුළුවන්

---

## 🛠️ Step 1: Folder Structure

```
acid-playground/
 ├── db.js
 ├── server.js
 ├── package.json
 └── README.md
```

---

## 🛠️ Step 2: Dependencies Install

```bash
mkdir acid-playground
cd acid-playground
npm init -y
npm install express sqlite3
```

---

## 🛠️ Step 3: Database Setup (`db.js`)

```js
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
```

---

## 🛠️ Step 4: Server Setup (`server.js`)

```js
const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());

/**
 * Atomicity Example
 * Either full transfer succeeds or rolls back
 */
app.post('/atomic-transfer', (req, res) => {
  const { fromId, toId, amount } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amount, fromId], function(err) {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).send("Error deducting balance");
      }

      // simulate forced error
      if (amount > 3000) {
        db.run("ROLLBACK");
        return res.status(400).send("Atomicity test: Rollback due to transfer limit");
      }

      db.run("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amount, toId], function(err2) {
        if (err2) {
          db.run("ROLLBACK");
          return res.status(500).send("Error adding balance");
        }

        db.run("COMMIT");
        res.send("Atomic transfer successful");
      });
    });
  });
});

/**
 * Consistency Example
 * Prevent negative balance
 */
app.post('/consistent-transfer', (req, res) => {
  const { fromId, toId, amount } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    db.get("SELECT balance FROM accounts WHERE id = ?", [fromId], (err, row) => {
      if (err || !row || row.balance < amount) {
        db.run("ROLLBACK");
        return res.status(400).send("Consistency violation: Insufficient funds");
      }

      db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amount, fromId]);
      db.run("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amount, toId], (err2) => {
        if (err2) {
          db.run("ROLLBACK");
          return res.status(500).send("Transfer failed");
        }

        db.run("COMMIT");
        res.send("Consistent transfer successful");
      });
    });
  });
});

/**
 * Isolation Example
 * Simulate lost update without locks
 */
app.post('/isolation-lost-update', (req, res) => {
  const amount = 100;

  db.serialize(() => {
    db.get("SELECT balance FROM accounts WHERE id = 1", (err, rowA) => {
      let newBalanceA = rowA.balance - amount;

      db.get("SELECT balance FROM accounts WHERE id = 1", (err2, rowB) => {
        let newBalanceB = rowB.balance - amount;

        db.run("UPDATE accounts SET balance = ? WHERE id = 1", [newBalanceA], (err3) => {
          if (err3) return res.status(500).send("Error updating A");

          db.run("UPDATE accounts SET balance = ? WHERE id = 1", [newBalanceB], (err4) => {
            if (err4) return res.status(500).send("Error updating B");

            res.send("Isolation test: Lost update simulated");
          });
        });
      });
    });
  });
});

/**
 * Durability Example
 * Commit + simulate crash
 */
app.post('/durable-transfer', (req, res) => {
  const { fromId, toId, amount } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    db.get("SELECT balance FROM accounts WHERE id = ?", [fromId], (err, row) => {
      if (err || !row || row.balance < amount) {
        db.run("ROLLBACK");
        return res.status(400).send("Insufficient funds");
      }

      db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amount, fromId]);
      db.run("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amount, toId], (err2) => {
        if (err2) {
          db.run("ROLLBACK");
          return res.status(500).send("Error updating receiver");
        }

        db.run("COMMIT", () => {
          res.send("Durable transfer committed! Now simulating crash...");
          setTimeout(() => process.exit(1), 2000); // crash after commit
        });
      });
    });
  });
});

/**
 * Utility: View Accounts
 */
app.get('/accounts', (req, res) => {
  db.all("SELECT * FROM accounts", [], (err, rows) => {
    if (err) return res.status(500).send("Error fetching accounts");
    res.json(rows);
  });
});

app.listen(3000, () => console.log("ACID Playground running on port 3000"));
```

---

## 🧪 Step 5: Testing Plan

1. **Check Accounts**

   ```
   GET http://localhost:3000/accounts
   ```

2. **Atomicity Test** (rollback if >3000)

   ```
   POST http://localhost:3000/atomic-transfer
   {
     "fromId": 1,
     "toId": 2,
     "amount": 4000
   }
   ```

3. **Consistency Test** (no negative balances)

   ```
   POST http://localhost:3000/consistent-transfer
   {
     "fromId": 1,
     "toId": 2,
     "amount": 10000
   }
   ```

4. **Isolation Test** (lost update simulation)

   ```
   POST http://localhost:3000/isolation-lost-update
   ```

5. **Durability Test** (commit then crash)

   ```
   POST http://localhost:3000/durable-transfer
   {
     "fromId": 1,
     "toId": 2,
     "amount": 500
   }
   ```

