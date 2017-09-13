const mysql      = require("mysql")
const nodemailer = require('nodemailer')
const multer     = require('multer')
const Crypto     = require('node-crypt')
const path 		 = require('path')


const crypto = new Crypto({
	key: 'iorder_app_api_encrypt',
	algorithm: 'aes-256-ctr'
})

const optionsMulter = multer.diskStorage({
	destination: 'public/uploads/',
	filename: (req, file, cb) => {
		cb(null, (Math.random().toString(36) + '00000000000000000').slice(2, 10) + Date.now() + path.extname(file.originalname))	
	}
})

const upload = multer({storage: optionsMulter})

function REST_ROUTER(router, connection, md5, fs){
	let self = this;
	self.handleRoutes(router, connection, md5, fs);
}

// Criando Configuracoes para envio de email
let conta = nodemailer.createTransport({
	service: 'Gmail',
	auth: {
		user: 'rafaeliorder@gmail.com',
		pass: '60744027'
	}
})

const Controller = require("./modules/User/controller")

REST_ROUTER.prototype.handleRoutes = (router, connection, md5, fs) => {
	router.get("/", Controller.list);

	// Cadastrar usuario
	router.post("/users", Controller.create);

	
	// Login
	router.post("/login", (req, res) => {
		let query = "SELECT * FROM ?? WHERE ?? = ? AND ?? = ?";
		let table = ["users", "email", req.body.email, "senha", md5(req.body.password)]
		query = mysql.format(query, table)
		connection.query(query, (err, rows) => {
			if(err){
				res.json({"Error": true, "Message": "Erro ao executar query"})
			}else{
				if(rows.length == 0){
					res.json({"Error": false, "Message": "Usuario ou senha incorretos"})
				}else{
					let id = rows[0].id
					let query = "SELECT ui.gender, ui.birth, ui.id_city, ui.district, ui.street, ui.number, ui.avatar, u.nome, u.email, u.id FROM ?? AS u LEFT JOIN ?? AS ui ON u.id = ui.id_user WHERE u.id = ?"
					let table = ["users", "users_info", id]
					query = mysql.format(query, table)
					connection.query(query, (error, campos) => {
						if(error){
							res.json({"Error": false, "Message": "Erro ao retornar campos"})
						}else{
							res.json({"Error": false, "Message": "Sucesso", "Dados": campos})	
						}
					})
				}
			}
		})
	})

	// Upload foto de perfil
	router.post('/profile', multer({dest: "./public/uploads/"}).single('avatar'), (req, res) => {
		let fileInfo = []
		let bitmap = new Buffer(fs.readFileSync(req.file.path), 'base64')
		fileInfo.push({
			"originalName": req.file.originalName,
			"size": req.file.size,
			"base64": new Buffer(fs.readFileSync(req.file.path)).toString("base64")
		})

		fs.unlink(req.file.path)
		
		let query = "UPDATE ?? SET ?? = ? WHERE ?? = ?"
		let table = ["users_info", "avatar", fileInfo[0].base64, "id_user", req.body.id]
		query = mysql.format(query, table)
		connection.query(query, (err, rows) => {
			if(err){
				res.json({"Error": true, "Message": "Erro ao executar query do Mysql"});
			}else{
				res.json({"Error": false, "Message": "Successo", "base64": fileInfo[0].base64});
			}
		})
	})

	/* CONSULTA USUARIOS */
	// Todos os usuarios
	router.get("/users", (req, res) => {
		let query = "SELECT * FROM ??";
		let table = ["user_login"];
		query = mysql.format(query, table);
		connection.query(query, (err, rows) => {
			if(err){
				res.json({"Error": true, "Message": "Erro ao executar query do Mysql"});
			}else{
				res.json({"Error": false, "Message": "Successo", "Users": rows});
			}
		});
	});

	// Determinado usuario
	router.get("/users/:user_id", (req, res) => {
		let query = "SELECT * FROM ?? WHERE ??=?";
		let table = ["users", "id", req.params.user_id];
		query = mysql.format(query, table);
		connection.query(query, (err, rows) => {
			if(err){
				console.log(query)
				res.json({"Error": true, "Message": "Erro ao executar query do Mysql DSA s", "User": rows});
			}else{
				res.json({"Error": false, "Message": "Sucesso", "User": rows});
			}
		});
	});

	// Listando cardapio
	router.get("/menu", (req, res) => {
		let query = "SELECT * FROM ??";
		let table = ["menu"];
		query = mysql.format(query, table);
		connection.query(query, (err, rows) => {
			if(err){
				res.json({"Error": true, "Message": "Erro ao executar query do Mysql"});
			}else{
				res.json({"Error": false, "Message": "Sucesso", "Cardapio": rows});
			}
		})
	})

	// Buscar Estabelecimentos
	router.get("/estabelecimentos", (req, res) => {
		let query = "SELECT Geo(?, ?, latitude, longitude) AS Distancia, cnpj FROM ?? HAVING Distancia < 30"
		let table = [req.query.latitude, req.query.longitude, "company_info"]
		query = mysql.format(query, table)
		connection.query(query, (err, rows) => {
			console.log(req)
			if(err){
				res.json({"Error": true, "Message": "Erro ao executar query do Mysql", "Retorno": err})
			}else{
				res.json({"Error": false, "Message": "Sucesso", "Dados": rows});
			}
		})
	})

	router.get('/tempomedio', (req, res) => {
		let query = "SELECT AVG(TIME_TO_SEC(TIMEDIFF(t.entrada,t.saida))) / 60 AS espera_media FROM ?? t"
		let table = ["requests"]
		query = mysql.format(query, table)
		console.log(query)
		connection.query(query, (err, rows) => {
			if(err){
				res.json({"Error": true, "Message": "Erro ao executar query do Mysql", "Retorno": err})
			}else{
				res.json({"Error": false, "Message": "Sucesso", "Dados": rows});
			}	
		})
	})

	// Atualiza o usuario
	router.put('/users', (req, res) => {
		let query = "UPDATE ?? SET ?? = ? WHERE ?? = ?";
		let table = ["user_login", "user_password", md5(req.body.password), "user_id", req.body.id];
		query = mysql.format(query, table);
		connection.query(query, (err, rows) => {
			if(err){
				res.json({"Error": true, "Message": "Erro ao executar query do Mysql"});
			}else{
				res.json({"Error": false, "Message": "Usuario atualizado"});
			}
		});
	});

	router.put('/senha', (req, res) => {
		let senha = Math.random().toString(36).slice(-8)
		let query = "UPDATE ?? SET ?? = ? WHERE ?? = ?"
		let table = ["users", "senha", md5(senha), "email", req.body.email]
		query = mysql.format(query, table)
		connection.query(query, (err, rows) => {
			if(err){
				res.json({"Error": true, "Message": "Erro ao executar query do Mysql"});
				console.log(query)
			}else{
				res.json({"Error": false, "Message": "Senha enviada para email"});
				// Enviando email
				conta.sendMail({
					from: 'iORDER <rafaeliorder@gmail.com>',
					to: req.body.nome+' <'+req.body.email+'>',
					subject: 'iORDER - Nova senha gerada!',
					html: 'sua nova senha é: '+senha,
				}, (err) => {
					if(err){
						throw err
					}else{
						console.log('Email Enviado')
					}
				})
			}
		})
	})
}

module.exports = REST_ROUTER;