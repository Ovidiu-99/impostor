var modelo = require("./modelo.js");

describe("El juego del impostor", function () {
    var juego;
    //var usuario;
    var nick;

    beforeEach(function () {
        juego = new modelo.Juego(4, "test");
        nick = "Pepe";
    });

    it("inicialmente......", function () {
        expect(Object.keys(juego.partidas).length).toEqual(0);
        expect(nick).toEqual("Pepe");
    });

    it("comprobar valores de la partida", function () {
        var codigo = juego.crearPartida(3, nick);
        expect(codigo).toEqual("fallo");
        codigo = juego.crearPartida(11, nick);
        expect(codigo).toEqual("fallo");
    });

    it("no se puede crear partida si el num no está entre 4 y 10", function () {
        var codigo = juego.crearPartida(3, nick);
        expect(codigo).toEqual("fallo");
        codigo = juego.crearPartida(11, nick);
        expect(codigo).toEqual("fallo");
    });

    describe("Pepe crea una partida de 4 jugadores", function () {
        var codigo;

        beforeEach(function () {
            codigo = juego.crearPartida(4, nick);
        });

        it("el usr Pepe crea una partida de 4 jugadores", function () {
            expect(codigo).not.toBe(undefined);
            expect(juego.partidas[codigo].nickOwner).toEqual(nick);
            expect(juego.partidas[codigo].maximo).toEqual(4);
            expect(juego.partidas[codigo].fase.nombre).toEqual("Inicial");
            expect(Object.keys(juego.partidas[codigo].usuarios).length).toEqual(1);
        });

        it("se unen jugadores a la partida", function () {
            juego.unirAPartida(codigo, "María");
            expect(Object.keys(juego.partidas[codigo].usuarios).length).toEqual(2);
            juego.unirAPartida(codigo, "José Carlos");
            expect(Object.keys(juego.partidas[codigo].usuarios).length).toEqual(3);
            juego.unirAPartida(codigo, "Mario");
            expect(Object.keys(juego.partidas[codigo].usuarios).length).toEqual(4);
            expect(juego.partidas[codigo].fase.nombre).toEqual("Completado");
        });

        it("No se ha asignado ningún impostor", function () {
            var partida = juego.partidas[codigo];
            var nimpostores = 0;
            var keys = Object.keys(juego.partidas[codigo].usuarios);
            for (i = 0; i < keys.length; i++) {
                if (partida.usuarios[keys[i]].impostor) nimpostores++;
            }
            expect(nimpostores).toEqual(0);
        });

        it("pepe inicia la partida", function () {
            juego.unirAPartida(codigo, "María");
            expect(Object.keys(juego.partidas[codigo].usuarios).length).toEqual(2);
            expect(juego.partidas[codigo].fase.nombre).toEqual("Inicial");
            juego.unirAPartida(codigo, "José Carlos");
            expect(Object.keys(juego.partidas[codigo].usuarios).length).toEqual(3);
            expect(juego.partidas[codigo].fase.nombre).toEqual("Inicial");
            juego.unirAPartida(codigo, "Ana");
            expect(Object.keys(juego.partidas[codigo].usuarios).length).toEqual(4);
            expect(juego.partidas[codigo].fase.nombre).toEqual("Completado");
            juego.iniciarPartida(codigo, nick);
            expect(juego.partidas[codigo].fase.nombre).toEqual("Jugando");
        });


        describe("La partida ya esta iniciada", function () {
            var partida;

            beforeEach(function () {
                juego.unirAPartida(codigo, "María");
                juego.unirAPartida(codigo, "José Carlos");
                juego.unirAPartida(codigo, "Mario");
                juego.iniciarPartida(codigo, nick);
                partida = juego.partidas[codigo];
            });

            it("Se ha asignado un impostor", function () {
                var nimpostores = 0;
                var keys = Object.keys(juego.partidas[codigo].usuarios);
                for (i = 0; i < keys.length; i++) {
                    if (partida.usuarios[keys[i]].impostor) nimpostores++;
                }
                expect(partida.numeroImpostoresVivos()).toEqual(1);
                expect(nimpostores).toEqual(1);
            });
            it("Se han asignado las tareas", function () {
                for (var key in partida.usuarios) {
                    expect(partida.usuarios[key].encargo).not.toEqual("ninguno");
                }
            });
            it("Mario sale de la partida", function () {
                expect(Object.keys(partida.usuarios).length).toEqual(4);
                var mario = partida.usuarios['Mario'];
                mario.abandonarPartida();
                expect(Object.keys(partida.usuarios).length).toEqual(3);
                expect(partida.usuarios['Mario']).toBe(undefined);
            });

            it("Todos los jugadores salen de la partida", function () {
                expect(Object.keys(partida.usuarios).length).toEqual(4);
                partida.usuarios['Mario'].abandonarPartida();
                partida.usuarios['Pepe'].abandonarPartida();
                partida.usuarios['María'].abandonarPartida();
                partida.usuarios['José Carlos'].abandonarPartida();
                expect(Object.keys(partida.usuarios).length).toEqual(0);
                expect(partida.usuarios['Mario']).toBe(undefined);
                expect(partida.numeroDeJugadores()).toEqual(0);
                expect(juego.partidas[codigo]).toBe(undefined);
                expect(partida.fase.nombre).toEqual("Final");
                expect(partida.ganador).toEqual("Abandono");
            });

            it("el impostor ataca, muere un ciudadano", function () {
                var impostor;
                var inocente;
                expect(partida.numeroCiudadanosVivos()).toEqual(3);
                for (var key in partida.usuarios) {
                    if (partida.usuarios[key].impostor) {
                        impostor = partida.usuarios[key];
                    }else{
                        inocente = partida.usuarios[key];
                    }
                }
                expect(inocente.estado.nombre).toEqual("vivo");
                impostor.atacar(inocente.nick);
                expect(partida.numeroCiudadanosVivos()).toEqual(2);
                expect(inocente.estado.nombre).toEqual("muerto");
            });

            it("mueren 2 inocentes, ganan impostores", function () {
                var impostor;
                var inocente;
                var inocente2;
                expect(partida.numeroCiudadanosVivos()).toEqual(3);
                for (var key in partida.usuarios) {
                    if (partida.usuarios[key].impostor) {
                        impostor = partida.usuarios[key];
                    }else{
                        inocente = partida.usuarios[key];
                    }
                }
                for(var key in partida.usuarios){
                    if(key != impostor.nick && key != inocente.nick){
                        inocente2 = partida.usuarios[key];
                    }
                }
                expect(partida.gananImpostores()).toBe(false);
                expect(inocente.estado.nombre).toEqual("vivo");
                impostor.atacar(inocente.nick);
                expect(partida.numeroCiudadanosVivos()).toEqual(2);
                expect(inocente.estado.nombre).toEqual("muerto");
                expect(inocente2.estado.nombre).toEqual("vivo");
                impostor.atacar(inocente2.nick);
                expect(partida.numeroCiudadanosVivos()).toEqual(1);
                expect(inocente2.estado.nombre).toEqual("muerto");
                expect(partida.gananImpostores()).toBe(true);
                expect(partida.ganador).toEqual("Impostor");
            });

            describe("las votaciones", function(){
                beforeEach(function(){

                });
                it("votacion: todos skipean, nadie muere", function () {
                    expect(partida.numeroCiudadanosVivos()).toEqual(3);
                    expect(partida.numeroImpostoresVivos()).toEqual(1);
                    expect(partida.fase.nombre).toEqual("Jugando");
                    expect(partida.ganador).toEqual(undefined);
                    partida.lanzarVotacion();
                    expect(partida.fase.nombre).toEqual("Votacion");
                    for(var key in partida.usuarios){
                        expect(partida.usuarios[key].skip).toBe(false);
                    }
                    for(var key in partida.usuarios){
                        partida.usuarios[key].saltar();
                    }
                    expect(partida.fase.nombre).toEqual("Jugando");
                    var jugadorMasVotado = partida.masVotado();
                    expect(jugadorMasVotado).toEqual("no hay nadie elegido");
                    expect(partida.numeroSkips()).toEqual(4);
                    for(var key in partida.usuarios){
                        expect(partida.usuarios[key].votos).toEqual(0);
                    }
                    expect(partida.numeroCiudadanosVivos()).toEqual(3);
                    expect(partida.numeroImpostoresVivos()).toEqual(1);
                    expect(partida.haTerminado()).toBe(false);
                    expect(partida.ganador).toEqual(undefined);
                });
    
                it("votacion: impostor pillado, gana el pueblo", function () {
                    expect(partida.numeroCiudadanosVivos()).toEqual(3);
                    expect(partida.numeroImpostoresVivos()).toEqual(1);
                    expect(partida.fase.nombre).toEqual("Jugando");
                    expect(partida.ganador).toEqual(undefined);
                    partida.lanzarVotacion();
                    expect(partida.fase.nombre).toEqual("Votacion");
                    var impostor;
                    var inocentes = [];
                    expect(partida.numeroCiudadanosVivos()).toEqual(3);
                    for (var key in partida.usuarios) {
                        if (partida.usuarios[key].impostor) {
                            impostor = partida.usuarios[key];
                        }else{
                            inocentes.push(partida.usuarios[key]);
                        }
                    }
                    for(var key in inocentes){
                        inocentes[key].votar(impostor.nick);
                    }
                    impostor.votar(inocentes[Object.keys(inocentes)[0]].nick);
                    expect(partida.elegidoEsImpostor()).toBe(true);
                    expect(impostor.votos).toEqual(3);
                    expect(impostor).toEqual(partida.masVotado());
                    expect(impostor.estado.nombre).toEqual("muerto");
                    expect(partida.gananCiudadanos()).toBe(true);
                    expect(partida.haTerminado()).toBe(true);
                    expect(partida.ganador).toEqual("Ciudadanos");
                });

                it("votacion: se mata a un inocente", function () {
                    expect(partida.numeroCiudadanosVivos()).toEqual(3);
                    expect(partida.numeroImpostoresVivos()).toEqual(1);
                    expect(partida.fase.nombre).toEqual("Jugando");
                    expect(partida.ganador).toEqual(undefined);
                    juego.lanzarVotacion(codigo, nick);
                    partida.usuarios[nick].impostor = true;
                    partida.usuarios["Mario"].impostor = false;
                    partida.usuarios["María"].impostor = false;
                    partida.usuarios["José Carlos"].impostor = false;
                    
                    expect(partida.fase.nombre).toEqual("Votacion");
                    juego.votar(codigo,nick,"Mario");
                    expect(partida.fase.nombre).toEqual("Votacion");
                    juego.votar(codigo,"José Carlos","Mario");
                    expect(partida.fase.nombre).toEqual("Votacion");
                    juego.votar(codigo,"María","Mario");
                    expect(partida.fase.nombre).toEqual("Votacion");
                    juego.votar(codigo,"Mario","María");
                    expect(partida.elegidoEsImpostor()).toBe(false);
                    expect(partida.fase.nombre).toEqual("Jugando");
                    expect(partida.usuarios["Mario"].estado.nombre).toEqual("muerto");
                    expect(partida.haTerminado()).toBe(false);
                    expect(partida.ganador).toEqual(undefined);
                });
                it("impostor ataca a todos, y gana",function(){
                    //iniciar partida
                    //ajustar a mano el impostor
                    //atacar y comprobar
                    
                    partida.usuarios[nick].impostor=true;
                    partida.usuarios["Mario"].impostor=false;
                    partida.usuarios["María"].impostor=false;
                    partida.usuarios["José Carlos"].impostor=false;
                    expect(partida.ganador).toEqual(undefined);
                    juego.atacar(codigo, nick, "Mario");
                    expect(partida.usuarios["Mario"].estado.nombre).toEqual("muerto");
                    expect(partida.fase.nombre).toEqual("Jugando");
                    juego.atacar(codigo, nick, "María");
                    expect(partida.usuarios["María"].estado.nombre).toEqual("muerto");
                    expect(partida.fase.nombre).toEqual("Final");
                    expect(partida.haTerminado()).toBe(true);
                    expect(partida.ganador).toEqual("Impostor");
                });
                it("realizar tareas",function(){
                    expect(partida.porcentajeGlobal()).toEqual(0);
                    for(var i=0;i<9;i++){
                        for(var key in partida.usuarios){
                            var usr = partida.usuarios[key];
                            usr.realizarTarea();
                            if (!usr.impostor){
                                expect(partida.porcentajeTarea(key)).toEqual((i+1)*10);
                            }
                        }
                        expect(partida.fase.nombre).toEqual("Jugando");
                    }
                    for(var key in partida.usuarios){
                        partida.usuarios[key].realizarTarea();
                        if (!partida.usuarios[key].impostor){
                            expect(partida.porcentajeTarea(key)).toEqual(100);
                        }
                    }
                    expect(partida.fase.nombre).toEqual("Final");
                    expect(partida.porcentajeGlobal()).toEqual(100);
                    expect(partida.haTerminado()).toBe(true);
                    expect(partida.ganador).toEqual("Ciudadanos");
                });
            });
        });
    });
});