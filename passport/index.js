/*
* import : 3rd-parties
* */
const passport = require('passport');

/*
* import : user-defined modules
* */
const local = require('./localStrategy');
const User = require('../models/user');

/*
*
* */
module.exports = () => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findOne( { where: { id, }, })
      .then(user => done(null, user))
      .catch(err => done(err))
    ;
  });

  local();
};
