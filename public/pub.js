(function(window){
  
  // Label
  
  // Define the overlay, derived from google.maps.OverlayView
  function Label(opt_options) {
   // Initialization
   this.setValues(opt_options);
   // Label specific
   var 
   span = this.span_ = document.createElement('span'),
   div = this.div_ = document.createElement('div');
   div.appendChild(span);
   div.className = "mapLabel";
  };
  Label.prototype = new google.maps.OverlayView;

  // Implement onAdd
  Label.prototype.onAdd = function() {
   var pane = this.getPanes().overlayLayer;
   pane.appendChild(this.div_);

   // Ensures the label is redrawn if the text or position is changed.
   var me = this;
   this.listeners_ = [
     google.maps.event.addListener(this, 'position_changed',
         function() { me.draw(); }),
     google.maps.event.addListener(this, 'active_changed',
         function() { me.draw(); })
   ];
  };

  // Implement onRemove
  Label.prototype.onRemove = function() {
   this.div_.parentNode.removeChild(this.div_);

   // Label is removed from the map, stop updating its position/text.
   for (var i = 0, I = this.listeners_.length; i < I; ++i) {
     google.maps.event.removeListener(this.listeners_[i]);
   }
  };

  // Implement draw
  Label.prototype.draw = function() {
   var 
   projection = this.getProjection(),
   position = projection.fromLatLngToDivPixel(this.get('position')),
   div = this.div_,
   pane = this.get('active') ? this.getPanes().floatPane : this.getPanes().overlayLayer;
   pane.appendChild(this.div_);
   
   div.style.left = position.x + 'px';
   div.style.top = position.y + 4 + 'px';
   div.style.display = 'block';
   div.className =  this.get('active') ? "mapLabel active" : "mapLabel" ;
   this.span_.innerHTML = this.get('text').toString();
  };
  
  // ----------------------------------------------------------------------- //
  
  // Main
  
  
  
  var 
  
  currentVenueId = null,
    
  venues = [],
  
  markers = [],
  
  userId = $("body").data("uid"),
  
  scrolledToTabs = false,
  
  tipTmp = $('<div class="tip">' +
  '<div class="user">' +
  '<small class="date"></small><img class="avatar"><small class="name"></small>' +
  '</div>' +
  '<div class="pinched"><p></p><img class="photo"></div>' +
  '</div>');
    
  function showError(msg) {
      
    if (msg === null || msg === "" || typeof msg === "undefined")
    msg = "Sorry, something went wrong! Please try again later.";
      
    alert(msg);
  }
    
  function setStatus(msg) {
      
    $("#status").text(msg);
  }
    
  // function openPubInfo(e) {
  function openPubInfo(i) {    
      
    // var venue = venues[$(e.currentTarget).data("pi")];
    var venue = venues[i];    
    currentVenueId = venue.id;      
    $("#venue .content h2").text(venue.name);
    $("#venue .content p").text(venue.location.address);      
    $("#venue .info .checkins").text(venue.stats.checkinsCount + " checkins");                  
    $("#venue .info .tips").text(venue.stats.tipCount + " tips");      
    $("#venue").show();
    
    $(".tab.tips .list").empty();
    $(".tab.photos .list").empty();    
    openTips(venue.id);
    // document.body.scrollTop = $("#mapcanvas").offset().top - 12;
    $('html, body').stop().animate({
        scrollTop: $("#mapcanvas").offset().top - 12 //$("#mapcanvas").offset().top + $("#mapcanvas").height() / 2 - 32
    }, 400)    
  }
    
  function openPhotos(e) {
    
    setActiveTab("photos");
              
    if($(".tab.photos img").length == 0) {
      
      var $list = $(".tab.photos .list");
      $list.html("Loading...");
                
      api("GET", "/venues/" + currentVenueId + "/photos",{}, function(response) {
              
        var 
        photos = response.response.photos.items,
        i = 0,
        photo = null;          
          
        $list.empty();
          
        for(i = 0; i < photos.length; i++) {
          photo = photos[i];
          $list.append($('<img width="300" height="500" src="' + photo.prefix + "300x500" + photo.suffix + '" class="photo"/>'));
        }
        
        setTabScrollTop();
      });

    }
  }
    
  function openTips(e) {
      
    setActiveTab("tips");
    
    if($(".tab.tips .list .tip").length == 0){
      
      var $list = $(".tab.tips .list");
      $list.html("Loading...");
        
      api("GET", "/venues/" + currentVenueId + "/tips",{}, function(response) {
            
        var 
        tips = response.response.tips.items,
        i = 0;
          
        $list.empty();
          
        for(i = 0; i < tips.length; i++) { 
          $list.append(renderTip(tips[i]));
        }
        
        setTabScrollTop();
      });
        
    }
  }
    
  function addCheckin(e) {
      
    apiActionClickHandler("/checkins/add", {venueId: currentVenueId}, function(response) {
      $(e.currentTarget).replaceWith("Checked in");
    }, e.currentTarget);
  }
    
  function like(e) {
      
    apiActionClickHandler("/venues/" + currentVenueId + "/like", {set: 1}, function(response) {
      $(e.currentTarget).attr("class","unlike").text("Unlike");
    }, e.currentTarget);
      
  }
    
  function unlike(e) {
      
    apiActionClickHandler("/venues/" + currentVenueId + "/like", {set: 0}, function(response) {
      $(e.currentTarget).attr("class","like").text("Like");
    }, e.currentTarget);
  }
    
  function dislike(e) {
      
    apiActionClickHandler("/venues/" + currentVenueId + "/dislike", {set: 1}, function(response) {
      $(e.currentTarget).attr("class","undislike").text("Undislike");
    }, e.currentTarget);
  }
    
  function undislike(e) {
      
    apiActionClickHandler("/venues/" + currentVenueId + "/dislike", {set: 0}, function(response) {
      $(e.currentTarget).attr("class","dislike").text("Dislike");
    }, e.currentTarget);
  }
    
  function addTip(e) {
    
    var $textarea = $(".tipForm textarea");
    apiActionClickHandler("/tips/add", {venueId: currentVenueId, text: $textarea.val()}, function(response) {
      $textarea.val("");
      $(".tab.tips .list").prepend(renderTip(response.response.tip));
    }, e.currentTarget);
  }
  
  function deleteTip(e) {
    $a = $(e.currentTarget);
    apiActionClickHandler("/tips/" + $a.data("id") + "/delete", {}, function(response) {
      $a.parent(".tip").remove();
    }, e.currentTarget);
  }
  
  
  function api(type, endpoint, data, callback, callee) {
      
    $.ajax(endpoint, {
      data: data,
      type: type,
      success: function(response) {  
    
        if(callee !== null)
          enableClickable(callee);
          
        if(response.meta.code != 200) {
            
          console.error(response.meta);

          return showError();
      
        }else{
                  
          callback(response);
      
        }
    
      },
      error: function(xhr,err,msg){ apiErrorHandler(xhr,err,msg,callee) }
    })
      
  }
    
  function apiActionClickHandler(endpoint,data,success,callee) {
      
    if(isDisabled(callee)) {
      return false;
    }
      
    disableClickable(callee);
      
    api("POST", endpoint, data, success, callee);
  }
    
  
  function setActiveTab(tabClass){
    $(".tab").removeClass("active");
    $(".open-" + tabClass).addClass("active");            
    $(".tab." + tabClass).addClass("active");            
  }
  
  function setTabScrollTop(){
    // document.body.scrollTop = $(".tabNav").offset().top - 12;
    // if(document.body.scrollTop <= ($("#mapcanvas").offset().top - 12)) {
    // if(!scrolledToTabs){
    //   scrolledToTabs = true;
    //   $('html, body').stop().animate({
    //       scrollTop: ($(".tabNav").offset().top - 12)
    //   }, 400);
    // }
    // }
  }
  
  function apiErrorHandler(xhr,err,msg,callee){
    if(xhr.status == 401){
      window.location.href = "/signin";
    }else{
      showError(JSON.parse(xhr.responseText).meta.errorDetail);      
    }
  }
  
  function isDisabled(el) {
    return (typeof $(el).attr("disabled") != "undefined");
  }
  
  function disableClickable(el) {
    var $el = $(el);
    $el.data("orgText",el.nodeName == "A" ? $el.text() : $el.val());
    $el.val("...").text("...");         
    $el.attr("disabled",true).css({"pointer-events":"none"});
  }
  
  function enableClickable(el) {
    var $el = $(el);
    $el.removeAttr("disabled").css({"pointer-events":"all"});
    $el.val($el.data("orgText")).text($el.data("orgText")); 
  }  
  
  
  function onGeolocationError(msg){
    setStatus(typeof msg == 'string' ? msg : "Opps, something went wrong :'(")
  }
  
  function onGeolocationSuccess(position) {
    setStatus(typeof msg == 'string' ? msg : "Location retrived, searching nearby pubs...");
    getVenues(position);
  }
  
  function getVenues(position) {
    
    var lat = position.coords.latitude,
    lon = position.coords.longitude;
        
    api("GET", "/venues/search", {
      ll: lat + "," + lon,
      intent: "browse",
      radius: 800,
      category: "pub"
    },
    function(response) {
      
      setStatus("Here you go!");
              
      venues = response.response.venues;

      createMap(position);
  
      addVenueMarkers();
    })    
  }
  
  function createMap(position) {
    var latlng,options,marker;
    
    latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    
    options = {
      zoom: 15,
      center: latlng,
      mapTypeControl: false,
      scrollwheel: false,
      navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL},
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    
    map = new google.maps.Map(document.getElementById("mapcanvas"), options);
    
    // create user marker
    marker = new google.maps.Marker({
      position: latlng, 
      map: map, 
      title: "You are here! (at least within a " + position.coords.accuracy + " meter radius)"
    });
  }
  
  function addVenueMarkers() {
    // var info,venue,label;
    var venue,label;    
    
    //info = new google.maps.InfoWindow({content: ""});

    for(var i=0; i < venues.length; i++){
      
      venue = venues[i];   
           
      function addMarker(venue,i){
        
        latlng = new google.maps.LatLng(venue.location.lat,venue.location.lng);
        marker = new google.maps.Marker({
          position: latlng, 
          map: map, 
          title: venue.name,
          icon: new google.maps.MarkerImage("/ico.png", null, null, null, new google.maps.Size(27,32)),
          draggable: false,
          animation: google.maps.Animation.DROP,
          active: false
        });
        label = new Label({
          map: map,
          text: venue.name,
          active: false
        });
        label.bindTo('position', marker, 'position');
        label.bindTo('active', marker, 'active');
        
        google.maps.event.addListener(marker, 'click', (function(marker, i) {
          return function() {
            for(var m=0;m<markers.length;m++){
              markers[m].set("active",false);
            }
            marker.set("active",true);
            map.panTo(new google.maps.LatLng(venue.location.lat,venue.location.lng));
            
            // info.setContent(
//               // '<a class="pubInfo" href="#map" data-pi="' + i + '">' +
//               // '<div style="padding:4px">' +
//               venue.name
//               // (typeof venue.location.address == "undefined" ? "" : "<br/>" + venue.location.address) +
//               // '</div>' +
//               // '</a>'
              openPubInfo(i);
//             );


            // info.open(map, marker);
          }
        })(marker, i));
        
        markers.push(marker);
      }

      setTimeout(addMarker, 60 * i, venue, i);      
    }
  }
  
  function renderTip(tip){
    var tmp = tipTmp.clone();  
    tmp.find(".avatar").attr("src", tip.user.photo.prefix + '36x36' + tip.user.photo.suffix);
    tmp.find(".user small").text(tip.user.firstName);            
    tmp.find(".pinched p").text(tip.text);   
    tmp.find(".date").text(new Date(tip.createdAt*1000));       
    if(typeof tip.photo != "undefined") {                       
      tmp.find(".photo").attr("src",tip.photo.prefix + '300x500' + tip.photo.suffix);
    }else{
      tmp.find(".photo").remove();
    }       
    if(tip.user.id == userId){
      tmp.prepend($("<a class=\"deleteTip\" data-id=\"" + tip.id + "\">&times;</a>"));
    }
    return tmp;
  }
  
  function setMapHeight(){
    $("#mapcanvas").css("height",Math.max(window.innerHeight - ($("#mapcanvas").offset().top + $("footer").height() + 18),260))
  }
      
  // Initialize!
  
  window.orientationchange = window.onresize = setMapHeight;
  setMapHeight();
  
  if (window.navigator.geolocation) {
    window.navigator.geolocation.getCurrentPosition(onGeolocationSuccess, onGeolocationError);
    
    // $(document).on( "click", ".pubInfo", {}, openPubInfo);
  
    $(document).on( "click", ".addCheckin", {}, addCheckin);
    $(document).on( "click", ".like", {}, like );
    $(document).on( "click", ".unlike", {}, unlike );  
    $(document).on( "click", ".dislike", {}, dislike );
    $(document).on( "click", ".undislike", {}, undislike );  
  
    $(document).on( "click", ".open-photos", {}, openPhotos);
    $(document).on( "click", ".open-tips", {}, openTips);
    $(document).on( "click", ".addTip", {}, addTip);
    $(document).on( "click", ".deleteTip", {}, deleteTip);    
    
  } else {
    showError('Sorry, but your browser is not supported or you did not allow geolocation request');
  }


})(window);