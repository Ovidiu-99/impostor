function ClienteRest(){
    this.crearPartida=function(nick,num,callback){
		$.getJSON("/crearPartida/"+nick+"/"+num,function(data){    
    		console.log(data);
    		callback(data);
		});
	}
    this.unirAPartida=function(codigo,nick){
        $.getJSON("/unirAPartida/"+codigo+"/"+nick,function(data){
            console.log(data);
        });
    }
    this.listaPartidas=function(){
        $.getJSON("/listaPartidas",function(data){
            console.log(data);
        });
    }
    this.iniciarPartida=function(codigo,nick){
        $.getJSON("/iniciarPartida/"+codigo+"/"+nick,function(data){
            console.log(data);
        });
	}
	this.partidasCreadas=function(admin){
        $.getJSON("/partidasCreadas/"+admin,function(data){
			console.log(data);
			cw.mostrarPartidasAnteriores(data, false);
		});
	}
	this.partidasTerminadas=function(admin){
        $.getJSON("/partidasTerminadas/"+admin,function(data){
			console.log(data);
			cw.mostrarPartidasAnteriores(data, true);
		});
    }
}

// function pruebas(){
// 	var codigo=undefined;
// 	rest.crearPartida("pepe",3,function(data){
// 		codigo=data.codigo;		
// 	});
// 	rest.crearPartida("pepe",4,function(data){
// 		codigo=data.codigo;
// 		//cambiar orden IMPORTANTE CAMBIAR ORDEN
// 		rest.unirAPartida("juan",codigo);
// 		rest.unirAPartida("juani",codigo);
// 		rest.unirAPartida("juana",codigo);
// 		rest.unirAPartida("juanma",codigo);
// 	});
// 	rest.crearPartida("pepe",5,function(data){
// 		codigo=data.codigo;
// 		rest.unirAPartida("juan",codigo);
// 		rest.unirAPartida("juani",codigo);
// 		rest.unirAPartida("juana",codigo);
// 		rest.unirAPartida("juanma",codigo);
// 	});
// //agregar otras partidas de 6, 7… hasta 10 jugadores
// }
