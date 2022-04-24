/*
* 로그인 상태인지 검사하는 미들웨어입니다.
* 로그인 상태면 다음 미들웨어로 넘어가고,
* 로그인 상태가 아니면 리디렉션 시킵니다.
* */
exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/?loginError=로그인이 필요합니다.');
  }
};

/*
* 로그인 상태가 아닌지 검사하는 미들웨어입니다.
* 로그인 상태가 아니면 다음 미들웨어로 넘어가고,
* 로그인 상태이면 리디렉션 시팁니다.
* */
exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/');
  }
};
