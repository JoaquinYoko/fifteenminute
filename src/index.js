// ***************inicializar mapa***************
var bbox;
var bboxString;
var map = L.map('map', {zoomControl: false}).fitWorld();
map.locate({setView: true, maxZoom: 15});

/*function onLocationFound(e) {
  var point = [e.latitude, e.longitude];
  setbbox(point);
}*/

//map.on('locationfound', onLocationFound);

function onLocationError(e) {
  alert(e.message);
}

var unionesActivas = L.featureGroup().addTo(map);
var marcadores = L.markerClusterGroup();

map.on('locationerror', onLocationError);
// *********************************************
var radio = 500

function modificarRadio(valor){
  document.getElementById("currentValue").innerHTML = valor;
  radio = valor;
  modificarCirculos(valor)
}

function mostrarConfig(){
  var configPanel = document.querySelector(".configPanel")
  configPanel.classList.toggle("open")
}

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href=http://www.openstreetmap.org/copyright>OpenStreetMap</a>'
}).addTo(map);



//*******layer principal*********
const circulosLayer = [];
let cancelado = false;
function inicializarLayer(requestedQuery){
  circulosLayer.length = 0;
  var opl = new L.OverPassLayer({
    minZoom: map.getZoom(),
    query: `(${requestedQuery});out;`,
    onSuccess: function(data) {
      unionesActivas.clearLayers();
      marcadores.clearLayers();
      let cantElementos = data.elements.length;
      let contador = 0;
      let confirmado = true;
      if(cantElementos > 800){
        confirmado = confirm("Son muchos datos para cargar. Esto podría tardar varios segundos. ¿Desea continuar? (Puede cancelar la carga en cualquier momento)");
      }
      if(confirmado){
        document.getElementById("cargaMax").innerHTML = cantElementos;
        document.getElementById("carga").innerHTML = contador;
        mostrarCarga();
        let procesarElementos = setInterval(() => {
        if(!cancelado){
            if(contador < cantElementos){
              let e = data.elements[contador];
              let pos = [e.lon, e.lat];
              agregarCirculo(pos)
              document.getElementById("carga").innerHTML = ++contador;
            }else{
              clearInterval(procesarElementos);
              dibujarFormas();
              document.getElementById("carga").innerHTML = ++contador;
              mostrarCarga();
              unionesActivas.addLayer(marcadores);
            }
        }else{
          clearInterval(procesarElementos);
          dibujarFormas();
          mostrarCarga();
          cancelado = false;
          unionesActivas.addLayer(marcadores);
        }
      }, 15)}
    },
  });
  unionesActivas.addLayer(opl); 
}
//****************************************** 

function dibujarFormas(){
  let union = circulosLayer.pop();
  L.geoJSON(union, {
    fillColor: '#fa3',
    fillOpacity: 0.1,
    opacity:1
  }).addTo(unionesActivas);
};

function mostrarCarga(){
  var carga = document.querySelector(".id-carga");
  carga.classList.toggle("cargando");
}

const options = {
  steps: 64,
  units: 'meters',
  options: {}
}

var markerIcon = L.divIcon({
  className: 'icono-ubicacion', 
  html: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16"> <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/></svg>',
  iconAnchor: [9, 15]
});

function agregarCirculo(pos) {  
  if(pos[0] != undefined){
    const circuloAgregar = turf.circle(pos, radio, options);
    L.marker([pos[1], pos[0]], {icon: markerIcon}).addTo(marcadores);
    if(circulosLayer.length > 0){
      let preexistentes = circulosLayer.pop()
      let nuevaUnion = turf.union(preexistentes, circuloAgregar);
      circulosLayer.push(nuevaUnion);
    }else{
      circulosLayer.push(circuloAgregar);
    }
    
  }
}

function modificarCirculos(valor){
  var long = circulosLayer.length
  var layer
  for (i=0; i<long; i++){
    layer = circulosLayer[i]
    layer.setRadius(valor)
  }
}

function hacerQuery(){
  let query = ``;
  var checkedValue = null; 
  var inputElements = document.getElementsByClassName('checkBoxes');
  for(var i=0; i<inputElements.length; i++){
        if(inputElements[i].checked){
            checkedValue = inputElements[i].value;
            let concatenarAQuery =  `nwr[amenity=${checkedValue}](${bboxString});`
            query = query.concat(concatenarAQuery);
        }
  }
  return query;
}

function actualizar(){
  unionesActivas.clearLayers();
  marcadores.clearLayers();
  var bounds = map.getBounds();
  setbbox(bounds);
  var reqQuery = hacerQuery();
  inicializarLayer(reqQuery);
}    

function setbbox(bounds){
  bbox = [bounds._southWest.lat, bounds._southWest.lng, bounds._northEast.lat, bounds._northEast.lng]
  bboxString = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`
  console.log(`${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`);
}

function cancelarQuery(){
  cancelado = true;
}

var resultados;
function searchLocation() {
  var searchTerm = $('#searchInput').val();

  $.getJSON('https://nominatim.openstreetmap.org/search?format=json&q=' + searchTerm, function (data) {
    if (data && data.length > 0) {
      resultados = data;
      var contenedor = $("#opcionesResultados");
      contenedor.empty();
      for(i=0; i<4; i++){
       
        var nuevoBoton = $("<button>").text(resultados[i].display_name).attr("id", "boton" + i).attr('value', i).attr('style', "width: 350px;");
        nuevoBoton.click(function() {
          var n = $(this).attr("value");
          var result = resultados[n];
          console.log(n);
          var lat = result.lat;
          var lon = result.lon;
          map.setView([lat, lon], 15)
        });
    
        contenedor.append(nuevoBoton);
      }
    } else {
      alert('Ubicación no encontrada');
    }
  });
}

function fijarVista(boton){
  var n = boton.value;
  console.log(n);
  var lat = result[n].lat;
  var lon = result[n].lon;
  map.setView([lat, lon], 15)
  L.marker([lat, lon]).addTo(map)
  .bindPopup(result.display_name)
  .openPopup();
}