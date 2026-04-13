/*
 * TNH Beds24 Iframe Helper v1
 * Load via customhead field: <script src="https://astrongpresence.com/beds24-iframe-helper-v1.js"></script>
 * Only activates when referer=widget is in the URL (loaded via our booking widget).
 * Hides booking strip, reports page height to parent for iframe resize.
 */
(function(){
  if(location.search.indexOf('referer=widget')<0)return;
  if(window.parent===window)return;

  /* Hide booking strip + headers + footer when embedded */
  var s=document.createElement('style');
  s.textContent='.b24fullcontainer-selector{display:none!important}'
    +'.b24fullcontainer-top{display:none!important}'
    +'.b24fullcontainer-ownerrow1{display:none!important}'
    +'.b24fullcontainer-footer{display:none!important}'
    +'.b24fullcontainer-proprow1{display:none!important}'
    +'.b24fullcontainer-proprow2{display:none!important}'
    +'.b24fullcontainer-proprow11{display:none!important}'
    +'.b24fullcontainer-ownerrow11{display:none!important}'
    +'body{background:transparent!important;overflow-x:hidden}';
  document.head.appendChild(s);

  /* Report height to parent */
  function send(){
    var h=document.documentElement.scrollHeight;
    try{window.parent.postMessage(JSON.stringify({type:'tnh-height',height:h}),'*');}catch(e){}
  }

  /* On load */
  if(document.readyState==='complete')send();
  else window.addEventListener('load',send);

  /* On DOM changes */
  if(typeof MutationObserver!=='undefined'){
    var t;
    new MutationObserver(function(){clearTimeout(t);t=setTimeout(send,150);})
      .observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
  }

  /* On resize + image loads */
  window.addEventListener('resize',send);
  document.addEventListener('load',function(e){if(e.target.tagName==='IMG')setTimeout(send,100);},true);

  /* Periodic fallback for 20s */
  var c=0,iv=setInterval(function(){send();if(++c>=10)clearInterval(iv);},2000);
})();
