var dirs  = [];
var processedDirs= {};
var recursiveAdd = function(dir) {
    var name = "/";
    var parts = dir.split("/");
    // remove first and last elements because they are empty
    parts.pop();
    parts.shift();
    parts.map(function(n) {
        name += n + "/";
        if (!processedDirs[name]) {
            processedDirs[name] = true;
            dirs.push(name);
        }
    });
}

recursiveAdd('/opt/web/a/b/c.txt');

console.log(dirs);

