'use strict';

function checkAuth(req, res, next) {
  
  if(!req.session.user) {
    console.log('not logged in');
    res.redirect('/login');
  } else {
    next();
  }

};

module.exports = function(server) {
  // Install a `/` route that returns server status
  var router = server.loopback.Router();

  router.get('/', checkAuth, (req, res) => {
    server.models.cat.find({where:{ownerId:req.session.user.userId}})
    .then(cats => {
      res.render('index', {cats:cats, title:'Cat Index'});
    });
  });

  router.get('/edit', checkAuth, (req, res) => {
    if(!req.query.id) req.query.id = 0;
    server.models.cat.find({
      where:{
        and:[{ownerId:req.session.user.userId}, {id:req.query.id}]
      }
    })
    .then(cat => {
      let male = false;
      let adopted = false;
      if(cat.length === 1) {
        male = cat[0].gender === 'male';
        adopted = cat[0].adopted;
      }
      res.render('edit', {cat:cat[0], male:male, adopted:adopted, title:'Edit Cat'});
    });
  });

  router.post('/edit', checkAuth, (req, res) => {
    //todo - verify cat.id was originally mine. ACLs should work, but...
    let cat = req.body;
    if(cat.id === '') delete cat.id;
    cat.ownerId = req.session.user.userId;
    server.models.cat.upsert(cat)
    .then(() => {
      res.redirect('/');
    });
  });

  router.get('/adopt', checkAuth, (req, res) => {
    if(!req.query.id) {
      res.redirect('/');
    } else {

      server.models.cat.find({
        where:{
          and:[{ownerId:req.session.user.userId}, {id:req.query.id}]
        }
      })
      .then(cat => {
        let theCat = cat[0];
        theCat.adopted = true;
        server.models.cat.upsert(theCat)
        .then(() => {
          res.redirect('/');
        });
            
      });
  
    }
  });
    
  router.get('/delete', checkAuth, (req, res) => {
    if(!req.query.id) {
      res.redirect('/');
    } else {

      server.models.cat.find({
        where:{
          and:[{ownerId:req.session.user.userId}, {id:req.query.id}]
        }
      })
      .then(cat => {
        console.log('destroy by '+req.query.id);
        server.models.cat.destroyById(req.query.id)
        .then(() => {
          res.redirect('/');
        });
      });
  
    }
  });

  router.get('/login', (req, res) => {
    res.render('login', {title:'Login'});
  });

  router.post('/login', (req, res) => {
    server.models.appuser.login({email:req.body.email,password:req.body.password})
    .then(user => {
      req.session.user = user;
      res.redirect('/');
    }).catch(() => {
        res.render('login', {failed:true});
    });
  });

  server.use(router);
};
