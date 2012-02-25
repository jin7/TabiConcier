/**
 *  GoogleMapper V3 - (The Wrapper Class of Google Maps API V3)
 *  @see       http://0-oo.net/sbox/javascript/google-mapper-v3
 *  @version   0.7.0
 *  @copyright 2008-2011 dgbadmin@gmail.com
 *  @license   http://0-oo.net/pryn/MIT_license.txt (The MIT license)
 *
 *  See also Google Maps API V3 documents.
 *  @see http://code.google.com/intl/ja/apis/maps/documentation/javascript/
 *  @see http://code.google.com/apis/maps/documentation/javascript/reference.html
 */
var GoogleMapper = {
    /** Mapオブジェクト */
    map: null,
    /** マーカーの配列 */
    markers: [],
    /** 吹き出し */
    infoWindow: null,
    /** Mapをクリック可能か（beClickable()内でのmapのclickイベントの制御用） */
    mapClickable: false
};
/**
 *  Google Maps API V3のJavaScriptを読み込む
 *  @param  Function    callback    読み込み完了時に実行するCallback関数
 *  @param  String      libraries   (Optional) 追加ライブラリ（複数の場合はカンマ区切り）
 *  @param  Boolean     sensor      (Optional) 位置情報を使用するかどうか
 */
GoogleMapper.load = function(callback, libraries, sensor) {
    GoogleMapper._onload = callback;

    var params = [
        "callback=GoogleMapper._onload",
        "libraries=" + (libraries || ""),
        "sensor=" + (sensor || false)
    ];

    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "//maps.googleapis.com/maps/api/js?" + params.join("&");
    document.getElementsByTagName("head")[0].appendChild(script);
};
/**
 *  地図を表示する（デフォルトは日本列島）
 *  @param  String  mapId   地図表示に使う要素（div等）のid属性
 *  @param  Number  lat     中心地点の緯度
 *  @param  Number  lng     中心地点の経度
 *  @param  Number  zoom    ズーム値
 *  @param  Object  options (Optional) Mapに渡すパラメータ
 *  @return Map
 *  @see http://code.google.com/apis/maps/documentation/javascript/reference.html#MapOptions
 *
 *  stylesを確認できるツール
 *  @see http://gmaps-samples-v3.googlecode.com/svn/trunk/styledmaps/wizard/index.html
 */
GoogleMapper.show = function(mapId, lat, lng, zoom, options) {
    var params = {
        center: new google.maps.LatLng((lat || 38), (lng || 137.5)),
        zoom: (zoom || 5),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [   //コンビニ等、全ての情報を表示する
            { featureType: "all", elementType: "all", stylers: [{ visibility: "on" }] }
        ],
        scaleControl: true,
        overviewMapControl: true,
        overviewMapControlOptions: { opened: true }
    };

    for (var i in (options || {})) {
        params[i] = options[i];
    }

    GoogleMapper.map = new google.maps.Map(document.getElementById(mapId), params);
    GoogleMapper.infoWindow = new google.maps.InfoWindow();

    return GoogleMapper.map;
};
/**
 *  マーカーを追加する
 *  マーカーをクリックするとGoogleMapper.getMarkerInfo()の内容を吹き出しに表示する
 *  @param  Number or LatLng        lat     緯度 or LatLng
 *  @param  Number                  lng     経度（latにLatLngを渡す場合は不要）
 *  @param  String                  title   (Optional) ツールチップ表示する文字列
 *  @param  String or MarkerImage   image   (Optional) マーカー画像のURL or MarkerImage
 *  @return Marker  追加したマーカー
 *
 *  （参考）Google Maps用のマーカー画像の配布サイト
 *  @see http://code.google.com/p/google-maps-icons/
 */
GoogleMapper.addMarker = function(lat, lng, title, image) {
    var position = lat;

    if (lng) {
        position = new google.maps.LatLng(lat, lng);
    }

    var marker = new google.maps.Marker({
        map: GoogleMapper.map,
        position: position,
        title: (title || ""),
        icon: image
    });

    google.maps.event.addListener(marker, "click", function() {
        GoogleMapper.openMarkerWindow(marker);
    });

    GoogleMapper.markers.push(marker);

    return marker;
};
/**
 *  Google Chart APIを使ってマーカー画像を生成する
 *  @param  Number or LatLng    lat         緯度 or LatLng
 *  @param  Number              lng         経度（latにLatLngを渡す場合は不要）
 *  @param  String              title       (Optional) ツールチップ表示する文字列
 *  @param  String              bgColor     (Optional) 背景（塗り潰し）色（例：FFFFFF）
 *  @param  String              textColor   (Optional) 文字色（例：000000）
 *  @param  String              str         (Optional) マーカー上に表示する文字
 *  @return String or MarkerImage
 *  @see http://code.google.com/apis/chart/docs/gallery/dynamic_icons.html
 */
GoogleMapper.addColorMarker = function(lat, lng, title, bgColor, textColor, str) {
    var type = "d_map_pin_letter_withshadow";
    var url = GoogleMapper._getIconURL(type, null, str, (bgColor || "F30"), textColor);

    var image = new google.maps.MarkerImage(
        url,
        new google.maps.Size(37, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34)   //指定しないと影も含めてセンタリングされる
    );

    var marker = GoogleMapper.addMarker(lat, lng, title, image);
    marker.setShape({coords: [0, 0, 20, 20], type: "rect"});    //丸い部分だけクリックできる

    return marker;
};
/**
 *  Google Chart APIを使って吹き出し画像を生成する
 *  @param  Number or LatLng    lat         緯度 or LatLng
 *  @param  Number              lng         経度（latにLatLngを渡す場合は不要）
 *  @param  String              str         吹き出しに表示する文字列
 *  @param  String              bgColor     (Optional) 背景（塗り潰し）色（例：FFFFFF）
 *  @param  String              textColor   (Optional) 文字色（例：000000）
 *  @param  String              style       (Optional) 吹き出し形状（尻尾無しは"bbT"）
 *  @return String or MarkerImage
 *  @see http://code.google.com/apis/chart/docs/gallery/dynamic_icons.html
 */
GoogleMapper.addBubbleMarker = function(lat, lng, str, bgColor, textColor, style) {
    var type = "d_bubble_text_small";
    style = style || "bb";
    var icon = GoogleMapper._getIconURL(type, style, str, (bgColor || "FF0"), textColor);

    var iconY = -1, shadowY = -1;

    switch (style) {
        case "bb":      //左下に着地点
            iconY = 35;
            shadowY = 37;
            break;
        case "bbtl":    //左上に着地点
            iconY = 0;
            shadowY = 0;
            break;
    }

    if (iconY > -1) {
        //位置の調整
        var point = new google.maps.Point(0, iconY);
        icon = new google.maps.MarkerImage(icon, null, null, point);
    }

    var marker = GoogleMapper.addMarker(lat, lng, str, icon);

    if (shadowY > -1) {
        //影を付ける
        var shadowUrl = GoogleMapper._getIconURL(type + "_shadow", style, str, "");
        var shadowPoint = new google.maps.Point(0, shadowY);
        marker.setShadow(new google.maps.MarkerImage(shadowUrl, null, null, shadowPoint));
    }

    return marker;
};
/**
 *  Google Chart APIのDynamic IconのURLを生成する
 */
GoogleMapper._getIconURL = function(iconType, style, str, bgColor, textColor) {
    var params = [style, encodeURIComponent(str || ""), bgColor, (textColor || "")];

    if (!style) {
        params.shift();
    }

    return "//chart.googleapis.com/chart?chst=" + iconType + "&chld=" + params.join("|");
};
/**
 *  マーカーのIndexを取得する
 *  @param  Marker  marker  Indexを調べたいマーカー
 *  @return Number  マーカーのIndex
 */
GoogleMapper.getMarkerIndex = function(marker) {
    var markers = GoogleMapper.markers;

    for (var i = 0, len = markers.length; i < len; i++) {
        if (markers[i] == marker) {
            return i;
        }
    }
};
/**
 *  マーカーを削除する
 *  @param  Number  index   削除するマーカーのIndex
 */
GoogleMapper.removeMarker = function(index) {
    GoogleMapper.markers[index].setMap(null);
    GoogleMapper.markers.splice(index, 1);
};
/**
 *  マーカーを全て削除する
 */
GoogleMapper.removeAllMarkers = function() {
    for (var i = 0, len = GoogleMapper.markers.length; i < len; i++) {
        GoogleMapper.markers[i].setMap(null);
    }

    GoogleMapper.markers = [];
};
/**
 *  マーカー上に吹き出しを表示する
 *  表示する内容はGoogleMapper.getMarkerInfo()から取得する
 *  @param  Marker  marker  吹き出しを表示するマーカー
 */
GoogleMapper.openMarkerWindow = function(marker) {
    GoogleMapper.openInfoWindow(GoogleMapper.getMarkerInfo(marker), null, marker);
};
/**
 *  吹き出しに表示する内容を作る（HTML可）
 *  表示したい内容がある場合、このfunctionを上書きする
 *  @param  Marker  marker  吹き出しを表示するマーカー
 */
GoogleMapper.getMarkerInfo = function(marker) {
    return GoogleMapper.escape(marker.title);
};
/**
 *  文字列のHTMLエスケープ
 *  @param  String  str
 *  @return String
 */
GoogleMapper.escape = function(str) {
    var rep = { "&": "&amp;", '"': "&quot;", "'": "&#039;", "<": "&lt;", ">": "&gt;" };

    return str.replace(/[&"'<>]/g, function(m) { return rep[m]; });
};
/**
 *  吹き出しを表示する（latLngとmarkerはどちらか一方を渡す）
 *  @param  String  content 吹き出しの中身のHTML
 *  @param  LatLng  latLng  (Optional) 吹き出しを表示する位置
 *  @param  Marker  marker  (Optional) 吹き出しを表示するマーカー
 */
GoogleMapper.openInfoWindow = function(content, latLng, marker) {
    if (!content) {
        return;
    }

    var infoWindow = GoogleMapper.infoWindow;
    infoWindow.setAnchor(null); //非公式APIでいったんクリア
    infoWindow.setOptions({ content: content, position: latLng });
    infoWindow.open(GoogleMapper.map, marker);
};
/**
 *  吹き出しを閉じる
 */
GoogleMapper.closeInfoWindow = function() {
    GoogleMapper.infoWindow.close();
};
/**
 *  地図をクリック可能にする（ダブルクリックによるズームはできなくなる）
 *  @param  Function    callback    クリック時に呼び出されるCallback関数
 *                                  クリックされた地点のLatLngが渡される
 *                                  文字列（HTML可）を返すとそれを吹き出しに表示する
 */
GoogleMapper.beClickable = function(callback) {
    //ダブルクリックはクリックイベントも発生するので無効にする
    GoogleMapper.map.disableDoubleClickZoom = true;
    GoogleMapper.mapClickable = true;

    google.maps.event.addListener(GoogleMapper.map, "click", function(event) {
        if (GoogleMapper.mapClickable) {
            GoogleMapper.openInfoWindow(callback(event.latLng), event.latLng);
        } else {
            GoogleMapper.mapClickable = true;
        }
    });
};
/**
 *  端末の現在位置を取得する
 *  @param  Function    onSuccess   位置取得時に実行するCallback関数
 *  @param  Function    onError     (Optional) 位置取得失敗時に実行するCallback関数
 *  @return Boolean     位置情報を取得可能かどうか
 *  @see http://dev.w3.org/geo/api/spec-source.html#api_description
 */
GoogleMapper.getCurrentPosition = function(onSuccess, onError) {
    if (!navigator.geolocation) {
        return false;
    }

    navigator.geolocation.getCurrentPosition(
        function(position) {
            var coords = position.coords;
            onSuccess(new google.maps.LatLng(coords.latitude, coords.longitude), coords);
        },
        onError || function(e) { alert(e.message); },
        { enableHighAccuracy: true, timeout: 10000 }
    );

    return true;
};
/**
 *  検索ボックスに入力補完機能を付ける（要Placesライブラリ）
 *  @param  String  inputId 検索ボックスのid
 */
GoogleMapper.setAutocomplete = function(inputId) {
    var ac = new google.maps.places.Autocomplete(document.getElementById(inputId));
    ac.bindTo("bounds", GoogleMapper.map);
};
/**
 *  地名や施設名等で検索する（ジオコーディング）
 *  @param  String      keywords    検索したいキーワード
 *  @param  Function    callback    (Optional) 検索結果が渡されるCallback関数
 *                                  渡されるのはGeocoderResponseの配列とGeocoderStatus
 *  @see http://code.google.com/apis/maps/documentation/v3/reference.html#Geocoder
 */
GoogleMapper.search = function(keywords, callback) {
    if (!keywords) {
        return;
    }

    callback = callback || function(response, status) {
        if (!GoogleMapper.checkResponseStatus(status)) {
            return;
        }

        var len = response.length;
        var msg = len + "件ヒットしました\n";

        if (len == 1) {
            var map = GoogleMapper.map;
            var result = response[0];
            var latLng = GoogleMapper.getGeocodeLatLng(result);
            map.panTo(latLng);

            if (map.getZoom() < 14) {
                map.setZoom(14);
            }

            GoogleMapper.openInfoWindow(GoogleMapper.getGeocodeAddress(result), latLng);
            return;
        } else if (len < 20) {
            for (var i = 0; i < len; i++) {
                msg += "・" + GoogleMapper.getGeocodeAddress(response[i]) + "\n";
            }
        }

        alert(msg + "詳細な地名を追加してください");
    };

    (new google.maps.Geocoder()).geocode({ address: keywords }, callback);
};
/**
 *  緯度経度から地名を検索する（逆ジオコーディング）
 *  @param  LatLng      latLng      緯度経度
 *  @param  Function    callback    検索結果が渡されるCallback関数
 *                                  渡されるのはGeocoderResponseの配列とGeocoderStatus
 *  @see http://code.google.com/apis/maps/documentation/v3/reference.html#Geocoder
 */
GoogleMapper.searchByLatLng = function(latLng, callback) {
    (new google.maps.Geocoder()).geocode({ latLng: latLng }, callback);
};
/**
 *  GeocoderStatusおよびPlacesServiceStatusをチェックする
 *  該当データなし以外のエラーの場合は、alert()を表示する
 *  @param  String  status
 *  @return Boolean true: OK, false: OK以外
 */
GoogleMapper.checkResponseStatus = function(status) {
    switch (status) {
        case "OK":
            return true;
        case "ZERO_RESULTS":
            alert("該当データがありませんでした");
            break;
        default:
            alert("エラーが発生しました (" + status + ")");
    }

    return false;
};
/**
 *  GeocoderResponseから主な地名を取り出す
 *  @param  GeocoderResponse    geocodeResult
 *  @return String  地名
 */
GoogleMapper.getGeocodeAddress = function(geocodeResult) {
    var address = "";
    var components = geocodeResult.address_components;

    for (var i = components.length - 2; i >= 0; i--) {  //国名は省略
        var name = components[i].long_name;

        if (!name.match(/^(日本|[0-9]{3}-[0-9]{4})$/)) {    //郵便番号も無視
            address += " " + name;
        }
    }

    return address.substring(1);
};
/**
 *  GeocoderResponseから緯度経度を取り出す
 *  @param  GeocoderResponse    geocodeResult
 *  @return LatLng
 */
GoogleMapper.getGeocodeLatLng = function(geocodeResult) {
    return geocodeResult.geometry.location;
};
/**
 *  ある地点からある地点までの道順を表示する
 *  1度目に出発地点、2度目に目的地のlatLngを渡す
 *  @param  String / LatLng point   地名 or 緯度経度
 *  @param  String          mode    (Optional) 移動手段（省略すると車）
 *                                             TravelModeの定数のどれか
 *  @param  String          panelId (Optional) 道順の説明を表示するdiv等のid
 */
GoogleMapper.direct = function(point, mode, panelId) {
    if (!GoogleMapper._router) {    //1回目の呼び出しの場合
        GoogleMapper._router = { from: point, mode: mode, panelId: panelId };
        return;
    }

    var router = GoogleMapper._router;
    GoogleMapper._router = null;

    var renderer = new google.maps.DirectionsRenderer({
        map: GoogleMapper.map,
        draggable: true
    });

    var panel = null;
    panelId = (panelId || router.panelId);

    if (panelId) {  //道順の詳細を別パネルに表示する場合
        panel = document.getElementById(panelId);
        panel.innerHTML = "データを取得しています<br />しばらくお待ちください";
        renderer.setPanel(panel);
    }

    var request = {
        origin: router.from,
        destination: point,
        travelMode: (mode || router.mode || google.maps.TravelMode.DRIVING),
        provideRouteAlternatives: true,
        unitSystem: google.maps.UnitSystem.METRIC
    };

    (new google.maps.DirectionsService()).route(request, function(response, status) {
        if (panel) {
            panel.innerHTML = "";
        }

        if (GoogleMapper.checkResponseStatus(status)) {
            renderer.setDirections(response);
        }
    });
};
/**
 *  ストリートビューを地図とは別に表示できるようにする
 *  @param  String  panelId ストリートビューを表示する場所（div等）のid属性
 */
GoogleMapper.setStreetView = function(panelId) {
    GoogleMapper.map.setStreetView(new google.maps.StreetViewPanorama(
        document.getElementById(panelId),
        { enableCloseButton: true, visible: false }
    ));
};
/**
 *  Google Placesに登録されているスポットを表示する（要Placesライブラリ）
 *  @param  Number  iconSize    (Optional) アイコンの表示サイズ
 *  @see http://code.google.com/apis/maps/documentation/javascript/places.html
 */
GoogleMapper.showPlaces = function(iconSize) {
    (new google.maps.places.PlacesService(GoogleMapper.map)).search(
        { bounds: GoogleMapper.map.getBounds() },   //取得対象範囲は表示中の地図
        function(results, status) {
            if (!GoogleMapper.checkResponseStatus(status)) {
                return;
            }

            GoogleMapper._places = GoogleMapper._places || {};
            iconSize = (iconSize || 24);
            var size = new google.maps.Size(iconSize, iconSize);

            for (var i = 0; i < results.length; i++) {
                var place = results[i];

                if (!GoogleMapper._places[place.id]) {
                    GoogleMapper.addPlace(place, size);
                    GoogleMapper._places[place.id] = true;
                }
            }
        }
    );
};
/**
 *  Google Placesのスポットをマーカーとして表示する
 *  @param  PlaceResult place   スポット情報
 *  @param  Size        size    アイコンサイズ
 */
GoogleMapper.addPlace = function(place, size) {
    var marker = new google.maps.Marker({
        map: GoogleMapper.map,
        position: place.geometry.location,
        title: place.name,
        icon: new google.maps.MarkerImage(place.icon, null, null, null, size)
    });

    //クリックされたら詳細ページへのリンクを表示する
    google.maps.event.addListener(marker, "click", function() {
        GoogleMapper.log(place.types.join());

        (new google.maps.places.PlacesService(GoogleMapper.map)).getDetails(
            { reference: place.reference },
            function(detail, status) {
                if (!GoogleMapper.checkResponseStatus(status)) {
                    return;
                }

                var h = GoogleMapper.escape;
                var url = h(detail.url.replace('com', 'co.jp'));    //日本語ページにする
                GoogleMapper.openInfoWindow(
                    '<a href="' + url + '" target="_blank">' + h(detail.name) + "</a>",
                    null,
                    marker
                );
            }
        );
    });
};
/**
 *  地図上に広告（Google AdSense）を表示する（要AdSenseライブラリ）
 *  @param  String          pubId       AdSenseアカウントのサイト運営者ID
 *  @param  AdFormat        format      (Optional) AdSenseの形状
 *  @param  ControlPosition position    (Optional) 地図上のどこに表示するか
 *  @param  String          channel     (Optional) AdSenseのチャネル番号
 *  @see http://code.google.com/apis/maps/documentation/javascript/advertising.html
 */
GoogleMapper.showAds = function(pubId, format, position, channel) {
    (new google.maps.adsense.AdUnit(document.createElement("div"), {
        channelNumber: channel,
        format: format || google.maps.adsense.AdFormat.BANNER,
        map: GoogleMapper.map,
        position: position || google.maps.ControlPosition.TOP_CENTER,
        publisherId: pubId
    }));
};
/**
 *  メインの地図に重ねて、右下に沖縄のミニ地図を表示
 *  @param  Array   markers (Optional) 沖縄のミニ地図に表示するMarkerの配列
 */
GoogleMapper.showOkinawa = function(markers) {
    var map = GoogleMapper.map;

    google.maps.event.addListener(map, "tilesloaded", function() {
        google.maps.event.clearListeners(map, "tilesloaded");

        //表示領域
        var outer = map.getDiv().appendChild(document.createElement("div"));
        outer.style.position = "absolute";
        outer.style.right = 0;
        outer.style.bottom = "120px";   //Overview Map Controlの分だけ空ける
        outer.style.overflow = "hidden";
        outer.style.width = "113px";
        outer.style.height = outer.style.width;
        outer.style.border = "solid 0 #eee";
        outer.style.borderWidth = "6px 0 6px 6px";

        //実際に地図が載るところ
        var inner = outer.appendChild(document.createElement("div"));
        inner.style.height = "160px";
        inner.style.top = "-23px";
        var okinawa = new google.maps.Map(inner, {
            center: new google.maps.LatLng(26.5, 127.9),    //沖縄本島の中心あたり
            zoom: map.getZoom(),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true, //操作系は不可で
            disableDoubleClickZoom: true,
            draggable: false,
            keyboardShortcuts: false,
            scrollwheel: false
        });

        //閉じるボタン
        var closeBtn = outer.appendChild(document.createElement("div"));
        closeBtn.innerHTML = "×";
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "-5px";
        closeBtn.style.right = 0;
        closeBtn.style.padding = "0 3px";
        closeBtn.style.backgroundColor = "#eee";
        closeBtn.style.cursor = "pointer";
        closeBtn.onclick = function() { outer.style.display = "none"; };

        //ミニ地図をクリックすると拡大してメインの地図に表示
        google.maps.event.addListener(okinawa, "click", function() {
            map.setCenter(okinawa.getCenter());
            map.setZoom(okinawa.getZoom() + 4);
        });

        //メイン地図と同じ位置にマーカーを表示
        if (!markers) {
            return;
        }
        var duplicateMarker = function(origin) {
            var marker = new google.maps.Marker({
                position: origin.position,
                title: origin.title,
                icon: origin.icon,
                shadow: origin.shadow
            });
            marker.setMap(okinawa);
            google.maps.event.addListener(marker, "click", function() {
                GoogleMapper.openMarkerWindow(origin);
            });
        };
        for (var i = 0, len = markers.length; i < len; i++) {
            duplicateMarker(markers[i]);
        }
    });
};
/**
 *  consoleがある場合のみ、コンソールに出力する
 *  @param  Object  value
 */
GoogleMapper.log = function(value) {
    if (window.console && console.log) {
        console.log(value);
    }
};
/******************************************************************************
 *  使用例
 *  GoogleMapeer.demo("gmap", "route", "keywords");
 *  @param  String  mapId           地図を表示する場所（div等）のid属性
 *  @param  String  streetViewId    (Optional) ストリートビューを表示するdiv等のid属性
 *  @param  String  routerPanelId   (Optional) 道順を表示する場所（div等）のid属性
 *  @param  String  keywordInputId  (Optional) 検索用テキストボックスのid属性
 ******************************************************************************/
GoogleMapper.demo = function(mapId, streetViewId, routerPanelId, keywordInputId) {
    var demo = GoogleMapper.demo;

    //地図を表示（緯度経度ズームを渡さないと日本列島を表示する）
    var map = GoogleMapper.show(mapId);

    //マーカーを表示
    var iconUrl = "//google-maps-icons.googlecode.com/files/moderntower.png";
    var tokyo = GoogleMapper.addMarker(35.7, 139.7, "東京", iconUrl);
    //マーカー上に吹き出しを表示
    GoogleMapper.openMarkerWindow(tokyo);
    //色の違うマーカーを表示
    GoogleMapper.addColorMarker(34.7, 135.5, "大阪", "FF0", "000", "虎");
    //吹き出し型のマーカーを表示
    var naha = GoogleMapper.addBubbleMarker(26.2, 127.7, "<那覇>");

    //沖縄のミニ地図を表示
    GoogleMapper.showOkinawa([naha]);

    //ストリートビューを地図とは別に表示できるようにする
    GoogleMapper.setStreetView(streetViewId);

    //地図上をクリック可能にする
    GoogleMapper.beClickable(function(latLng) { //クリックされた時のCallback関数
        //逆ジオコーディングして地名をタイトルバーに表示
        GoogleMapper.searchByLatLng(latLng, function(response, status) {
            if (GoogleMapper.checkResponseStatus(status)) {
                document.title = GoogleMapper.getGeocodeAddress(response[0]);
            }
        });

        //緯度・経度を吹き出しに表示
        var h = "緯度: " + latLng.lat() + "<br />経度: " + latLng.lng();

        //二つの地点間の車または徒歩の道順を表示
        if (demo.startFlg) {    //スタート地点指定済みの場合
            demo.startFlg = false;
            GoogleMapper.direct(latLng);
            return "";  //この場合は吹き出し表示なし
        }
        demo.startFlg = false;
        demo.startRouting = function(mode) {
            GoogleMapper.mapClickable = false;
            demo.startFlg = true;
            GoogleMapper.direct(latLng, mode, routerPanelId);
            GoogleMapper.closeInfoWindow();
        };
        h += "<br /><br />ここから次にクリックする場所までの道順を表示できます<br />";
        var modes = {
            DRIVING: "車",
            //BICYCLING: "自転車",  //日本は未対応
            WALKING: "歩き"
        };
        for (var mode in modes) {
            h += '<input type="button" value="' + modes[mode] + 'の場合"';
            h += ' onclick="GoogleMapper.demo.startRouting(';
            h += 'google.maps.TravelMode.' + mode + ')" /> ';
        }

        return h;   //戻り値が吹き出しに表示される
    });

    //道順の終点はマーカーでもOKにする
    var getMarkerInfo = GoogleMapper.getMarkerInfo; //オリジナルを退避
    GoogleMapper.getMarkerInfo = function(marker) {
        if (demo.startFlg) {    //スタート地点指定済みの場合
            demo.startFlg = false;
            GoogleMapper.direct(marker.position);
            return "";
        }
        return getMarkerInfo(marker);
    };

    //検索キーワードの入力補完（要placesライブラリ）
    if (google.maps.places) {
        GoogleMapper.setAutocomplete(keywordInputId);
    }

    //地名や施設名等で検索する（ジオコーディング）
    var searchBox = document.getElementById(keywordInputId);
    demo.search = function() {
        GoogleMapper.search(searchBox.value);
        searchBox.focus();
    };

    //consoleがあれば、中心点とズーム値をコンソールに表示
    google.maps.event.addListener(map, "idle", function() {
        var center = map.getCenter();
        var latlng = "lat:" + center.lat() + ", lng:" + center.lng();
        GoogleMapper.log(latlng + ", zoom:" + map.getZoom());
    });
};
