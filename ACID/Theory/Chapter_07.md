# 📘 Chapter 7: Atomicity Deep Dive

## 🔹 Recap

Atomicity = **All or Nothing** principle.
Transaction එකක් සාර්ථක වුණොත් → **Full Commit**
Fail වුණොත් → **Full Rollback**

---

## 🔹 Why Atomicity is Important?

1. **Partial Updates Issue**

   * A → B ට Data යවලා A deduct උනා.
   * Server crash → B increment වෙලා නෑ.
   * 🚨 Data loss / corruption

2. **Multiple Steps Transactions**

   * Order place කරනකොට:

     * Order entry create වෙන්න ඕන
     * Payment deduct වෙන්න ඕන
     * Stock reduce වෙන්න ඕන
   * එකක් fail උනොත් **Rollback All**

---

## 🔹 Example Scenarios

### ✅ Correct Atomic Transaction

* Deduct balance from A
* Add balance to B
* Commit

### ❌ Incorrect (No Atomicity)

* Deduct A → Crash → No add to B
* DB inconsistent

---

## 🔹 Node.js Practical – Multi-Step Transaction

මේකෙන් අපි **multi-step transaction** එකක් run කරලා Atomicity test කරන්නම්.

---

### 1. API: Order Placement with Atomicity

```js
app.post('/place-order', (req, res) => {
  const { customerId, productId, quantity, price } = req.body;
  const total = quantity * price;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // 1. Deduct stock
    db.get("SELECT stock FROM products WHERE id = ?", [productId], (err, row) => {
      if (err || !row || row.stock < quantity) {
        db.run("ROLLBACK");
        return res.status(400).send("Not enough stock");
      }

      db.run("UPDATE products SET stock = stock - ? WHERE id = ?", [quantity, productId]);

      // 2. Deduct money from customer
      db.get("SELECT balance FROM accounts WHERE id = ?", [customerId], (err2, row2) => {
        if (err2 || !row2 || row2.balance < total) {
          db.run("ROLLBACK");
          return res.status(400).send("Insufficient funds");
        }

        db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [total, customerId]);

        // 3. Insert order
        db.run("INSERT INTO orders (customerId, productId, quantity, total) VALUES (?, ?, ?, ?)", 
          [customerId, productId, quantity, total], function(err3) {
          if (err3) {
            db.run("ROLLBACK");
            return res.status(500).send("Order failed");
          }

          // ✅ Everything good → Commit
          db.run("COMMIT");
          res.send("Order placed successfully (Atomic)");
        });
      });
    });
  });
});
```

---

### 2. Setup Tables for Test

Add this to `db.js`:

```js
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT, stock INTEGER)");
  db.run("CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, customerId INTEGER, productId INTEGER, quantity INTEGER, total INTEGER)");

  db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
    if (row.count === 0) {
      db.run("INSERT INTO products (name, stock) VALUES ('Laptop', 10)");
    }
  });
});
```

---

### 3. Test Cases

1. **Valid Order**

   ```
   POST http://localhost:3000/place-order
   {
     "customerId": 1,
     "productId": 1,
     "quantity": 2,
     "price": 1000
   }
   ```

   ✅ Stock reduce, balance deduct, order create

2. **Invalid Order (Insufficient Funds)**

   ```
   POST http://localhost:3000/place-order
   {
     "customerId": 1,
     "productId": 1,
     "quantity": 5,
     "price": 2000
   }
   ```

   🚨 **Rollback** → Stock unchanged, order not created, balance unchanged

---

## 🔹 Edge Cases

1. **System Crash during Transaction**

   * If crash before commit → Rollback → DB safe
   * If crash after commit → Changes saved

2. **Multiple Operations**

   * Atomicity works even with 5–6 queries
   * Either **All succeed** or **All rollback**

