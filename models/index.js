/*
* import : 3rd-parties
* */
const Sequelize = require('sequelize');

/*
* import : user-defined modules
* */
const User = require('./user');
const Good = require('./good');
const Auction = require('./auction');

/*
* 데이터베이스 접속 정보 설정을 불러옵니다.
* */
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];

/*
* 데이터베이스에 연결합니다.
* */
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config,
);

/*
* ORM 환경에 대한 참조입니다.
* */
const db = {
  sequelize,
  User,
  Good,
  Auction,
};

/*
* 각 클래스에 대한 ORM 환경을 초기화합니다.
* */
User.init(sequelize);
Good.init(sequelize);
Auction.init(sequelize);

/*
* 각 클래스 간 관계 정의를 ORM 환경에 적용합니다.
* */
User.associate(db);
Good.associate(db);
Auction.associate(db);

/*
* 준비 완료된 ORM 환경 참조 변수를 내보냅니다.
* */
module.exports = db;
