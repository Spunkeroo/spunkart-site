(function(){
if(window._tipWidgetInit)return;window._tipWidgetInit=true;
var ADDRS={
BTC:'bc1pkepg42ctsvsxk499qu02qqyyz88gwjchnjpsu22wmng9rhpfv3jqw2t2hm',
ETH:'0xf02CBa58DBA117706f3BDcf4aC6574174c6dDC69',
SOL:'8G3bpLXPn961LmEfQe38fjgGPqQRhF4kNqyo7tthaiqy',
USDC:'0xf02CBa58DBA117706f3BDcf4aC6574174c6dDC69',
USDT:'0xf02CBa58DBA117706f3BDcf4aC6574174c6dDC69'
};
var LABELS={BTC:'Bitcoin',ETH:'Ethereum',SOL:'Solana',USDC:'USDC (ERC-20)',USDT:'USDT (ERC-20)'};
var coin='BTC';
var css=document.createElement('style');
css.textContent='.tw-btn{display:inline-flex;align-items:center;gap:.4rem;padding:.5rem 1.1rem;border:none;border-radius:999px;font-weight:800;font-size:.85rem;cursor:pointer;color:#fff;background:linear-gradient(135deg,#a855f7,#7c3aed,#c026d3);box-shadow:0 0 14px rgba(168,85,247,.6);transition:all .2s;text-decoration:none;letter-spacing:.3px;white-space:nowrap;animation:twGlow 2s ease-in-out infinite;font-family:inherit}'
+'@keyframes twGlow{0%,100%{box-shadow:0 0 14px rgba(168,85,247,.6)}50%{box-shadow:0 0 22px rgba(192,38,211,.85),0 0 44px rgba(168,85,247,.5)}}'
+'.tw-btn:hover{transform:scale(1.07)}'
+'.tw-overlay{display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.78);backdrop-filter:blur(6px);justify-content:center;align-items:center}'
+'.tw-overlay.active{display:flex}'
+'.tw-modal{background:#12121a;border:2px solid #7c3aed;border-radius:1.25rem;padding:2rem;max-width:420px;width:90%;text-align:center;box-shadow:0 0 60px rgba(168,85,247,.35)}'
+'.tw-h{margin:0 0 .5rem;font-size:1.4rem;font-weight:800;background:linear-gradient(135deg,#a855f7,#c084fc,#e879f9);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}'
+'.tw-p{color:#a0a0b8;margin:.5rem 0 1rem;font-size:.88rem;line-height:1.6}'
+'.tw-tabs{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:12px}'
+'.tw-tab{padding:6px 12px;border-radius:20px;border:1px solid #2a2a3e;background:#1a1a2e;color:#a0a0b8;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit}'
+'.tw-tab.active{background:#7c3aed;color:#fff;border-color:#7c3aed}'
+'.tw-tab:hover{border-color:#7c3aed}'
+'.tw-addr{background:#0a0a0f;border:1px solid #7c3aed;border-radius:.5rem;padding:.75rem;font-family:monospace;font-size:.7rem;word-break:break-all;color:#c084fc;cursor:pointer;margin-bottom:.75rem;transition:all .2s}'
+'.tw-addr:hover{background:#1a0a2e;border-color:#a855f7}'
+'.tw-note{font-size:.72rem;color:#6b6b80;margin-bottom:1rem}'
+'.tw-close{width:100%;padding:.6rem;background:#1a1a2e;border:1px solid #2a2a3e;color:#f0f0f0;border-radius:10px;font-size:.88rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s}'
+'.tw-close:hover{border-color:#7c3aed;color:#c084fc}';
document.head.appendChild(css);

var overlay=document.createElement('div');
overlay.className='tw-overlay';
overlay.id='tw-overlay';
overlay.onclick=function(e){if(e.target===overlay)closeTip()};
var coins=['BTC','ETH','SOL','USDC','USDT'];
var icons={BTC:'\u20BF',ETH:'\u27E0',SOL:'\u25CE',USDC:'$',USDT:'$'};
var tabsHtml=coins.map(function(c){return '<button class="tw-tab'+(c==='BTC'?' active':'')+'" onclick="window._twSelect(\''+c+'\',this)">'+icons[c]+' '+c+'</button>'}).join('');
overlay.innerHTML='<div class="tw-modal">'
+'<h3 class="tw-h">Tip Spunk</h3>'
+'<p class="tw-p">Built by one person with AI. Every tip keeps these sites free forever. Much love.</p>'
+'<div class="tw-tabs">'+tabsHtml+'</div>'
+'<div class="tw-addr" id="tw-addr" onclick="window._twCopy()">'+ADDRS.BTC+'</div>'
+'<p class="tw-note" id="tw-note">Click address to copy &bull; '+LABELS.BTC+'</p>'
+'<button class="tw-close" onclick="window._twClose()">Close</button>'
+'</div>';
document.body.appendChild(overlay);

window._twSelect=function(c,btn){
coin=c;
document.querySelectorAll('.tw-tab').forEach(function(t){t.classList.remove('active')});
btn.classList.add('active');
document.getElementById('tw-addr').textContent=ADDRS[c];
document.getElementById('tw-note').textContent='Click address to copy \u2022 '+LABELS[c];
};
window._twOpen=function(){overlay.classList.add('active')};
window._twClose=function(){overlay.classList.remove('active')};
window._twCopy=function(){
navigator.clipboard.writeText(ADDRS[coin]).then(function(){
var el=document.getElementById('tw-addr');
var orig=ADDRS[coin];
el.textContent='\u2713 Copied!';
setTimeout(function(){el.textContent=orig},2000);
}).catch(function(){});
};
document.addEventListener('keydown',function(e){if(e.key==='Escape')window._twClose()});

// Auto-inject tip button into nav if no tip button exists
if(!document.querySelector('[onclick*="twOpen"],[onclick*="openTipModal"],[onclick*="tipModal"]')){
var nav=document.querySelector('nav,.nav,.navbar');
if(nav){
var btn=document.createElement('button');
btn.className='tw-btn';
btn.onclick=window._twOpen;
btn.innerHTML='<span style="animation:twPulse 1.5s ease-in-out infinite">&#x1F9E1;</span> Tip';
btn.style.cssText='margin-left:auto';
nav.appendChild(btn);
}
}
})();
