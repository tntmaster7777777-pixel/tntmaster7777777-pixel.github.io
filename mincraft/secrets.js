/* === SHARED SECRETS LIBRARY — sprinkled across game-vault games ===
   Activate via:
     • Konami code: ↑ ↑ ↓ ↓ ← → ← → B A
     • Type one of these words anywhere: help, money, rich, ninja, godmode,
       unicorn, rainbow, party, pizza, dance, boom, mute, secret, hello,
       big, tiny, spin, slow, fast, dark, light, win, gameover
     • Triple-click the top-left corner of the screen for a hint.
*/
(function(){
  if(window.__SECRETS_LOADED__)return;window.__SECRETS_LOADED__=true;

  const seq=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let idx=0,buf='';

  // Inject animation styles once
  const st=document.createElement('style');
  st.textContent=`
    @keyframes secretPop{0%{opacity:0;transform:translate(-50%,-20px) scale(.5)}10%{opacity:1;transform:translate(-50%,0) scale(1.15)}20%{transform:translate(-50%,0) scale(1)}85%{opacity:1}100%{opacity:0;transform:translate(-50%,0) scale(1)}}
    @keyframes secretRainbow{0%{filter:hue-rotate(0)}100%{filter:hue-rotate(360deg)}}
    @keyframes secretShake{0%,100%{transform:translate(0,0)}25%{transform:translate(-6px,3px)}50%{transform:translate(6px,-3px)}75%{transform:translate(-3px,-6px)}}
    .SECRET-RAINBOW{animation:secretRainbow 3s linear infinite}
    .SECRET-INVERT{filter:invert(1) hue-rotate(180deg)}
  `;
  document.head.appendChild(st);

  function flash(msg,color){
    color=color||'#ffd700';
    const d=document.createElement('div');
    d.textContent=msg;
    d.style.cssText='position:fixed;top:25%;left:50%;transform:translateX(-50%);font:bold 24px monospace;color:'+color+';background:rgba(0,0,0,.88);border:3px solid '+color+';padding:16px 28px;border-radius:14px;z-index:2147483647;box-shadow:0 0 40px '+color+';pointer-events:none;text-align:center;max-width:80vw;animation:secretPop 3s forwards';
    document.body.appendChild(d);
    setTimeout(function(){d.remove();},3000);
  }
  function confetti(){
    for(let i=0;i<70;i++){
      const c=document.createElement('div');
      const col='hsl('+(Math.random()*360)+',90%,60%)';
      c.style.cssText='position:fixed;left:'+(Math.random()*100)+'vw;top:-20px;width:8px;height:14px;background:'+col+';z-index:2147483646;pointer-events:none;transform:rotate('+(Math.random()*360)+'deg)';
      document.body.appendChild(c);
      const fall=2000+Math.random()*1500,sway=(Math.random()-0.5)*200;
      c.animate([{transform:'translate(0,0) rotate(0)'},{transform:'translate('+sway+'px,'+(window.innerHeight+50)+'px) rotate(720deg)'}],{duration:fall,easing:'ease-in'});
      setTimeout(function(){c.remove();},fall);
    }
  }
  function rainEmoji(emojis,n,size){
    n=n||30;size=size||'36px';
    for(let i=0;i<n;i++)(function(j){setTimeout(function(){
      const p=document.createElement('div');
      p.textContent=emojis[Math.floor(Math.random()*emojis.length)];
      p.style.cssText='position:fixed;left:'+(Math.random()*100)+'vw;top:-60px;font-size:'+size+';z-index:2147483645;pointer-events:none';
      document.body.appendChild(p);
      p.animate([{top:'-60px',transform:'rotate(0)'},{top:'110vh',transform:'rotate(540deg)'}],{duration:2500,easing:'ease-in'});
      setTimeout(function(){p.remove();},2500);
    },j*100);})(i);
  }
  function pump(amt){
    const targets=['score','coins','gold','money','cash','points','gems','xp','exp'];
    let hit=0;
    for(const n of targets){
      try{ if(typeof window[n]==='number'){window[n]+=amt;hit++;} }catch(e){}
      try{ if(window.player&&typeof window.player[n]==='number'){window.player[n]+=amt;hit++;} }catch(e){}
      try{ if(window.game&&typeof window.game[n]==='number'){window.game[n]+=amt;hit++;} }catch(e){}
      try{ if(window.state&&typeof window.state[n]==='number'){window.state[n]+=amt;hit++;} }catch(e){}
    }
    return hit;
  }
  function heal(){
    const fields=['hp','health','hearts','lives','energy','stamina','mp','mana'];
    let hit=0;
    for(const n of fields){
      try{ if(typeof window[n]==='number'){window[n]=99999;hit++;} }catch(e){}
      try{ if(window.player&&typeof window.player[n]==='number'){window.player[n]=99999;hit++;} }catch(e){}
    }
    try{ if(window.player){window.player.invincible=true;window.player.god=true;} }catch(e){}
    return hit;
  }

  const triggers={
    help:function(){flash('Try: money, rich, ninja, godmode, unicorn, rainbow, party, pizza, dance, boom, big, tiny, spin, dark, win','#ffffff');},
    money:function(){const h=pump(99999);flash(h?'💰 +99,999!':'💰 secret unlocked!','#44ff44');},
    rich:function(){const h=pump(1e9);flash(h?'🤑 BILLIONAIRE!':'🤑 secret!','#ffd700');confetti();},
    ninja:function(){flash('🥷 NINJA MODE','#88ddff');document.body.style.transition='filter .3s';document.body.style.filter='hue-rotate(180deg) contrast(1.1)';setTimeout(function(){document.body.style.filter='';},5000);},
    godmode:function(){const h=heal();flash(h?'⚡ GOD MODE — invincible':'⚡ GOD MODE','#ffaa00');},
    unicorn:function(){flash('🦄 UNICORN PARADE!','#ff66cc');for(let i=0;i<20;i++)(function(j){setTimeout(function(){const u=document.createElement('div');u.textContent='🦄';u.style.cssText='position:fixed;left:-60px;top:'+(Math.random()*80)+'vh;font-size:46px;z-index:2147483645;pointer-events:none';document.body.appendChild(u);u.animate([{left:'-60px'},{left:'110vw'}],{duration:2800,easing:'linear'});setTimeout(function(){u.remove();},2800);},j*150);})(i);},
    rainbow:function(){flash('🌈 RAINBOW MODE','#ff8800');document.body.classList.add('SECRET-RAINBOW');setTimeout(function(){document.body.classList.remove('SECRET-RAINBOW');},10000);},
    party:function(){flash('🎊 PARTY TIME!','#ff44ff');confetti();setTimeout(confetti,400);setTimeout(confetti,800);},
    pizza:function(){flash('🍕 SNACK RAIN!','#ff6644');rainEmoji(['🍕','🍔','🌮','🍩','🍟','🥨']);},
    dance:function(){flash('💃 DANCE!','#ff44aa');document.body.style.transition='transform .2s';let i=0;const t=setInterval(function(){document.body.style.transform='rotate('+([-5,5][i%2])+'deg)';i++;if(i>20){clearInterval(t);document.body.style.transform='';}},150);},
    boom:function(){flash('💥 BOOM!','#ff2222');document.body.animate([{transform:'translate(0,0)'},{transform:'translate(-10px,5px)'},{transform:'translate(10px,-5px)'},{transform:'translate(-6px,-8px)'},{transform:'translate(8px,6px)'},{transform:'translate(0,0)'}],{duration:500});rainEmoji(['💥','🔥','✨'],15,'40px');},
    mute:function(){flash('🔇 audio toggled','#888');try{document.querySelectorAll('audio,video').forEach(function(a){a.muted=!a.muted;});}catch(e){}},
    secret:function(){flash('🤫 you found a secret','#ccccff');},
    hello:function(){flash('👋 hi there','#44ccff');},
    big:function(){flash('🐘 BIG MODE','#ff8844');document.body.style.transition='transform .4s';document.body.style.transformOrigin='50% 50%';document.body.style.transform='scale(1.15)';setTimeout(function(){document.body.style.transform='';},3000);},
    tiny:function(){flash('🐜 TINY MODE','#88ff44');document.body.style.transition='transform .4s';document.body.style.transformOrigin='50% 50%';document.body.style.transform='scale(.6)';setTimeout(function(){document.body.style.transform='';},3000);},
    spin:function(){flash('🌀 SPIN!','#aa66ff');document.body.animate([{transform:'rotate(0)'},{transform:'rotate(360deg)'}],{duration:1200,easing:'ease-in-out'});},
    slow:function(){flash('🐢 SLOW MO','#66aaff');document.body.style.transition='all 1s';},
    fast:function(){flash('⚡ FAST','#ffee44');document.body.style.transition='';},
    dark:function(){flash('🌑 NIGHT','#666');document.body.style.transition='filter .5s';document.body.style.filter='brightness(.5) contrast(1.2)';setTimeout(function(){document.body.style.filter='';},6000);},
    light:function(){flash('☀ DAY','#ffee99');document.body.style.transition='filter .5s';document.body.style.filter='brightness(1.4) saturate(1.3)';setTimeout(function(){document.body.style.filter='';},6000);},
    win:function(){flash('🏆 YOU WIN!','#ffd700');confetti();setTimeout(confetti,500);setTimeout(confetti,1000);rainEmoji(['🏆','🎉','⭐','🥇']);},
    gameover:function(){flash('💀 GAME OVER (just kidding)','#ff4444');document.body.classList.add('SECRET-INVERT');setTimeout(function(){document.body.classList.remove('SECRET-INVERT');},2000);},
    flip:function(){flash('🙃 FLIP','#aaaaff');document.body.style.transition='transform .5s';document.body.style.transform='rotate(180deg)';setTimeout(function(){document.body.style.transform='';},4000);},
    cat:function(){flash('🐱 meow','#ffaa88');rainEmoji(['🐱','😺','😸','🐈','🐾']);},
    dog:function(){flash('🐶 woof','#ddaa66');rainEmoji(['🐶','🐕','🦴','🐾']);},
  };

  document.addEventListener('keydown',function(e){
    const k=e.key;
    // Konami sequence
    const want=seq[idx];
    if(k===want||(k.length===1&&want.length===1&&k.toLowerCase()===want)){
      idx++;
      if(idx===seq.length){
        idx=0;
        flash('🎉 KONAMI CODE!','#ff44cc');
        confetti();heal();pump(99999);
        document.body.classList.add('SECRET-RAINBOW');
        setTimeout(function(){document.body.classList.remove('SECRET-RAINBOW');},8000);
      }
    } else {
      idx=(k===seq[0])?1:0;
    }
    // Word buffer
    if(/^[a-zA-Z]$/.test(k)){
      buf=(buf+k.toLowerCase()).slice(-14);
      for(const w in triggers){
        if(buf.endsWith(w)){triggers[w]();buf='';break;}
      }
    }
  },true);

  // Triple-click top-left corner for hint
  let tl=[];
  document.addEventListener('click',function(e){
    if(e.clientX<50&&e.clientY<50){
      tl.push(Date.now());
      tl=tl.filter(function(t){return Date.now()-t<2000;});
      if(tl.length>=3){tl=[];flash('🔓 Type a secret word! Try: help, money, party, unicorn, godmode, pizza','#44ff88');}
    }
  });

  console.log('%c🕵️ Secrets loaded. Try the Konami code or type: help','color:#ff44cc;font-size:14px;font-weight:bold');
})();
