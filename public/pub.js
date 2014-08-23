(function(){

window.checkin = function (a,id){
  $.post("/checkin",{
    venue_id: id
  },function(response){
    if(response.meta == "signin"){
      window.location.href = "/signin"
    }else{
      console.log(response)      
      if(response.meta.code == 200){
        $(a).replaceWith("Checked In ;)")
      }
    }
  })
}
function success(position) {
  
  var status = $('#status');
  status.text(typeof msg == 'string' ? msg : "Location retrived, searching nearby pubs...");
      
  $.post("/",{
    method: "search",
    ll: position.coords.latitude + "," + position.coords.longitude,
    intent: "browse",
    radius: 800,
  },function(response){
    
    status.text("Here you go!");
    var mapcanvas = document.createElement('div'),latlng,options,map,marker,venue,info;
    mapcanvas.id = 'mapcanvas';
    mapcanvas.style.height = '400px';
    mapcanvas.style.width = '100%';
  
    $('article').append(mapcanvas);

    latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    options = {
      zoom: 15,
      center: latlng,
      mapTypeControl: false,
      navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL},
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("mapcanvas"), options);

    marker = new google.maps.Marker({
      position: latlng, 
      map: map, 
      title:"You are here! (at least within a " + position.coords.accuracy + " meter radius)"
    });
    
    info = new google.maps.InfoWindow({
      content: ""
    });
    
    for(var i=0; i < response.response.venues.length; i++){
      venue = response.response.venues[i];        
      function addMarker(venue){
        latlng = new google.maps.LatLng(venue.location.lat,venue.location.lng);
        marker = new google.maps.Marker({
          position: latlng, 
          map: map, 
          title: venue.name,
          icon: '/ico.png',
          draggable: false,
          animation: google.maps.Animation.DROP
        });

        google.maps.event.addListener(marker, 'click', (function(marker, i) {
          return function() {
            info.setContent(venue.name + "<br/>" + venue.location.address + "<br/><a onclick=\"checkin(this,'"+venue.id+"');\">check in</a>");
            info.open(map, marker);
          }
        })(marker, i));
      }
      setTimeout(addMarker,30*i,venue);
    }
  })
}
function error(msg) {
  $('#status').text(typeof msg == 'string' ? msg : "Opps, something went wrong :'(");
}
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(success, error);
} else {
  error('not supported');
}
})(window);