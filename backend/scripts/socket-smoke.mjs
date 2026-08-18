import io from 'socket.io-client';

const SERVER = process.env.SOCKET_URL || 'http://localhost:5001';

function wait(ms){return new Promise(r=>setTimeout(r,ms));}

async function run(){
  console.log('Starting socket smoke test against',SERVER);

  const jwtMod = await import('jsonwebtoken');
    const jwt = jwtMod.default || jwtMod;
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
    const tokenA = jwt.sign({ userId: `smokeA-${Date.now()}`, email: 'smokeA@example.com' }, jwtSecret, { expiresIn: '1h' });
    const tokenB = jwt.sign({ userId: `smokeB-${Date.now()}`, email: 'smokeB@example.com' }, jwtSecret, { expiresIn: '1h' });

    // Use polling transport (more likely to work in this environment)
    const socketOptionsA = { reconnection: false, transports: ['polling'], auth: { token: tokenA } };
    const socketOptionsB = { reconnection: false, transports: ['polling'], auth: { token: tokenB } };

    const socketA = io(SERVER, socketOptionsA);
    const socketB = io(SERVER, socketOptionsB);

    await new Promise((res,rej)=>{
      let connected=0;
      socketA.on('connect',()=>{console.log('A connected',socketA.id);connected++; if(connected===2)res();});
      socketB.on('connect',()=>{console.log('B connected',socketB.id);connected++; if(connected===2)res();});
      setTimeout(()=>rej(new Error('connect-timeout')),15000);
    });

  const roomId = `smoke-room-${Date.now()}`;
  console.log('Using roomId',roomId);

  socketA.emit('join-room',{roomId});

  socketA.on('existing-participants', (data)=>{
    console.log('A existing-participants',data);
  });

  socketB.on('existing-participants', (data)=>{
    console.log('B existing-participants',data);
  });

  socketB.on('user-joined',(d)=>console.log('B user-joined',d));
  socketA.on('user-joined',(d)=>console.log('A user-joined',d));

  // have B join after short delay
  await wait(300);
  socketB.emit('join-room',{roomId});

  // wait for join events
  await wait(500);

  // get peer ids
  const peersA = [];
  const peersB = [];
  socketA.on('existing-participants', (data)=>{ data.participants.forEach(p=>peersA.push(p.socketId)); });
  socketB.on('existing-participants', (data)=>{ data.participants.forEach(p=>peersB.push(p.socketId)); });

  await wait(300);

  const target = socketB.id;
  console.log('A will send offer to',target);

  socketB.once('offer', (payload)=>{
    console.log('B received offer from',payload.from);
    // B sends answer back
    socketB.emit('answer',{ roomId, targetSocketId: payload.from, answer: { type:'answer', sdp:'dummy-answer' } });
  });

  socketA.once('answer',(payload)=>{
    console.log('A received answer from',payload.from);
  });

  socketA.once('ice-candidate',(p)=>console.log('A got ice candidate',p));
  socketB.once('ice-candidate',(p)=>console.log('B got ice candidate',p));

  // A sends offer to B via server
  socketA.emit('offer',{ roomId, targetSocketId: target, offer: { type:'offer', sdp:'dummy-offer' } });

  // exchange ice
  await wait(300);
  socketA.emit('ice-candidate',{ roomId, targetSocketId: target, candidate: { candidate:'candidateA' } });
  socketB.emit('ice-candidate',{ roomId, targetSocketId: socketA.id, candidate: { candidate:'candidateB' } });

  await wait(800);

  // cleanup
  socketA.disconnect();
  socketB.disconnect();
  console.log('Socket smoke test done');
}

run().catch(err=>{console.error('Smoke failed',err); process.exit(1)});
