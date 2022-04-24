/*
* import : 3rd-parties
* */
const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');

/*
* import : user-defined modules
* */
const { isNotLoggedIn, isLoggedIn, } = require('./middlewares');
const User = require('../models/user');

/*
* 라우터 객체를 생성합니다.
* */
const router = express.Router();

/*
* POST /auth/join
* 회원 가입을 위한 서브 라우트입니다.
* */
router.post('/join',
  isNotLoggedIn,  // 이미 로그인 중인 사용자가 가입 요청 보내는 것을 막기 위한 미들웨어입니다.
  async (req, res, next) => {
    /*
    * 앞의 미들웨어를 통과하면 회원 가입 절차를 시작합니다.
    * */

    /*
    * 요청 본문 양식에서 email, nick, password, money 속성 값을 꺼내옵니다.
    * */
    const { email, nick, password, money } = req.body;

    try {
      /*
      * 이미 가입된 이메일인지 확인합니다.
      * 이미 있으면, 클라이언트를 리디렉션 시키고 에러 원인을 알려줍니다.
      * */
      const exUser = await User.findOne({ where: { email, }, });
      if (exUser) {
        return res.redirect('/join?joinError=이미 가입된 이메일입니다.');
      }

      /*
      * 비밀번호를 암호화하여 새 계정 정보를 생성합니다.
      * */
      const hash = await bcrypt.hash(password, 12);
      await User.create({
        email,
        nick,
        password: hash,
        money,
      });

      /*
      * 회원 가입 처리가 문제 없이 완료되면,
      * 클라이언트를 메인 페이지로 리디렉션 시킵니다.
      * */
      return res.redirect('/');
    } catch (error) {
      console.error(`[join] ${req.method} ${req.method} failed with : `, error);
    }
  }
);

/*
* POST /auth/login
* 로그인을 위한 서브 라우트입니다.
* */
router.post('/login',
  isNotLoggedIn,  // 이미 로그인 중인 사용자가 가입 요청 보내는 것을 막기 위한 미들웨어입니다.
  (req, res, next) => {

    /*
    *
    * */
    passport.authenticate('local', (authError, user, info) => {

      /*
      * 에러가 발생한 경우, 로그를 출력하고 에러 처리 미들웨어로 넘어갑니다.
      * */
      if (authError) {
        console.error(`[login] ${req.method} ${req.url} failed with : `, authError);
        return next(authError);
      }

      /*
      * 사용자 정보 객체가 비어있는 경우, 로그인에 실패했다는 의미이므로
      * 클라이언트를 리디렉션 시키고 로그인 실패 사실을 알립니다.
      * */
      if (!user) {
        return res.redirect(`/?loginError=${info.message}`);
      }

      /*
      * authError 객체도 비어 있고 user 객체도 있으면 여기에 도달합니다.
      * req.login() 메서드를 호출합니다.
      * 이 때 첫 번째 매개변수로 전달하는 user 객체는
      * passport.serializeUser() 메서드로 전달한 콜백 함수의 첫 번째 매개변수로 전달됩니다.
      * ( ./passport/index.js 파일을 보세요. )
      * */
      return req.login(user, (loginError) => {

        /*
        * 에러가 발생한 경우, 로그를 출력하고 에러 처리 미들웨어로 넘어갑니다.
        * */
        if (loginError) {
          console.error(`[login] ${req.method} ${req.url} failed with : `, loginError);
          return next(loginError);
        }

        /*
        * 로그인 처리가 문제 없이 완료되면,
        * 클라이언트를 메인 페이지로 리디렉션 시킵니다.
        * */
        return res.redirect('/');
      });
    })(req, res, next);
  }
);

/*
* POST /auth/logout
* 요청을 보낸 클라이언트에 대해 로그아웃 처리를 위한 서브 라우트입니다.
* */
router.get('/logout',
  isLoggedIn, // 로그인 중이지 않은데 로그인 요청을 보내는 것을 막기 위한 미들웨어입니다.
  (req, res) => {
    req.logout();
    req.session.destroy();
    res.redirect('/');
  }
);

/*
* 준비 완료된 라우터 객체를 내보냅니다.
* */
module.exports = router;
