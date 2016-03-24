 'use strict';
 var ftp = require('ftp');
 var fs = require('fs');
 var path = require('path');

 function myftp(opts) {

     var client;
     var queue = [];

     opts.remoteDir = opts.remoteDir.replace(/^\/+/, '');

     function initClient(cb) {
         client = new ftp();
         client.on('ready', cb);
         client.on('error', function(err, info) {
             var message = err.message;
             console.log('init ftp: error ' + message);
             client.destroy();
         });
         client.connect(opts.connect);
     }

     function consoleinfo(info) {
         if (opts.console) {
             console.info(info);
         }
     }

     function getRemoteName(filename) {
         return path.join(opts.remoteDir, filename).replace(/\\/g, '/');
     }

     function doSend(filename, remoteName, fileSource) {
         if (!client) {
             initClient(doSend.bind(null, filename, remoteName, fileSource));
             return;
         }
         remoteName = getRemoteName(remoteName) || getRemoteName(filename);
         consoleinfo("Uploading " + filename + " as " + remoteName + ".");
         client.put(fileSource || filename, remoteName, function(err) {
             consoleinfo(err ? "Couldn't upload " + filename + ":\n" + err : filename + ' uploaded.');
             advanceQueue(err);
         });
     }

     function doDelete(filename) {
         if (!client) {
             initClient(doDelete.bind(null, filename));
             return;
         }
         var remoteName = getRemoteName(filename);
         consoleinfo("Deleting  " + remoteName + ".");
         client.delete(remoteName, function(err) {
             consoleinfo(err ? "Couldn't delete " + filename + ":\n" + err : filename + ' deleted.');
             advanceQueue(err);
         });
     }

     function doMkdir(filename) {
         if (!client) {
             initClient(doMkdir.bind(null, filename));
             return;
         }
         var remoteName = getRemoteName(filename);
         consoleinfo("Adding  " + remoteName + ".");
         client.mkdir(remoteName, true, function(err) {
             consoleinfo(err ? "Couldn't add " + filename + ":\n" + err : filename + ' added.');
             advanceQueue(err);
         });
     }

     function doRmdir(filename) {
         if (!client) {
             initClient(doRmdir.bind(null, filename));
             return;
         }
        
         var remoteName = getRemoteName(filename);
         consoleinfo("Deleting  " + remoteName + ".");
         client.rmdir(remoteName, function(err) {
             consoleinfo(err ? "Couldn't delete " + filename + ":\n" + err : filename + ' deleted.');
             advanceQueue(err);
         });
     }

     function doCheckDirExists(dirname) {
         if (!client) {
             initClient(doCheckDirExists.bind(null, dirname));
             return;
         }
         var remoteName = getRemoteName(dirname);
         consoleinfo("doCheckDirExists  " + remoteName + ".");
         var existed = false;
         client.cwd(remoteName, function(err, currentDir) {
             if (err) {
                 if (err.code !== 550) {
                     consoleinfo("checkdir " + dirname + " fail:\n" + err);
                     advanceQueue(err);
                 }
                 consoleinfo(dirname + 'is not existed.');
                 return advanceQueue(null, existed);
             }

             existed = true;
             consoleinfo(dirname + ' existed.');
             advanceQueue(null, existed);
         });
     }

     function doList(dirname) {
         if (!client) {
             initClient(doList.bind(null, dirname));
             return;
         }
         var remoteName = getRemoteName(dirname);
         consoleinfo("Listing  " + remoteName + ".");

         // some bs to deal with this callback possibly being called multiple times.
         // the result we want is not always the first or last one called.
         var result = [],
             resultTimer;
         client.list(remoteName, function(err, list) {
             if (err) {
                 result = true;
                 consoleinfo("Couldn't list " + dirname + ":\n" + err);
                 return advanceQueue(err, list);
             }
             if (result === true || result.length) return;

             if (list && list.length) {
                 result = list;
             }
             if (resultTimer) return;
             resultTimer = setTimeout(function() {
                 consoleinfo(dirname + ' listed.');
                 advanceQueue(null, result);
             }, 100);
         });
     }

     function execute(entry) {
         if (entry.hasExecuted) {
             return;
         }
         var file = entry.file;
         var remoteName = entry.remoteName;
         var action = entry.action;
         entry.hasExecuted = true;
         switch (action) {
             case 'upload':
                 doSend(file, remoteName, entry.source);
                 break;
             case 'delete':
                 doDelete(file);
                 break;
             case 'mkdir':
                 doMkdir(file);
                 break;
             case 'rmdir':
                 doRmdir(file);
                 break;
             case 'list':
                 doList(file);
                 break;
             case 'checkdir':
                 doCheckDirExists(file);
                 break;
             default:
                 throw new Error("Unexpected action " + action);
                 break;
         }
     }

     function entryEquals(a, b) {
         return a.action === b.action &&
             a.file === b.file
         a.callback === b.callback;
     }

     function addToQueue(entry) {
         if (queue.slice(1).some(entryEquals.bind(null, entry))) {
             return;
         }
         queue.push(entry);
         if (queue.length === 1) {
             execute(entry);
         }
     }

     function advanceQueue(err, currentResult) {
         var finished = queue.shift();
         if (!finished) {
             return;
         }
         if (finished.callback) {
             finished.callback(err, currentResult);
         }
         if (queue.length) {
             execute(queue[0]);
         }else{
            client.end();
         }

     }

     function addFile(filename, remoteName, source, callback) {
         addToQueue({ file: filename, source: source, remoteName: remoteName, action: 'upload', callback: callback });
     }

     function removeFile(filename, callback) {
         addToQueue({ file: filename, action: 'delete', callback: callback });
     }

     function addDir(filename, callback) {
         addToQueue({ file: filename, action: 'mkdir', callback: callback });
     }

     function removeDir(filename, callback) {
         addToQueue({ file: filename, action: 'rmdir', callback: callback });
     }

     function listFiles(dirname, callback) {
         addToQueue({ file: dirname, action: 'list', callback: callback });
     }

     function checkDir(dirname, callback) {
         addToQueue({ file: dirname, action: 'checkdir', callback: callback });
     }


     function end() {
         client.end();
     }

     return {
         addFile: addFile,
         removeFile: removeFile,
         addDir: addDir,
         removeDir: removeDir,
         listFiles: listFiles,
         checkDir:checkDir,
         advanceQueue: advanceQueue,
         end: end
     };
 }

module.exports = myftp;