 'use strict';
 var createFtpQueue = require('./myftp');


 var settings = {
     remoteDir: '/static.*8.com/test/l/',
     // filter : null,
     console: true,
     connect: {
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
     }
 }


 var upList = [
     'foo.txt',
     'bar.txt',
     'kar.txt'
 ];


 var q = createFtpQueue(settings);
 debugger;
 /*q.listFiles('.', function(err, result) {
     if (err) {
         console.error(err);
         q.end();
         process.exit(-1);
     }
     console.log(result);
 });
*/



 //addDir



 /*q.checkDir('./foo/a/b', function(err, result) {
     if (err) {
         console.error(err);
         process.exit(-1);
     }
     //result = true/false
     if (!result) {
         //不存在
         q.addDir('./foo/a/b', function(err) {
             if (err) {
                 console.error(err);
                 q.end();
                 process.exit(-1);
             }
         })
     }

 });
*/

 /*q.removeDir('./foo/a/', function(err) {
     if (err) {
         console.error(err);
         q.end();
         process.exit(-1);
         
     }
 });*/

 upList.forEach(function(upfile) {
     q.addFile(upfile, 'foo/' + upfile, null,function(err) {
         if (err) {
             console.error('upload file %s fail!', upfile);
             q.end();
             process.exit(-1);
         }
         console.log('upload file %s success.', upfile);
     })
 });

