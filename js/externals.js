const requestNotificationPermission = async ()=>{
    const permission = await Notification.requestPermission();
    if(permission!=='granted'){
        throw new Error("No se ha podido otorgar permisos para la notificación.");
    }else{
        new Notification("Hola, mi nombre es Jaime Jeovanny Cortez Flores, soy estudiante de la Universidad Francisco Gavidia.");
    }
}



async function recordVideo(){
    if(window.recorder && window.recorder.state==="recording"){
        window.recorder.stop();
    }else{
        let toggle = document.getElementById("recording-button");
        let stream = await navigator.mediaDevices.getUserMedia({audio:true,video:true}).catch((error)=>{
            throw new Error("No es posible continuar, debido a que no se han brindado permisos a la aplicación");
        });
        let videoE1 = document.getElementById("video-element");
        videoE1.srcObject = stream;
        videoE1.play();
        window.recorder = new MediaRecorder(stream);
        let chunks = [];
        window.recorder.ondataavailable = function(event){
            if(event.data.size <= 0){
                chunks.push(event.data);
            }
        };
        window.recorder.onstop = function(){
            let blob = new Blob(chunks,{type:'video/mp4'});
            toggle.innerHTML = `<i class="fa fa-circle"></i>`;
            videoE1.srcObject = null;
            videoE1.src = URL.createObjectURL(blob);
            let tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
        }
        window.recorder.onstart = function(){
            toggle.innerHTML = `<i class="fa fa-square"></i>`;

        };
        window.recorder.start();
    }
}

function geolocalizacion(){
    if(navigator.permissions && navigator.permissions.query){
        navigator.permissions.query({name:'geolocation'}).then(function(result){
            const permission = result.state;
            if(permission === 'granted' || permission === 'prompt'){
                _onGetCurrentLocation();
            }
        });
    }else if(navigator.geolocation){
        _onGetCurrentLocation();
    }
}

function _onGetCurrentLocation(){
    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };
    navigator.geolocation.getCurrentPosition(function(position){
        const marker = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        let enlace = document.getElementById("ir_mapa");
        enlace.href = `https://maps.google.com/?q=${marker.lat},${marker.lng}`;
        enlace.text = "IR AL MAPA";
        enlace.target = "_blank";
    },function(error){
        console.log(error);
    },options);
}


const init = () =>{
    const tieneSoporteUserMedia = () =>
        !!(navigator.mediaDevices.getUserMedia);

    if(typeof MediaRecorder === "undefined" || !tieneSoporteUserMedia()){
        return alert("Su navegador no cumple con los requisitos, por favor actualice a un navegador mas reciente");
    }

    const $listaDeDispositivos = document.querySelector("#listaDeDispositivos"),
          $duracion = document.querySelector("#duracion"),
          $btnComenzarGrabacion = document.querySelector("#btnComenzarGrabacion"),
          $btnDetenerGrabacion = document.querySelector("#btnDetenerGrabacion");

    const limpiarSelect = () => {
        for(let x = $listaDeDispositivos.options.length-1; x >= 0; x--){
            $listaDeDispositivos.options.remove(x);
        }
    }

    const segundosATiempo = numeroDeSegundos => {
        let horas = Math.floor(numeroDeSegundos/60/60);
        numeroDeSegundos -= horas * 60 * 60;
        
        let minutos = Math.floor(numeroDeSegundos/60);
        numeroDeSegundos -= minutos * 60;

        numeroDeSegundos = parseInt(numeroDeSegundos);
        if(horas<10) horas = "0"+horas;
        if(minutos<10) minutos = "0"+minutos;
        if(numeroDeSegundos<10) numeroDeSegundos = "0"+numeroDeSegundos;

        return `${horas}:${minutos}:${numeroDeSegundos}`;
    };

    let tiempoInicio,mediaRecorder,idIntervalo;
    const refrescar = () =>{
        $duracion.textContent = segundosATiempo( (Date.now() - tiempoInicio) / 1000);
    }
    const llenarLista = () =>{
        navigator.mediaDevices.enumerateDevices().then(dispositivos =>{
            limpiarSelect();
            dispositivos.forEach((dispositivos,indice)=>{
                if(dispositivos.kind === "audioinput"){
                    const $opcion = document.createElement("option");
                    $opcion.text = dispositivos.label || `Dispositivo ${indice+1}`;
                    $opcion.value = dispositivos.deviceId;
                    $listaDeDispositivos.appendChild($opcion);
                }
            })
        })
    };

    const comenzarAContar = () =>{
        tiempoInicio = Date.now();
        idIntervalo = setInterval(refrescar,500);
    };

    const comenzarAGrabar = () =>{
        if(!$listaDeDispositivos.options.length) return alert("No hay dispositivos");
        if(mediaRecorder) return alert("Ya se está grabando");

        navigator.mediaDevices.getUserMedia({
            audio:{
                deviceId:$listaDeDispositivos.value,
            }
        }).then(stream =>{
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            comenzarAContar();
            const fragmentosDeAudio = [];
            mediaRecorder.addEventListener("dataavailable",evento =>{
                fragmentosDeAudio.push(evento.data);
            });
            mediaRecorder.addEventListener("stop", ()=>{
                stream.getTracks().forEach(track=>track.stop());
                detenerConteo();
                const blobAudio = new Blob(fragmentosDeAudio);
                const urlParaDescargar = URL.createObjectURL(blobAudio);
                let a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display:none";
                a.href = urlParaDescargar;
                a.download = "jaimejeovannycorezflores.ufg.webm";
                a.click();
                window.URL.revokeObjectURL(urlParaDescargar);
            });
        }).cath(error => {
            console.log(error);
        });
    };

    const detenerConteo = () =>{
        clearInterval(idIntervalo);
        tiempoInicio = null;
        $duracion.textContent = "";
    }

    const detenerGrabacion = () =>{
        if(!mediaRecorder) return alert("No se está grabando");
        mediaRecorder.stop();
        mediaRecorder = null;
    }

    $btnComenzarGrabacion.addEventListener("click",comenzarAGrabar);
    $btnDetenerGrabacion.addEventListener("click",detenerGrabacion);

    llenarLista();
}
document.addEventListener("DOMContentLoaded",init);