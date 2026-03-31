const fs = require('fs/promises');
const path = require('path');

const pool = require('./pool');

const AUTO_MIGRATE = process.env.AUTO_MIGRATE !== 'false';

const initDatabase = async () => {
 if (!AUTO_MIGRATE) {
  console.log('AUTO_MIGRATE=false, se omite inicialización de esquema.');
  return;
 }

 const schemaPath = path.join(__dirname, 'schema.sql');
 const schemaSQL = await fs.readFile(schemaPath, 'utf8');

 await pool.query(schemaSQL);
 console.log('Esquema PostgreSQL verificado/inicializado correctamente.');
};

module.exports = {
 initDatabase
};
