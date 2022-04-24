/*
* import : built-ins
* */
const fs = require('fs');
const path = require('path');

/*
* import : 3rd-parties
* */
const express = require('express');
const multer = require('multer');

/*
* import : user-defined modules
* */
const { Good, Auction, User, } = require('../models');
const { isLoggedIn, isNotLoggedIn, } = require('./middlewares');

/*
* 파일 업로드를 저장하기 위한 디렉토리를 확인하고, 없으면 생성하도록 합니다.
* */
try {
  fs.readdirSync('uploads');
} catch (error) {
  console.group('[init] directory for upload');
  console.warn('[init] directory \'uploads\' not found, creating ... ');
  fs.mkdirSync('uploads');
  console.warn('[init] directory \'uploads\' has been created.');
  console.groupEnd();
}

/*
* 파일 업로드를 위한 업로더 객체를 생성 및 초기화합니다.
* */
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, `${path.basename(file.originalname, ext)}${new Date().valueOf()}${ext}`)
    },
  }),
  limits: { fileSize: 5*1024*1024, },
});

/*
* 라우터 객체를 생성합니다.
* */
const router = express.Router();

/*
* res.locals 속성을 통해 req.user 객체에 접근 가능하도록 res 객체에 준비해 둡니다.
* 이 처리를 해 두면, res.render() 메서드에서 {user: req.user} 처리를 안 해도 됩니다.
* */
router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

/*
* GET /
* 메인 페이지를 렌더링하여 클라이언트에게 응답합니다.
* 이 때, 메인 페이지에는 현재까지 팔리지 않은 경매 상품들의 목록을 조회하여 보여줍니다.
* */
router.get('/', async (req, res, next) => {
  try {
    const goods = await Good.findAll({ where: { SoldId: null, } });
    res.render('main', {
      title: 'Node Auction',
      goods,
    });
  } catch (error) {
    console.error(`[main page] ${req.method} ${req.url} failed with : `, error);
    next(error);
  }
});

/*
* GET /join
* 회원 가입 페이지를 렌더링하여 클라이언트에게 응답합니다.
* */
router.get('/join',
  isNotLoggedIn,  // 이미 로그인 중인 사용자가 가입 요청 보내는 것을 막기 위한 미들웨어입니다.
  (req, res) => {
    res.render('join', {
      title: '회원가입 - Node Auction',
    });
  }
);

/*
* GET /good
* 상품 등록 페이지를 렌더링하여 클라이언트에게 응답합니다.
* */
router.get('/good',
  isLoggedIn,   // 로그인 중이지 않은데 로그인 요청을 보내는 것을 막기 위한 미들웨어입니다.
  (req, res) => {
    res.render('good', {
      title: '상품 등록 - Node Auction',
    });
  }
);

/*
* POST /good
* 새 상품을 등록합니다.
* */
router.post('/good',
  isLoggedIn,   // 로그인 중이지 않은데 로그인 요청을 보내는 것을 막기 위한 미들웨어입니다.
  upload.single('img'),
  async (req, res, next) => {
    try {
      const { name, price, } = req.body;
      await Good.create({
        OwnerId: req.user.id,
        name,
        img: req.file.filename,
        price,
      });
    } catch (error) {
      console.error(`[register goods] ${req.method} ${req.url} failed with : `, error);
      next(error);
    }
  }
);

/*
* GET /good/:id
* :id 를 ID 로 갖는 상품에 대한 입찰 정보를 조회하여
* 패이지로 렌더링한 결과를 클라이언트에게 응답합니다.
* */
router.get('/good/:id',
  isLoggedIn,
  async (req, res, next) => {
    try {
      const [good, auction] = await Promise.all([
        Good.findOne({
          where: { id: req.params.id, },
          include: {
            model: User,
            as: 'Owner',
          },
        }),
        Auction.findAll({
          where: { GoodId: req.params.id, },
          include: { model: User, },
          order: [['bid', 'ASC'],],
        }),
      ]);
      res.render('auction', {
        title: `${good.name} - NodeAuction`,
        good,
        auction,
      });
    } catch (error) {
      console.error(`[register goods] ${req.method} ${req.url} failed with : `, error);
      next(error);
    }
  }
);

/*
* POST /good/:id/bid
*
* */
router.post('/good/:id/bid',
  async (req, res, next) => {
    try {
      /*
      * 요청 내용을 파악하고 이에 부합하는 제품 정보를 조회합니다.
      * */
      const { bid, msg } = req.body;
      const good = await Good.findOne({
        where: { id: req.params.id, },
        include: { model: Auction, },
        order: [[{ model: Auction }, 'bid', 'DESC'],],
      });

      /*
      * 입찰 기본 조건을 만족하는 지 검사를 수행합니다.
      * 각 검사를 통과하지 못하면 클라이언트 측에 왜 입찰하지 못하는지 이유를 알려줍니다.
      * */
      if (good.price >= bid) {
        return res.status(403).send('시작 가격보다 높게 입찰해야 합니다.');
      }
      if (new Date(good.createdAt).valueOf() + (24*60*60*1000) < new Date()) {
        return res.status(403).send('경매가 이미 종료되었습니다.');
      }
      if (good.Auctions[0] && good.Auctions[0].bid >= bid) {
        return res.status(403).send('이전 입찰가보다 높아야 합니다.');
      }

      /*
      * 입찰 처리에 문제가 없기 때문에,
      * 입찰 요청에 포함된 정보를 입찰 내역에 저장합니다.
      * */
      const result = await Auction.create({
        bid,
        msg,
        UserId: req.user.id,
        GoodId: req.params.id,
      });

      /*
      * 입찰 결과 내역을 실시간으로 모든 클라이언트로 브로드캐스팅 하고,
      * 입찰을 요청한 본인에게는 처리 결과가 성공적이었음을 응답합니다.
      * */
      req.app.get('io').to(req.params.id).emit('bid', {
        bid: result.bid,
        msg: result.msg,
        nick: req.user.nick,
      });
      return res.send('ok');
    } catch (error) {
      console.error(`[register goods] ${req.method} ${req.url} failed with : `, error);
      return next(error);
    }
  }
);

/*
* 준비 완료된 라우터 객체를 내보냅니다.
* */
module.exports = router;
