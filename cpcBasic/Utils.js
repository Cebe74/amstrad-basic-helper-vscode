// Utils.js - Utililities for CPCBasic
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasic/
//

"use strict";

var Utils = {
	debug: 0,
	console: console,	

	dateFormat: function (d) {
		return d.getFullYear() + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + ("0" + d.getDate()).slice(-2) + " "
			+ ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2) + "." + ("0" + d.getMilliseconds()).slice(-3);
	},
	stringStartsWith: function (sStr, sFind, iPos) {
		iPos = iPos || 0;
		return sStr.indexOf(sFind, iPos) === iPos;
	},
	stringEndsWith: function (str, find) {
		return str.indexOf(find, str.length - find.length) !== -1;
	},
	stringCapitalize: function (str) { // capitalize first letter
		return str.charAt(0).toUpperCase() + str.substring(1);
	},
	toRadians: function (deg) {
		return deg * Math.PI / 180;
	},
	toDegrees: function (rad) {
		return rad * 180 / Math.PI;
	},
	getChangedParameters: function (current, initial) {
		var oChanged = {},
			sName;

		for (sName in current) {
			if (current.hasOwnProperty(sName)) {
				if (current[sName] !== initial[sName]) {
					oChanged[sName] = current[sName];
				}
			}
		}
		return oChanged;
	},
	bSupportsBinaryLiterals: (function () { // does the browser support binary literals?
		try {
			Function("0b01"); // eslint-disable-line no-new-func
			return true;
		} catch (err) {
			return false;
		}
	}())
};

if (typeof module !== "undefined" && module.exports) {
	module.exports = Utils;
}
