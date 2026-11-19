// Chrome's current 2D contract synchronizes hit testing when drawElementImage runs.
// Keep the same subtree and its state when switching back to ordinary HTML.
function makeSurface(host, source, paint, onMode) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let canvas, observer, deadline, mode, dispose, renderInView, syncMotion;
  let motion = !reduced.matches;
  function html(message) {
    clearTimeout(deadline);observer?.disconnect();
    if(canvas){canvas.onpaint=null;canvas.removeEventListener('contextlost',lost);canvas.removeEventListener('webglcontextlost',lost);}
    dispose?.();dispose=renderInView=syncMotion=null;mode=null;
    source.removeAttribute('drawable');
    if(canvas){host.replaceChildren(source);canvas=null;}
    onMode(false,message);
  }
  function lost(){html('Графический контекст потерян. Включён HTML.');}
  function render(){renderInView?.();}
  function setMotion(enabled){motion=enabled;syncMotion?.();}
  function enable(kind='2d') {
    if(canvas && kind===mode){render();return;}
    if(canvas)html('');
    const surface=document.createElement('canvas');
    surface.id='canvas';
    surface.setAttribute('content','drawable');
    if(surface.content!=='drawable'||typeof surface.requestPaint!=='function'){
      html('В этом браузере работает обычный HTML.');return;
    }
    canvas=surface;mode=kind;
    try {
      let renderer, draw;
      if(kind==='webgl'){
        renderer=ticketHologram(surface,source);
        dispose=renderer.dispose;
        surface.addEventListener('webglcontextlost',lost);
      }else{
        const ctx=surface.getContext('2d');
        if(typeof ctx?.drawElementImage!=='function')throw Error('drawElementImage unavailable');
        draw=()=>{ctx.reset();ctx.drawElementImage(source,0,0,surface.width,surface.height);paint(ctx,surface);};
      }
      source.setAttribute('drawable','');surface.append(source);host.replaceChildren(surface);
      let first=true, inView=false, textureDirty=true, phase=0, frame=0, previous;
      const visible=()=>inView&&!document.hidden;
      const failure=error=>{console.warn(error);html('Браузер прервал отрисовку. Включён HTML.');};
      const stop=()=>{cancelAnimationFrame(frame);frame=0;previous=undefined;};
      const animate=now=>{
        frame=0;
        if(!visible()||!motion)return;
        if(previous!==undefined)phase+=Math.min(100,now-previous)/1000;
        previous=now;
        try{renderer.draw(phase);}catch(error){failure(error);return;}
        frame=requestAnimationFrame(animate);
      };
      syncMotion=()=>{
        if(!renderer||first||!visible()||!motion){stop();return;}
        if(!frame)frame=requestAnimationFrame(animate);
      };
      renderInView=()=>{if(visible())surface.requestPaint();};
      const visibilityChanged=()=>{
        clearTimeout(deadline);
        if(visible()){
          if(first)deadline=setTimeout(()=>html('Первый кадр не пришёл. Включён HTML.'),2500);
          render();
        }
        syncMotion();
      };
      const intersection=new IntersectionObserver(([entry])=>{
        if(canvas!==surface)return;
        inView=entry.isIntersecting&&entry.intersectionRatio>0;
        visibilityChanged();
      });
      intersection.observe(surface);
      document.addEventListener('visibilitychange',visibilityChanged);
      const preferenceChanged=()=>setMotion(!reduced.matches);
      reduced.addEventListener('change',preferenceChanged);
      dispose=()=>{
        stop();
        intersection.disconnect();
        document.removeEventListener('visibilitychange',visibilityChanged);
        reduced.removeEventListener('change',preferenceChanged);
        renderer?.dispose();
      };
      const size=()=>{
        const dpr=window.devicePixelRatio||1;
        const w=Math.max(1,Math.round(host.clientWidth*dpr)),h=Math.max(1,Math.round(host.clientHeight*dpr));
        if(surface.width!==w||surface.height!==h)textureDirty=true;
        if(surface.width!==w)surface.width=w;
        if(surface.height!==h)surface.height=h;
        render();
      };
      surface.onpaint=event=>{
        if(canvas!==surface)return;
        if(renderer&&(!event.changedElements||event.changedElements.length))textureDirty=true;
        if(!visible())return;
        try{
          if(renderer){
            // A browser paint refreshes the DOM texture, while the animation only updates GLSL.
            if(textureDirty){renderer.updateTexture();textureDirty=false;}
            renderer.draw(phase);
          }else draw();
          if(first){first=false;clearTimeout(deadline);onMode(kind,'');syncMotion();}
        }catch(error){failure(error);}
      };
      surface.addEventListener('contextlost',lost);
      observer=new ResizeObserver(size);observer.observe(host);
      size();
    }catch(e){console.warn(e);html('Включён обычный HTML.');}
  }
  return {enable,html,render,setMotion};
}
