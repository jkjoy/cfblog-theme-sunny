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
   * 相对时间转换
   */
  function relativeTime(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.max(0, now.getTime() - d.getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}天前`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}个月前`;
    const years = Math.floor(months / 12);
    return `${years}年前`;
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
      <time cat_title="${new Date(comment.date).toLocaleString('zh-CN')}" class="date" datetime="${comment.date}">
        ${relativeTime(comment.date)}
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
    const ol = document.createElement('ol');
    ol.className = 'comment-list';

    commentTree.forEach(comment => {
      ol.appendChild(renderComment(comment, 0));
    });

    container.innerHTML = '';
    container.appendChild(ol);

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
   * 初始化
   */
  function init() {
    const commentsDiv = document.getElementById('comments');
    if (!commentsDiv) return;

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
