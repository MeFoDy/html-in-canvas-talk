// One 2D bitmap feeds both panes. GLSL changes the texture coordinates below the horizon.
const plain = document.querySelector('#plain');
const ctx = plain.getContext('2d');
const w = plain.width, h = plain.height, horizon = 238;
const sky = ctx.createLinearGradient(0, 0, 0, horizon);
sky.addColorStop(0, '#272748'); sky.addColorStop(.5, '#9c5769'); sky.addColorStop(1, '#ffbd85');
ctx.fillStyle = sky; ctx.fillRect(0, 0, w, horizon);
ctx.fillStyle = '#ffdca0'; ctx.beginPath(); ctx.arc(352, 183, 70, 0, Math.PI * 2); ctx.fill();
for (const [base, amp, color, phase] of [[192,38,'#945c72',0],[210,26,'#6a5069',4],[225,28,'#3e405b',2]]) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0,horizon);
  for (let x=0; x<=w; x+=3) {
    const wave = .54*Math.sin(x/96+phase)+.34*Math.sin(x/34+phase)+.12*Math.cos(x/14+phase);
    ctx.lineTo(x,base+amp*wave);
  }
  ctx.lineTo(w,horizon);ctx.closePath();ctx.fill();
}
ctx.save();ctx.translate(0,horizon*1.69);ctx.scale(1,-.69);
ctx.drawImage(plain,0,0,w,horizon,0,0,w,horizon);ctx.restore();
const sea=ctx.createLinearGradient(0,horizon,0,h);
sea.addColorStop(0,'rgba(113,158,163,.18)');sea.addColorStop(1,'rgba(35,44,74,.75)');
ctx.fillStyle=sea;ctx.fillRect(0,horizon,w,h-horizon);
const effect = document.querySelector('#effect'), slider = document.querySelector('#waves');
const button = document.querySelector('#motion'), status = document.querySelector('#shader-status');
const gl = effect.getContext('webgl', {alpha:false, preserveDrawingBuffer:true});
function unavailable() {
  slider.disabled=true;button.disabled=true;const copy=plain.cloneNode();copy.removeAttribute('id');
  copy.setAttribute('aria-label','Исходный закат');copy.getContext('2d').drawImage(plain,0,0);effect.replaceWith(copy);
  status.textContent='WebGL недоступен. Справа показана исходная текстура.';
}
function start() {
  const program=gl.createProgram();
  for(const [type,code] of [
    [gl.VERTEX_SHADER,'attribute vec2 pos; varying vec2 uv; void main(){uv=vec2(pos.x,-pos.y)*0.5+0.5;gl_Position=vec4(pos,0.,1.);}'],
    [gl.FRAGMENT_SHADER,`precision highp float;
      varying vec2 uv; uniform sampler2D scene; uniform float time, strength;
      void main(){
        vec2 p=uv;
        float depth=max(uv.y-.595,0.);
        float water=smoothstep(0.,.06,depth);
        float crest=sin(104.*depth+10.*uv.x-3.2*time)+.46*sin(220.*depth-22.*uv.x+2.1*time);
        p.x+=strength*water*crest*(.028+.21*depth);
        p.y+=strength*water*.045*sin(uv.x*21.+crest)*depth;
        vec3 reflected=texture2D(scene,clamp(p,0.,1.)).rgb;
        float glint=pow(.5+.5*sin(207.*depth-6.4*time+5.*crest),6.);
        float light=exp(-17.*abs(p.x-.587));
        gl_FragColor=vec4(mix(reflected,vec3(1.,.75,.43),strength*water*glint*light*.46),1.);
      }`]
  ]){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));
    gl.attachShader(program,s);gl.deleteShader(s);}
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const pos=gl.getAttribLocation(program,'pos');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,plain);
  for(const [key,value] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,key,value);
  const time=gl.getUniformLocation(program,'time'), strength=gl.getUniformLocation(program,'strength');
  let phase=0, frame=0, previous, inView=false;
  let playing=false;
  const visible=()=>inView&&!document.hidden;
  const moving=()=>visible()&&playing&&Number(slider.value)>0;
  function draw(){gl.uniform1f(time,phase);gl.uniform1f(strength,slider.value/100);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);}
  function animate(now){
    frame=0;
    if(!moving())return;
    if(previous!==undefined)phase+=Math.min(100,now-previous)/1000;
    previous=now;
    draw();
    frame=requestAnimationFrame(animate);
  }
  function stop(){cancelAnimationFrame(frame);frame=0;previous=undefined;}
  function refresh(){
    button.setAttribute('aria-pressed', String(playing));
    button.title=playing ? 'Поставить анимацию на паузу' : 'Запустить анимацию';
    if(visible())draw();
    if(!moving())stop();
    else if(!frame)frame=requestAnimationFrame(animate);
  }
  const observer=new IntersectionObserver(([entry])=>{
    inView=entry.isIntersecting&&entry.intersectionRatio>0;
    refresh();
  });
  observer.observe(effect);
  button.onclick=()=>{playing=!playing;refresh();};
  document.addEventListener('visibilitychange',refresh);
  slider.oninput=()=>{document.querySelector('output').value=slider.value+'%';refresh();};
  effect.addEventListener('webglcontextlost',()=>{
    stop();
    observer.disconnect();
    document.removeEventListener('visibilitychange',refresh);
    unavailable();
  });
  refresh();
}
if(gl){try{start();}catch(e){console.warn(e);unavailable();}}else unavailable();
