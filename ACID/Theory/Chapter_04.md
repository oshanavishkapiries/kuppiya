# 📘 Chapter 3: Consistency (කන්සිස්ටන්සි)

## 🔹 Theory Part

**Definition:**
Consistency කියන්නේ transaction එකක් DB එකට apply වුනාම, Database එක **valid state** එකකම තියෙන්න ඕන කියන principle එක.

👉 සරල definition එක:

> Database එකේ **rules (constraints, validations, business logic)** කිසිදා **break වෙන්න දෙන්න බෑ**.

---

### 🏦 Banking Example (Theory)

Imagine:

* Bank account එකේ balance එක **negative** වෙන්න දෙන්න බෑ.
* Transaction එකක් fail උනොත්, **rollback** වෙලා DB එක පරණ valid state එකේම තියෙන්න ඕන.

**Example:**

* A ගිණුම = Rs. 2000
* A wants to transfer Rs. 5000 to B

👉 Atomicity එක check කරනවා **All or Nothing** කියලා.
👉 **Consistency check කරනවා**: “A balance < 0 වෙන්නේද?”

* Answer YES → ❌ Reject transaction
* Answer NO → ✅ Commit transaction

---

## 🔹 Practical Part (Node.js Example)

අපි consistency rule එකක් add කරනවා:

> **Account balance එක negative වෙන්න දෙන්න බෑ.**

---

### 1. Modify `server.js` (transfer route)

```js
app.post('/transfer', (req, res) => {
  const { fromId, toId, amount } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // Check if fromId has enough balance (Consistency Rule)
    db.get("SELECT balance FROM accounts WHERE id = ?", [fromId], (err, row) => {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).send("DB Error");
      }

      if (!row || row.balance < amount) {
        db.run("ROLLBACK");
        return res.status(400).send("Insufficient funds - Consistency violation");
      }

      // Deduct from sender
      db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amount, fromId], function(err2) {
        if (err2) {
          db.run("ROLLBACK");
          return res.status(500).send("Error deducting balance");
        }

        // Add to receiver
        db.run("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amount, toId], function(err3) {
          if (err3) {
            db.run("ROLLBACK");
            return res.status(500).send("Error adding balance");
          }

          db.run("COMMIT");
          res.send("Transfer successful (Consistency maintained)");
        });
      });
    });
  });
});
```

---

## 🔹 Testing Consistency

1. Start server:

   ```bash
   node server.js
   ```

2. Try normal transfer (valid funds):

   ```json
   POST http://localhost:3000/transfer
   {
     "fromId": 1,
     "toId": 2,
     "amount": 1000
   }
   ```

   ✅ Success – balances update.

3. Try invalid transfer (overdraft attempt):

   ```json
   POST http://localhost:3000/transfer
   {
     "fromId": 1,
     "toId": 2,
     "amount": 10000
   }
   ```

   🚨 Result → **"Insufficient funds - Consistency violation"**

   * DB state **unchanged**.
   * No negative balances.


