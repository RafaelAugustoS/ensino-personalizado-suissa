const express    = require("express")
const mysql      = require("mysql")
const bodyParser = require("body-parser");
const md5 	     = require("MD5")
const rest 	     = require("./REST.js")
const app 	     = express()
const morgan     = require("morgan")
const morganBody = require("morgan-body")
const formidable = require('formidable')
const fs   	     = require("fs")
const path       = require("path")
const cors       = require('cors')

// Configucãos padroes
const config = {
	port: 3080,
	email: '@gmail.com'
}



let accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {
	flags: 'a'
})

app.use(cors())
app.use(bodyParser.json())
app.use(express.static('./public'))
morganBody(app);


function REST(){
	let self = this
	return self.connectMysql()
}

REST.prototype.connectMysql = function(){
	let self = this;
	let pool = mysql.createPool({
		connectionLimit: 100,
		host: 'localhost',
		user: 'root',
		password: 'root',
		port: 8889,
		database: 'iorder',
		debug: false
	});
	return pool.getConnection(function(err, connection){
		console.log(err)
		console.log(connection)
		if(err){
			return self.stop(err);
		}

		return self.configureExpress(connection);
	});
}

REST.prototype.configureExpress = function(connection){
	let self = this;

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended: true
	}));

	const router = express.Router();
	app.use('/api', router);

	let rest_router = new rest(router, connection, md5, fs);
	self.startServer();
}

REST.prototype.startServer = function(){
	app.listen(config.port, function(){
		console.log('Servidor rodando na porta '+config.port);
	});
}

REST.prototype.stop = function(err){
	console.log('Erro no MYSQL n' + err);
	process.exit(1);
}

const myConnection = new REST();
console.log(myConnection)