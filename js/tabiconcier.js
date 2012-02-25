    var directionsDisplay = new google.maps.DirectionsRenderer();
    var directionsService = new google.maps.DirectionsService();

    var mapObj;
    var markerList = [];
    var mapenv = { 'center': '36.725943, 136.706325', 'zoom': 15 };  // PFU, Unoke

    var places_search_input;

    // 各目的地の滞在時間
    var dicStay = new Object();
    var DEFAULT_STAY = 30;

    var infowindow = new google.maps.InfoWindow({
        zIndex: 10100
    });

    var _lid = 0;  // 場所情報オブジェクトID

    $('#map_canvas').gmap({
        'center': mapenv.center,
        'zoom': mapenv.zoom,
        'disableDefaultUI':false,
        'callback': function() {
            var self = this;

            // 検索ボックスを配置
            var control = self.get('control', function() {
                $(self.el).append('<div id="control"><div><input id="places-search" class="ui-bar-d ui-input-text ui-body-null ui-corner-all ui-shadow-inset ui-body-d ui-autocomplete-input" type="text"/></div></div>');
                return $('#control')[0];
            });
            self.addControl(new control(), 1);

            // 現在位置にマーカーを配置
            // TODO : self.addShapeで怒られる。#<Object>にaddShapeメソッドなんか無いッ！て
//                    self.getCurrentPosition(function(position, status) {
//                        if ( status === 'OK' ) {
//                            var clientPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
//                            self.addMarker({'position': clientPosition, 'bounds': true});
//                            self.addShape('Circle', {
//                                'strokeWeight': 0,
//                                'fillColor': "#008595",
//                                'fillOpacity': 0.25,
//                                'center': clientPosition,
//                                'radius': 15,
//                                'clickable': false
//                            });
//                        }
//                    });
        }
    });

    //クリックイベント
    $('#legopen').click(function() {
        //パネルをアニメーションでトグル出来るようにする
//        $("#legpanel").animate({width: 'toggle'}, 300);
        $("#overlay").animate({width: 'toggle'}, 300);
    });

    // 行程リスト（オーバーレイビュー）追加
    $("#legpart").append("<div data-role='content' id='overlay' data-theme='a'><ul data-role='listview' id='departureList'><li data-role='list-divider' data-theme='a'>何時にご出発されますか？</li><li data-role='fieldcontain'><input type='range' name='departureHour' id='departureHour' value='8' min='0' max='23' style='width:40px;height:20px'/><label for='lblDepartureHour'>時</label><input type='range' name='departureMin' id='departureMin' value='30' min='0' max='59' style='width:40px;height:20px' /><label for='lblDepartureMin'>分</label><br /><br /></li></ul><ul data-role='listview' data-split-icon='delete' id='departureLocation'>" + getDepartureLocationDivider() + "</ul><br /><br /><ul data-role='listview' data-split-icon='delete' id='location_list'>" + getLegListDivider() + "</ul><ul data-role='listview' id='directions_panel'></ul></div>");
//    $("#legpart").append("<div data-role='content' id='overlay' data-theme='a'><a>出発時刻を入力してね！<input type='number' max='24' min='0' style='width:50px' id='departureTime' name='departureTime' value='8' /></a><br /><Image src='img/head2.gif' height=20 width=485 /><ul data-role='listview' data-split-icon='delete' id='location_list'></ul><div id='directions_panel'></div></div>");
//    $("#legpart").append("<div data-role='content' id='overlay' data-theme='a'><ul data-role='listview' id='departureList'><li data-role='list-divider' data-theme='a'>出発時刻を入力してね！</li><li data-role='fieldcontain'><input type='range' name='departureHour' id='departureHour' value='8' min='0' max='23' style='width:40px;height:20px'/><label for='lblDepartureHour'>時</label><input type='range' name='departureMin' id='departureMin' value='30' min='0' max='59' style='width:40px;height:20px' /><label for='lblDepartureMin'>分</label><br /><br /></li></ul><ul id='overlay' data-role='listview' data-split-icon='delete'><li><a>test</a></li></ul>");

    // 配置先／移動先の場所から詳細検索して、マーカー情報設定。
    // dspDialog が true ならダイアログを表示。
    // isStorege が true ならストレージに格納
    function findLocation(location, marker, stay, dspDialog, isStorage) {
        $('#map_canvas').gmap('search', {'location': location}, function(results, status) {
            if ( status === 'OK' ) {
                // マーカーを設定
                $.each(results[0].address_components, function(i,v) {
                    if ( v.types[0] == "administrative_area_level_1" ||
                         v.types[0] == "administrative_area_level_2" ) {
                        $('#state'+marker.__gm_id).val(v.long_name);
                    } else if ( v.types[0] == "country") {
                        $('#country'+marker.__gm_id).val(v.long_name);
                    }
                });
                marker.setTitle(results[0].formatted_address);
                $('#address'+marker.__gm_id).val(results[0].formatted_address);
                if (stay == undefined) {
                    stay = DEFAULT_STAY;
                }
                $('#stay'+marker.__gm_id).val(stay);

                placeMarker(marker, stay, isStorage);  // マーカー配置

                if (dspDialog)
                {
                    openDialog(marker);   // ダイアログで場所情報を表示
                }
            }
        });
    }
    // マーカーを配置する
    function placeMarkerFromLocObj(locObj, marker, isStorage)
    {
        // 場所情報を行程リストへ追加
        addLocationToLegList(locObj);

        // 滞在時間を滞在時間連想配列へ追加
        var stayKey = getKey(marker);
        storeStayToStayList(stayKey, locObj.stay);

        // 場所情報をストレージへ追加
        if (isStorage)
        {
            addLocationToStorage(locObj);
        }
        
        // マーカー連想配列にマーカーと場所情報オブジェクトを関連付けて保持
        markerList[getKey(locObj)] = marker;
    }
    // マーカーを配置する
    function placeMarker(marker, stay, isStorage)
    {
        // 場所情報オブジェクトを生成
        var locObj = GenerateLocationInfo(marker, stay);

        // 場所情報を行程リストへ追加
        addLocationToLegList(locObj);

        // 滞在時間を滞在時間連想配列へ追加
        var stayKey = getKey(marker);
        storeStayToStayList(stayKey, stay);

        // 場所情報をストレージへ追加
        if (isStorage)
        {
            addLocationToStorage(locObj);
        }
        
        // マーカー連想配列にマーカーと場所情報オブジェクトを関連付けて保持
        markerList[getKey(locObj)] = marker;
    }
    // 場所情報オブジェクト生成
    function GenerateLocationInfo(marker, stay)
    {
        var locObj = new Object();
        locObj.location = marker.getPosition();
        locObj.lat = locObj.location.lat();
        locObj.lon = locObj.location.lng();
        locObj.title = marker.getTitle();
        locObj.address = marker.getTitle();
        locObj.name = "";
        if (stay) {
            locObj.stay = stay;
        }
// MarkerオブジェクトはJSON化できない
//        locObj.marker = marker;
        return locObj;
    }
    // 場所情報を行程リストへ追加
    function addLocationToLegList(locObj)
    {
        var li = $("<li data-role='list-divider' data-theme='b'></li>");
        var aText;
        if (locObj.name) {
            aText = locObj.name;
        } else {
            aText = locObj.address;
        }
        var anchorInfo = $("<a href='#' locLanLon='" + locObj.lat + '-' + locObj.lon + "' id='locAddress' locaddr='" + locObj.address + "' style='margin-left:20px'>" + aText + "</a>");
        li.append(anchorInfo);
        var delBtn = $("<a id='delLoc' locKey='" + getKey(locObj) + "'>削除</a>");
        li.delegate("a", "click", function() {

            var locKey = $(this).attr("locKey");
            if (locKey)
            {
                deleteLocation(locKey);
                return;
            }
            var locLanLon = $(this).attr("locLanLon");
            if (locLanLon)
            {
               mapObj.setCenter(getLanLon(locLanLon));
               mapObj.setZoom(15);
            }
        });

        li.append(delBtn);

        if ($('#depLoc').size() == 0 && locObj.isDept) {
            li.attr('id', 'depLoc');
            $('#departureLocation').append(li);
        } else {
            $('#location_list').append(li);
        }

        refreshLocationList();
    }
    // 場所情報をストレージへ追加
    function addLocationToStorage(locObj)
    {
        var key = getKey(locObj);
        $.jStorage.set(key, locObj);
    }
    // ダイアログを更新
//    function updateDialogList(marker)
//    {
//        var dlgs = $('#dialog').children;
//        $.each(dlgs, function(i, dlg) {
//            var dlgid = dlg.getElementById('dialog' + marker.__gm_id);
//            if (!dlgid) {
//                var isDept = dlg.getElementById('isDept');
//                isDept.checked = false;
//            }
//        });
//    }
    // ストレージの場所情報を更新
    function updateLocation(locKey, loc_name, stay, comment, isDept)
    {
        var locObj = $.jStorage.get(locKey);
        locObj.stay = stay;
        locObj.name = loc_name;
        if (isDept == 'true') {
            locObj.isDept = true;
        }
        if (comment) {
            locObj.comment = comment;
        }
        $.jStorage.set(locKey, locObj);
        if (isDept == 'true') {
            var keys = $.jStorage.index();
            $.each(keys, function(i, k) {
                if (k != locKey) {
                    var locObj = $.jStorage.get(k);
                    locObj.isDept = false;
                    $.jStorage.set(k, locObj);
                }
            });
        }
    }
    // 滞在時間連想配列に滞在時間を追加／存在する滞在時間を更新
    function storeStayToStayList(stayKey, stay)
    {
        dicStay[stayKey] = stay;
    }
    // 場所情報を削除
    function deleteLocation(obj)
    {
        var locKey = getKey(obj);

        // 場所情報をストレージから削除
        var locObj = deleteLocationFromStorage(locKey);

        if (locObj == null) return;

        // マーカーを削除
        deleteMarker(locObj);

        // 行程リスト表示を更新
        reloadLocationList();

        deleteFromMemoryList(locObj);
    }
    // メモリー上の連想配列からレコード削除
    function deleteFromMemoryList(locObj)
    {
        var locKey = getKey(locObj);
        delete markerList[locKey];
        delete dicStay[getKey(locObj)];
    }
    // マーカーを削除
    function deleteMarker(locObj)
    {
        if (locObj instanceof google.maps.Marker)
        {
            locObj.setMap(null);
        }
        else
        {
            var marker = getMarker(locObj);
            if (marker) {
                marker.setMap(null);
                marker.setMap(null);
            }
//            var latlng = new google.maps.LatLng(locObj.lat, locObj.lon);
//            mapObj.setCenter(latlng);
        }
    }
    // マーカーを取得
    function getMarker(locObj)
    {
        var isKeyString = typeof locObj == 'string';
        if (isKeyString)
        {
            return markerList[locObj];
        }
        else
        {
            var locKey = getKey(locObj);
            return markerList[locKey];
        }
    }
    // 場所情報をストレージから削除
    function deleteLocationFromStorage(locKey)
    {
        var locObj = $.jStorage.get(locKey);
        $.jStorage.deleteKey(locKey);
        return locObj;
    }
    // 行程リストを再表示
    function refreshLocationList()
    {
        if (!isInitialize)
        {
            $('#departureLocation').listview('refresh');
            $('#location_list').listview('refresh');
        }
    }
    // ストレージ用のキーを取得
    function getKey(obj)
    {
        var limtter = '-';
        if (obj instanceof google.maps.Marker)
        {
            return obj.position.lat() + limtter + obj.position.lng();
        }
        else if (obj instanceof google.maps.LatLng)
        {
              return obj.lat() + limtter + obj.lng();
        }
        else if (typeof obj == 'string')
        {
            return obj;
        }
        else
        {
            return obj.lat + limtter + obj.lon;
        }
    }
    // LatLngオブジェクトを取得
    function getLanLon(key)
    {
        var latlon = key.split('-');
        return new google.maps.LatLng(latlon[0], latlon[1]);
    }
    // 場所情報オブジェクトを取得
    function getLocationObject(latlng)
    {
        var locKey = getKey(latlng);
        return $.jStorage.get(locKey);
        
    }
    // 場所情報名を取得（nameが設定無い場合は、addressを取得）
    function getLocationName(latlng)
    {
        var locObj =getLocationObject(latlng);
        if (locObj.name) {
            return locObj.name;
        } else {
            return locObj.address;
        }
    }
    // 場所情報のロード
    function loadLocation()
    {
        loadLocationFromStorage();
    }
    // ストレージから場所情報を読み込み、行程リストへ追加、マーカー配置
    function loadLocationFromStorage()
    {
        // 行程リストへ追加、マーカー配置
        var keys = $.jStorage.index();
        $.each(keys, function(i, k) {
            var locObj = $.jStorage.get(k);
            if (locObj.comment == undefined) {
                locObj.comment = "";
            }
            if (locObj.stay == undefined) {
                locObj.stay = DEFAULT_STAY;
            }
            if (locObj.isDepLoc == undefined) {
                locObj.isDepLoc = false;
            }
            if (locObj.name == undefined) {
                locObj.name = "";
            }
            if (locObj.address == undefined) {
                locObj.address = locObj.title;
            }
            loadMarkerOnMap(locObj);  // マーカー配置
        });
    }
    // ダイアログ要素取得
    function getDialogElement(marker, locObj) {
        var formelm = $('<form data-theme="a" id="dialog' + marker.__gm_id + '" method="get" action="/" style="display:none;"><p><label for="loc_name">名前</label><input id="loc_name' + marker.__gm_id + '" class="txt" name="loc_name" value="' + locObj.name + '"/></p><p><label for="address">住所</label><input id="address' + marker.__gm_id + '" class="txt" name="address" value="' + locObj.address + '"/></p><p><label for="stay">滞在時間(分)</label><input id="stay' + marker.__gm_id + '" class="txt" name="stay" onkeyDown="return numOnly()" style="width:50px" value="' + locObj.stay + '"/></p><p><label for="comment">コメント</label><textarea id="comment' + marker.__gm_id + '" class="txt" name="comment" cols="30" rows="3">' + locObj.comment + '</textarea></p></form>');
        var pelm = $('<p></p>');
        var inputelm = $('<input type="checkbox" id="isDept' + marker.__gm_id + '" value="false" style="width:30px;height:30px"><p style="margin-left:10px">出発地とする</p>');
        if (locObj.isDept) {
            inputelm[0].checked = true;
        }
//        pelm.append(inputelm);
        formelm.delegate('input', 'click', function() {
            if (this.id.indexOf('isDept') == 0 ) {
                if (this.checked) {
                    $(this).val("true");
                } else {
                    $(this).val("false");
                }
            }
        });
//        formelm.append(pelm);
        formelm.append(inputelm);
        return formelm;
    }
    // 行程情報オブジェクトを元にマーカーを配置する
    function loadMarkerOnMap(locObj)
    {
        addLocationToLegList(locObj);
        var stayKey = getKey(locObj);
        storeStayToStayList(stayKey, locObj.stay);

        var latlng = new google.maps.LatLng(locObj.lat, locObj.lon);
        $('#map_canvas').gmap('addMarker', {
            'position': latlng,
            'draggable': false,
            'bounds': false},
            function(map, marker) {
                $('#dialog').append(getDialogElement(marker, locObj));
                marker.setTitle(locObj.name);
                markerList[getKey(locObj)] = marker;
        }).click( function() {
            openDialog(this);
        });
    }
    // マーカーを追加する
    function addMarker(locObj, dspDialog, isStorage)
    {
        var latlng = new google.maps.LatLng(locObj.lat, locObj.lon);
        $('#map_canvas').gmap('addMarker', {
            'position': latlng,
            'draggable': false,
            'bounds': false},
            function(map, marker) {
                $('#dialog').append(getDialogElement(marker, locObj));
                if (locObj.address == "") {
                    // 住所検索＆マーカー配置
                    findLocation(marker.getPosition(), marker, locObj.stay, dspDialog, isStorage);
                } else {
                    // マーカー配置
                    if (locObj.name) {
                        marker.setTitle(locObj.name);
                    } else {
                        marker.setTitle(locObj.address);
                    }
                    placeMarkerFromLocObj(locObj, marker, isStorage);
                    if (dspDialog)
                    {
                        openDialog(marker);   // ダイアログで場所情報を表示
                    }
                }
        }).click( function() {
            openDialog(this);
        });
    }
    // 行程リストをクリア
    function clearLocationList()
    {
        $('#departureLocation').empty();
        $('#departureLocation').append(getDepartureLocationDivider);
        $('#location_list').empty();
        $('#location_list').append(getLegListDivider());
    }
    // 行程リストdivider
    function getLegListDivider()
    {
        return "<li data-role='list-divider' data-theme='a'>何処に行かれますか？</li>";
    }
    // コンシェル結果リストdivider
    function getConcierDivider()
    {
        return "<br /><br /><li data-role='list-divider' data-theme='a'>ご提案する行程</li>";
    }
    // 出発地divider
    function getDepartureLocationDivider()
    {
        return "<li data-role='list-divider' data-theme='a'>何処からご出発されますか？</li>";
    }
    // 行程リストを再ロード＆表示
    function reloadLocationList()
    {
        clearLocationList();
        loadLocationFromStorage();
        refreshLocationList();
    }
    // マーカー場所の詳細情報をダイアログ表示する
    function openDialog(marker) {
        $('#dialog'+marker.__gm_id)
          .css({'z-index': 10000})
          .dialog({
            'modal':true,
            'title': 'ここになさいますか？',
            'buttons': {
                "行かない": function() {
                    $(this).dialog( "close" );
                    marker.setMap(null);
                    deleteLocation(marker);
                },
                "行く": function() {
                    var dicKey = getKey(marker);
                    var stay = $('#stay'+marker.__gm_id).val();
                    var comment = $('#comment'+marker.__gm_id).val();
                    storeStayToStayList(dicKey, stay);

                    var loc_name = $('#loc_name'+marker.__gm_id).val();
                    if (loc_name.length > 0) {
                        marker.setTitle(loc_name);
                    }
                    var isDept = $('#isDept' + marker.__gm_id).val();
                    updateLocation(getKey(marker), loc_name, stay, comment, isDept);
//                    updateDialogList(marker);
                    reloadLocationList();

                    $(this).dialog( "close" );
                }
            }
        });
    }
    // 数値のみを入力可能にする
    function numOnly() {
        m = String.fromCharCode(event.keyCode);
        if("0123456789\b\r".indexOf(m, 0) < 0) return false;
        return true;
    }
    // 経過時間を現在時間に足しこむ
    function timeCalc(hour, min, stay) {
        var intHour    = parseInt(hour);
        var intMin     = parseInt(min);
        var intStaySec = parseInt(stay);

        if (intStaySec >= 60) {
            intMin += Math.floor(intStaySec / 60);
        }
        if ((intStaySec % 60) >= 30) {
            intMin++;
        }
        if (intMin >= 60) {
            intHour += Math.floor(intMin / 60);
            intMin %= 60;
        }

        hour = intHour.toString();
        min  = intMin.toString();

        return [hour, min];
    }
    // コンシェル
    function doConcier()
    {
        // TODO: 交通手段選択可能に
        var travelMode = google.maps.DirectionsTravelMode.DRIVING;
        var keys = $.jStorage.index();
        var keyNum = keys.length;
        if (keyNum <= 1) {
            alert('行かれる場所は2つ以上お選びください');
            return;
        }
        var dhour = $('#departureHour').val();
        var dmin  = $('#departureMin').val();
        if (dhour == "" || dmin == "") {
            alert('出発時刻をお申し付けください');
            return;
        }
        var start = null;
        var end = null;
        var waypts = [];
        $.each(keys, function(i, k) {
            var locObj = $.jStorage.get(k);
            if (start == null && locObj.isDept) {
                start = new google.maps.LatLng(locObj.lat, locObj.lon, true);
                end = new google.maps.LatLng(locObj.lat, locObj.lon, true);
            } else {
                waypts.push({
                    location: new google.maps.LatLng(locObj.lat, locObj.lon, true),
                    stopover: true
                });
            }
        });
        if (start == null) {
            alert('ご出発地をご指定ください');
            return;
        }
        var request = {
            origin: start,
            destination: end,
            waypoints: waypts,
            optimizeWaypoints: true,
            travelMode: travelMode
        };
        directionsService.route(request, function(response, status) {
          if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
            var route = response.routes[0];

            var dp = $('#directions_panel');
            dp.empty();
            dp.append(getConcierDivider());

            var li = $("<li data-role='list-divider' data-theme='b'><img src='img/concier.png' height=100 width=100 /><div class='baroon'>この行程を提案いたします<br />　出発：" + $('#departureHour').val() + ":" + $('#departureMin').val() + "<br />　到着：<label id='arrivalTime'/><br />　トータル移動距離：<label id='totalDistance'/><br /></div></li>");
            dp.append(li);

            var travelModeStr;
            if (travelMode == google.maps.DirectionsTravelMode.DRIVING)
            {
                travelModeStr = "<br /><b>お車の場合、";
            }
            else if (travelMode == google.maps.DirectionsTravelMode.WALKING)
            {
                travelModeStr = "<br /><b>徒歩の場合、";
            }
            else if (travelMode == google.maps.DirectionsTravelMode.BICYCLING)
            {
                travelModeStr = "<br /><b>自転車の場合、";
            }
            travelModeStr += "このような行程です。楽しいお旅を！</b><br /><br />";
            dp.append("<li data-role='list-divider' data-theme='b'>" + travelModeStr + "</li>");

            var totalDistance = 0.0;

            // 出発時刻
            var hour = $('#departureHour').val();
            var min  = $('#departureMin').val();

            li = $("<li data-role='list-divider' data-theme='b'></li>");
            li.append('<b>■' + getLocationName(start) + '</b><br />');
            li.append('　　　　出発　　' + hour + '時' + min + '分<br />');
            dp.append(li);

            for (var i = 0; i < route.legs.length - 1; i++) {
                li = $("<li data-role='list-divider' data-theme='b'></li>");
                li.append("<Image src='img/car.png' style='height:40px;width=40px;margin-left:40px;margin-top:-5px' /><label style='margin-left:80px;font-size: normal'>" + route.legs[i].distance.text + " - " + route.legs[i].duration.text + "</label><br />");
                dp.append(li);
                totalDistance += parseFloat(route.legs[i].distance.text);

                // 到着時刻
                var arrTime = timeCalc(hour, min, route.legs[i].duration.value);
                hour = arrTime[0];
                min = arrTime[1];
                var locObj = getLocationObject(waypts[route.optimized_waypoint_order[i]].location);
//                var locname = getLocationName(waypts[route.optimized_waypoint_order[i]].location);
                var locname, locaddr, locurl;
                if (locObj.name) {
                    locname = locObj.name;
                } else {
                    locname = "";
                }
                if (locObj.address) {
                    locaddr = locObj.address;
                } else {
                    locaddr = "";
                }
                if (locObj.url) {
                    locurl = locObj.url;
                } else {
                    locurl = "";
                }
                var locKey = getKey(waypts[route.optimized_waypoint_order[i]].location);
                var loclat = waypts[route.optimized_waypoint_order[i]].location.lat();
                var loclng = waypts[route.optimized_waypoint_order[i]].location.lng();
                li = $("<li data-role='list-divider' data-theme='b' locKey='" + locKey + "' locname='" + locname + "' locaddr='" + locaddr + "' locurl='" + locurl + "' loclat='" + loclat + "' loclng='" + loclng + "'></li>");
                if (locname) {
                    li.append('<b>■' + locname + '</b><br />');
                } else {
                    li.append('<b>■' + locaddr + '</b><br />');
                }
                li.append('　　　　到着　　' + hour + '時' + min + '分<br />');
                dp.delegate("li", "click", function() {
                    var locKey = $(this).attr("locKey");
                    if (locKey) {
                        var locurl = $(this).attr("locurl");
                        var locname = $(this).attr("locname");
                        var locaddr = $(this).attr("locaddr");
                        var loclat = $(this).attr("loclat");
                        var loclng = $(this).attr("loclng");
                        if (locurl) {
                            var a;
                            if (locname) {
                                a = $("<a href='#' id='" + locurl + "'>" + locname + "</a>");
                            } else {
                                a = $("<a href='" + locurl + "'>" + locaddr + "</a>");
                            }
                            $(function() {
                                a.click(function() {
                                    window.open(this.id);
                                });
                            });
                            infowindow.setContent(a[0]);
                        } else {
                            if (locname) {
                                infowindow.setContent("<p>" + locname + "</p>");
                            } else {
                                infowindow.setContent("<p>" + locaddr + "</p>");
                            }
                        }
                        var latlng = new google.maps.LatLng(loclat, loclng);
                        infowindow.setPosition(latlng);
                        infowindow.open(mapObj);
                        mapObj.setCenter(latlng);
                    }
                });

                // 滞在時間
                li.append('　　　　滞在　　' + dicStay[getKey(waypts[route.optimized_waypoint_order[i]].location)] + '分<br />');

                // 出発時刻
                var depTime = timeCalc(hour, min, parseInt(dicStay[getKey(waypts[route.optimized_waypoint_order[i]].location)]) * 60);
                hour = depTime[0];
                min = depTime[1];
                li.append('　　　　出発　　' + hour + '時' + min + '分<br />');
                dp.append(li);
            }

            li = $("<li data-role='list-divider' data-theme='b'></li>");
            li.append("<Image src='img/car.png' style='height:40px;width=40px;margin-left:40px;margin-top:-5px' /><label style='margin-left:80px;font-size: normal'>" + route.legs[route.legs.length - 1].distance.text + " - " + route.legs[route.legs.length - 1].duration.text + "</label><br />");
            dp.append(li);
            totalDistance += parseFloat(route.legs[route.legs.length - 1].distance.text);

            // 到着時刻
            var arrTime = timeCalc(hour, min, route.legs[route.legs.length - 1].duration.value);
            hour = arrTime[0];
            min = arrTime[1];
            li = $("<li data-role='list-divider' data-theme='b'></li>");
            li.append('<b>■' + getLocationName(end) + '</b><br />');
            li.append('　　　　到着　　' + hour + '時' + min + '分<br />');
            dp.append(li);

            // 到着時刻とトータル移動距離を表示
            var el = document.getElementById('arrivalTime');
            el.innerHTML = hour + ":" + min;
            el = document.getElementById('totalDistance');
            el.innerHTML = totalDistance.toFixed(1) + "km";

            if (!isInitialize) {
                dp.listview('refresh');
            }
          }

        });
    }

    // 場所情報オブジェクトID生成
    function generateLID() {
        var retID = _lid;
        _lid++;
        return retID;
    }

    $('#map_canvas').gmap().bind('init', function(event, map) {
        // 現在位置に円表示
        // TODO : undefined で applyできん！って怒られる。。。
//        $('#map_canvas').gmap('getCurrentPosition', function(position, status) {
//            if ( status === 'OK' ) {
//                var clientPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
//                $('#map_canvas').gmap('addMarker', {'position': clientPosition, 'bounds': true});
//                $('#map_canvas').gmap('addShape', 'Circle', {
//                    'strokeWeight': 0,
//                    'fillColor': "#008595",
//                    'fillOpacity': 0.25,
//                    'center': clientPosition,
//                    'radius': 15,
//                    'clickable': false
//                });
//            }
//        });
        // マップ上クリックでマーカー配置
        $(map).click( function(event) {
            addMarker({lid:generateLID(), lat:event.latLng.lat(), lon:event.latLng.lng(), name:"", address:"", stay:DEFAULT_STAY, comment:""}, true, true);
        });
        mapObj = map;
        var dmap = $(map);
        directionsDisplay.setMap(map);

        // 検索コントロール準備（オートコンプリート、イベント）
        places_search_input = document.getElementById('places-search');
        var autocomplete = new google.maps.places.Autocomplete(places_search_input);
        autocomplete.bindTo('bounds', map);

        google.maps.event.addListener(autocomplete, 'place_changed', function() {
          places_search_input.value = "";
          var place = autocomplete.getPlace();
          if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
          } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);  // Why 17? Because it looks good.
          }

          // 検索結果からマーカー配置
          addMarker({lid:generateLID(), url:place.url, reference:place.reference, lat:place.geometry.location.lat(), lon:place.geometry.location.lng(), name:place.name, address:place.formatted_address, stay:DEFAULT_STAY, comment:""}, true, true);
        });
    });

$(function(){
    $('#splash').click(function() {
        $.mobile.changePage("#mapview",{transition:"fade"});
    });
//    setTimeout(function(){
//        $.mobile.changePage("#mapview",{transition:"fade"});
//    },3000);
});

    var isInitialize = true;
    loadLocation();
    isInitialize = false;
