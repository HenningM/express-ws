'use strict';

module.exports = function(string) {
	if (string.charAt(string.length - 1) != "/") {
		return string + "/";
	} else {
		return string;
	}
}