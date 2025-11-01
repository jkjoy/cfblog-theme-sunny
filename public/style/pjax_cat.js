var pjax = new Pjax({
  selectors: [
    "title",
    "meta:not([http-equiv='origin-trial'])",
    ".main_body"
  ],
  cacheBust: false
})

$(document).on('pjax:send', function() {
    $('.loading_circle').fadeIn().css('display','flex');
});

$(document).on('pjax:complete', function() {
    $('.loading_circle').fadeOut();
    cat_user_pjax_callback();
    pjax.refresh();
    console.log("pjax to "+window.location.href);
});