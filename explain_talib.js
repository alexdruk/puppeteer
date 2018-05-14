var talib = require("talib");
//also see https://github.com/askmike/gekko/blob/develop/core/talib.js
//use debug watch to see
let function_desc = talib.explain("STDDEV");
for (const key of Object.keys(function_desc)) {
    const val = function_desc[key];
    console.log(val);
}
/*
var functions = talib.functions;
for (i in functions) {
	console.log(functions[i].name);
}
*/
