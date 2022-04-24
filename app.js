/*
* import : built-ins
* */
const path = require('path');

/*
* import : 3rd-parties
* */
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const morgan = require('morgan');

/*
* import : user-defined modules
* */
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const { sequelize } = require('./models');
const passportConfig = require('./passport');
const sse = require('./sse');
const webSocket = require('./socket');

/*
* express app 객체를 생성합니다.
* */
const app = express();

/*
* 설정 파일로부터 정보를 읽어옵니다.
* */
dotenv.config();

/*
* 읽어온 서비스 포트 설정 정보를 app 객체에 담습니다.
* 설정 정보를 찾지 못했을 경우, 기본 값으로 8010 을 사용하도록 하였습니다.
* */
app.set('port', process.env.PORT || 8010);

/*
* 사용자 인증 정책을 적용합니다.
* */
passportConfig();

/*
* 렌더링 엔진으로서 nunjucks 를 사용하도록 설정합니다.
* */
app.set('view engine', 'html');
nunjucks.configure('views', {
  express: app,
  watch: true,
});

/*
* ORM 을 위한 sequelize 환경을 초기화합니다.
* */
sequelize.sync({ force: true, })
  .then(() => {
    console.log('[success] sequelize connection');
  })
  .catch((err) => {
    console.log('[error] sequelize initialization failed with : ', err);
  })
;

/*
*
* */
const sessionMiddleware = session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },
});

/*
* 모든 요청에 대해 공통적으로 처리되어야 할 미들웨어들을 적용합니다.
* */
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: false, }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

/*
* 라우터를 등록합니다.
* */
app.use('/', indexRouter);
app.use('/auth', authRouter);

/*
* 라우터를 찾지 못한 경우에 이 미들웨어로 넘어오도록 하였습니다.
* */
app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터를 찾을 수 없습니다.`);
  error.status = 404;
  next(error);
});

/*
* 가장 최후에 오게되는 미들웨어입니다.
* 마지막까지 처리되지 못한 에러는 여기까지 와서 에러 로그를 출력하고
* 클라이언트에게 에러 페이지를 렌더링하여 보내 주도록 하였습니다.
* */
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

/*
* 준비가 완료된 express 어플리케이션을 실행하고 설정된 서비스 포트에 할당합니다.
* */
const server = app.listen(app.get('port'), () => {
  console.log('[start] 서버가 시작되었습니다. 서비스 포트 : ', app.get('port'));
});

/*
* 서버에 SSE(Server Sent Event) 를 적용합니다.
* */
webSocket(server, app);
sse(server);
