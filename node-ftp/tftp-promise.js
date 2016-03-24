var PromiseFtp = require('promise-ftp');

var setting = {
    'host': '192.168.119.*',
    'port': 21,
    'connTimeout ': 30,
    'user': '*',
    'password': '*',
    secure: false,
    secureOptions: undefined,
    connTimeout: 5000,
    pasvTimeout: 10000,
    keepalive: 10000
};
var ftp = new PromiseFtp();
var remoteDir = '/static.58.com/test/l/foo/';
ftp.connect(setting)
    .then(function(serverMessage) {
        console.log('Server message: ' + serverMessage);
        return ftp.list(remoteDir);
    }).then(function(list) {
        console.log('Directory listing:');
        console.dir(list);
        if (!list.length) {
            return ftp.mkdir(remoteDir)
        } else {
            return ftp.end();
        }
    }).then(function(res) {
        console.log('create result:%s', res);
        return ftp.end();
    }).catch(function(err) {
        console.log(err);
        return ftp.end();
    })
