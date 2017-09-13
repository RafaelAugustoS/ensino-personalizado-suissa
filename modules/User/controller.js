const mysql = require("mysql")
const md5 = require("MD5")

const list = (req, res) => res.json({"Message": "Ola mundo"})
const create = (req, res) => {
	// Cadastrando Usuario
	let query = "INSERT INTO ??(??, ??, ??) VALUES (?,?,?)";
	let table = ["users","nome","email", "senha", req.body.nome, req.body.email, md5(req.body.password)];
	query = mysql.format(query, table);

	connection.query(query, (err, rows) => {
		if(err){
			res.json({"Error": true, "Message": "Erro ao executar a query do MYSQL", "query": query})
		}else{			
			res.json({"Error" : false, "Message": "Usuario adicionado!"});

			// Enviando email
			conta.sendMail({
				from: 'iORDER <rafaeliorder@gmail.com>',
				to: req.body.nome+' <'+req.body.email+'>',
				subject: 'Testando envio de email iORDER',
			}, (err) => {
				if(err){
					throw err
				}else{
					console.log('Email Enviado')
				}
			})
		}
	})
}
const Controller = {
	list,
	create
}

module.exports = Controller