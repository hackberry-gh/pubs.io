(function(window){
  
  var pub;
  window.pub = pub = {
    venues: [],
    currentVenueId: null,
    showError: function(msg){
      if(msg === null){
        msg = "Sorry, something went wrong! Please try again later."
      }
      alert(msg);
    },
    setStatus: function(msg){
      $("#status").text(msg);
    },
    getVenues: function(position){
      var lat = position.coords.latitude,
          lon = position.coords.longitude;
          
      $.get("/venues/search",{
        ll: lat + "," + lon,
        intent: "browse",
        radius: 800,
        category: "pub"
      },function(response){
        
        if(response.meta.code != 200){
          console.error(response.meta);
          return pubs.error();
        }
        
        pub.venues = response.response.venues;
    
        pub.setStatus("Here you go!");

        _createMap(position);
    
        _addVenueMarkers();
      })
    },
    openPubInfo: function(e){
      var venue = pub.venues[$(e.currentTarget).data("pi")];
      pub.currentVenueId = venue.id;      
      $("#venue .content h2").text(venue.name);
      $("#venue .content p").text(venue.location.address);      
      $("#venue .info .checkins").text(venue.stats.checkinsCount+" checkins");                  
      $("#venue .info .tips").text(venue.stats.tipCount+" tips");      
      $("#venue").show();
      pub.getVenueTips(venue.id);
      console.log(venue)
      $.get("/venues/"+venue.id+"/likes",function(response){
        console.log(response)
      })
    },
    getVenuePhotos: function(id){
      
      // $("#venue").html("Loading photos of "+venue.name);
      $(".tab").removeClass("active");
      $(".openPhotos").addClass("active");            
      $(".tab.photos").addClass("active");
      
      if($(".tab.photos img").length == 0){
        
        $.get("/venues/" + id + "/photos",
        function(response){
          
          if(response.meta.code != 200){
            console.error(response.meta);
            return pubs.error();
          }
          
          var photos = response.response.photos;
          
          $(".tab.photos").empty();
          
          for(var i=0; i < photos.items.length; i++){
            var p = photos.items[i],
            src = p.prefix + "300x500" + p.suffix;
            $(".tab.photos").append($('<img src="'+src+'" class="photo"/>'));
          }
        });
      }
    },
    getVenueTips: function(id){
      $(".tab").removeClass("active");
      $(".openTips").addClass("active");      
      $(".tab.tips").addClass("active");
      
      if($(".tab.tips .tip").length == 0){
        
        $.get("/venues/" + id + "/tips",
        function(response){
        
          if(response.meta.code != 200){
            console.error(response.meta);
            return pubs.error();
          }
        
          // console.log(response);
        
          var tips = response.response.tips;
        
          $(".tab.tips list").empty();
          for(var i=0; i< tips.items.length; i++){
            var tip = tips.items[i],tmp;
            
            
            tmp = $('<div class="tip">' +
              '<div class="user">' +
                '<img class="avatar"><small></small>' +
              '</div>' +
              '<div class="pinched"><p></p><img class="photo"></div>' +
            '</div>');
            
            tmp.find(".avatar").attr("src",tip.user.photo.prefix + '36x36' + tip.user.photo.suffix);
            tmp.find(".user small").text(tip.user.firstName);            
            tmp.find(".pinched p").text(tip.text);   
            if(typeof tip.photo != "undefined"){                       
              tmp.find(".photo").attr("src",tip.photo.prefix + '300x500' + tip.photo.suffix);
            }else{
              tmp.find(".photo").remove();
            }               
            $(".tab.tips .list").append(tmp);
          }
        });
        
      }
    }, 
    addCheckin: function(id){
      var $a = $("a.addCheckin"),a = $a[0];
      if(typeof $a.attr("disabled") != "undefined"){
        return false;
      }
      _disableBtn(a);
      $.ajax("/checkins/add",{
        data: {venueId: id},
        type: "POST",
        success: function(response){  
          if(response.meta.code != 200){
            _enableBtn(a);
            console.error(response.meta);
            return pubs.error();
          }else{
            $(a).replaceWith("Checked in");
          }
        },
        error: _onApiError
      })
    },
    like: function(id){
      var $a = $("a.like"), a = $a[0];
      if(typeof $a.attr("disabled") != "undefined"){
        return false;
      }
      _disableBtn(a);
      $.post("/venues/"+id+"/like",{set:1},
      function(response){  
        if(response.meta.code != 200){
          _enableBtn(a);
          console.error(response.meta);
          return pubs.error();
        }else{
          $(a).removeAttr("disabled").attr("class","unlike").text("Unlike");
        }
      })
    },
    unlike: function(id){
      var $a = $("a.unlike"), a = $a[0];
      if(typeof $a.attr("disabled") != "undefined"){
        return false;
      }
      _disableBtn(a);
      $.post("/venues/"+id+"/like",{set:0},
      function(response){  
        if(response.meta.code != 200){
          _enableBtn(a);
          console.error(response.meta);
          return pubs.error();
        }else{
          $(a).removeAttr("disabled").attr("class","like").text("Like");
        }
      })
    },
    dislike: function(id){
      var $a = $("a.dislike"), a = $a[0];
      if(typeof $a.attr("disabled") != "undefined"){
        return false;
      }
      _disableBtn(a);
      $.post("/venues/"+id+"/dislike",{set:1},
      function(response){  
        if(response.meta.code != 200){
          _enableBtn(a);
          console.error(response.meta);
          return pubs.error();
        }else{
          $(a).removeAttr("disabled").attr("class","undislike").text("Undislike");
        }
      })
    },
    undislike: function(id){
      var $a = $("a.undislike"), a = $a[0];
      if(typeof $a.attr("disabled") != "undefined"){
        return false;
      }
      _disableBtn(a);
      $.post("/venues/"+id+"/dislike",{set:0},
      function(response){  
        if(response.meta.code != 200){
          _enableBtn(a);
          console.error(response.meta);
          return pubs.error();
        }else{
          $a.removeAttr("disabled").attr("class","dislike").text("Dislike");
        }
      })
    },
    openTipForm: function(){$(".tipForm").show();},
    closeTipForm: function(){$(".tipForm").hide();},    
    addTip: function(id,text){
      var btn = $(".topForm input[type=submit]")[0];
      if(typeof $(btn).attr("disabled") != "undefined"){
        return false;
      }
      _disableBtn(btn);
      $.post("/tips/add",{venueId: id,text: text},
      function(response){ 
        enable(btn);
        if(response.meta.code != 200){          
          console.error(response.meta);
          return pubs.error();
        }
        pub.closeTipForm();
      })
    }
  };
  
  // private
  function _onApiError(xhr,err,msg){
    if(xhr.status == 401){
      window.location.href = "/signin";
    }else{
      pubs.error();      
    }
  }
  
  function _disableBtn(btn){
    var $btn = $(btn);
    $btn.data("orgText",btn.nodeName == "A" ? $btn.text() : $btn.val());
    $btn.val("...").text("...");         
    $btn.attr("disabled",true);
  }
  
  function _enableBtn(btn){
    var $btn = $(btn);
    $btn.removeAttr("disabled");
    $btn.val($btn.data("orgText")).text($btn.data("orgText")); 
  }  
  
  function _createMap(position){
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
    
    pub.map = new google.maps.Map(document.getElementById("mapcanvas"), options);
    
    // create user marker
    marker = new google.maps.Marker({
      position: latlng, 
      map: pub.map, 
      title: "You are here! (at least within a " + position.coords.accuracy + " meter radius)"
    });
  }
  
  function _addVenueMarkers(){
    var info,venue;
    
    info = new google.maps.InfoWindow({content: ""});

    for(var i=0; i < pub.venues.length; i++){
      
      venue = pub.venues[i];   
           
      function addMarker(venue,i){
        
        latlng = new google.maps.LatLng(venue.location.lat,venue.location.lng);
        marker = new google.maps.Marker({
          position: latlng, 
          map: pub.map, 
          title: venue.name,
          icon: '/ico.png',
          draggable: false,
          animation: google.maps.Animation.DROP
        });

        google.maps.event.addListener(marker, 'click', (function(marker, i) {
          return function() {
            info.setContent(
            '<a class="pubInfo" href="#venue" data-pi="' + i + '">' + 
            '<div style="padding:12px">' +
              venue.name + "<br/>" + 
              venue.location.address + 
            '</div>' +  
            '</a>'
            );
            info.open(pub.map, marker);
          }
        })(marker, i));
      }
      setTimeout(addMarker, 60 * i, venue, i);
    }
  }
  
  function _onGeolocationSuccess(position){
    pub.setStatus(typeof msg == 'string' ? msg : "Location retrived, searching nearby pubs...");
    pub.getVenues(position);
  }
  
  function _onGeolocationError(msg){
    pub.setStatus(typeof msg == 'string' ? msg : "Opps, something went wrong :'(")
  }
  
  function _setMapHeight(){
    $("#mapcanvas").css("height",Math.max(window.innerHeight - ($("#mapcanvas").offset().top + 12),260))
  }
      
  // Initialize!
  
  if (window.navigator.geolocation) {
    window.navigator.geolocation.getCurrentPosition(_onGeolocationSuccess, _onGeolocationError);
  } else {
    pub.showError('Sorry, but your browser is not supported or you did not allow geolocation request');
  }

  window.onresize = _setMapHeight;
  window.orientationchange = _setMapHeight;
  _setMapHeight();

  $(document).on( "click", ".pubInfo", {}, pub.openPubInfo );
  
  $(document).on( "click", ".addCheckin", {}, function(e){pub.addCheckin(pub.currentVenueId)} );
  $(document).on( "click", ".like", {}, function(e){pub.like(pub.currentVenueId)} );
  $(document).on( "click", ".unlike", {}, function(e){pub.unlike(pub.currentVenueId)} );  
  $(document).on( "click", ".dislike", {}, function(e){pub.dislike(pub.currentVenueId)} );
  $(document).on( "click", ".undislike", {}, function(e){pub.undislike(pub.currentVenueId)} );  
  $(document).on( "click", ".openTipForm", {}, function(e){pub.openTipForm()} );
  
  $(document).on( "click", ".openPhotos", {}, function(e){pub.getVenuePhotos(pub.currentVenueId)} );
  $(document).on( "click", ".openTips", {}, function(e){pub.getVenueTips(pub.currentVenueId)} );
  $(".topForm").on( "submit", function(e){ 
    e.preventDefault();
    pub.addTip(pub.currentVenueId,$(".topForm textarea").val());
    return false;
  })

})(window);