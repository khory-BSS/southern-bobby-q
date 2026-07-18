// Run: node generate-password-hash.js yourpassword
// Copy the printed hash into ADMIN_PASSWORD_HASH in your Railway environment variables.
const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node generate-password-hash.js <password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log(hash);
