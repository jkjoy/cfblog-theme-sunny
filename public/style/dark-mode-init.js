(function(){
  var c = document.cookie;
  var isDark = c.indexOf('night=1') > -1;
  console.log('[Theme] Cookie:', c);
  console.log('[Theme] Is dark mode:', isDark);
  if(isDark) {
    document.documentElement.classList.add('darkmode');
    console.log('[Theme] Applied darkmode class');
  }
})();
