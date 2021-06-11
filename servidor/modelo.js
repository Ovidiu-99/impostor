var cad = require('./cad.js');

function Juego(min, test) {
	this.cad = new cad.Cad();
	this.min = min;
	this.partidas = {};
	this.crearPartida = function (num, nick) {
		let codigo = "fallo";
		if (!this.partidas[codigo] && this.numeroValido(num)) {
			codigo = this.obtenerCodigo();
			this.partidas[codigo] = new Partida(num, nick, codigo, this);
			this.insertarPartida({"nick":nick,"numeroJugadores":num,"fase":this.partidas[codigo].fase.nombre,"fecha":Date.now()});
		}
		return codigo;
	}
	this.unirAPartida = function (codigo, nick) {
		var res = -1;
		if (this.partidas[codigo]) {
			res = this.partidas[codigo].agregarUsuario(nick);
		}
		return res;
	}
	this.obtenerCodigo = function () {
		let cadena = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		let letras = cadena.split('');
		let maxCadena = cadena.length;
		let codigo = [];
		for (i = 0; i < 6; i++) {
			codigo.push(letras[randomInt(1, maxCadena) - 1]);
		}
		return codigo.join('');
	}
	this.numeroValido = function (numero) {
		return numero >= this.min && numero <= 10;
	}
	this.eliminarPartida = function (codigo) {
		delete this.partidas[codigo];
	}
	this.listaPartidas = function(){
		var listaJSON = [];
		var huecos = 0;
		for(key in this.partidas){
			var partida = this.partidas[key];
			var owner = partida.nickOwner;
			listaJSON.push({"codigo":key,"owner":owner});
		}
		return listaJSON;
	}
	this.listaPartidasDisponibles = function(){
		var listaJSON = [];
		var huecos = 0;
		var maximo;
		for(key in this.partidas){
			var partida = this.partidas[key];
			huecos = partida.huecos();
			maximo = partida.maximo;
			if(huecos>0){
				listaJSON.push({"codigo":key,"huecos":huecos, "maximo":maximo});
			}
		}
		return listaJSON;
	}
	this.iniciarPartida = function(codigo, nick){
		var owner = this.partidas[codigo].nickOwner;
		if(nick==owner){
			this.partidas[codigo].iniciarPartida();
		}
	}
	this.lanzarVotacion = function(codigo, nick){
		var usr = this.partidas[codigo].usuarios[nick];
		usr.lanzarVotacion();
	}
	this.obtenerFase = function(codigo){
		var fase = this.partidas[codigo].fase.nombre;
		return fase;
	}
	this.saltarVoto = function(codigo, nick){
		var usr = this.partidas[codigo].usuarios[nick];
		usr.saltar();
	}
	this.votar = function(codigo, nick, sospechoso){
		var usr = this.partidas[codigo].usuarios[nick];
		usr.votar(sospechoso);
	}
	this.obtenerEncargo = function(codigo, nick){
		var res = {}
		var encargo = this.partidas[codigo].usuarios[nick].encargo;
		var impostor = this.partidas[codigo].usuarios[nick].impostor;
		res = {"encargo" : encargo, "impostor" : impostor}
		return res;
	}
	this.obtenerListaJugadores = function(codigo){
		return this.partidas[codigo].obtenerListaJugadores();
	}
	this.atacar=function(codigo,nick,atacado){
		var usr=this.partidas[codigo].usuarios[nick];
		usr.atacar(atacado);
	}
	this.realizarTarea = function(codigo, nick){
		this.partidas[codigo].realizarTarea(nick);
	}

	this.partidasCreadas = function(admin, callback) {
		if(admin == "adminOvidiu"){
			this.cad.obtenerPartidaCriterio({fase:"Inicial"},function(lista) {
				if(lista){
					callback(lista);
				}else{
					callback([]);
				}
			});
		}
	}

	this.partidasTerminadas = function(admin, callback) {
		if(admin == "adminOvidiu"){
			this.cad.obtenerPartidaCriterio({fase:"Final"},function(lista) {
				if(lista){
					callback(lista);
				}else{
					callback([]);
				}
			});
		}
	}

	this.insertarPartida = function(log) {
		if(test == "noTest"){
			this.cad.insertarPartida(log,function(res){});
		}
	}

	//this.cad.connect();
	if(test == "noTest"){
		this.cad.connect(function(db){
			console.log("conectado a Atlas");
		})
	}
}

function Partida(num, owner, codigo, juego) {
	this.maximo = num;
	this.nickOwner = owner;
	this.juego = juego;
	this.fase = new Inicial();
	this.codigo = codigo;
	this.usuarios = {};
	this.elegido = "no hay nadie elegido";
	this.tareas = ["jardines", "calles", "mobiliario", "basuras"];
	this.ganador;
	this.agregarUsuario = function (nick) {
		return this.fase.agregarUsuario(nick, this);
	}
	this.puedeAgregarUsuario = function (nick) {
		let nuevo = nick;
		let contador = 1;
		while (this.usuarios[nuevo]) {
			nuevo = nick + contador;
			contador = contador + 1;
		}
		this.usuarios[nuevo] = new Usuario(nuevo);
		this.usuarios[nuevo].partida = this;
		var numero = this.numeroDeJugadores() - 1;
		this.usuarios[nuevo].numJugador = numero;
		if (this.comprobarMinimo()){
			this.fase=new Completado();
		}
		return {"codigo":this.codigo,"nick":nuevo,"numJugador":numero};
	}
	this.comprobarMinimo = function () {
		return this.numeroDeJugadores() >= this.juego.min;
	}
	this.comprobarMaximo = function () {
		return this.numeroDeJugadores() <= this.maximo;
	}
	this.iniciarPartida = function () {
		this.fase.iniciarPartida(this);
	}
	this.puedeIniciarPartida = function () {
		this.fase = new Jugando();
		this.asignarTareas();
		this.asignarImpostor();
	}
	this.asignarTareas = function () {
		let i=0;
		for (var key in this.usuarios) {
		    this.usuarios[key].encargo=this.tareas[i];
		    i=(i+1)%(this.tareas.length);
		}
	}
	this.asignarImpostor = function () {
		var keys = Object.keys(this.usuarios);
		var usuarioAleatorio = keys[randomInt(0, keys.length)];
		this.usuarios[usuarioAleatorio].asignarImpostor();
		//this.usuarios[usuarioAleatorio].impostor = true;
	}
	this.abandonarPartida = function (nick) {
		this.fase.abandonarPartida(nick, this);
	}
	this.puedeAbandonarPartida = function (nick) {
		this.eliminarUsuario(nick);
		if (!this.comprobarMinimo()) {
			this.fase = new Inicial();
		}
		if(this.numeroDeJugadores() <= 0){
			this.juego.eliminarPartida(this.codigo);
			this.ganador = "Abandono";
			this.finPartida();
		}
	}
	this.eliminarUsuario = function (nick) {
		delete this.usuarios[nick];
	}
	this.numeroDeJugadores = function () {
		return Object.keys(this.usuarios).length;
	}
	this.obtenerListaJugadores = function(){
		var lista = [];
		for(var key in this.usuarios){
			var usr = this.usuarios[key];
			lista.push({"nick":usr.nick, "numJugador":usr.numJugador});
		}
		return lista;
	}
	this.obtenerListaJugadoresVivos = function(){
		var lista = [];
		for(var key in this.usuarios){
			if(this.usuarios[key].estadoVivo()){
				var usr = this.usuarios[key];
				lista.push({"nick":usr.nick, "numJugador":usr.numJugador});
			}
		}
		return lista;
	}
	this.atacar = function (nick) {
			this.fase.atacar(nick, this);
	}
	this.puedeAtacar = function (inocente) {
		this.usuarios[inocente].esAtacado();
		this.comprobarFinal();
	}
	this.numeroImpostores = function () {
		let cont = 0;
		for (var key in this.usuarios) {
			if (this.usuarios[key].impostor){
				cont++;
			}
		}
		return cont;
	}
	this.numeroImpostoresVivos = function () {
		let cont = 0;
		for (var key in this.usuarios) {
			if (this.usuarios[key].impostor && this.usuarios[key].estadoVivo()){
				cont++;
			}
		}
		return cont;
	}
	this.numeroCiudadanosVivos = function () { 
		let cont = 0;
		for (var key in this.usuarios) {
			if (!this.usuarios[key].impostor && this.usuarios[key].estadoVivo()) {
				cont++;
			}
		}
		return cont;
	}
	this.votar = function(sus){
		this.fase.votar(sus, this);
	}
	this.puedeVotar = function(sus){
		this.usuarios[sus].esVotado();
		this.comprobarVotacion();
	}
	this.gananImpostores = function () {
		return this.numeroImpostoresVivos() >= this.numeroCiudadanosVivos();
	}
	this.gananCiudadanos = function () {
		return this.numeroImpostoresVivos() == 0;
	}
	this.masVotado=function(){
		let max=1;
		var usr=undefined;
		for (var key in this.usuarios) {
			if (this.usuarios[key].impostor.votos >= max && this.usuarios[key].estadoVivo()) {
				max = this.usuarios[key].impostor.votos;
				usr = this.usuarios[key];
			}
		}
		//comprobar que solo hay 1 mas votado
		return usr;
	}
	this.numeroSkips=function(){
		let nSkips=0;
		for (var key in this.usuarios) {
			if (this.usuarios[key].skip && this.usuarios[key].estadoVivo()) {
				nSkips++;
			}
		}
		return nSkips;
	}
	this.todosHanVotado = function(){
		let res=true;
		for (var key in this.usuarios) {
			if (!this.usuarios[key].haVotado && this.usuarios[key].estadoVivo()) {
				res = false;
				break;
			}
		}
		return res;
	}
	this.listaHanVotado = function(){
		var lista = [];
		for (var key in this.usuarios) {
			if (this.usuarios[key].haVotado && this.usuarios[key].estadoVivo()) {
				lista.push(key);
			}
		}
		return lista;
	}
	this.comprobarVotacion=function(){
		if (this.todosHanVotado()){
			let elegido=this.masVotado();
			if (elegido && elegido.votos>this.numeroSkips()){
				elegido.esAtacado();
				this.elegido=elegido.nick;
			}
			this.finalVotacion();
		}
	}
	this.finalVotacion = function(){
		this.fase = new Jugando();
		//this.reiniciarContadoresVotaciones(); //ha votado, skip, elegido
		this.comprobarFinal();
	}
	this.reiniciarContadoresVotaciones = function(){
		this.elegido = "no hay nadie elegido";
		for(var key in this.usuarios){
			if(this.usuarios[key].estadoVivo())
			this.usuarios[key].reiniciarContadoresVotaciones();
		}
	}
	this.masVotado=function(){
		let votado="no hay nadie elegido";
		let max=1;
		for (var key in this.usuarios) {
			if (max<this.usuarios[key].votos){
				max=this.usuarios[key].votos;
				votado=this.usuarios[key];
			}
		}
		return votado;
	}
	this.comprobarFinal=function(){
		if (this.gananImpostores()){
			this.ganador = "Impostor";
			this.finPartida();
		}
		else if (this.gananCiudadanos()){
			this.ganador = "Ciudadanos";
			this.finPartida();
		}
	}
	this.finPartida=function(){
		console.log(this.ganador);
		this.fase = new Final();
		this.juego.insertarPartida({"nick":this.nickOwner,"numeroJugadores":this.numeroDeJugadores(),"fase":this.fase.nombre,"fecha":Date.now(),"ganador":this.ganador});
	}
	this.lanzarVotacion=function(){
		this.fase.lanzarVotacion(this);
	}
	this.puedeLanzarVotacion=function(){
		this.reiniciarContadoresVotaciones();
		this.fase=new Votacion();
	}
	this.huecos = function(){
		return this.maximo-this.numeroDeJugadores();
	}
	this.realizarTarea = function(nick){
		this.fase.realizarTarea(nick, this);
	}
	this.puedeRealizarTarea = function(nick){
		this.usuarios[nick].realizarTarea();
	}
	this.tareaTerminada = function(nick){
		var tareasTerminadas = this.comprobarTareasTerminadas();
		if(tareasTerminadas){
			this.ganador = "Ciudadanos";
			this.finPartida();
		}
	}
	this.comprobarTareasTerminadas = function(){
		let res = true;
		for (var key in this.usuarios){
			if(this.usuarios[key].estadoTarea != "completado"){
				res = false;
			}
		}
		return res;
	}
	this.porcentajeTarea = function(nick){
		return this.usuarios[nick].porcentajeTarea();
	}
	this.porcentajeGlobal = function(){
		var total = 0;
		for (var key in this.usuarios){
			total = total + this.porcentajeTarea(key);
		}
		total = total / (this.numeroDeJugadores() - this.numeroImpostores());
		return total;
	}
	this.obtenerImpostor = function(){
		var impostor;
		for (var key in this.usuarios){
			if(this.usuarios[key].impostor){
				impostor = this.usuarios[key];
			}
		}
		return impostor;
	}
	this.elegidoEsImpostor = function(){
		return this.elegido == this.obtenerImpostor().nick;
	}
	this.haTerminado = function () {
		return this.fase.nombre == "Final";
	}

	this.agregarUsuario(owner);
}

function Inicial() {
	this.nombre = "Inicial";
	this.agregarUsuario = function (nick, partida) {
		return partida.puedeAgregarUsuario(nick);
		// if (partida.comprobarMinimo()) {
		// 	partida.fase = new Completado();
		// }
	}
	this.iniciarPartida = function (partida) {
		console.log("Faltan jugadores");
	}
	this.abandonarPartida = function (nick, partida) {
		partida.puedeAbandonarPartida(nick);
		//comprobar si no quedan usuarios
	}
	this.atacar = function (inocente) {
	}
	this.lanzarVotacion = function(){
	}
	this.votar=function(sus, partida){
	}
	this.realizarTarea = function(nick, partida){
		
	}
}

function Completado() {
	this.nombre = "Completado";
	this.agregarUsuario = function (nick, partida) {
		if (partida.comprobarMaximo()) {
			return partida.puedeAgregarUsuario(nick);
		}
		else {
			console.log("Lo siento, numero máximo")
		}
	}
	this.iniciarPartida = function (partida) {
		partida.puedeIniciarPartida();
		//asignar engcargos: secuencialmente a todos los usr
		//asignarimpostor dado el array usuario Object.keys

	}
	this.abandonarPartida = function (nick, partida) {
		partida.puedeAbandonarPartida(nick);
		if (!partida.comprobarMinimo()){
			partida.fase=new Inicial();
		}
	}
	this.atacar = function (inocente) {
	}
	this.lanzarVotacion = function(){
	}
	this.votar=function(sus, partida){
	}
	this.realizarTarea = function(nick, partida){
		
	}
}
function Jugando() {
	this.nombre = "Jugando";
	this.agregarUsuario = function (nick, partida) {
		console.log("La partida ya ha comenzado");
	}
	this.iniciarPartida = function (partida) {
	}
	this.abandonarPartida = function (nick, partida) {
		partida.puedeAbandonarPartida(nick);
		//comprobar si termina la partida
	}
	this.atacar = function (inocente, partida) {
		partida.puedeAtacar(inocente);
	}
	this.lanzarVotacion = function(partida){
		partida.puedeLanzarVotacion();
	}
	this.votar=function(sus, partida){
	}
	this.realizarTarea = function(nick, partida){
		partida.puedeRealizarTarea(nick);
	}
}

function Votacion(){
	this.nombre="Votacion";
	this.agregarUsuario=function(nick,partida){}
	this.iniciarPartida=function(partida){}
	this.abandonarPartida=function(nick,partida){}
	this.atacar=function(inocente){}
	this.lanzarVotacion=function(){}
	this.votar=function(sus, partida){
		partida.puedeVotar(sus);
	}
	this.realizarTarea = function(nick, partida){
		
	}
}

function Final() {
	this.nombre = "Final";
	this.agregarUsuario = function (nick, partida) {
		console.log("La partida ya ha terminado");
	}
	this.iniciarPartida = function (partida) {
	}
	this.abandonarPartida = function (nick, partida) {
		//partida.puedeAbandonarPartida();
		//esto es absurdo (salvo para javier xd)
		//eliminar el usuario y comprobar si no quedan usuarios
	}
	this.atacar = function (nick, partida) {
	}
	this.lanzarVotacion = function(){
	}
	this.votar=function(sus, partida){
	}
	this.realizarTarea = function(nick, partida){
		
	}
}

function Usuario(nick) {
	this.nick = nick;
	// this.juego = juego;
	this.partida;
	this.impostor = false;
	this.encargo = "ninguno";
	this.votos = 0;
	this.skip = false;
	this.haVotado = false;
	this.numJugador;
	this.estado = new Vivo();
	this.estadoTarea = "no completado";
	this.realizado = 0;
	this.maxTarea = 10;
	this.estadoVivo = function(){
		return this.estado.estadoVivo();
	}
	this.iniciarPartida = function () {
		this.partida.iniciarPartida();
	}
	this.abandonarPartida = function () {
		this.partida.abandonarPartida(this.nick);
		if (this.partida.numeroDeJugadores() <= 0) {
			console.log(this.nick+" era el ultimo jugador de la partida.")
		}
	}
	this.atacar = function (nick) {
		if (this.impostor) res = this.partida.atacar(nick);
	}
	this.saltar=function(){
		this.haVotado = true;
		this.skip=true;
		this.partida.comprobarVotacion();
	}
	this.lanzarVotacion=function(){
		this.estado.lanzarVotacion(this);
	}
	this.puedeLanzarVotacion=function(){
		this.partida.lanzarVotacion();
	}
	this.esAtacado = function () {
		this.estado.esAtacado(this);
	}
	this.votar=function(sospechoso){
		this.haVotado=true;
		this.partida.votar(sospechoso);
	}
	this.esVotado=function(){
		this.votos++;
	}
	this.reiniciarContadoresVotaciones = function(){
		this.votos = 0;
		this.haVotado = false;
		this.skip = false;
	}
	this.realizarTarea = function(){
		if(!this.impostor){
			this.realizado++;
			if(this.realizado >=this.maxTarea){
				this.realizado = this.maxTarea;
				this.estadoTarea = "completado";
				this.partida.tareaTerminada(this.nick);
			}	
		}
	}
	this.asignarImpostor = function(){
		this.impostor = true;
		this.estadoTarea = "completado";
		//this.realizado = this.maxTarea;
	}
	this.porcentajeTarea = function(){
		return 100*(this.realizado/this.maxTarea);
	}
}

function Vivo() {
	this.nombre = "vivo";
	this.esAtacado = function (usuario) {
		usuario.estado = new Muerto();
	}
	this.lanzarVotacion = function(usr){
		usr.puedeLanzarVotacion();
	}
	this.estadoVivo = function(){
		return true;
	}
}

function Muerto() {
	this.nombre = "muerto";
	this.esAtacado = function (usuario) {
	}
	this.lanzarVotacion = function(){
	}
	this.estadoVivo = function(){
		return false;
	}
}

function randomInt(low, high) {
	return Math.floor(Math.random() * (high - low) + low);
}

// function inicio() {
// 	juego = new Juego()
// 	var usr = new Usuario("Pepe")
// 	var codigo = usr.crearPartida(4);

// 	juego.unirAPartida(codigo, "luis");
// 	juego.unirAPartida(codigo, "luisa");
// 	juego.unirAPartida(codigo, "luisito");

// 	usr.iniciarPartida();
// }

module.exports.Juego = Juego;
module.exports.Usuario = Usuario;