/*
 Simple max coins calculator :P
*/

// block reward
var rew = 25;
// reward halv every n blocks
const blockhalv = 840000;
// block time
const blocktime= 1*60;


function secondsToString(seconds)
{
   var value = seconds;

   var units = {
       "year": 365*(24 * 60 * 60),
       "day": 24*60*60,
       "hour": 60*60,
       "minute": 60,
       "second": 1
   }

   var result = []

   for(var name in units) {
     var p =  Math.floor(value/units[name]);
     if(p == 1) result.push(" " + p + " " + name);
     if(p >= 2) result.push(" " + p + " " + name + "s");
     value %= units[name]
   }

   return result;

}
var res = 0;
var rounds=0;
while(rew>0){
    res+=rew*blockhalv;
    rew/=2;
    rounds++;
}
console.log("\x1b[36m","Aprox halv: "+secondsToString(blockhalv*blocktime));
console.log("Aprox max coins: "+res);
console.log("Aprox subsidy end (ignored difficulty changes): "+secondsToString(rounds*(blockhalv*blocktime)));
console.log("rounds: "+rounds);
console.log("\x1b[0m");
