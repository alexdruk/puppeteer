const util = require('util')
const mysql = require('mysql2')
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'cryptotrader.cbzcytw9sbsb.us-west-2.rds.amazonaws.com',
    user: 'adroukadmin',
    password: 'Adrouk1546!',
    database: 'ct'
})

// Ping database to check for common exception errors.
pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        else if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        else if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
        else 
            throw err;
            process.exit(1); 
    }

    if (connection) connection.release()

    return
})

// Promisify for Node.js async/await.
pool.query = util.promisify(pool.query)

module.exports = pool