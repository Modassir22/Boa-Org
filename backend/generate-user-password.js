const bcrypt = require('bcryptjs');

const password = '.Hnhlw74QQ0q';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nUpdate query:');
console.log(`UPDATE users SET password = '${hash}' WHERE membership_no = 'BOA/LM/0016/2023';`);
