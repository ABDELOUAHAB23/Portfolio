(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
      define(factory);
    } else {
      global.AOS = factory();
    }
  }(this, function () {
    'use strict';
  
    var root = typeof window !== 'undefined' ? window :
               typeof global !== 'undefined' ? global :
               typeof self !== 'undefined' ? self : {};
  
    var defaultDuration = 400;
    var defaultDelay = 0;
    var defaultOffset = 120;
    var defaultEasing = 'ease';
    var defaultAnimatedClassName = 'aos-animate';
    var defaultInitClassName = 'aos-init';
    var defaultThrottleDelay = 99;
    var defaultDebounceDelay = 50;
  
    var deviceDetector = {
      isMobile: function () {
        var ua = navigator.userAgent || navigator.vendor || window.opera;
        return (/android|bb\d+|meego|mobile|ipad|playbook|silk/i).test(ua);
      },
      isTablet: function () {
        var ua = navigator.userAgent || navigator.vendor || window.opera;
        return this.isMobile() && !(/phone|ipod/i).test(ua);
      },
      isIE11: function () {
        return '-ms-scroll-limit' in document.documentElement.style && '-ms-ime-align' in document.documentElement.style;
      }
    };
  
    var throttle = function (func, wait, options) {
      var timeout, context, args, result;
      var previous = 0;
      if (!options) options = {};
      
      var later = function () {
        previous = options.leading === false ? 0 : Date.now();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      };
  
      var throttled = function () {
        var now = Date.now();
        if (!previous && options.leading === false) previous = now;
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          previous = now;
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        } else if (!timeout && options.trailing !== false) {
          timeout = setTimeout(later, remaining);
        }
        return result;
      };
  
      throttled.cancel = function () {
        clearTimeout(timeout);
        previous = 0;
        timeout = context = args = null;
      };
  
      return throttled;
    };
  
    var debounce = function (func, wait, immediate) {
      var timeout;
      return function () {
        var context = this, args = arguments;
        var later = function () {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      };
    };
  
    var isMutationObserverSupported = function () {
      return 'MutationObserver' in window || 'WebKitMutationObserver' in window || 'MozMutationObserver' in window;
    };
  
    var MutationObserverFactory = function (callback) {
      var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
      var observer = new MutationObserver(callback);
      return observer;
    };
  
    var observeMutations = function (callback) {
      var observer = MutationObserverFactory(callback);
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        removedNodes: true
      });
      return observer;
    };
  
    var calculateOffset = function (el) {
      var rect = el.getBoundingClientRect();
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
    };
  
    var applyClasses = function (el, animatedClassNames, isAnimateIn) {
      if (isAnimateIn) {
        el.classList.add(...animatedClassNames);
      } else {
        el.classList.remove(...animatedClassNames);
      }
    };
  
    var handleScroll = function (elements) {
      var scrollTop = window.pageYOffset;
      elements.forEach(function (el) {
        var position = el.position;
        var isVisible = scrollTop >= position.in && (!position.out || scrollTop < position.out);
        applyClasses(el.node, el.options.animatedClassNames, isVisible);
      });
    };
  
    var init = function (settings) {
      var options = {
        offset: settings.offset || defaultOffset,
        delay: settings.delay || defaultDelay,
        easing: settings.easing || defaultEasing,
        duration: settings.duration || defaultDuration,
        animatedClassName: settings.animatedClassName || defaultAnimatedClassName,
        initClassName: settings.initClassName || defaultInitClassName,
        throttleDelay: settings.throttleDelay || defaultThrottleDelay,
        debounceDelay: settings.debounceDelay || defaultDebounceDelay,
        disable: settings.disable || false,
        once: settings.once || false,
        mirror: settings.mirror || false,
        anchorPlacement: settings.anchorPlacement || 'top-bottom'
      };
  
      var elements = Array.from(document.querySelectorAll('[data-aos]')).map(function (node) {
        var offset = options.offset;
        var delay = options.delay;
        var duration = options.duration;
        var easing = options.easing;
        var animatedClassName = options.animatedClassName;
        var initClassName = options.initClassName;
        var mirror = options.mirror;
        var once = options.once;
        var anchorPlacement = options.anchorPlacement;
  
        var position = {
          in: calculateOffset(node).top - window.innerHeight + offset,
          out: mirror ? calculateOffset(node).top + node.offsetHeight - offset : null
        };
  
        var animatedClassNames = [animatedClassName];
        if (node.getAttribute('data-aos')) {
          animatedClassNames.push(node.getAttribute('data-aos'));
        }
  
        if (initClassName) {
          node.classList.add(initClassName);
        }
  
        return {
          node: node,
          options: {
            once: once,
            mirror: mirror,
            animatedClassNames: animatedClassNames
          },
          position: position
        };
      });
  
      var handleScrollThrottled = throttle(function () {
        handleScroll(elements);
      }, options.throttleDelay);
  
      window.addEventListener('scroll', handleScrollThrottled);
      window.addEventListener('resize', debounce(function () {
        elements = elements.map(function (el) {
          el.position = {
            in: calculateOffset(el.node).top - window.innerHeight + offset,
            out: mirror ? calculateOffset(el.node).top + el.node.offsetHeight - offset : null
          };
          return el;
        });
        handleScroll(elements);
      }, options.debounceDelay));
  
      if (isMutationObserverSupported() && !settings.disableMutationObserver) {
        observeMutations(function () {
          elements = elements.map(function (el) {
            el.position = {
              in: calculateOffset(el.node).top - window.innerHeight + offset,
              out: mirror ? calculateOffset(el.node).top + el.node.offsetHeight - offset : null
            };
            return el;
          });
          handleScroll(elements);
        });
      }
  
      document.addEventListener(settings.startEvent || 'DOMContentLoaded', function () {
        handleScroll(elements);
      });
    };
  
    return {
      init: init
    };
  }));
  