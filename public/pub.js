(function(){

window.checkin = function (a,id){
  $(a).text("...").attr("disabled",true);
  $.post("/checkin",{
    venue_id: id
  },function(response){
    if(response.meta == "signin"){
      window.location.href = "/signin"
    }else{     
      if(response.meta.code == 200){
        $(a).replaceWith("Checked in ;)")
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
    var latlng,options,map,marker,venue,info;

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
            info.setContent(venue.name + "<br/>" + venue.location.address + "<br/><a onclick=\"checkin(this,'"+venue.id+"');\">tap to check-in</a>");
            info.open(map, marker);
            $("#venue").html("Loading photos of "+venue.name);
            $.get("/venue/"+venue.id,function(resp){
              $("#venue").empty();  
              $("#venue").append($("<h2>"+venue.name+"</h2><p>"+venue.location.address+"</p>")) 
              for(var i=0;i<resp.response.photos.items.length;i++){
                var p = resp.response.photos.items[i],
                src = p.prefix+"300x500"+p.suffix;
                $("#venue").append($('<img src="'+src+'"/>'));
              }
            });
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

function setMapHeight(){
  $("#mapcanvas").css("height",window.innerHeight - ($("#mapcanvas").offset().top + 48))
}
window.onresize=setMapHeight;
window.orientationchange=setMapHeight;
setMapHeight();
})(window);