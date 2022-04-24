/*
* import : 3rd-parties
* */
const bcrypt = require('bcryptjs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

/*
* import : user-defined modules
* */
const User = require('../models/user');

/*
* 로컬 계정 접속 요청 시 처리 정책을 함수로 내보냅니다.
* */
module.exports = () => {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
  }, async (email, password, done) => {
    try {
      const exUser = await User.findOne({ where: { email, }, });
      if (exUser) {
        const result = await bcrypt.compare(password, exUser.password);
        if (result) {
          done(null, exUser);
        } else {
          done(null, false, { message: '비밀번호가 일치하지 않습니다.', });
        }
      } else {
        done(null, false, { message: '가입되지 않은 회원입니다.', });
      }
    } catch (error) {
      console.error('[login] failed with : ', error);
      done(error);
    }
  }));
};
