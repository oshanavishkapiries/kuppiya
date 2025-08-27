# 📘 Chapter 5: Durability (ඩියුරබිලිටි)

## 🔹 Theory Part

**Definition:**
Durability කියන්නේ once a transaction **commit උනොත්**, ඒ data එක system crash 🖥️, power failure ⚡, හෝ server restart 🔄 වුණත් **safe** වෙන්න ඕන කියන principle එක.

👉 සරල definition එක:

> **Commit = Forever.**

---

### 🏦 Banking Example (Theory)

* A → B ට Rs. 1000 transfer කරනවා.
* Transaction commit උනා → A balance -1000, B balance +1000.
* Suddenly **server crash** 😱

👉 **Without Durability:** Transfer lost, DB rollback වෙලා balances වෙනස් වෙන්නේ නෑ.
👉 **With Durability:** Crash උනත් DB commit data safe.

---

### 📌 How Databases Ensure Durability

1. **Write-Ahead Logs (WAL)** – Before commit, transaction log එක disk එකේ save වෙනවා.
2. **Checkpoints** – Periodically DB state flush වෙනවා disk එකට.
3. **Backups + Replication** – Extra copies keep කරනවා failures handle කරන්න.

SQLite/MySQL/Postgres වගේ DBms වල durability ensure කරනවා default.

---

## 🔹 Practical Part (Node.js Example)

අපි මෙක simulate කරන්න පුළුවන්:

* Transaction commit කරනවා.
* Crash එක simulate කරනවා (process.exit()).
* Server restart උනත් committed data safe.

---

### 1. Use file-based SQLite DB (instead of in-memory)

`db.js`

```js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('bank.db'); // file-based DB

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY, name TEXT, balance INTEGER)");
  
  // Insert sample accounts if empty
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

### 2. Create Durable Transfer API

`server.js`

```js
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
          return res.status(500).send("Transfer failed");
        }

        db.run("COMMIT", (err3) => {
          if (err3) {
            return res.status(500).send("Commit failed");
          }

          // Simulate crash right after commit
          setTimeout(() => {
            console.log("Simulating crash...");
            process.exit(1); // crash
          }, 2000);

          res.send("Transfer committed. System may crash, but data is safe!");
        });
      });
    });
  });
});
```

---

## 🔹 Testing Durability

1. Start server:

   ```bash
   node server.js
   ```

2. Call API:

   ```json
   POST http://localhost:3000/durable-transfer
   {
     "fromId": 1,
     "toId": 2,
     "amount": 500
   }
   ```

3. Server commits transaction ✅ → then simulates crash (process.exit).

4. Restart server again:

   ```bash
   node server.js
   ```

5. Check balances:

   ```bash
   GET http://localhost:3000/accounts
   ```

   👉 You’ll see data persisted → **Durability principle verified** 🎉

