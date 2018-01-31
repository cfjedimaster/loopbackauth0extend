
module.exports = function() {

	return function(req, res, next) {
		//console.log('abandonded mw '+req.session);
		next();
	};

}
