/*
* import : 3rd-parties
* */
const { Op } = require('sequelize');

/*
* import : built-ins
* */
const { Good, Auction, User, sequelize } = require('../models');

/*
*
* */
module.exports = async () => {
  try {
    /*
    * yesterday : 지금으로부터 하루 전 시점 시간입니다.
    * */
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    /*
    * 지금으로부터 하루 전 시점부터 현재까지 사이에 등록된 경매 물품들 중
    * 아직 낙찰자가 정해지지 않은 것들을 조회하고,
    * 각각에 대해 낙찰 처리를 진행해 줍니다.
    * */
    const targets = await Good.findAll({
      where: {
        SoldId: null,
        createdAt: { [Op.lte]: yesterday, },
      },
    });

    targets.forEach(async (target) => {
      const success = await Auction.findOne({
        where: { GoodId: target.id, },
        order: [['bid', 'DESC'],],
      });
      await Good.update({
        SoldId: success.UserId,
      }, {
        where: { id: target.id, },
      });
      await User.update({
        money: sequelize.literal(`money - ${success.bid}`),
      }, {
        where: { id: success.UserId, },
      });
    });

  } catch (error) {
    console.error('[error] checking auction failed with : ', error);
  }
};
