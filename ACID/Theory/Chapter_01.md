## 🔹 Chapter 1: ACID යනු මොකක්ද?

ACID කියන්නේ **Database Transactions** වල quality හරියටම තියාගන්න හිතාගත් set of principles එකක්.
මේකෙන් data corruption, inconsistent states, හා multi-user problems වලට solution තියෙනවා.

👉 **ACID Breakdown**:

1. **Atomicity (අටොමීසිටි)**

   * Transaction එකක් හෝ **ඉවරවෙන්න ඕන** නැත්නම් **rollback වෙන්න ඕන**.
   * Example: ගිණුම A → ගිණුම B ට Data යවනකොට, දෙකම සාර්ථකව update වෙන්න ඕන. එකක් හරි, එකක් fail උනොත්, දෙකම cancel වෙන්න ඕන.

2. **Consistency (කන්සිස්ටන්සි)**

   * Transaction එකක් DB එකේ **valid rules break නොකර** සාර්ථක වෙන්න ඕන.
   * Example: Bank account balance එක **negative** වෙන්න දෙන්න බෑ.

3. **Isolation (අයිසොලේෂන්)**

   * Multiple users parallel transactions run කළත්, ඒවා එකිනෙකට disturb නොවෙන්න ඕන.
   * Example: දෙන්නෙක් එකවර bank account එකෙන් पैसे withdraw කරනවා.

4. **Durability (ඩියුරබිලිටි)**

   * Once transaction එක commit උනොත්, **system crash** උනත් data safe.
   * Example: Server එක crash උනත් commit උන transfer එක DB එකේ safe.


