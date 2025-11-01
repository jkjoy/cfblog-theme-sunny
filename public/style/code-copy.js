/**
 * 代码块复制功能
 * macOS 风格的复制按钮
 */

(function() {
  'use strict';

  // 为代码块添加复制按钮
  function addCopyButtons() {
    // 查找所有代码块
    const codeBlocks = document.querySelectorAll('article .post_content pre');

    codeBlocks.forEach(function(preBlock) {
      // 检查是否已经添加了复制按钮
      if (preBlock.querySelector('.copy-code-button')) {
        return;
      }

      // 创建复制按钮
      const copyButton = document.createElement('button');
      copyButton.className = 'copy-code-button';
      copyButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span class="copy-text">复制</span>
      `;
      copyButton.setAttribute('type', 'button');
      copyButton.setAttribute('aria-label', '复制代码');

      // 添加点击事件
      copyButton.addEventListener('click', function(e) {
        e.preventDefault();
        copyCode(preBlock, copyButton);
      });

      // 将按钮添加到代码块
      preBlock.style.position = 'relative';
      preBlock.appendChild(copyButton);
    });
  }

  // 复制代码到剪贴板
  function copyCode(preBlock, button) {
    // 获取代码内容
    const codeElement = preBlock.querySelector('code');
    if (!codeElement) return;

    let code = codeElement.textContent || codeElement.innerText;

    // 使用现代剪贴板 API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code)
        .then(function() {
          showCopySuccess(button);
        })
        .catch(function(err) {
          console.error('复制失败:', err);
          // 降级到传统方法
          fallbackCopy(code, button);
        });
    } else {
      // 降级到传统方法
      fallbackCopy(code, button);
    }
  }

  // 传统复制方法（降级方案）
  function fallbackCopy(text, button) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showCopySuccess(button);
      } else {
        showCopyError(button);
      }
    } catch (err) {
      console.error('复制失败:', err);
      showCopyError(button);
    }

    document.body.removeChild(textArea);
  }

  // 显示复制成功
  function showCopySuccess(button) {
    const textSpan = button.querySelector('.copy-text');
    const originalText = textSpan.textContent;

    // 改变按钮样式
    button.classList.add('copied');
    textSpan.textContent = '已复制';

    // 2秒后恢复
    setTimeout(function() {
      button.classList.remove('copied');
      textSpan.textContent = originalText;
    }, 2000);
  }

  // 显示复制失败
  function showCopyError(button) {
    const textSpan = button.querySelector('.copy-text');
    const originalText = textSpan.textContent;

    button.classList.add('copy-error');
    textSpan.textContent = '复制失败';

    setTimeout(function() {
      button.classList.remove('copy-error');
      textSpan.textContent = originalText;
    }, 2000);
  }

  // 初始化
  function init() {
    addCopyButtons();
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 导出到全局，供 PJAX 导航后重新初始化
  window.initCodeCopy = init;
})();
