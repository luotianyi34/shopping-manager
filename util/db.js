const mysql = require("mysql")
/*连接数据库*/
const connection = mysql.createConnection({
    host:"localhost",
    port:3306,
    user:"root",
    password:"1234",
    database:"shopping"
});
/*打开连接*/
connection.connect();

module.exports = connection;
