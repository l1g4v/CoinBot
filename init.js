var fs = require('fs');
var isWin = process.platform === "win32";

if(!fs.existsSync("settings.json")){
    console.log("\x1b[33m","Settings file no exists");
    console.log("\x1b[0m");
    process.exit();
}



if(!fs.existsSync(require("./settings.json").DIR+"/ca.pem") || !fs.existsSync(require("./settings.json").DIR+"/key.pem") || !fs.existsSync(require("./settings.json").DIR+"/cert.pem")){
    if(!require("./settings.json").CA){
    if(require("./settings.json").PRODUCTION===true){
        if(isWin){
            console.log("\x1b[33m","auto generate ca.pem key.pem cert.pem only avaliable on linux based systems");
            console.log("\x1b[0m");
            process.exit();
        }
        
        var exec = require('child_process').exec;
        console.log("\x1b[32m",'generating self signed certs');
        console.log("\x1b[0m");
        var cmd='openssl req -newkey rsa:2048 -sha256 -nodes -keyout key.pem -x509 -days 1024 -out cert.pem -subj "/C=US/ST=New York/L=Brooklyn/O=Example Brooklyn Company/CN='+require("./settings.json").DOMAIN+'"'
        var dir = exec(cmd, function(err, stdout, stderr) {
            if (err) {
              console.error(err);
              process.exit();
            }
            console.log("\x1b[32m",stdout);
            console.log("\x1b[0m");
          });
          
          dir.on('exit', function (code) {
            console.log("\x1b[36m","DONE");
            console.log("\x1b[0m");
            var bot = require('./bot');
            require('./web')(bot);
          });
        }else{
            var bot = require('./bot');
        }
    }else{
        var bot = require('./bot');
        if(require("./settings.json").PRODUCTION===true){
        require('./web')(bot);}
    }

    }else{        
        var bot = require('./bot');
        if(require("./settings.json").PRODUCTION===true){
        require('./web')(bot);
    }
}