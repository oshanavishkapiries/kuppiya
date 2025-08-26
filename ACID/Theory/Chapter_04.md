# 📘 Chapter 4: Isolation (අයිසොලේෂන්)

## 🔹 Theory Part

**Definition:**
Isolation කියන්නේ **multiple transactions එකම වෙලාවට run වෙද්දී** ඒවා එකිනෙකට **interfere නොවෙන්න ඕන** කියන principle එක.

👉 සරල definition එක:

> එක transaction එකක් data එකට data corruption/dirty state cause කරන්න බෑ.

---

### ⚠️ Common Problems Without Isolation

1. **Dirty Read** 🩸

   * Transaction A → update data (not committed yet)
   * Transaction B → read that uncommitted data
   * If A later rolls back → B saw **wrong data**.

2. **Lost Update** ❌

   * Transaction A read balance (1000)
   * Transaction B read balance (1000)
   * A updates → balance = 800
   * B updates → balance = 900
   * Final balance should be 700, but actually = 900 (A’s update lost).

3. **Non-Repeatable Read** 🔁

   * Transaction A read a row (balance = 2000)
   * Transaction B updated the same row (balance = 3000)
   * Transaction A read again → balance = 3000 (same query → different result).

4. **Phantom Read** 👻

   * Transaction A runs query: `SELECT * FROM accounts WHERE balance > 1000` → returns 5 rows
   * Transaction B inserts new row with balance = 2000
   * Transaction A re-runs query → returns 6 rows (a “phantom” row appeared).

---

👉 **Solution:** Use **Transaction Isolation Levels**
(SQL databases usually provide 4 standard levels):

1. **READ UNCOMMITTED** → Dirty reads possible
2. **READ COMMITTED** → Prevents dirty reads
3. **REPEATABLE READ** → Prevents non-repeatable reads
4. **SERIALIZABLE** → Prevents all anomalies (but slowest)

---

## 🔹 Practical Part (Node.js Simulation)

අපි SQLite / MySQL එකේ `BEGIN TRANSACTION` use කරලා concurrency simulate කරන්න පුළුවන්.

### 1. Lost Update Simulation

අපි **same account balance update** කරන්න transactions දෙක එකවර run කරමු.

```js
app.post('/simulate-lost-update', async (req, res) => {
  const amount = 100;

  db.serialize(() => {
    // Transaction A
    db.get("SELECT balance FROM accounts WHERE id = 1", (err, rowA) => {
      let newBalanceA = rowA.balance - amount;

      // Transaction B (runs "concurrently")
      db.get("SELECT balance FROM accounts WHERE id = 1", (err2, rowB) => {
        let newBalanceB = rowB.balance - amount;

        // Commit A
        db.run("UPDATE accounts SET balance = ? WHERE id = 1", [newBalanceA], (err3) => {
          if (err3) return res.status(500).send("Error updating A");

          // Commit B (overwrites A’s update)
          db.run("UPDATE accounts SET balance = ? WHERE id = 1", [newBalanceB], (err4) => {
            if (err4) return res.status(500).send("Error updating B");

            res.send("Lost update simulation done");
          });
        });
      });
    });
  });
});
```

---

### 2. Fixing with Transactions (Isolation)

We can fix this with a **`BEGIN IMMEDIATE TRANSACTION` lock** (so only one transaction can update at a time).

```js
app.post('/safe-transfer', (req, res) => {
  const { fromId, toId, amount } = req.body;

  db.serialize(() => {
    db.run("BEGIN IMMEDIATE TRANSACTION"); // lock row

    db.get("SELECT balance FROM accounts WHERE id = ?", [fromId], (err, row) => {
      if (err || row.balance < amount) {
        db.run("ROLLBACK");
        return res.status(400).send("Insufficient funds or error");
      }

      db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amount, fromId]);
      db.run("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amount, toId], (err2) => {
        if (err2) {
          db.run("ROLLBACK");
          return res.status(500).send("Transfer failed");
        }

        db.run("COMMIT");
        res.send("Safe transfer with Isolation");
      });
    });
  });
});
```

---

## 🔹 Testing

1. Call `/simulate-lost-update` multiple times →

   * You’ll see account balance dropping incorrectly (lost updates).

2. Call `/safe-transfer` →

   * Always consistent, because transaction locks prevent parallel updates.
