게임 'Sleighers'의 서버 Repository입니다.

프로젝트 소개 - 🛷 Sleighers
--
- 설산에서 즐기는 멀티 레이싱 게임 Sleighers
- 직접 제작한 설산에서 플레이하는 썰매 라이딩
- 한 게임에 최대 5인까지 참여 가능
- Unity 클라이언트 & Node.js 서버
<br/>

서버 구조  
![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=flat&logo=nodedotjs&logoColor=white)
![socket.io](https://img.shields.io/badge/socket.io-010101?style=flat&logo=socketdotio&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)
![AWS EC2](https://img.shields.io/badge/EC2-FF9900?style=flat&logo=amazonec2&logoColor=white)
--
- Out Game과 In Game 서버를 나누어 설계, 구현
- Out Game : Node.js, WebSocket(Socket.io)
- In Game : Node.js, TCP
- DB : MySQL(AWS RDS)
- 배포 : AWS EC2
<br/>

서버 기능 소개
--
### OutGame 서버

#### ✔️ 로그인 / 회원가입
  - DB는 AWS RDS의 MySQL을 사용했습니다.
  - 일반적인 로그인, Google OAuth. 두 가지 방법을 구현했습니다.
<details>
    <summary>Login Code 조각</summary>

<!-- summary 아래 한칸 공백 두고 내용 삽입 -->
https://github.com/SnowRail/Server-node.js/blob/722e4df6362f3b37565e54bbf28fc7830da9c01c/AuthServer/EventHandler.js#L49-L69
</details>
<br/>

#### ✔️ 닉네임 설정
<details>
    <summary>Set Name Code 조각</summary>

https://github.com/SnowRail/Server-node.js/blob/722e4df6362f3b37565e54bbf28fc7830da9c01c/AuthServer/EventHandler.js#L148-L158
</details>
<br/>

#### ✔️ 매치메이킹
  - 1~5인까지 하나의 게임에 참여할 수 있습니다.
  - 5인이 매칭되면 즉시 게임이 시작됩니다.
  - 5인 미만일 경우, 매칭 시작 후, 일정 시간이 지나면 매칭에 참여한 인원만으로 게임이 시작됩니다.
<details>
    <summary>Match Making Code 조각</summary>

https://github.com/SnowRail/Server-node.js/blob/722e4df6362f3b37565e54bbf28fc7830da9c01c/AuthServer/EventHandler.js#L197-L213
https://github.com/SnowRail/Server-node.js/blob/722e4df6362f3b37565e54bbf28fc7830da9c01c/AuthServer/EventHandler.js#L216-L249
</details>
<br/> 


### InGame 서버

#### ✔️ Game State, Event 관리
<details>
    <summary>CountDown Event 일부</summary>

https://github.com/SnowRail/Server-node.js/blob/722e4df6362f3b37565e54bbf28fc7830da9c01c/InGameServer/ProtocolHandler.js#L105-L134
</details>

#### ✔️ 플레이어 Position broadcast

#### ✔️ 최종 Ranking 판단 및 관리
  - semaphore를 이용해 여러 플레이어가 Goal에 접근한 경우의 동시성 문제를 해결했습니다.
<details>
    <summary>Player Goal 처리 Func</summary>

https://github.com/SnowRail/Server-node.js/blob/722e4df6362f3b37565e54bbf28fc7830da9c01c/InGameServer/ProtocolHandler.js#L138-L153
</details>
<br/> 
