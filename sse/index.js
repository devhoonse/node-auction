/*
* import : 3rd-parties
* */
const SSE = require('sse');

/*
* 새로운 클라이언트가 서버에 접속하면
* 매 1 초마다 이 클라이언트로 현재 서버 시간 문자열을 보내도록 설정합니다.
* */
module.exports = (server) => {
  const sse = new SSE(server);
  sse.on('connection', (client) => {
    setInterval(() => {
      client.send(`[server] date : ${Date.now().toString()}`);
    }, 1000);
  });
};
