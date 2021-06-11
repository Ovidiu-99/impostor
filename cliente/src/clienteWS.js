function ClienteWS(){
    this.estado = undefined;
    this.socket;
    this.impostor;
    this.nick = undefined;
    this.codigo = undefined;
    this.owner = false;
    this.numJugador;
    this.crearPartida = function(nick, numero){
        this.nick = nick;
        this.socket.emit("crearPartida", nick, numero);
    }
    this.unirAPartida = function(codigo, nick){
        this.nick = nick;
        this.socket.emit("unirAPartida", codigo, nick);
    }
    this.iniciarPartida = function(){
        this.socket.emit("iniciarPartida", this.codigo, this.nick);
    }
    this.listaPartidasDisponibles = function(){
        this.socket.emit("listaPartidasDisponibles");
    }
    this.listaPartidas = function(){
        this.socket.emit("listaPartidas");
    }
    this.estoyDentro = function(){
        this.socket.emit("estoyDentro", this.codigo, this.nick);
    }
    this.atacar = function(nickAtacado){
        this.socket.emit("atacar", this.codigo, this.nick, nickAtacado);
    }
    this.lanzarVotacion = function(){
        this.socket.emit("lanzarVotacion", this.codigo, this.nick);
    }
    this.saltarVoto = function(){
        this.socket.emit("saltarVoto", this.codigo, this.nick);
    }
    this.votar = function(sospechoso){
        this.socket.emit("votar", this.codigo, this.nick, sospechoso);
    }
    this.obtenerEncargo = function(){
        this.socket.emit("obtenerEncargo", this.codigo, this.nick)
    }
    this.movimiento=function(direccion,x,y){
        this.socket.emit("movimiento",this.nick,this.codigo,this.numJugador,direccion,x,y);
    }
    this.realizarTarea = function(codigo, nick){
        this.socket.emit("realizarTarea", codigo, nick);
    }
    this.enviarMensaje = function(mensaje) {
        this.socket.emit("enviarMensaje", this.codigo, this.nick, mensaje);
    }
    
    //final votacion
    //cuantos han votado
    this.ini = function(){
        this.socket=io.connect();
        this.lanzarSocketSrv();    
    }
    //servidor WS dentro del cliente
    this.lanzarSocketSrv = function(){
        var cli = this;
        this.socket.on('connect', function(){			
			console.log("Conectado al servidor de WS");
		});
        this.socket.on("partidaCreada", function(data){
            cli.codigo = data.codigo;
            console.log(data);
            if(data.codigo != "fallo"){
                cli.owner = true;
                cli.numJugador = 0;
                cli.estado = "vivo";
                cw.mostrarEsperandoRival();
            }
        });
        this.socket.on("unidoAPartida", function(data){
            cli.nick=data.nick;
            cli.numJugador=data.numJugador;
            cli.estado = "vivo";
            cli.codigo = data.codigo;
            console.log(data);
            if(data.codigo != "fallo"){
                cw.mostrarEsperandoRival();
            }
        });
        this.socket.on("acabaPartida", function(data){
            console.log(data);
            finPartida(data);
        });
        this.socket.on("nuevoJugador",function(lista){
            cw.mostrarListaJugadores(lista);
        });
        this.socket.on("esperando",function(fase){
            console.log("esperando...");
        });
        this.socket.on("partidaIniciada",function(fase){
			console.log("Partida en fase: "+fase);
			if (fase=="Jugando"){
				cli.obtenerEncargo();
				cw.limpiar();
				lanzarJuego();
			}
        });
        this.socket.on("hasAtacado",function(fase){
            if(fase == "Jugando"){
                ataquesOn = true;
            }
        });
        this.socket.on("votacionLanzada",function(lista){
            cw.mostrarModalVotacion(lista);
            desactivarCapturaTeclas();
        });
        this.socket.on("muereInocente",function(inocente){
            console.log(inocente);
            if(cli.nick == inocente){
                cli.estado = "muerto";
                finPartida("Has sido asesinado por el impostor.");
            }else{
                borrarJugador(inocente);
            }
            dibujarMuereInocente(inocente);
        });
        this.socket.on("recibirListaPartidas",function(partidas){
            console.log(partidas);
        });
        this.socket.on("dibujarRemoto",function(lista){
            console.log(lista);
            for(var i=0;i<lista.length;i++){
                if(lista[i].nick != cli.nick){
                    lanzarJugadorRemoto(lista[i].nick, lista[i].numJugador);
                }
            }
            crearColision();
        });
        this.socket.on("moverRemoto",function(datos){
            mover(datos);
        });
        this.socket.on("recibirListaPartidasDisponibles",function(partidas){
            console.log(partidas);
            if(!cli.codigo){
                cw.mostrarUnirAPartida(partidas);
            }
        });
        this.socket.on("finalVotacion",function(data){
            console.log(data);
            $('#modalGeneral').modal('toggle');
            if(data.elegido == "no hay nadie elegido"){
                cw.mostrarModalSimple("No hay nadie elegido en la votación.");
            }else{
                if(data.esImpostor){
                    cw.mostrarModalSimple("Se ha pillado al impostor: " + data.elegido);
                }else{
                    cw.mostrarModalSimple("El elegido "+data.elegido+ " era inocente.");
                    if(data.elegido == cli.nick){
                        finPartida("Has sido asesinado por la votacion.");
                    }else{
                        borrarJugador(data.elegido);
                    }
                }
            }
        });
        // this.socket.on("final",function(data){
        //     console.log(data);
        //     ws.finPartida(data);
        // });
        this.socket.on("haVotado",function(data){
            console.log(data);
            //actualizar la lista
        });
        this.socket.on("recibirEncargo", function(data){
            console.log(data);
			cli.impostor = data.impostor;
			cli.encargo = data.encargo;
            if (data.impostor){
                cw.mostrarModalSimple("Eres el impostor, acaba con todos.");
            }
        })
        this.socket.on("tareaRealizada",function(data){
            console.log("Porcentaje de la tarea realizado: "+data.porcentaje+" porcentaje global: "+data.porcentajeGlobal);
        });
        this.socket.on("barraProgresoGlobal",function(porcentaje){
            console.log("Porcentaje de las tarea realizado: "+porcentaje);
            actualizarBarraProgreso(porcentaje);
        });
        this.socket.on("recibirMensaje",function(data){
            cw.mostrarMensaje(data.nick, data.mensaje);
        });
    }
    this.ini();
}
var ws2, ws3, ws4;
function pruebas(){
    // var ws1 = new ClienteWS();
    ws2 = new ClienteWS();
    ws3 = new ClienteWS();
    ws4 = new ClienteWS();
    var codigo = ws.codigo;

    ws2.unirAPartida(codigo, "juan");
    ws3.unirAPartida(codigo, "juani");
    ws4.unirAPartida(codigo, "juana");

    ws.iniciarPartida();

}