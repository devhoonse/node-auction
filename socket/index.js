/*
* import : 3rd-parties
* */
const SocketIO = require('socket.io');

/*
* socket.io 인스턴스를 생성하여
* express 서버 인스턴스의 서비스 port 를 공유하도록 합니다.
* */
module.exports = (server, app) => {
  /*
  * socket.io 인스턴스를 생성하고,
  * req.app.get('io') 를 통해 app 컨텍스트에서 접근 가능하도록 참조를 생성합니다.
  * */
  const io = SocketIO(server, { path: '/socket.io', });
  app.set('io', io);

  /*
  * 새로운 클라이언트와의 소켓 연결이 될 때마다 실행할 동작입니다.
  * 해당 소켓 연결 요청 시,
  * */
  io.on('connection', (socket) => {
    const req = socket.request;
    const { headers: { referer } } = req;
    const roomId = referer.split('/')[referer.split('/').length - 1];

    /*
    * 해당 방에 입창 처리를 해주고,
    * 클라이언트와의 소켓 연결이 끊어졌을 때
    * 해당 방에 대한 퇴장 처리를 하도록 이벤트 핸들러도 등록합니다.
    * */
    socket.join(roomId);
    socket.on('disconnect', () => {
      socket.leave(roomId);
    });
  });
};
