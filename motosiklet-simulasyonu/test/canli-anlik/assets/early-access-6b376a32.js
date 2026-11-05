/*! Motonom early-access helpers ea4c8e29 */
(function(){
  "use strict";
  var LS_DISMISS="motonom_ea_sticky_dismissed";
  var LS_SIGNED="motonom_ea_signed_up";
  var ENDPOINT="/api/early-access";
  var unlocked=false;
  var inlineInView=false;
  var inputFocused=false;
  var padEl=null;
  var ioMap=new Map();

  function validEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||"").trim());
  }

  async function submitEmail(email){
    var res=await fetch(ENDPOINT,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({email:email})
    });
    var data={};
    try{data=await res.json()}catch(e){}
    if(!res.ok) throw new Error((data&&data.error)||"Kayıt gönderilemedi");
    return data;
  }

  function setMsg(form, text, isError){
    var msg=form.querySelector("[data-ea-msg]");
    if(!text){
      if(msg){msg.hidden=true;msg.textContent="";msg.className="ea-form__msg"}
      return;
    }
    if(!msg){
      msg=document.createElement("p");
      msg.setAttribute("data-ea-msg","");
      msg.setAttribute("aria-live","polite");
      form.appendChild(msg);
    }
    msg.hidden=false;
    msg.textContent=text;
    msg.className="ea-form__msg"+(isError?" ea-form__msg--error":"");
    msg.setAttribute("role", isError?"alert":"status");
  }

  function markSignedUp(){
    try{localStorage.setItem(LS_SIGNED,"1")}catch(e){}
    try{localStorage.setItem(LS_DISMISS,"1")}catch(e){}
    hideSticky(true);
  }

  function showSuccess(form, email){
    var wrap=document.createElement("div");
    wrap.className="ea-form ea-form--success";
    wrap.setAttribute("role","status");
    wrap.innerHTML='<p class="eyebrow">KAYDINIZ ALINDI</p><p>Ürün duyuruları <strong></strong> adresine gönderilecek.</p>';
    wrap.querySelector("strong").textContent=email;
    form.replaceWith(wrap);
    markSignedUp();
  }

  async function onSubmit(ev){
    var form=ev.target;
    if(!form || !form.matches || !form.matches("[data-ea-form]")) return;
    if(form.closest && form.closest("#root")) return;
    ev.preventDefault();
    if(form.getAttribute("data-ea-busy")==="1") return;
    var input=form.querySelector('input[type="email"]');
    if(!input) return;
    var email=String(input.value||"").trim();
    if(!validEmail(email)){
      setMsg(form,"Geçerli bir e-posta adresi girin.",true);
      input.focus();
      return;
    }
    form.setAttribute("data-ea-busy","1");
    var btn=form.querySelector('button[type="submit"]');
    var prev=btn?btn.textContent:"";
    if(btn){btn.disabled=true;btn.textContent="Gönderiliyor…"}
    setMsg(form,"",false);
    try{
      await submitEmail(email);
      showSuccess(form, email);
    }catch(err){
      setMsg(form,"Kayıt şu an gönderilemedi. Lütfen biraz sonra tekrar deneyin.",true);
      if(btn){btn.disabled=false;btn.textContent=prev||"Kaydolun"}
      form.removeAttribute("data-ea-busy");
    }
  }

  function dismissed(){
    try{
      if(localStorage.getItem(LS_DISMISS)==="1") return true;
      if(localStorage.getItem(LS_SIGNED)==="1") return true;
    }catch(e){}
    return false;
  }

  function isMobile(){
    return !(window.matchMedia) || window.matchMedia("(max-width:720px)").matches;
  }

  function ensurePad(){
    if(padEl && padEl.isConnected) return padEl;
    padEl=document.getElementById("ea-sticky-pad");
    if(padEl) return padEl;
    padEl=document.createElement("div");
    padEl.id="ea-sticky-pad";
    padEl.className="ea-sticky-pad";
    padEl.setAttribute("aria-hidden","true");
    document.body.appendChild(padEl);
    return padEl;
  }

  function syncPad(el, visible){
    var pad=ensurePad();
    if(!visible || !el){
      pad.style.height="0px";
      document.documentElement.classList.remove("ea-sticky-on");
      return;
    }
    var h=Math.ceil(el.getBoundingClientRect().height + 24);
    pad.style.height=h+"px";
    document.documentElement.classList.add("ea-sticky-on");
  }

  function hideSticky(remove){
    var el=document.getElementById("ea-sticky");
    if(el){
      el.classList.remove("is-visible");
      el.hidden=true;
      el.setAttribute("aria-hidden","true");
      if(remove) el.remove();
    }
    syncPad(null, false);
  }

  function ensureSticky(){
    if(dismissed() || !isMobile()) return null;
    var el=document.getElementById("ea-sticky");
    if(el) return el;
    el=document.createElement("aside");
    el.id="ea-sticky";
    el.className="ea-sticky";
    el.setAttribute("data-ea-sticky","");
    el.setAttribute("aria-label","Motonom erken erişim");
    el.setAttribute("aria-hidden","true");
    el.hidden=true;
    // No empty msg node — created only on error (avoids stray dark bar)
    el.innerHTML=[
      '<div class="ea-sticky__inner">',
      '<div class="ea-sticky__copy"><strong>Erken erişime katıl</strong><span>Mağaza duyurusu için e-posta bırak</span></div>',
      '<button type="button" class="ea-sticky__close" data-ea-dismiss aria-label="Kapat">×</button>',
      '<form class="ea-sticky__form" data-ea-form action="/api/early-access" method="post">',
      '<label for="ea-email-sticky">E-posta adresi</label>',
      '<div class="ea-sticky__row">',
      '<input id="ea-email-sticky" name="email" type="email" autocomplete="email" inputmode="email" placeholder="ornek@eposta.com" required />',
      '<button class="button button--primary" type="submit">Kaydol</button>',
      '</div>',
      '</form>',
      '</div>'
    ].join("");
    document.body.appendChild(el);
    return el;
  }

  function canShow(){
    if(dismissed() || !isMobile() || !unlocked) return false;
    if(inlineInView) return false;
    if(inputFocused) return false;
    if(document.querySelector(".ea-form--success")) return false;
    return true;
  }

  function updateSticky(){
    if(!canShow()){
      var el=document.getElementById("ea-sticky");
      if(el){
        el.classList.remove("is-visible");
        el.hidden=true;
        el.setAttribute("aria-hidden","true");
      }
      syncPad(null, false);
      return;
    }
    var el=ensureSticky();
    if(!el) return;
    el.hidden=false;
    el.classList.add("is-visible");
    el.setAttribute("aria-hidden","false");
    requestAnimationFrame(function(){ syncPad(el, true); });
  }

  function unlock(){
    if(unlocked) return;
    unlocked=true;
    updateSticky();
  }

  function onClick(ev){
    var t=ev.target;
    if(t && t.closest && t.closest("[data-ea-dismiss]")){
      ev.preventDefault();
      try{localStorage.setItem(LS_DISMISS,"1")}catch(e){}
      hideSticky(true);
    }
  }

  function inlineTargets(){
    var nodes=[];
    var seen=new Set();
    function add(el){
      if(!el || seen.has(el)) return;
      if(el.id==="ea-sticky" || (el.closest && el.closest("#ea-sticky"))) return;
      seen.add(el);
      nodes.push(el);
    }
    document.querySelectorAll("#erken-erisim, .ea-box, .footer-cta, form.ea-form, .ea-form--success").forEach(function(el){
      var box=el.closest ? (el.closest("#erken-erisim, .ea-box, .footer-cta") || el) : el;
      add(box);
    });
    return nodes;
  }

  function setupObserver(){
    if(!("IntersectionObserver" in window)){
      inlineInView=false;
      return;
    }
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){ ioMap.set(en.target, en.isIntersecting); });
      var any=false;
      ioMap.forEach(function(v){ if(v) any=true; });
      inlineInView=any;
      updateSticky();
    },{root:null, rootMargin:"0px", threshold:0.08});

    function refresh(){
      ioMap=new Map();
      io.disconnect();
      inlineTargets().forEach(function(el){ io.observe(el); });
      updateSticky();
    }
    refresh();
    var mo=new MutationObserver(function(){
      if(document.querySelector(".ea-form--success")){
        markSignedUp();
        return;
      }
      clearTimeout(setupObserver._t);
      setupObserver._t=setTimeout(refresh, 120);
    });
    mo.observe(document.documentElement,{childList:true,subtree:true});
  }

  function setupFocus(){
    document.addEventListener("focusin", function(ev){
      var t=ev.target;
      if(t && (t.matches && (t.matches("input,textarea,select") || t.isContentEditable))){
        if(t.closest && t.closest("#ea-sticky")) return;
        inputFocused=true;
        updateSticky();
      }
    }, true);
    document.addEventListener("focusout", function(){
      setTimeout(function(){
        var a=document.activeElement;
        if(a && a.matches && a.matches("input,textarea,select")){
          if(a.closest && a.closest("#ea-sticky")){ inputFocused=false; updateSticky(); return; }
          inputFocused=true;
        } else {
          inputFocused=false;
        }
        updateSticky();
      }, 0);
    }, true);
  }

  function init(){
    ensurePad();
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("click", onClick, true);
    setupFocus();
    setupObserver();

    var onScroll=function(){
      if((window.scrollY||document.documentElement.scrollTop||0)>Math.max(280,Math.round((window.innerHeight||700)*0.6))) unlock();
    };
    window.addEventListener("scroll", onScroll, {passive:true});
    window.addEventListener("resize", function(){
      if(!isMobile()) hideSticky(false);
      else updateSticky();
    }, {passive:true});
    setTimeout(unlock, 3500);
    onScroll();
    updateSticky();
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
