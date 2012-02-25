if (navigator.userAgent.indexOf('iPad') != -1) {
    document.write('<link rel="stylesheet" type="text/css" href="css/tabiconcier-ipad.css">');
} else if (navigator.userAgent.indexOf('iPhone') != -1) {
    document.write('<link rel="stylesheet" type="text/css" href="css/tabiconcier-iphone.css">');
} else if (navigator.userAgent.indexOf('Android 2') != -1) {
    document.write('<link rel="stylesheet" type="text/css" href="css/tabiconcier-android2.css">');
} else if (navigator.userAgent.indexOf('Android 3.0') != -1) {
    document.write('<link rel="stylesheet" type="text/css" href="css/tabiconcier-android30.css">');
} else if (navigator.userAgent.indexOf('Android 3.1') != -1) {
    document.write('<link rel="stylesheet" type="text/css" href="css/tabiconcier-android31.css">');
} else if (navigator.userAgent.indexOf('Android 3.2') != -1) {
    document.write('<link rel="stylesheet" type="text/css" href="css/tabiconcier-android32.css">');
} else {
    document.write('<link rel="stylesheet" type="text/css" href="css/tabiconcier.css">');
}
