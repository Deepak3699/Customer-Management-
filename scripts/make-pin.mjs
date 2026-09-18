/* PIN ka bcrypt hash banata hai — .env.local me daalne ke liye */
import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Naya PIN (4-6 ank): ', (pin) => {
  if (!/^\d{4,6}$/.test(pin)) { console.log('❌ Sirf 4-6 ank'); process.exit(1); }
  const hash = bcrypt.hashSync(pin, 10);
  const b64 = Buffer.from(hash, 'utf8').toString('base64');
  console.log('\n.env.local me yeh line daaliye:\n');
  console.log('SHOP_PIN_HASH=' + b64);
  console.log('\nVercel par bhi (Settings -> Environment Variables) yahi value daalein.');
  console.log('(Yeh base64 hai — isme $ nahi hota, isliye kahin nahi tootta.)\n');
  rl.close();
});
