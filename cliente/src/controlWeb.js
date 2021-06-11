function ControlWeb() {
    this.mostrarCrearPartida = function (min) {
        var cadena =      '<div id="mostrarCP">'
        cadena = cadena + '<h3>Crear partida</h3>';
        cadena = cadena +   '<form class="form-inline">';
        cadena = cadena +       '<div class="input-group">';
        cadena = cadena +           '<span for="usr" class="input-group-addon">Nick</span>';
        cadena = cadena +           '<input type="txt" class="form-control" id="nick" placeholder="Nombre en el juego">';
        cadena = cadena +       '</div>';
        cadena = cadena +       '<div class="input-group">';
        cadena = cadena +           '<span for="num" class="input-group-addon">Número</span>';
        cadena = cadena +           '<input type="number" class="form-control" id="num" min="'+min+'" max="10" value="'+min+'">';
        cadena = cadena +       '</div>';
        cadena = cadena +   '</form>';
        cadena = cadena +   '<form action="/action_page.php">';
        cadena = cadena +       '<div class="form-group">';
        cadena = cadena +           '<br><button type="button" id="btnCrear" class="btn btn-primary">Crear partida</button>';
        cadena = cadena +       '</div>';
        cadena = cadena +   '</form>';
        cadena = cadena + '</div>';
        $('#crearPartida').append(cadena);
        $('#btnCrear').on('click', function () {
            var nick = $('#nick').val();
            var num = $('#num').val();
            if(nick && num>=2){
                $('#mostrarCP').remove();
                ws.crearPartida(nick, num);
            }
            //mostrar esperarando rival
            //controlar la entrada
        });
    }
    this.mostrarEsperandoRival = function () {
        this.limpiar();
        var cadena = '<div id="mER">';
        cadena = cadena + '<img src="cliente/img/loading.gif" class="img-rounded" alt="loading image">';
        if(ws.owner){
            cadena = cadena + '<br>'
            cadena = cadena + '<button type="button" id="btnIniciar" class="btn btn-primary">Iniciar partida</button>';
        }
        cadena = cadena + '</div>';
        $('#esperando').append(cadena);
        $('#btnIniciar').on('click', function () {
            ws.iniciarPartida();
        });
    }

    this.mostrarUnirAPartida = function (lista) {
        $('#mUAP').remove();
        var cadena = '<div id = "mUAP">';
        cadena = cadena + '<h3>Lista de partidas</h3>';
        cadena = cadena + '<div  class="list-group">';
        for (var i = 0; i < lista.length; i++) {
            var maximo=lista[i].maximo;
	        var numJugadores=maximo-lista[i].huecos;
            cadena = cadena + '<a href="#" value=' + lista[i].codigo + ' class="list-group-item">';
            cadena = cadena + 'Código: ' + lista[i].codigo + '<span class="badge">' + numJugadores +'/' + maximo + '</span>';
            cadena = cadena + '</a>';
        }
        cadena = cadena + '</div>';
        cadena = cadena + '<button type="button" id="btnUnir" class="btn btn-primary">Unir a partida</button>';
        cadena = cadena + '</div>';
        $('#unirAPartida').append(cadena);
        StoreValue = [];
        $(".list-group a").click(function () {
            StoreValue = [];
            StoreValue.push($(this).attr("value"));
        });

        $('#btnUnir').on('click', function () {
            var nick = $('#nick').val();
            if (nick != "" && StoreValue[0]) {
                var codigo = StoreValue[0];
                $('#mostrarCP').remove();
                $('#mUAP').remove();
                ws.unirAPartida(codigo, nick);
            }
        });
    }

    this.mostrarListaJugadores = function (lista) {
        $('#mostrarListaEsperando').remove();
        var cadena = '<div id="mostrarListaEsperando"><h3>Lista Jugadores</h3>';
        cadena = cadena + '<ul class="list-group">';
        for (var i = 0; i < lista.length; i++) {
            cadena = cadena + '<li class="list-group-item">' + lista[i].nick + '</li>';
        }
        cadena = cadena + '</ul></div>';
        $('#listaEsperando').append(cadena);
    }

    this.limpiar = function () {
        $('#mUAP').remove();
        $('#mostrarCP').remove();
        $('#mostrarListaPartidas').remove();
        $('#mER').remove();
        $('#mostrarListaEsperando').remove();
        $('#mPA').remove();
        $('#game-container').remove();
        var cadena = '<div id="game-container"></div>';
        $('#juegoPhaser').append(cadena);
    }
    this.mostrarModalSimple = function(mgs){
        this.limpiarModal();
        var texto = "<p id='avisarImpostor'>"+mgs+"</p>";
        $('#textoModal').append(texto);
        $("#pie").append('<button type="button" id="cerrar" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>');
        $('#modalGeneral').modal("show");
    }
    this.mostrarModalTarea = function(tarea){
        this.limpiarModal();
        var texto = "<p id='tarea'>"+tarea+"</p>";
        $('#textoModal').append(texto);
        $("#pie").append('<button type="button" id="cerrar" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>');
        $('#modalGeneral').modal("show");

        $('#cerrar').on('click', function () {
            tareasOn = true;
        })
    }
    this.mostrarModalVotacion = function(lista){
        this.limpiarModal();
        var cadena = '<div id="votacion"><h3>Votacion</h3>';
        //cadena = cadena + '';
        cadena = cadena + '<div class="input-group">';
        for (var i = 0; i < lista.length; i++) {
            cadena = cadena + '<div><input type="radio" name="optradio" value="'+ lista[i].nick+'">' + lista[i].nick + '</div>';
        }
        cadena = cadena + '<div><input type="radio" name="optradio" value="-1">' + "Saltar Voto" + '</div>';
        cadena = cadena + '</div>';
        $('#textoModal').append(cadena);
        cw.mostrarChat();
        $("#pie").append('<button type="button" id="votar" class="btn btn-secondary" data-dismiss="modal">Votar</button>');
        $('#modalGeneral').modal("show");
        var sospechoso = undefined;
        $('.input-group input').on('change',function(){
            sospechoso = $('input[name=optradio]:checked','.input-group').val();
        });
        $('#votar').click(function(){
            if(sospechoso != "-1"){
                ws.votar(sospechoso);
            }else{
                ws.saltarVoto();
            }
            crearInputTeclas();
        });
    }
    this.mostrarPartidasAnteriores = function(lista, mostrarGanador) {
        this.limpiar();
        var cadena = '<div id="mPA">';
        if(mostrarGanador){
            cadena = cadena + '<h3>Partidas Terminadas</h3>';
        }else{
            cadena = cadena + '<h3>Partidas Creadas</h3>';
        }
        
        cadena = cadena + '<div class="list-group">'
        for (var i = 0; i < lista.length; i++) {
            var nick;
            var num;
            var fecha;
            var ganador;
            nick = lista[i].nick;
            num = lista[i].numeroJugadores;
            fecha = lista[i].fecha;
            ganador = lista[i].ganador;
            var date = new Date(fecha);
            var h = addZero(date.getHours());
            var m = addZero(date.getMinutes());
            var s = addZero(date.getSeconds());
            fecha = date.toLocaleDateString() + " Hora: "+ h + ":" + m + ":" + s;
            cadena = cadena + '<a class="list-group-item">';
            cadena = cadena + '<h4 class="list-group-item-text">'+'Creador de la partida: '+nick+'</h4>';
            cadena = cadena + '<h4 class="list-group-item-text">'+'Número de jugadores: '+num+'</h4>';
            cadena = cadena + '<h4 class="list-group-item-text">'+'Fecha: '+fecha+'</h4>';
            if(mostrarGanador){
                cadena = cadena + '<h4 class="list-group-item-text">'+'Ganador: '+ganador+'</h4>';
            }
            cadena = cadena + '</a>';
        }
        cadena = cadena +'</div>'
        cadena = cadena + '</div>';
        $('#partidasAnteriores').append(cadena);
    }
    this.mostrarChat = function() {
        var cadena =        '<div id="mChat">';
        cadena = cadena +       '<h3>Chat</h3>';
        cadena = cadena +       '<a class="list-group-item" id="listaMensajes">';
        cadena = cadena +       '</a>';
        cadena = cadena +       '<div class="input-group">';
        cadena = cadena +       '<input type="text" id="mensaje" class="form-control"/>';
        cadena = cadena +           '<div class="input-group-append">';
        cadena = cadena +               '<button id="enviarMensaje" class="btn btn-warning">Enviar</button>';
        cadena = cadena +           '</div>';
        cadena = cadena +       '</div>';
        cadena = cadena +   '</div>';
        $('#chat').append(cadena);
        $('#enviarMensaje').click(function(){
            var mensaje = $('#mensaje').val();
            ws.enviarMensaje(mensaje);
            $('#mensaje').val("");
        });
    }
    this.mostrarMensaje = function(nick, mensaje){
        var cadena = '<p class="list-group-item-text">'+nick+': '+mensaje+'</p>';
        $('#listaMensajes').append(cadena);
    }
    this.limpiarModal = function(){
        $('#avisarImpostor').remove();
        $('#tarea').remove();
        $('#cerrar').remove();
        $('#votacion').remove();
        $('#votar').remove();
        $('#mChat').remove();
    }
}

function addZero(i) {
    if (i < 10) {
      i = "0" + i;
    }
    return i;
}