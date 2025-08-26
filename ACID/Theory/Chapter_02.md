# 📘 Chapter 2: Atomicity (අටොමීසිටි)

## 🔹 Theory Part

**Definition:**
Atomicity කියන්නේ **"All or Nothing"** principle එක.
Transaction එක **partially complete වෙන්න බෑ**.

👉 සරල definition එක:

> Transaction එකක් success වෙන්න ඕනොත් **පූර්ණයෙන්ම success වෙන්න ඕන**. Fail උනොත් **Rollback වෙන්න ඕන**.

---

### 🏦 Banking Example (Theory)

* A ගිණුම → B ගිණුමට Rs. 1000 යවනවා.
* Steps:

  1. A account එකේ balance 1000 ට අඩු කරන්න
  2. B account එකේ balance 1000 ට වැඩි කරන්න

👉 Imagine, Step 1 success වෙලා, Step 2 fail උනා කියලා.

* A → -1000
* B → No update
* 🚨 Database එක inconsistent වෙලා, Data අතුරුදන්!

**Atomicity Rule:** එක fail උනොත්, **rollback** වෙන්න ඕන.

---

## 🔹 Practical Part (Node.js Example)

අපි සරල **Node.js + SQLite** backend එකක් ගන්නවා.
(ඔයා MySQL/PostgreSQL ද ගන්න පුළුවන්, මම SQLite simple කියලා use කරනවා example එකට).

### 1. Project Setup

```bash
mkdir acid-demo
cd acid-demo
npm init -y
npm install sqlite3 express
```

### 2. Create `db.js`

```js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:'); // In-memory DB for testing

// Initialize tables
db.serialize(() => {
  db.run("CREATE TABLE accounts (id INTEGER PRIMARY KEY, name TEXT, balance INTEGER)");
  db.run("INSERT INTO accounts (name, balance) VALUES ('A', 5000)");
  db.run("INSERT INTO accounts (name, balance) VALUES ('B', 2000)");
});

module.exports = db;
```

### 3. Create `server.js`

```js
const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());

// Atomic Bank Transfer
app.post('/transfer', (req, res) => {
  const { fromId, toId, amount } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amount, fromId], function(err) {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).send("Error deducting balance");
      }

      // Simulate error if transferring more than 3000
      if (amount > 3000) {
        db.run("ROLLBACK");
        return res.status(400).send("Transfer limit exceeded, rolled back");
      }

      db.run("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amount, toId], function(err2) {
        if (err2) {
          db.run("ROLLBACK");
          return res.status(500).send("Error adding balance");
        }

        db.run("COMMIT");
        res.send("Transfer successful");
      });
    });
  });
});

app.get('/accounts', (req, res) => {
  db.all("SELECT * FROM accounts", [], (err, rows) => {
    res.json(rows);
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

---

## 🔹 Testing Atomicity

1. Start server:

   ```bash
   node server.js
   ```

2. Check accounts before:

   ```
   GET http://localhost:3000/accounts
   ```

3. Valid transfer:

   ```
   POST http://localhost:3000/transfer
   {
     "fromId": 1,
     "toId": 2,
     "amount": 1000
   }
   ```

   ✅ Transfer success, balances updated.

4. Invalid transfer (over 3000):

   ```
   POST http://localhost:3000/transfer
   {
     "fromId": 1,
     "toId": 2,
     "amount": 4000
   }
   ```

   🚨 **Atomicity kicks in:**

   * Deduct attempt → rollback → final balance unchanged.

