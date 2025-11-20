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

/* 禁用无限滚动加载 - 改为页码翻页 */
// 移除所有无限滚动相关功能
var isLoading = false;

// 禁用滚动触发的自动加载
// $(window).on('scroll touchmove', function() { ... }) - 已移除

// 禁用 IntersectionObserver 自动加载
window.initLoadMore = function() {
    // 不再初始化无限滚动
    console.debug('[pagination] Infinite scroll disabled, using page numbers');
};

// 保持 AJAX 加载功能用于 PJAX，但不自动触发
$('body').on('click','.cat_archive_next a.next',function(e) {
    // 允许默认行为（页面跳转）而不是 AJAX 加载
    // 移除 e.preventDefault() 以允许正常页面导航

    // 如果用户明确点击，可以保留 AJAX 加载作为增强功能
    // 但不再自动触发
    return true; // 允许默认链接行为
});

/* 分页导航功能 - 页码显示 */
function initPagination() {
    var currentPage = getCurrentPage();
    var totalPages = getTotalPages();

    if (totalPages > 1) {
        renderPageNumbers(currentPage, totalPages);
    }
}

// 获取当前页码
function getCurrentPage() {
    var pathname = window.location.pathname;
    var match = pathname.match(/\/page\/(\d+)\//);
    if (match) {
        return parseInt(match[1]);
    }
    return 1;
}

// 获取总页数（从页面数据中提取）
function getTotalPages() {
    // 尝试从页面中提取总页数信息
    // 可以通过在页面中添加隐藏元素或数据属性来传递
    var totalPagesElement = document.querySelector('[data-total-pages]');
    if (totalPagesElement) {
        return parseInt(totalPagesElement.getAttribute('data-total-pages'));
    }

    // 如果没有明确的总页数，根据是否存在下一页链接来估算
    var nextLink = document.querySelector('.cat_archive_next a.next');
    if (!nextLink) {
        return getCurrentPage(); // 当前页就是最后一页
    }

    // 默认返回较大值，实际使用时建议从服务器端传递总页数
    return 999;
}

// 渲染页码导航
function renderPageNumbers(currentPage, totalPages) {
    var paginationContainer = document.querySelector('.cat_archive_next');
    if (!paginationContainer) return;

    var paginationHTML = '<div class="cat_pagination">';

    // 上一页
    if (currentPage > 1) {
        var prevPage = currentPage - 1;
        var prevUrl = prevPage === 1 ? '/' : '/page/' + prevPage + '/';
        paginationHTML += '<a href="' + prevUrl + '" class="page-nav prev">‹ 上一页</a>';
    }

    // 页码
    var startPage = Math.max(1, currentPage - 2);
    var endPage = Math.min(totalPages, currentPage + 2);

    // 第一页
    if (startPage > 1) {
        paginationHTML += '<a href="/" class="page-number">1</a>';
        if (startPage > 2) {
            paginationHTML += '<span class="page-dots">...</span>';
        }
    }

    // 中间页码
    for (var i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            paginationHTML += '<span class="page-number current">' + i + '</span>';
        } else {
            var pageUrl = i === 1 ? '/' : '/page/' + i + '/';
            paginationHTML += '<a href="' + pageUrl + '" class="page-number">' + i + '</a>';
        }
    }

    // 最后一页
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += '<span class="page-dots">...</span>';
        }
        paginationHTML += '<a href="/page/' + totalPages + '/" class="page-number">' + totalPages + '</a>';
    }

    // 下一页
    if (currentPage < totalPages) {
        var nextPage = currentPage + 1;
        var nextUrl = '/page/' + nextPage + '/';
        paginationHTML += '<a href="' + nextUrl + '" class="page-nav next">下一页 ›</a>';
    }

    paginationHTML += '</div>';

    // 替换原有内容
    paginationContainer.innerHTML = paginationHTML;
}

// 初始化分页（页面加载完成后）
$(function() {
    initPagination();
});

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