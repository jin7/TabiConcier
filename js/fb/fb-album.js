function getAlbumPhotos(){
    FB.api('/me/albums',  function(resp) {
        //Log.info('Albums', resp);
        var albumlist = $("#albumlist");
        albumlist.empty();
        albumlist.append($("<option/>").html("-- select album --"));
        for (var i=0, l=resp.data.length; i<l; i++){
            var
                album = resp.data[i],
                option = $("<option/>");
            option.html(album.name);
            option.attr("value", "/" + album.id + "/photos");
            albumlist.append(option);
        }
        albumlist.css("display", "block");

        albumlist.change(function() {
            getPhotos($("#albumlist option:selected").val());
        });
    });
};

var IsLoad;
function getPhotos(album_photos_url) {
    FB.api(album_photos_url, function(resp) {
        var gallery = $("#gallery");
        if (!IsLoad) {
            Galleria.loadTheme('galleria/themes/classic/galleria.classic.min.js');
            IsLoad = true;
        }
        gallery.css("display", "none");
        gallery.empty();
        for (var i=0, l=resp.data.length; i<l; i++) {
            var
                photo = resp.data[i];
                img = $("<img/>");
            img.attr("title", photo.name);
            img.attr("src", photo.source);
            gallery.append(img);
            //gallery.push ({ image: photo.source });
        }
        gallery.css("display", "block");

        gallery.galleria({
            debug : false,
            lightbox: true,
            swipe: true,
            preload: 3,
            width: 500,
            height: 500
        });
    });
};
