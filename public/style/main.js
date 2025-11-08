/* 打开侧栏 */
$(document).on('click','.mobile_menu',function() {
    $('.cat_menu .left').css('left','0');
    $('.menu_off').css('left','0');
});
$(document).on('click','.menu_off',function() {
    $('.cat_menu .left').css('left','-20rem');
    $('.menu_off').css('left','-100vw');
});
$(document).on('click','.cat_menu .item a',function() {
    $('.menu_off').click();
});


/* 昼夜模式 */
$(document).on('click','.todark_anniu',function() {
    $(this).hide();
    $('.tolight_anniu').show();
    $('html').addClass('darkmode');
    var date = new Date(); 
    date.setTime(date.getTime()+(3*60*60*1000));   
    document.cookie = "night=1;path=/;expires="+date.toGMTString();
});
$(document).on('click','.tolight_anniu',function() {
    $(this).hide();
    $('.todark_anniu').show();
    $('html').removeClass('darkmode');
    var date = new Date();
    date.setTime(date.getTime()+(3*60*60*1000));   
    document.cookie = "night=0;path=/;expires="+date.toGMTString();
});
/* 评论者头像 */
$(document).on('blur', '#toavatar', function(){
    var mail = $(this).val();
    $(".api_avatar").attr('src', 'https://cravatar.cn/avatar/' + $.md5(mail) +'?&d=mm');
});
$(function () {
    var moodall = "😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😙 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 🤯 🤠 🥳 😎 🤓 🧐 😕 😟 🙁 ☹️ 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬";
    var moodarr = moodall.split(" ");
    var mood = "<div class='comment_emoji_block'>";
        moodarr.forEach(function(element) {
            mood += "<span onclick=\"$('textarea.Comment_Textarea').val($('textarea.Comment_Textarea').val() + '" + element + "')\">" + element + "</span>";
        });
    mood += "</div>";
    $('textarea.Comment_Textarea').after(mood);
});
/* 滚动百分比 */
$(window).scroll(function(){
	let a = document.documentElement.scrollTop || window.pageYOffset,
		b = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight) - document.documentElement.clientHeight,
		result = Math.round(a / b * 100);
	if(result == 0){
	    $(".percentage").fadeOut();
	}else{
	    $(".percentage").fadeIn().css('display','flex');
	}
    $(".percentage .num").text(result);
});
$('body').on('click','.percentage',function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* 菜单滚动至窗口顶部加阴影 */
$(window).scroll(function() {
    var scrollTop = $(window).scrollTop();
    var catMenuTop = $('.cat_menu').offset().top;
    if (scrollTop == catMenuTop) {
        $('.cat_menu').css('box-shadow','var(--box-shadow)');
    } else {
        $('.cat_menu').css('box-shadow','unset');
    }
});

/* 加载更多文章 */
// 保留原始 <a class="next" href="...">，不要替换为 <span>，避免丢失 href 与默认行为
var isLoading = false;
$(window).on('scroll touchmove', function() {
    var A = Math.floor($(window).scrollTop()) + window.innerHeight;
    var B = $(document).height();
    var $next = $('.cat_archive_next').find('a.next');
    if(!isLoading && Math.abs(A - B) < 50  && $next.length > 0) {
        isLoading = true;
        setTimeout(function() {
            $next.trigger('click');
        }, 300);
    }
});
// 统一委托到 body，因 .cat_archive_next 不在 .main 内
$('body').on('click','.cat_archive_next a.next',function(e) {
    e.preventDefault();
    $this = $(this);
    $this.addClass('loading').text("loading"); 
    var href = $this.attr('href');
    if (href != undefined) {
        var reqUrl = href;
        try { reqUrl = new URL(href, window.location.href).href; } catch (e) {}
        $.ajax({
            url: reqUrl,
            type: 'get',
            cache: false,
            error: function(request) {
            },
            success: function(data) {
                $this.removeClass('loading').text("more");
                
                var $html = $('<div></div>').append($.parseHTML(data));
                var $res = $html.find('.postlist');
                if ($res.length > 0) {
                    $('.postlist_out').append($res.fadeIn(500));
                }
                var newhref = $html.find('.cat_archive_next a.next').attr('href');
                var $next = $('.cat_archive_next a.next');
                if (newhref) {
                    $next.attr('href', newhref).removeClass('loading').text('more');
                } else {
                    $next.remove();
                    $('.cat_archive_next').append('<span class="over">已全部加载</span>');
                }
                // 兼容重新初始化懒加载/代码复制/评论等
                if (window.lazySizes && typeof window.lazySizes.init === 'function') {
                    window.lazySizes.init();
                }
                if (window.initCodeCopy && typeof window.initCodeCopy === 'function') {
                    window.initCodeCopy();
                }
                if (window.initComments && typeof window.initComments === 'function') {
                    window.initComments();
                }
                isLoading = false;
            }
        });
    }
    return false;
});

// 使用 IntersectionObserver 自动无感加载（滚动兼容保留）
if ('IntersectionObserver' in window) {
    var io;
    var observeMore = function() {
        var $next = document.querySelector('.cat_archive_next .next');
        if (!$next) return;
        if (io) { io.disconnect(); }
        io = new IntersectionObserver(function(entries){
            entries.forEach(function(entry){
                if (entry.isIntersecting && !isLoading) {
                    isLoading = true;
                    setTimeout(function(){
                        $($next).trigger('click');
                    }, 100);
                }
            });
        }, { root: null, rootMargin: '100px', threshold: 0 });
        io.observe($next);
    };
    // 初始与每次加载后尝试观察新的 next
    observeMore();
    $(document).on('DOMNodeInserted', function(e){
        if ($(e.target).is('.cat_archive_next') || $(e.target).find('.cat_archive_next .next').length) {
            observeMore();
        }
    });
}

/* 点击回复某人 */
$('.main').on('click', '.cat_comment_reply', function () {
    $('.cat_cancel_comment_reply').show();
    $(".respond").appendTo($(".respond").parent().parent());
    $('.cat_comment_respond_form').css('outline','2px solid var(--theme-30)');
});

/* 取消回复某人 */
$('.main').on('click', '.cat_cancel_comment_reply', function () {
    $('.cat_cancel_comment_reply').hide();
    $('.cat_comment_respond_form').css('outline','none');
    return TypechoComment.cancelReply();
});
