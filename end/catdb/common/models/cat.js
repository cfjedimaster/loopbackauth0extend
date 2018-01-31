'use strict';

const request = require('request');

const auth0ExtendURL = 'fillmeout';
const auth0Token = 'ditto';

module.exports = function(Cat) {

	Cat.observe('before save', function(ctx, next) {

		if(ctx.isNewInstance) {

			let options = {
				method:'POST',
				url:auth0ExtendURL +'on_new_cat',
				headers:{'Authorization':`Bearer ${auth0Token}`},
				json:ctx.instance
			};

			request(options, function(error, response, body) {
				if(error) throw new Error(error);
				//ctx.instance = body.cat;
				for(let key in body.cat) {
					ctx.instance[key] = body.cat[key];
				};

				next();
			});

		} else {
			
			let options = {
				method:'POST',
				url:auth0ExtendURL +'on_edit_cat',
				headers:{'Authorization':`Bearer ${auth0Token}`},
				json:ctx.data
			};

			request(options, function(error, response, body) {
				if(error) throw new Error(error);

				if(body.error) {
					let err = new Error(body.message);
					err.statusCode = 400;
  					next(err);
				} else {
					for(let key in body.cat) {
						ctx.data[key] = body.cat[key];
					};

					// now handle adoption
					if(ctx.data.adopted && !ctx.currentInstance.adopted) {
						console.log('do adoption');
						options.url = auth0ExtendURL + 'on_adopt_cat';
						request(options, function(error, response, body) { });						
					}
					next();
				}

			});
			
		}

	});

};
