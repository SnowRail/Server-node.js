const net = require('net');

const server = net.createServer((socket) => {
  console.log('클라이언트 연결됨: ' + socket.remoteAddress + ':' + socket.remotePort);

  socket.on('data', (data) => {
    console.log('수신 데이터: ' + data.toString());
    socket.write('수신한 데이터를 다시 전송합니다: ' + data);
  });

  socket.on('end', () => {
    console.log('클라이언트 연결 종료됨: ' + socket.remoteAddress + ':' + socket.remotePort);
  });
});

server.listen(30303, () => {
  console.log('#@ 서버 시작됨: ' + server.address().address + ':' + server.address().port);
});
