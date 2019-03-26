/*
  Copyright (c) 2018 Sr.León

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.

*/

//Carga de idiomas
var alangs = require("./lang.json");
var langs = alangs.langs;
var lang = alangs.en;

function setLang(lan){
    if(langs.includes(lan))    
    eval(`lang = alangs.${lan}`);
    else lang = alangs.en;
}

//Cargar ajustes y bloques
const settings = require("./settings.json");
var lastblockn=require("./blocks.json").nblock;
var users = require('./user.json');
try{
  lasblockn = require("./blocks.json").nblock;
  console.log("Blocks: "+lastblockn);
}catch(ec){
  throw Error(ec);
}
//Iniciar constantes
const rpcCoin = require('node-bitcoin-rpc');
const TelegramBot = require('node-telegram-bot-api');
const request = require('request');
const QrCode = require('jsqr');
const Jimp = require("jimp");
//Cargar ajustes
const token = settings.TOKEN;
const UnitName=settings.UnitName;
const FullName=settings.FullName;
const production=settings.PRODUCTION;
const url=settings.URL;
//Misc
var debugb=false;
var bot;

rpcCoin.init(settings.RPCH, settings.RPCP, settings.RPCUS, settings.RPCPW);

if(production === true) {
  bot = new TelegramBot(token);
  bot.setWebHook(url + bot.token);
}
else {
  debugb=true;
  bot = new TelegramBot(token, { polling: true });
}


process.on('uncaughtException', function (err) {
  console.log('Caught exception: ', err);
});

rpcCoin.call('getbalance', [], function (err, res) {
  if (err) {
    let errMsg = "Error when calling coin RPC: " + err;
    debugL(errMsg);
    throw new Error(errMsg);
  } else if (res.error) {
    let errMsg = "Error received by coin RPC: " + res.error.message + " (" + res.error.code + ")";
    debugL(errMsg);
    throw new Error(errMsg);
  } else {
    debugL('Server Total Balance: ' + res.result)
  }
});

//Procesar mensaje
bot.on('message', (msg) => {
try{

  if(msg.text!=null){
  var arr = msg.text.split(" ");

  var cmd =arr[0];
  var chatId = msg.chat.id;

  var tmp = msg.from.language_code.toLowerCase();
	var code = tmp.substring(0, 2);
  setLang(code);
  switch (cmd){

    case "/start":    
      var address="";    
      rpcCoin.call('getnewaddress', [], function (err, res) {
        if (err) {
          let errMsg = lang.error_msg + err;
          debugL(errMsg);
          throw new Error(errMsg);
        } else if (res.error) {
          let errMsg = "Error " + res.error.message + " (" + res.error.code + ")";
          bot.sendMessage(chatId,errMsg);
          debugL(errMsg);
          throw new Error(errMsg);
        } else {
          address=res.result;
          rpcCoin.call('setaccount', [address, `${chatId}`], function (err, resu) {
            if (err) {
              let errMsg = lang.error_msg + err;
              debugL(errMsg);
              throw new Error(errMsg);
            } else if (resu.error) {
              let errMsg = "Error " + resu.error.message + " (" + resu.error.code + ")";
              bot.sendMessage(chatId,errMsg);
              debugL(errMsg);
              throw new Error(errMsg);
            } else {
              var welcome = lang.start_msg;
              welcome = welcome.replace("${user}",msg.from.first_name)
              bot.sendMessage(chatId, welcome + address);
              var tmp = {}
              tmp[`${chatId}`]=chatId;
              Object.assign(users,tmp);
              writeUsers(JSON.stringify(users));
            }
          }); 
        }
      });       
    break;    

    case "/balance":
      rpcCoin.call('getbalance', [`${chatId}`], function (err, res) {
        if (err) {
          let errMsg = lang.error_msg + err;
          debugL(errMsg);
          throw new Error(errMsg);
        } else if (res.error) {
          let errMsg = "Error " + res.error.message + " (" + res.error.code + ")";
          bot.sendMessage(chatId,errMsg);
          debugL(errMsg);
          throw new Error(errMsg);
        } else {
          
          bot.sendMessage(chatId,String(res.result+" "+UnitName));
        }
      }); 
    break;

    case "/help":
      var y = "";
      for(var x in lang.help_msg)
        y += x + "\n";
      bot.sendMessage(chatId, y);
    break;

    case "/history": 
      rpcCoin.call('listtransactions', [`${chatId}`], function (err, res) {
          if (err) {
            let errMsg = lang.error_msg + err;
            debugL(errMsg);
            throw new Error(errMsg);
          } else if (res.error) {
            let errMsg = "Error " + res.error.message + " (" + res.error.code + ")";
            bot.sendMessage(chatId,errMsg);
            debugL(errMsg);
            throw new Error(errMsg);
          } else {
            var r="";
            
              for (var i = 0; i < res.result.length; i++) {
                  var counter = res.result[i]; 
                  r+=lang.history_msg[0].replace("${category}",res.result[i].category);  
                  r+=lang.history_msg[0].replace("${amount}",res.result[i].amount+` ${UnitName}`);  
                  r+=lang.history_msg[0].replace("${comment}",res.result[i].comment);  
                  r+=lang.history_msg[0].replace("${txid}",res.result[i].txid);                    
              }
            bot.sendMessage(chatId,r);

          }
        }); 
    break;

    case "/newaddress":
      var address="";
      var type="legacy";
      if(arr.length>1) {
        if(arr[1]!="legacy"||arr[1]!="bech32"){
          if(arr[1]=="segwit"){
            type="p2sh-segwit";
          }else{
            type=arr[1];
          }
        }
      }
      rpcCoin.call('getnewaddress', [`${chatId}`,`${type}`], function (err, res) {
        if (err) {
          let errMsg = lang.error_msg + err;
          debugL(errMsg);
          throw new Error(errMsg);
        } else if (res.error) {
          let errMsg = "Error " + res.error.message + " (" + res.error.code + ")";
          bot.sendMessage(chatId,errMsg);
          debugL(errMsg);
          throw new Error(errMsg);
        } else {
          address=res.result;
          rpcCoin.call('setaccount', [res.result, `${chatId}`], function (err, resu) {
            if (err) {
              let errMsg = lang.error_msg + err;
              debugL(errMsg);
              throw new Error(errMsg);
            } else if (resu.error) {
              let errMsg = "Error " + resu.error.message + " (" + resu.error.code + ")";
              bot.sendMessage(chatId,errMsg);
              debugL(errMsg);
              throw new Error(errMsg);
            } else {
              bot.sendMessage(chatId,address);
              var qr = require('qr-image');  
              var code = qr.imageSync(address, { type: 'png', ec_level:'Q' });  
              bot.sendPhoto(chatId,code);
            }
          });
        }
      });    
    break;

    case "/sendto":
      var addr="";
      var ammo=0;
      var comment="";
      var confirm=2;
      if(arr.length<3){
        
        bot.sendMessage(chatId,lang.sento_error);
        return;
      }
      addr=arr[1];
      ammo = parseFloat(arr[2]);
      if(arr.length==4){
        confirm=parseInt(arr[3]);
        if(confirm===0)confirm=2;
        
      }else if(arr.length>=5){
        confirm=parseInt(arr[3]);
        if(confirm===0)confirm=2;
        for(var c=4;c<arr.length;c++){
          comment+=arr[c]+" ";
        }      
      }
      rpcCoin.call('getaccount', [arr[1]], function (err, res) {
        if (err) {
          let errMsg = lang.error_msg + err;
          debugL(errMsg);
          throw new Error(errMsg);
        } else if (res.error) {
          let errMsg = "Error " + res.error.message + " (" + res.error.code + ")";
          bot.sendMessage(chatId,errMsg);
          debugL(errMsg);
          throw new Error(errMsg);
        } else {
          var totest=String(res.result).split('');
          if (totest.length>3) {
            debugL("Existe: "+String(res.result)+"char");
            move(`${chatId}`,res.result,ammo,comment,confirm,chatId);
        }
        else if(totest.length<1 || totest==null){
            sendfrom(`${chatId}`,addr,ammo,comment,confirm,chatId);
          }
        }
      }); 
    break;

    case "/alladdress":
      rpcCoin.call('getaddressesbyaccount', [`${chatId}`], function (err, res) {
        if (err) {
          let errMsg = lang.error_msg + err;
          debugL(errMsg);
          throw new Error(errMsg);
        } else if (res.error) {
          let errMsg = "Error " + res.error.message + " (" + res.error.code + ")";
          bot.sendMessage(chatId,errMsg);
          debugL(errMsg);
          throw new Error(errMsg);
        } else {
          var addrs=String(res.result).split(",");
          console.log(addrs);
          for (var ad=0;ad<addrs.length;ad++){
            bot.sendMessage(chatId,addrs[ad]);
          }
          
        }
      }); 
      break;

      case "/reqpay":
      var am=0;
      var m="";
      var a="";
      
      if(arr.length<2){      
        bot.sendMessage(chatId,lang.reqpay_error);
        return;
      }
      am=arr[1];
      if(arr.length>2){      
        am=arr[1];
        for(var l=2;l<arr.length;l++){
          m+=arr[l]+" ";
        }
        m=encodeURI(m);
        rpcCoin.call('getnewaddress', [], function (err, res) {
          if (err) {
            let errMsg = lang.error_msg + err;
            debugL(errMsg);
            throw new Error(errMsg);
          } else if (res.error) {
            let errMsg = "Error " + res.error.message + " (" + res.error.code + ")";
            bot.sendMessage(chatId,errMsg);
            debugL(errMsg);
            throw new Error(errMsg);
          } else {
            bot.sendMessage(chatId,`${FullName}:${res.result}?amount=${am}&message=${m}`);
            var qr = require('qr-image');  
            var code = qr.imageSync(`${FullName}:${res.result}?amount=${am}&message=${m}`, { type: 'png', ec_level:'Q' });  
            bot.sendPhoto(chatId,code);
            rpcCoin.call('setaccount', [res.result, `${chatId}`], function (err, resu) {
              if (err) {
                let errMsg = lang.error_msg + err;
                debugL(errMsg);
                throw new Error(errMsg);
              } else if (resu.error) {
                let errMsg = "Error " + resu.error.message + " (" + resu.error.code + ")";
                bot.sendMessage(chatId,errMsg);
                debugL(errMsg);
                throw new Error(errMsg);
              } else {
                a=address;
              }
            });
          }
        }); 
        
      }
      else{
        rpcCoin.call('getnewaddress', [], function (err, res) {
          if (err) {
            let errMsg = lang.error_msg + err;
            debugL(errMsg);
            throw new Error(errMsg);
          } else if (res.error) {
            let errMsg = "Error " + res.error.message + " (" + res.error.code + ")";
            bot.sendMessage(chatId,errMsg);
            debugL(errMsg);
            throw new Error(errMsg);
          } else {
            bot.sendMessage(chatId,`${FullName}:${res.result}?amount=${am}`);
            var qr = require('qr-image');  
            var code = qr.imageSync(`${FullName}:${res.result}?amount=${am}`, { type: 'png' , ec_level:'Q'});  
            bot.sendPhoto(chatId,code);
            rpcCoin.call('setaccount', [res.result, `${chatId}`], function (err, resu) {
              if (err) {
                let errMsg = lang.error_msg + err;
                debugL(errMsg);
                throw new Error(errMsg);
              } else if (resu.error) {
                let errMsg = "Error " + resu.error.message + " (" + resu.error.code + ")";
                bot.sendMessage(chatId,errMsg);
                debugL(errMsg);
                throw new Error(errMsg);
              } else {
                
              }
            });
          }
        }); 
        
      }
    break;

    case "/qr":
      if(arr.length<2){      
        bot.sendMessage(chatId,lang.qr_error);
        return;
      }
        var qr = require('qr-image');  
        var code = qr.imageSync(arr[1], { type: 'png' , ec_level:'Q'});  
        bot.sendPhoto(chatId,code);
      break;
      case "/features":
      if(chatId!=require("./settings.json").MASTERID){
        bot.sendMessage(chatId, 'Unknow command, write /help');
      }else{
        bot.sendMessage(chatId, "Sending...");
        var f=readTextFile("features.txt");
        for (u in users) {
          bot.sendMessage(users[u], f);
        }
      }
    break;

    default:
      bot.sendMessage(chatId, lang.cmd_error);
    break;
  }
}else{
  if(msg.photo!=null){
    var pic=msg.photo[0];
    var options = {
			uri: "https:\/\/api.telegram.org\/bot" + token + "\/getFile?file_id=" + pic.file_id,
			method: 'POST',
			headers: { 'Content-Type': 'application/json' }
		};
		try{
      var dcq;
			request(options, function(error, response, body){
				var jsonraw = JSON.parse(body); var p = jsonraw.result.file_path;
				debugL('path: ' + p);
				var uri = "https:\/\/api.telegram.org\/file\/bot" + token + "\/" + p;
        debugL('uri: ' + uri);
        
        Jimp.read(uri, function(err, image) {
          if (err) {
            bot.sendMessage(msg.chat.id, 'Error');
            return;              
          }
          var code = QrCode(image.bitmap.data,image.bitmap.width,image.bitmap.height);
          if(code){
            debugL("qr code:"+code.data);
            bot.sendMessage(msg.chat.id, code.data);   
          }else{
            bot.sendMessage(msg.chat.id, 'Error');   
          }             
          
      });
      });      
		}
		catch(err){ console.error(err); bot.sendMessage(msg.chat.id, 'Error'); return; }
  }else{
    bot.sendMessage(msg.chat.id, 'Invalid message');
  }
}
}catch(err){
  debugL(err);
}

});
/*
TODO:
Implement this fuction on main code
*/
//Obtener parametros de un texto parecido a: coinname:address?amount=n&message=m
function UrlParams(url) {
  var queryString = url.split(":").join("=");
  queryString=queryString.split("?").join("&");
  queryString=decodeURIComponent(queryString);
  debugL(queryString);
  var obj = {};
  if (queryString) {
    queryString = queryString.split('#')[0];
    var arr = queryString.split('&');

    for (var i=0; i<arr.length; i++) {
      var a = arr[i].split('=');
      var paramNum = undefined;
      var paramName = a[0].replace(/\[\d*\]/, function(v) {
        paramNum = v.slice(1,-1);
        return '';
      });
      var paramValue = typeof(a[1])==='undefined' ? true : a[1];
      paramName = paramName.toLowerCase();
      if (obj[paramName]) {
        if (typeof obj[paramName] === 'string') {
          obj[paramName] = [obj[paramName]];
        }
        if (typeof paramNum === 'undefined') {
          obj[paramName].push(paramValue);
        }
        else {
          obj[paramName][paramNum] = paramValue;
        }
      }
      else {
        obj[paramName] = paramValue;
      }
    }
  }

  return obj;
}

//mover entre cuentas
//TODO: Nevermind lol //Enviar a otro servidor y retornarlo, para hacer una justa transaccion // Send to another server and return.
function move(user ,user2, amount ,comment ,confirm,chatId){
  rpcCoin.call('move', [user,user2,amount,confirm,comment], function (err, res) {
    if (err) {
      let errMsg = lang.error_msg + err;
      debugL(errMsg);
      throw new Error(errMsg);
    } else if (res.error) {
      let errMsg = "Error " + res.error.message + " (" + res.error.code + ")";
      bot.sendMessage(chatId,errMsg);
      
      throw new Error(errMsg);
    } else {
      bot.sendMessage(chatId,lang.local_transfer);
      
    }
  });
}

//Enviar desde cuenta
function sendfrom(user ,addrs, amount ,comment ,confirm,chatId){
  rpcCoin.call('sendfrom', [user,addrs,amount,confirm,comment], function (err, res) {
    if (err) {
      let errMsg = lang.error_msg + err;
      debugL(errMsg);
      throw new Error(errMsg);
    } else if (res.error) {
      let errMsg = "Error " + res.error.message + " (" + res.error.code + ")";
      bot.sendMessage(chatId,errMsg);
      
      throw new Error(errMsg);
    } else {
      bot.sendMessage(chatId,String(res.result).replace(",","\n"));
      var qr = require('qr-image');  
      var code = qr.imageSync(String(res.result).replace(",","\n"), { type: 'png' });  
      bot.sendPhoto(chatId,code);
      
    }
  });
}


//E/S
function writeUsers(output) {
  var fs = require('fs');
  fs.writeFile("user.json", output, function(err) {
      if(err) {
          return debugL(err);
      }
  
      debugL("The file was saved!");
  }); 
  users=null;
  users=require("./user.json");
}

function writeBlocks(number) {
  var fs = require('fs');
  fs.writeFile("blocks.json", `{"nblock":${number}}`, function(err) {
      if(err) {
        throw err;
      }  
      debugL("The file was saved!");
  }); 
  lastblockn=number;
}

function readTextFile(file) {
	var fs = require('fs') , filename = file; 
  fs.readFile(filename, 'utf8', function(err, data) {
  if (err) throw err;
  debugL('OK: ' + filename);
  debugL(data)
  return new String(data);
});
}

//Busqueda de una actualizacion en las transacciones
//GOD
debugL("listening");
setInterval(listenTX, (1)*1000);
function listenTX(){
  rpcCoin.call('getblockcount', [], function (err, res) {
    if (err) {
      let errMsg = lang.error_msg + err;
      debugL(errMsg);
      throw new Error(errMsg);
    } else if (res.error) {
      let errMsg = "Error " + res.error.message + " (" + res.error.code + ")";      
      throw new Error(errMsg);
    } else {
      if(res.result!=lastblockn){
        debugL(res.result);
        writeBlocks(res.result);
        rpcCoin.call('getblockhash', [lastblockn], function (err, res2) {
          if (err) {
            let errMsg = lang.error_msg + err;
            debugL(errMsg);
            throw new Error(errMsg);
          } else if (res.error) {
            let errMsg = "Error " + res.error.message + " (" + res.error.code + ")";
            
            throw new Error(errMsg);
          } else {
            debugL(res2.result);
            var hash=res2.result;
            rpcCoin.call('getblock', [hash], function (err, res3) {
              if (err) {
                let errMsg = lang.error_msg + err;
                debugL(errMsg);
                throw new Error(errMsg);
              } else if (res.error) {
                let errMsg = "Error " + res.error.message + " (" + res.error.code + ")";
                
                throw new Error(errMsg);
              } else {
                debugL(res3.result);
                var block = res3.result;
                if(!block.tx)return;
                for(var txx=0;txx<block.tx.length;txx++){
                  rpcCoin.call('gettransaction', [block.tx[txx]], function (err, res4) {
                    if (err) {
                      let errMsg = lang.error_msg + err;
                      debugL(errMsg);
                      throw new Error(errMsg);
                    } else if (res.error) {
                      let errMsg = "Error " + res.error.message + " (" + res.error.code + ")";
                      
                      throw new Error(errMsg);
                    } else {
                      debugL(res4.result);
                      var txr=res4.result;
                      if(txr.category=="send"){
                        return;
                      }else{
                        for (var d=0;d<txr.details.length;d++){
                          if(users.hasOwnProperty(txr.details[d].account)){
                            bot.sendMessage(users[txr.details[d].account],"Recieved "+txr.amount+" "+UnitName);
                          }
                        }
                      }              
                    }
                  });
                }                
              }
            });            
          }
        });
      }      
    }
  });
}

function debugL(d){
  if(debugb){
    console.log(d);
  }
  
}
module.exports = bot;