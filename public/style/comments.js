/**
 * 评论系统 - 完全客户端实现
 * 适用于 SSG 模式，通过 WordPress REST API 动态加载评论
 */

(function() {
  'use strict';

  // 配置
  const AVATAR_MIRROR = ''; // 可选的头像镜像地址
  const POLL_INTERVAL = 30000; // 轮询间隔（30秒）
  const FIRST_CHECK_DELAY = 2000; // 首次检查延迟（2秒）

  // 全局变量
  let wpUrl = '';
  let postId = '';
  let authorId = '';
  let lastCheckTime = Date.now();
  let pollTimer = null;
  let commentMap = new Map(); // 评论 ID 到评论对象的映射

  /**
   * 头像 URL 处理（支持镜像）
   */
  function withAvatarMirror(url) {
    if (!url) return 'https://cn.cravatar.com/avatar/';
    if (!AVATAR_MIRROR) return url;
    try {
      const u = new URL(url);
      u.hostname = AVATAR_MIRROR.replace(/^https?:\/\//, '').replace(/\/$/, '');
      return u.toString();
    } catch {
      return url || 'https://cn.cravatar.com/avatar/';
    }
  }

  /**
   * 格式化日期时间显示
   */
  function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * 构建评论树结构
   */
  function buildCommentTree(flatComments) {
    const map = new Map();
    const roots = [];

    // 创建映射
    flatComments.forEach(comment => {
      map.set(comment.id, { ...comment, children: [] });
      commentMap.set(comment.id, comment);
    });

    // 构建树
    flatComments.forEach(comment => {
      const node = map.get(comment.id);
      if (comment.parent === 0) {
        roots.push(node);
      } else {
        const parent = map.get(comment.parent);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      }
    });

    return roots;
  }

  /**
   * 渲染单个评论
   */
  function renderComment(comment, level = 0) {
    const isAuthor = authorId && comment.author === parseInt(authorId);
    const avatar = withAvatarMirror(comment.author_avatar_urls?.['48'] || comment.author_avatar_urls?.['96']);
    const isPending = comment.status === 'hold' || comment.status === 'waiting';
    const isReply = level > 0 || isAuthor;

    // 获取父评论信息
    const parentComment = comment.parent ? commentMap.get(comment.parent) : null;

    const li = document.createElement('li');
    li.className = `${level > 0 ? 'cat_comment_child' : 'cat_comment_parent'} ${isReply ? 'huomiaoreply' : ''}`;

    const replyout = document.createElement('div');
    replyout.className = 'cat_comment_replyout';
    replyout.setAttribute('data-replyout-id', comment.id);

    const body = document.createElement('div');
    body.className = 'cat_comment_body';
    body.id = `comment-${comment.id}`;
    body.setAttribute('data-coid', comment.id);

    // 回复按钮区域
    const replyBtn = document.createElement('div');
    replyBtn.className = 'cat_comment_reply';
    replyBtn.setAttribute('data-reply-id', comment.id);
    replyBtn.innerHTML = `
      <img class="avatar lazyload" src="/style/lazy.png" data-src="${avatar}" alt="${comment.author_name}" />
      <div class="replymengban">@</div>
    `;

    // 内容区域
    const content = document.createElement('div');
    content.className = 'content';

    const userDiv = document.createElement('div');
    userDiv.className = 'user';
    if (isReply) userDiv.setAttribute('align', 'right');

    let userHtml = `<span class="comment_user_name">`;
    if (comment.author_url) {
      userHtml += `<a href="${comment.author_url}" target="_blank" rel="external nofollow">${comment.author_name}</a>`;
    } else {
      userHtml += comment.author_name;
    }
    userHtml += `</span>`;

    if (parentComment) {
      userHtml += ` <a style="font-size: 0.75rem;display: inline; color: var(--colorC);" href="#comment-${comment.parent}">@${parentComment.author_name}</a>`;
    }

    if (isPending) {
      userHtml += ` <p class="waiting" style="color:var(--theme-60);">（评论审核中...）</p>`;
    }

    userDiv.innerHTML = userHtml;

    const substance = document.createElement('div');
    substance.className = `substance ${isAuthor ? 'iscat' : 'isfriend'}`;
    substance.innerHTML = comment.content.rendered;

    const infos = document.createElement('div');
    infos.className = 'commentinfos';
    if (isReply) infos.setAttribute('align', 'right');
    infos.innerHTML = `
      <time class="date" datetime="${comment.date}">
        ${formatDateTime(comment.date)}
      </time>
    `;

    content.appendChild(userDiv);
    content.appendChild(substance);
    content.appendChild(infos);

    body.appendChild(replyBtn);
    body.appendChild(content);
    replyout.appendChild(body);
    li.appendChild(replyout);

    // 子评论
    if (comment.children && comment.children.length > 0) {
      const childrenDiv = document.createElement('div');
      childrenDiv.className = 'comment-children';
      const childrenOl = document.createElement('ol');
      comment.children.forEach(child => {
        childrenOl.appendChild(renderComment(child, level + 1));
      });
      childrenDiv.appendChild(childrenOl);
      li.appendChild(childrenDiv);
    }

    return li;
  }

  /**
   * 渲染评论列表
   */
  function renderCommentList(comments) {
    const container = document.getElementById('comment-list-container');
    if (!container) return;

    if (comments.length === 0) {
      container.innerHTML = `
        <div class="cat_block" style="text-align: center; padding: 2rem;">
          暂无评论，快来抢沙发吧！
        </div>
      `;
      return;
    }

    const commentTree = buildCommentTree(comments);

    // 每个父评论使用一个 cat_block 包裹
    const frag = document.createDocumentFragment();
    commentTree.forEach(function(root) {
      const wrap = document.createElement('div');
      wrap.className = 'cat_block';
      const ol = document.createElement('ol');
      ol.className = 'comment-list';
      ol.appendChild(renderComment(root, 0));
      wrap.appendChild(ol);
      frag.appendChild(wrap);
    });

    container.innerHTML = '';
    container.appendChild(frag);

    // 绑定回复按钮事件
    bindReplyButtons();

    // 重新初始化懒加载
    if (window.lazySizes && typeof window.lazySizes.init === 'function') {
      window.lazySizes.init();
    }
  }

  /**
   * 加载评论
   */
  async function loadComments(silent = false) {
    if (!wpUrl || !postId) return;

    try {
      const response = await fetch(`${wpUrl}/wp-json/wp/v2/comments?post=${postId}&per_page=100&orderby=date&order=asc`);
      if (!response.ok) {
        if (!silent) {
          console.error('评论加载失败:', response.status);
        }
        return;
      }

      const comments = await response.json();
      renderCommentList(comments);
      lastCheckTime = Date.now();
    } catch (error) {
      if (!silent) {
        console.error('评论加载错误:', error);
      }
    }
  }

  /**
   * 检查新评论
   */
  async function checkNewComments() {
    if (!wpUrl || !postId) return;

    try {
      const response = await fetch(`${wpUrl}/wp-json/wp/v2/comments?post=${postId}&per_page=100&orderby=date&order=asc`);
      if (!response.ok) return;

      const allComments = await response.json();
      const newComments = allComments.filter(comment => {
        const commentTime = new Date(comment.date).getTime();
        return commentTime > lastCheckTime;
      });

      if (newComments.length > 0) {
        console.log(`发现 ${newComments.length} 条新评论，正在刷新...`);
        renderCommentList(allComments);
        lastCheckTime = Date.now();
      }
    } catch (error) {
      console.error('检查新评论失败:', error);
    }
  }

  /**
   * 绑定回复按钮事件
   */
  function bindReplyButtons() {
    document.querySelectorAll('.replymengban').forEach(replyBtn => {
      replyBtn.addEventListener('click', function() {
        const commentBody = this.closest('.cat_comment_body');
        if (!commentBody) return;

        const commentId = commentBody.getAttribute('data-coid');
        const commentReplyout = commentBody.closest('.cat_comment_replyout');
        if (!commentId || !commentReplyout) return;

        const parentInput = document.querySelector('[name="parent"]');
        const cancelBtn = document.querySelector('.cat_cancel_comment_reply');
        const textArea = document.querySelector('[name="text"]');

        if (parentInput) {
          parentInput.value = commentId;
        }

        if (cancelBtn) {
          cancelBtn.style.display = 'inline-block';
        }

        const respondDiv = document.getElementById('respond');
        if (respondDiv) {
          commentReplyout.parentNode?.insertBefore(respondDiv, commentReplyout.nextSibling);
        }

        if (textArea) {
          textArea.focus();
        }
      });
    });
  }

  /**
   * 初始化评论表单
   */
  function initCommentForm() {
    const commentForm = document.querySelector('.cat_comment_respond_form');
    if (!commentForm) return;

    const parentInput = commentForm.querySelector('[name="parent"]');
    const cancelBtn = document.querySelector('.cat_cancel_comment_reply');
    const emailInput = commentForm.querySelector('[name="mail"]');
    const authorInput = commentForm.querySelector('[name="author"]');
    const urlInput = commentForm.querySelector('[name="url"]');
    const textArea = commentForm.querySelector('[name="text"]');

    // 从 localStorage 加载用户信息
    if (localStorage.getItem('comment_author_email')) {
      emailInput.value = localStorage.getItem('comment_author_email') || '';
    }
    if (localStorage.getItem('comment_author')) {
      authorInput.value = localStorage.getItem('comment_author') || '';
    }
    if (localStorage.getItem('comment_author_url')) {
      urlInput.value = localStorage.getItem('comment_author_url') || '';
    }

    // 取消回复
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        if (parentInput) parentInput.value = '0';
        cancelBtn.style.display = 'none';

        const respondDiv = document.getElementById('respond');
        const commentsDiv = document.getElementById('comments');
        if (respondDiv && commentsDiv) {
          commentsDiv.insertBefore(respondDiv, commentsDiv.firstChild);
        }
      });
    }

    // 评论表单提交
    commentForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const formData = new FormData(commentForm);
      const email = formData.get('mail');
      const author = formData.get('author');
      const url = formData.get('url');
      const contentText = formData.get('text');

      // 保存用户信息
      localStorage.setItem('comment_author_email', email);
      localStorage.setItem('comment_author', author);
      localStorage.setItem('comment_author_url', url || '');

      const parent = parentInput ? parseInt(parentInput.value) : 0;

      const submitBtn = commentForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = '提交中...';

      try {
        const response = await fetch(`${wpUrl}/wp-json/wp/v2/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            post: parseInt(postId),
            author_name: author,
            author_email: email,
            author_url: url || undefined,
            content: contentText,
            parent: parent
          })
        });

        if (response.ok) {
          // 直接刷新页面并跳转到评论区
          window.location.href = window.location.pathname + window.location.search + '#comments';
        } else {
          const error = await response.json();
          console.error('评论提交失败:', error);
          // 按钮会恢复，用户可以重试
        }
      } catch (error) {
        console.error('评论提交错误:', error);
        // 按钮会恢复，用户可以重试
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  /**
   * 侧边栏：初始化最新评论列表（始终尝试）
   */
  function initRecentComments() {
    const recentSection = document.getElementById('recent-comments');
    if (!recentSection) return;

    // 清理旧的渲染，避免重复叠加（例如 PJAX 重新初始化）
    recentSection.querySelectorAll('.cat_recentcomment_list').forEach(function(el){ el.remove(); });

    const wp = recentSection.getAttribute('data-wp-url');
    const loading = recentSection.querySelector('[data-role="recent-loading"]');
    if (!wp) {
      if (loading) loading.innerHTML = '<div style="text-align:center; padding: 1rem; color: var(--B);">未配置 WordPress 地址</div>';
      return;
    }

    fetch(`${wp}/wp-json/wp/v2/comments?per_page=5&orderby=date&order=desc&_embed`)
      .then(function(r){ return r.json(); })
      .then(function(arr){
        const frag = document.createDocumentFragment();
        arr.forEach(function(c){
          const box = document.createElement('div');
          box.className = 'cat_block cat_recentcomment_list';

          const left = document.createElement('div'); left.className = 'left';
          const right = document.createElement('div'); right.className = 'right';

          const img = document.createElement('img'); img.className = 'avatar lazyload';
          img.src = '/style/lazy.png';
          img.setAttribute('data-src', (c.author_avatar_urls && (c.author_avatar_urls['48'] || c.author_avatar_urls['96'])) || '/style/avatar.png');
          img.alt = c.author_name || '';
          left.appendChild(img);

          const user = document.createElement('div'); user.className = 'user';
          const name = document.createElement('div'); name.className = 'name'; name.textContent = c.author_name || '';
          const time = document.createElement('time'); time.className = 'smalltext'; time.textContent = new Date(c.date).toLocaleDateString('zh-CN');
          user.appendChild(name); user.appendChild(time);

          const reply = document.createElement('div'); reply.className = 'reply';
          const a = document.createElement('a'); a.className = 'recent-comment-item';
          a.innerHTML = (c.content && c.content.rendered) || '';
          a.href = '#';

          // Prefer resolving via post id to get accurate slug
          function setHrefFromLinkFallback() {
            var href = c.link || (c._embedded && c._embedded.up && c._embedded.up[0] && c._embedded.up[0].link) || '';
            try {
              var u = new URL(href);
              var path = u.pathname.replace(/\/$/, '');
              var slug = path.split('/').filter(Boolean).pop() || '';
              a.href = slug ? `/${slug}/#comments` : '#';
            } catch (e) { a.href = '#'; }
          }

          if (typeof c.post === 'number' && c.post > 0) {
            fetch(`${wp}/wp-json/wp/v2/posts/${c.post}?_fields=slug`)
              .then(function(r){ return r.ok ? r.json() : null; })
              .then(function(p){ if (p && p.slug) { a.href = `/${p.slug}/#comments`; } else { setHrefFromLinkFallback(); } })
              .catch(function(){ setHrefFromLinkFallback(); });
          } else {
            setHrefFromLinkFallback();
          }

          reply.appendChild(a);

          right.appendChild(user);
          right.appendChild(reply);

          box.appendChild(left);
          box.appendChild(right);

          frag.appendChild(box);
        });
        if (loading) loading.remove();
        const infoCard = recentSection.querySelector('.aside_info_card');
        if (infoCard && infoCard.parentNode === recentSection) {
          recentSection.insertBefore(frag, infoCard);
        } else {
          recentSection.appendChild(frag);
        }
      })
      .catch(function(){
        if (loading) loading.innerHTML = '<div style="text-align:center; padding: 1rem; color: var(--B);">最新评论加载失败</div>';
      });
  }

  /**
   * 初始化
   */
  function init() {
    // 无论是否存在评论区，都尝试初始化侧边栏最新评论
    initRecentComments();

    const commentsDiv = document.getElementById('comments');
    if (!commentsDiv) {
      return;
    }

    wpUrl = commentsDiv.getAttribute('data-wp-url');
    postId = commentsDiv.getAttribute('data-post-id');
    authorId = commentsDiv.getAttribute('data-author-id');

    if (!wpUrl || !postId) {
      console.error('评论系统初始化失败：缺少必要参数');
      return;
    }

    // 初始化表单
    initCommentForm();

    // 加载评论
    loadComments();

    // 启动轮询
    setTimeout(() => {
      checkNewComments();
      pollTimer = setInterval(checkNewComments, POLL_INTERVAL);
    }, FIRST_CHECK_DELAY);
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 导出供 PJAX 使用
  window.initComments = init;

  // 页面卸载时清理定时器
  window.addEventListener('beforeunload', function() {
    if (pollTimer) {
      clearInterval(pollTimer);
    }
  });
})();