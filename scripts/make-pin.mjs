/* Generates bcrypt PIN hash for .env.local */
import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('New PIN (4-6 digits): ', (pin) => {
  if (!/^\d{4,6}$/.test(pin)) { console.log('❌ Only 4-6 digits allowed'); process.exit(1); }
  const hash = bcrypt.hashSync(pin, 10);
  const b64 = Buffer.from(hash, 'utf8').toString('base64');
  console.log('\nAdd this line to .env.local:\n');
  console.log('SHOP_PIN_HASH=' + b64);
  console.log('\nOn Vercel (Settings -> Environment Variables), set the same value.');
  console.log('(Base64 format avoids special character issues with $).\n');
  rl.close();
});
