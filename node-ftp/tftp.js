 var Client = require('ftp');
 var fs = require('fs');
 var path = require('path');

 var c = new Client();
 var upList = [
     'foo/a/foo.txt',
     'foo/a/ar.txt',
     'foo/a/kar.txt'
 ];
 c.on('greeting', function(msg) {
     console.log('connect ftp ok,%s', msg);
 });
 c.on('error', function(err) {
     console.log('ftp error:%s', err.toString());
 })
 c.on('close', function() {
     console.log('now close ftp connect.');
 })

 var remoteDir = '/static.58.com/test/l/';

 function doPut() {
     if (!upList.length) {
         c.end();
     } else {
         upfile = upList.shift();
         var dirname = path.dirname(upfile);
         doChekckAndAddDir(dirname, function(err) {
             c.put(upfile, remoteDir + upfile, function(err) {
                 if (err) {
                     console.log(err);
                     c.end();
                 }
                 console.info('... upload file [%s] success.', upfile);
                 doPut();
             });

         });


     }
 }

 var remoteDirMap = {};

 function doChekckAndAddDir(dirname, callback) {
     var _remoteDir = remoteDir + dirname;
     if (remoteDirMap[_remoteDir]) {
         return callback(null);
     }
     c.cwd(_remoteDir, function(err, currentDir) {
        console.log('check dir existed? %s',_remoteDir);
         if (err) {
             if (err.code !== 550) {
                 //当路径不存在时，error code === 550
                 console.error(err);
                 c.end();
                 return;
             }
             //新建
             console.log("%s not existed,create it now ...", _remoteDir);
             c.mkdir(_remoteDir, true, function(err) {
                 if (err) {
                     console.error(err);
                     c.end();
                     return;
                 }
                 remoteDirMap[_remoteDir] = true;
                 console.log('create dir %s suc', _remoteDir);
                 callback(null);
             })

         } else {
             remoteDirMap[_remoteDir] = true;
             c.cwd(remoteDir, function(err, currentDir) {
                 callback(null);
             })
         }

     });

 }



 c.on('ready', function() {
     console.log('connect and authentication success.')
         //check dir if existed
     doPut();


 });
 // connect to localhost:21 as anonymous
 c.connect({
     'host': '192.168.119.*',
     'port': 21,
     user: '*',
     password: '*',
     'connTimeout ': 30,
 });