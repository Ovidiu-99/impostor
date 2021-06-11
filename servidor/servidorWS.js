modelo = require('./modelo.js');

function ServidorWS(){

    this.enviarRemitente=function(socket,mens,datos){
        socket.emit(mens,datos);
    }

    this.enviarATodos=function(io,nombre,mens,datos){
        io.sockets.in(nombre).emit(mens,datos);
    }

    this.enviarATodosMenosRemitente=function(socket,nombre,mens,datos){
        socket.broadcast.to(nombre).emit(mens,datos)
    };
    this.enviarGlobal = function(socket, mensaje, datos){
        socket.broadcast.emit(mensaje, datos);
    }

    this.lanzarSocketSrv = function(io, juego){
        var cli=this;
		io.on('connection',function(socket){		    
		    socket.on('crearPartida', function(nick,numero) {
                var codigo=juego.crearPartida(numero,nick);	      
                socket.join(codigo);
                console.log('usuario nick: '+nick+" crea partida numero: "+numero);  				
                cli.enviarRemitente(socket,"partidaCreada",{"codigo":codigo, "owner":nick});
                var lista = juego.listaPartidasDisponibles();
                cli.enviarGlobal(socket, "recibirListaPartidasDisponibles", lista);      		        
            });
            socket.on('unirAPartida', function(codigo, nick) {
                //nick o codigo nulo
                var res=juego.unirAPartida(codigo,nick);
		    	socket.join(codigo);
		    	var owner=juego.partidas[codigo].nickOwner;
		  		console.log("Usuario "+res.nick+" se une a partida "+res.codigo+" numJugador: "+res.numJugador);
		    	cli.enviarRemitente(socket,"unidoAPartida",res);
		    	var lista=juego.obtenerListaJugadores(codigo);
		    	cli.enviarATodos(io, codigo, "nuevoJugador",lista);
            });
            socket.on('iniciarPartida', function(codigo, nick) {
                //ToDO
                //comprobar si nick es owner
                //cli.enviarATodos(socket)
                juego.iniciarPartida(codigo, nick);
                var fase = juego.partidas[codigo].fase.nombre;
                if(fase=="Jugando"){
                    cli.enviarATodos(io,codigo, "partidaIniciada", fase);
                }else{
                    cli.enviarRemitente(socket, "esperando", fase);
                }
            });
            socket.on('atacar',function(codigo, nickAtacante, nickAtacado){
                juego.partidas[codigo].usuarios[nickAtacante].atacar(nickAtacado);
                var fase = juego.obtenerFase(codigo);
                cli.enviarATodos(io, codigo, "muereInocente", nickAtacado);
                cli.enviarRemitente(socket, "hasAtacado", fase);
                if(fase == "Final"){
                    cli.enviarATodos(io,codigo, "acabaPartida", "Gana el impostor");
                }
                // else{
                //     //avisar al impostor
                //     cli.enviarATodos(io, codigo, "muereInocente", nickAtacado);
                // }
            });
            socket.on('listaPartidas', function() {
                cli.enviarRemitente(socket, "recibirListaPartidas", juego.listaPartidas());
            });
            socket.on('estoyDentro', function(codigo, nick) {
                //var usr = juego.obtenerJugador(codigo, nick);
                // var numero = jeugo.partidas[codigo].usuarios[nick].numJugador;
                // var datos = {"nick":nick, "numJugador": numero};
                // cli.enviarATodosMenosRemitente(socket, codigo, "dibujarRemoto", datos);
                var lista = juego.obtenerListaJugadores(codigo);
                cli.enviarRemitente(socket, "dibujarRemoto", lista);
            });
            socket.on('movimiento', function(nick, codigo, numJugador, direccion, x, y) {
                // this.nick,this.codigo,this.numJugador,direccion,x,y)
                // (direccion, nick, numJugador,x,y)
                var datos = {nick:nick, numJugador:numJugador, direccion:direccion, x:x, y:y};
                cli.enviarATodosMenosRemitente(socket, codigo, "moverRemoto", datos);
            });
            socket.on('lanzarVotacion', function(codigo, nick) {
                juego.lanzarVotacion(codigo, nick);
                var partida = juego.partidas[codigo];
                var lista = partida.obtenerListaJugadoresVivos();
                cli.enviarATodos(io, codigo, "votacionLanzada", lista);
            });
            socket.on('saltarVoto', function(codigo, nick) {
                var partida = juego.partidas[codigo];
                juego.saltarVoto(codigo, nick);
                if(partida.todosHanVotado()){
                    //enviar el mas votado si lo hay
                    var data = {"elegido":partida.elegido,"fase":juego.obtenerFase(codigo),"esImpostor":partida.elegidoEsImpostor()}
                    cli.enviarATodos(io,codigo,"finalVotacion",data);
                }else{
                    //enviar lista de los que han votado
                    cli.enviarATodos(io,codigo,"haVotado",partida.listaHanVotado());
                }
            });
            socket.on('votar', function(codigo, nick, sospechoso) {
                var partida = juego.partidas[codigo];
                juego.votar(codigo, nick, sospechoso);
                if(partida.todosHanVotado()){
                    //enviar el mas votado si lo hay
                    var data = {"elegido":partida.elegido,"fase":juego.obtenerFase(codigo),"esImpostor":partida.elegidoEsImpostor()}
                    cli.enviarATodos(io,codigo,"finalVotacion",data);
                    if(partida.haTerminado()){
                        if(partida.elegidoEsImpostor()){
                            cli.enviarATodos(io,codigo, "acabaPartida", "Ganan los ciudadanos");
                            console.log("Acaba la partida - Ganan los ciudadanos");
                        }else{
                            cli.enviarATodos(io,codigo, "acabaPartida", "Gana el impostor");
                        }
                    }
                }else{
                    //enviar lista de los que han votado
                    cli.enviarATodos(io,codigo,"haVotado",partida.listaHanVotado());
                }
            });
            socket.on("obtenerEncargo", function(codigo, nick){
                cli.enviarRemitente(socket, "recibirEncargo", juego.obtenerEncargo(codigo, nick));
            });
            socket.on('listaPartidasDisponibles', function() {
                cli.enviarRemitente(socket, "recibirListaPartidasDisponibles", juego.listaPartidasDisponibles());
            });
            socket.on('realizarTarea', function(codigo, nick) {
                console.log(codigo+" "+nick+" realiza la tarea");
                juego.realizarTarea(codigo, nick);
                var fase = juego.obtenerFase(codigo);
                var partida = juego.partidas[codigo];
                var porciento = partida.porcentajeTarea(nick);
                var porcientoGlobal = partida.porcentajeGlobal(nick);
                cli.enviarRemitente(socket, "tareaRealizada", {"porcentaje":porciento,"porcentajeGlobal":porcientoGlobal});
                cli.enviarATodos(io,codigo, "barraProgresoGlobal", porcientoGlobal);
                if(fase == "Final"){
                    cli.enviarATodos(io,codigo, "acabaPartida", "Ganan los ciudadanos");
                    console.log("Acaba la partida - Ganan los ciudadanos");
                }
            });
            socket.on('enviarMensaje',function(codigo, nick, mensaje){
                cli.enviarATodos(io,codigo, "recibirMensaje", {"nick":nick,"mensaje":mensaje});
            });
		});
    }
}

module.exports.ServidorWS = ServidorWS;