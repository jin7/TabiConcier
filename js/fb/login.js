window.fbAsyncInit = function() {
    FB.init({appId: '106854749438502', status: true, cookie: true, xfbml: true});

    /* All the events registered */
    FB.Event.subscribe('auth.login', function(response) {
        // do something with response
        login();
//        changeToSplash();
    });
    FB.Event.subscribe('auth.logout', function(response) {
        // do something with response
        logout();
    });

    FB.getLoginStatus(function(response) {
        if (response.session) {
            // logged in and connected user, someone you know
            login();
        }
//        changeToSplash();
    });
};
(function() {
    var e = document.createElement('script');
    e.type = 'text/javascript';
    e.src = document.location.protocol +
        '//connect.facebook.net/en_US/all.js';
    e.async = true;
    var fbroot = document.getElementById('fb-root');
    if (fbroot) fbroot.appendChild(e);
}());

function login(){
    FB.api('/me', function(response) {
        document.getElementById('login').style.display = "block";
        //document.getElementById('login').innerHTML = response.name + " succsessfully logged in!";
    });
}
function logout(){
    document.getElementById('login').style.display = "none";
}

function graphStreamPublish(){
    var body = document.getElementById('speech-input-field').value;
    if (body == '') {
        alert('empty message.');
        return;
    }
    FB.api('/me/feed', 'post', { message: body }, function(response) {
        if (!response || response.error) {
            alert('Error occured');
        } else {
            document.getElementById('speech-input-field').value = '';
            alert('done post.Post ID: ' + response.id);
        }
    });
}
