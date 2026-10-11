(() => {
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const groundY = 438;
  const keys = new Set();
  const ui = {
    food: document.querySelector('#food-fill'), foodValue: document.querySelector('#food-value'),
    distance: document.querySelector('#distance-value'), herds: document.querySelector('#herd-value'),
    start: document.querySelector('#start-screen'), end: document.querySelector('#end-screen'),
    toast: document.querySelector('#toast')
  };
  let state, lastTime = 0, toastTimer = 0;
  const rand = (min, max) => min + Math.random() * (max - min);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function reset() {
    state = {running:false, time:0, world:0, food:100, herds:0, player:{x:150,y:groundY-58,vx:0,vy:0,w:35,h:58,face:1,onGround:true,invuln:0},
      shots:[], buffalo:[], obstacles:[], nextHerd:760, nextObstacle:380, decor:[], particles:[]};
    for(let i=0;i<35;i++) state.decor.push({x:i*190+rand(0,150), type:Math.random()<.58?'grass':'rock',size:rand(.55,1.2)});
    updateHud();
  }
  function startGame(){reset();state.running=true;ui.start.classList.add('hidden');ui.end.classList.add('hidden');lastTime=performance.now();}
  function updateHud(){ui.food.style.width=`${state.food}%`;ui.food.style.background=state.food<25?'#b74d35':state.food<50?'#d49a48':'#88a05c';ui.foodValue.textContent=Math.ceil(state.food);ui.distance.textContent=Math.floor(state.world/10);ui.herds.textContent=state.herds;}
  function toast(text){ui.toast.textContent=text;ui.toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove('visible'),1700);}
  function endGame(){state.running=false;document.querySelector('#final-distance').textContent=`${Math.floor(state.world/10)} m`;document.querySelector('#final-herds').textContent=state.herds;ui.end.classList.remove('hidden');}

  function shoot(){if(!state.running)return;const p=state.player;state.shots.push({x:p.x+p.w/2+p.face*18,y:p.y+23,vx:p.face*520,life:1.7});p.recoil=.12;}
  function jump(){if(state.running&&state.player.onGround){state.player.vy=-510;state.player.onGround=false;}}
  function spawnHerd(){const x=state.nextHerd;state.buffalo.push({x,y:groundY-47,w:58,h:43,hp:1,phase:rand(0,6),speed:rand(8,18)});if(Math.random()<.48)state.buffalo.push({x:x+rand(66,118),y:groundY-47,w:58,h:43,hp:1,phase:rand(0,6),speed:rand(8,18)});state.nextHerd+=rand(1230,1850);}
  function spawnObstacle(){state.obstacles.push({x:state.nextObstacle,y:groundY-19,w:rand(25,43),h:19,type:Math.random()<.5?'rock':'cactus'});state.nextObstacle+=rand(370,620);}

  function update(dt){const s=state,p=s.player;s.time+=dt;s.food-=1.55*dt;s.world+=125*dt;
    const left=keys.has('ArrowLeft')||keys.has('a'),right=keys.has('ArrowRight')||keys.has('d');p.vx=(right?1:0)-(left?1:0);if(p.vx){p.face=Math.sign(p.vx);s.world+=p.vx*82*dt;}s.world=Math.max(0,s.world);p.x=clamp(p.x+p.vx*230*dt,70,350);p.vy+=1200*dt;p.y+=p.vy*dt;if(p.y+p.h>=groundY){p.y=groundY-p.h;p.vy=0;p.onGround=true;}p.invuln=Math.max(0,p.invuln-dt);
    if(s.world+W> s.nextHerd)spawnHerd();if(s.world+W>s.nextObstacle)spawnObstacle();
    s.shots=s.shots.filter(b=>{b.x+=b.vx*dt;b.life-=dt;return b.life>0&&b.x>s.world-50&&b.x<s.world+W+100;});
    for(const b of [...s.buffalo]){b.phase+=dt;const bx=b.x-s.world;for(const shot of s.shots){if(!shot.dead&&shot.x-s.world>bx&&shot.x-s.world<bx+b.w&&shot.y>b.y-10&&shot.y<b.y+b.h){shot.dead=true;b.hp=0;for(let i=0;i<12;i++)s.particles.push({x:b.x+rand(0,b.w),y:b.y+rand(0,b.h),vx:rand(-90,90),vy:rand(-150,20),life:rand(.35,.8),color:i%2?'#f2d186':'#a84d31'});}}
      if(b.hp<=0){s.buffalo.splice(s.buffalo.indexOf(b),1);s.herds++;s.food=Math.min(100,s.food+43);toast('Buffalo secured  ·  +43 provisions');}
      else if(Math.abs((p.x+17)-(bx+b.w/2))<37&&p.y+p.h>b.y+5&&p.y<b.y+b.h&&!p.invuln){p.invuln=.8;s.food=Math.max(0,s.food-8);p.vy=-220;toast('Watch your step!');}}
    s.shots=s.shots.filter(b=>!b.dead);
    for(const o of s.obstacles){const ox=o.x-s.world;if(Math.abs((p.x+17)-(ox+o.w/2))<27&&p.y+p.h>o.y+4&&p.y<o.y+o.h&&!p.invuln){p.invuln=.9;s.food=Math.max(0,s.food-5);p.vy=-260;toast('Easy there, cowboy!');}}
    s.buffalo=s.buffalo.filter(b=>b.x-s.world>-100);s.obstacles=s.obstacles.filter(o=>o.x-s.world>-100);
    s.particles=s.particles.filter(a=>{a.x+=a.vx*dt;a.y+=a.vy*dt;a.vy+=300*dt;a.life-=dt;return a.life>0;});
    if(s.food<=0){s.food=0;updateHud();endGame();}updateHud();
  }

  function sky(){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#8bc2c3');g.addColorStop(.56,'#efd09b');g.addColorStop(1,'#d8a35f');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#f6dfa9';ctx.beginPath();ctx.arc(765,125,43,0,Math.PI*2);ctx.fill();
    // distant mesas
    ctx.fillStyle='#c58b62';ctx.beginPath();ctx.moveTo(0,312);for(let x=0;x<=W;x+=4){const wx=x+state.world*.11;const h=45+Math.sin(wx*.006)*20+Math.sin(wx*.017)*10;ctx.lineTo(x,305-h);}ctx.lineTo(W,360);ctx.lineTo(0,360);ctx.fill();
    ctx.fillStyle='#b97c56';ctx.beginPath();ctx.moveTo(0,355);for(let x=0;x<=W;x+=4){const wx=x+state.world*.2;ctx.lineTo(x,322+Math.sin(wx*.009)*16+Math.sin(wx*.021)*7);}ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();}
  function landscape(){ctx.fillStyle='#b87e4c';ctx.fillRect(0,groundY,W,H-groundY);ctx.fillStyle='#99704a';ctx.fillRect(0,groundY+9,W,4);
    for(let i=0;i<7;i++){const x=((i*180-state.world*.82)% (W+180)+W+180)%(W+180)-40;ctx.fillStyle=i%2?'#d99b57':'#c58a4d';ctx.beginPath();ctx.ellipse(x,groundY+50,82,18,0,0,Math.PI*2);ctx.fill();}
    for(const d of state.decor){const x=(d.x-state.world*.84)%(W+220);if(x< -30||x>W+30)continue;ctx.save();ctx.translate(x,groundY+3);ctx.scale(d.size,d.size);if(d.type==='grass'){ctx.strokeStyle='#e0b067';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-5,-13);ctx.moveTo(0,0);ctx.lineTo(2,-17);ctx.moveTo(0,0);ctx.lineTo(7,-11);ctx.stroke();}else{ctx.fillStyle='#8e6849';ctx.beginPath();ctx.ellipse(0,-5,10,6,0,Math.PI,Math.PI*2);ctx.fill();}ctx.restore();}}
  function drawBuffalo(b){const x=b.x-state.world,y=b.y+Math.sin(b.phase*2)*1.4;ctx.save();ctx.translate(x+b.w/2,y+b.h/2);ctx.scale(b.w/58,b.h/43);ctx.fillStyle='#493a2d';ctx.beginPath();ctx.ellipse(-2,2,24,16,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(15,-6,14,18,-.2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(27,-1,9,7,.1,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#493a2d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(22,-14);ctx.quadraticCurveTo(28,-23,34,-17);ctx.moveTo(12,-20);ctx.quadraticCurveTo(8,-27,3,-21);ctx.stroke();ctx.strokeStyle='#33271e';ctx.lineWidth=3;for(const lx of [-15,-5,11,20]){ctx.beginPath();ctx.moveTo(lx,12);ctx.lineTo(lx-1,22);ctx.stroke();}ctx.restore();}
  function drawObstacle(o){const x=o.x-state.world;if(o.type==='cactus'){ctx.strokeStyle='#54734d';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x+o.w/2,groundY);ctx.lineTo(x+o.w/2,groundY-37);ctx.moveTo(x+o.w/2,groundY-20);ctx.lineTo(x+o.w/2-10,groundY-20);ctx.lineTo(x+o.w/2-10,groundY-29);ctx.moveTo(x+o.w/2,groundY-27);ctx.lineTo(x+o.w/2+9,groundY-27);ctx.lineTo(x+o.w/2+9,groundY-35);ctx.stroke();}else{ctx.fillStyle='#80705a';ctx.beginPath();ctx.ellipse(x+o.w/2,groundY-5,o.w/2,10,0,Math.PI,Math.PI*2);ctx.fill();}}
  function drawPlayer(){const p=state.player,x=p.x,y=p.y;if(p.invuln>0&&Math.floor(state.time*16)%2===0)return;ctx.save();ctx.translate(x+17,y);if(p.face<0)ctx.scale(-1,1);
    // boots and legs
    ctx.strokeStyle='#553622';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-5,42);ctx.lineTo(-7,55);ctx.lineTo(-13,56);ctx.moveTo(6,42);ctx.lineTo(8,54);ctx.lineTo(14,55);ctx.stroke();
    // body and bandana
    ctx.fillStyle='#b65c36';ctx.beginPath();ctx.moveTo(-10,20);ctx.lineTo(10,20);ctx.lineTo(12,45);ctx.lineTo(-12,45);ctx.closePath();ctx.fill();ctx.fillStyle='#e7bd72';ctx.fillRect(-10,34,20,4);
    // neck, head, hair
    ctx.fillStyle='#d29a68';ctx.fillRect(-5,12,10,10);ctx.fillStyle='#dcaa79';ctx.beginPath();ctx.ellipse(0,9,9,11,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#523a2a';ctx.beginPath();ctx.ellipse(0,1,10,4,0,Math.PI,Math.PI*2);ctx.fill();
    // broad cowboy hat
    ctx.fillStyle='#725031';ctx.beginPath();ctx.ellipse(0,1,21,4,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(0,-3,10,6,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='#c8944d';ctx.fillRect(-8,-4,16,2);
    // gun arm
    ctx.strokeStyle='#dcaa79';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(5,24);ctx.lineTo(16,27);ctx.stroke();ctx.fillStyle='#54402f';ctx.fillRect(13,24,17,5);ctx.fillStyle='#a6a19a';ctx.fillRect(25,23,6,3);ctx.restore();}
  function drawShot(b){const x=b.x-state.world;ctx.fillStyle='#ffe2a0';ctx.beginPath();ctx.arc(x,b.y,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff6d3';ctx.beginPath();ctx.arc(x,b.y,1.8,0,Math.PI*2);ctx.fill();}
  function draw(){sky();landscape();for(const o of state.obstacles)drawObstacle(o);for(const b of state.buffalo)drawBuffalo(b);for(const b of state.shots)drawShot(b);drawPlayer();for(const a of state.particles){ctx.globalAlpha=clamp(a.life*1.7,0,1);ctx.fillStyle=a.color;ctx.beginPath();ctx.arc(a.x-state.world,a.y,3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
    // tiny signpost at the far trail edge, as a sense of scale
    ctx.fillStyle='#69472f';ctx.fillRect(W-31,groundY-62,4,62);ctx.fillStyle='#e6d1a6';ctx.fillRect(W-50,groundY-61,44,20);ctx.fillStyle='#765338';ctx.font='9px monospace';ctx.fillText('WEST',W-45,groundY-48);}
  function frame(now){const dt=Math.min((now-lastTime)/1000,.035);lastTime=now;if(state.running)update(dt);draw();requestAnimationFrame(frame);}
  window.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if([' ','arrowup','arrowleft','arrowright'].includes(key))e.preventDefault();keys.add(key);if((key===' '||key==='w'||key==='arrowup')&&!e.repeat)jump();if(key==='j'&&!e.repeat)shoot();if(key==='enter'&&!state.running&&ui.start.classList.contains('hidden')&&!ui.end.classList.contains('hidden'))startGame();});
  window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());canvas.addEventListener('pointerdown',e=>{if(!state.running)return;const rect=canvas.getBoundingClientRect();const x=(e.clientX-rect.left)/rect.width*W;state.player.face=x<state.player.x+17?-1:1;shoot();});
  document.querySelector('#start-button').addEventListener('click',startGame);document.querySelector('#restart-button').addEventListener('click',startGame);
  reset();requestAnimationFrame(now=>{lastTime=now;frame(now);});
})();
