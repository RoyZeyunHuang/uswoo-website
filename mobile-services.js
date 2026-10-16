/* Phone only (<=560px): the 8 "Beyond the lease" essentials cards show their Chinese line without the trailing 。
   Runs after i18n-zh.js and before i18n.js, so it edits the dictionary, not the page. Desktop keeps the original copy. */
(function(){
  if(!window.matchMedia('(max-width:560px)').matches || !window.USWOO_ZH) return;
  ["Local moves and luggage shipping, handled.", "Smarter partitions for shared space.", "Rental and setup, no starting from scratch.", "Internet, power and the essentials online.", "A U.S. number and a plan that fits.", "Coverage that meets building requirements.", "The small details, before and after.", "Events, networking and local community."].forEach(function(k){
    var v = window.USWOO_ZH[k];
    if(v) window.USWOO_ZH[k] = v.replace(/。\s*$/, '');
  });
})();
