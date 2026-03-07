/*
 * SPUNK Network Ad Loader
 * Loads ads from Firebase and injects them into any site.
 * Add to any site: <script src="https://spunk.codes/spunk-ads.js" defer></script>
 *
 * Features:
 * - Fetches active ads from Firebase every 10 seconds
 * - Respects network targeting (show only on matching networks)
 * - Tracks impressions and clicks
 * - Supports 4 positions: top, bottom, sidebar, sticky
 * - Supports 6 formats: banner, square-sm, square-md, square-lg, rect, leaderboard
 * - Supports custom HTML ads
 * - Dismissable by users (per-session)
 */
(function(){
  'use strict';
  if(window._spunkAdsInit)return;
  window._spunkAdsInit=true;

  var DB='https://predict-network-ec767-default-rtdb.firebaseio.com';
  var REFRESH=10000;
  var dismissed={};
  var rendered={};

  // Detect which network this site belongs to
  var host=location.hostname||'';
  var network='Other';
  if(host.indexOf('predict.')===0)network='Predict';
  else if(host.indexOf('spunk.')===0||host==='spunkart.com')network='Spunk';
  else if(host==='pfp.best')network='PFP';
  else if(host.indexOf('alien.')===0)network='Alien';
  else if(host.indexOf('plush.')===0)network='Plush';
  else if(host.indexOf('stimulant.')===0)network='Stimulant';
  else if(host.indexOf('monkey.')===0)network='Monkey';
  else if(host.indexOf('scam.')===0)network='Scam';
  else if(host.indexOf('clown.')===0)network='Clown';
  else if(host.indexOf('claw.')===0)network='Claw';
  else if(host.indexOf('i13.')===0)network='i13';
  else if(host.indexOf('ai13.')===0)network='ai13';
  else if(host.indexOf('iai.')===0)network='iai';
  else if(host.indexOf('aibot.')===0)network='AIBot';

  function loadAds(){
    fetch(DB+'/admin/ads.json')
      .then(function(r){return r.json()})
      .then(function(data){
        if(!data)return;
        Object.keys(data).forEach(function(id){
          var ad=data[id];
          if(!ad||!ad.active)return;
          if(dismissed[id])return;

          // Check network targeting
          var nets=(ad.networks||'all').toLowerCase();
          if(nets!=='all'){
            var allowed=nets.split(',').map(function(s){return s.trim().toLowerCase()});
            if(allowed.indexOf(network.toLowerCase())===-1)return;
          }

          renderAd(id,ad);
        });
      })
      .catch(function(){});

    // Also load announcement
    fetch(DB+'/admin/announcement.json')
      .then(function(r){return r.json()})
      .then(function(data){
        if(!data||!data.active||!data.text)return;
        if(dismissed['announcement'])return;
        renderAnnouncement(data);
      })
      .catch(function(){});
  }

  // Format sizes: width x height in px
  var FORMATS={
    'banner':{w:'100%',h:'auto',mw:'1200px'},
    'leaderboard':{w:'728px',h:'90px',mw:'728px'},
    'square-sm':{w:'200px',h:'200px',mw:'200px'},
    'square-md':{w:'250px',h:'250px',mw:'250px'},
    'square-lg':{w:'300px',h:'300px',mw:'300px'},
    'rect':{w:'300px',h:'250px',mw:'300px'}
  };

  function renderAd(id,ad){
    var existing=document.getElementById('spunk-ad-'+id);
    if(existing)return; // Already rendered

    var wrapper=document.createElement('div');
    wrapper.id='spunk-ad-'+id;
    wrapper.style.cssText='margin:0;padding:0;z-index:9990;';

    var bg=ad.bg||'#1a1a2e';
    var accent=ad.accent||'#a855f7';
    var fmt=ad.format||'banner';
    var sz=FORMATS[fmt]||FORMATS['banner'];
    var isBlock=fmt!=='banner';

    var inner;
    if(ad.html){
      inner=ad.html;
    }else if(isBlock){
      // Square/rect/leaderboard block ad
      inner='<a href="'+esc(ad.url)+'" target="_blank" rel="noopener" onclick="window._spunkAdClick(\''+id+'\')" style="display:block;width:'+sz.w+';height:'+sz.h+';max-width:100%;background:'+esc(bg)+';border:1px solid '+esc(accent)+'33;border-radius:10px;text-decoration:none;overflow:hidden;position:relative;font-family:system-ui,sans-serif">';
      if(ad.image){
        inner+='<img src="'+esc(ad.image)+'" alt="'+esc(ad.headline||'Ad')+'" style="width:100%;height:100%;object-fit:cover">';
      }else{
        inner+='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:12px;text-align:center">';
        inner+='<strong style="color:#fff;font-size:'+(fmt==='leaderboard'?'0.85rem':'0.9rem')+';margin-bottom:6px;line-height:1.3">'+esc(ad.headline||'')+'</strong>';
        if(ad.body)inner+='<span style="color:#aaa;font-size:0.75rem;margin-bottom:8px;line-height:1.3">'+esc(ad.body)+'</span>';
        inner+='<span style="background:'+esc(accent)+';color:#fff;padding:6px 14px;border-radius:6px;font-weight:700;font-size:0.75rem">'+esc(ad.cta||'Learn More')+'</span>';
        inner+='</div>';
      }
      inner+='<button onclick="event.preventDefault();event.stopPropagation();window._spunkAdDismiss(\''+id+'\')" style="position:absolute;top:2px;right:4px;background:rgba(0,0,0,0.5);border:none;color:#999;cursor:pointer;font-size:0.8rem;padding:2px 5px;border-radius:4px;line-height:1" aria-label="Close">&times;</button>';
      inner+='</a>';
    }else{
      // Full-width banner (original)
      inner='<div style="background:'+esc(bg)+';border:1px solid '+esc(accent)+'33;border-radius:10px;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;max-width:1200px;margin:0 auto;position:relative">';
      inner+='<div style="flex:1;min-width:200px"><strong style="color:#fff;font-size:0.9rem">'+esc(ad.headline||'')+'</strong>';
      if(ad.body)inner+='<span style="color:#aaa;font-size:0.8rem;margin-left:8px">'+esc(ad.body)+'</span>';
      inner+='</div>';
      inner+='<a href="'+esc(ad.url)+'" target="_blank" rel="noopener" onclick="window._spunkAdClick(\''+id+'\')" style="background:'+esc(accent)+';color:#fff;padding:8px 18px;border-radius:8px;font-weight:700;font-size:0.82rem;text-decoration:none;white-space:nowrap">'+esc(ad.cta||'Learn More')+'</a>';
      inner+='<button onclick="window._spunkAdDismiss(\''+id+'\')" style="position:absolute;top:4px;right:8px;background:none;border:none;color:#666;cursor:pointer;font-size:1rem;padding:4px" aria-label="Close">&times;</button>';
      inner+='</div>';
    }
    wrapper.innerHTML=inner;

    // Position + alignment
    var pos=ad.position||'top';
    var align=isBlock?'display:flex;justify-content:center;':'';
    if(pos==='top'){
      wrapper.style.cssText+='padding:8px 16px;'+align;
      var body=document.body;
      body.insertBefore(wrapper,body.firstChild);
    }else if(pos==='bottom'){
      wrapper.style.cssText+='padding:8px 16px;'+align;
      var footer=document.querySelector('footer')||document.body;
      if(footer.tagName==='FOOTER')footer.parentNode.insertBefore(wrapper,footer);
      else document.body.appendChild(wrapper);
    }else if(pos==='sticky'){
      wrapper.style.cssText+='position:fixed;bottom:0;left:0;right:0;padding:8px 16px;z-index:9990;'+align;
      document.body.appendChild(wrapper);
    }else{
      // sidebar / in-content — insert after first <section> or <article>
      wrapper.style.cssText+='padding:8px 16px;'+align;
      var target=document.querySelector('section:nth-of-type(2)')||document.querySelector('article')||document.querySelector('main');
      if(target)target.parentNode.insertBefore(wrapper,target.nextSibling);
      else document.body.appendChild(wrapper);
    }

    // Track impression
    trackImpression(id);
    rendered[id]=true;
  }

  function renderAnnouncement(data){
    if(document.getElementById('spunk-announcement'))return;
    var el=document.createElement('div');
    el.id='spunk-announcement';
    el.style.cssText='background:'+(data.bg||'#7c3aed')+';color:#fff;text-align:center;padding:10px 40px 10px 16px;font-size:0.85rem;font-weight:600;position:relative;z-index:9991;font-family:system-ui,sans-serif';
    el.innerHTML=esc(data.text)+'<button onclick="this.parentElement.remove();window._spunkAdDismiss(\'announcement\')" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:rgba(255,255,255,0.7);cursor:pointer;font-size:1.2rem">&times;</button>';
    document.body.insertBefore(el,document.body.firstChild);
  }

  function trackImpression(id){
    fetch(DB+'/admin/ads/'+id+'/impressions.json')
      .then(function(r){return r.json()})
      .then(function(val){
        var n=(val||0)+1;
        return fetch(DB+'/admin/ads/'+id+'/impressions.json',{method:'PUT',body:JSON.stringify(n)});
      })
      .catch(function(){});
  }

  window._spunkAdClick=function(id){
    fetch(DB+'/admin/ads/'+id+'/clicks.json')
      .then(function(r){return r.json()})
      .then(function(val){
        var n=(val||0)+1;
        return fetch(DB+'/admin/ads/'+id+'/clicks.json',{method:'PUT',body:JSON.stringify(n)});
      })
      .catch(function(){});
  };

  window._spunkAdDismiss=function(id){
    dismissed[id]=true;
    var el=document.getElementById('spunk-ad-'+id);
    if(el)el.remove();
  };

  function esc(s){if(!s)return '';var d=document.createElement('div');d.textContent=s;return d.innerHTML}

  // Initial load + refresh
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',loadAds);
  }else{
    loadAds();
  }
  setInterval(loadAds,REFRESH);
})();
