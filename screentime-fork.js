// A modified version of https://github.com/robflaherty/screentime that uses https://github.com/customd/jquery-visible to check the viewport

(function() {
  function ScreenTimeFork($) {
    /* jquery-visible */
    /**
     * Copyright 2012, Digital Fusion
     * Licensed under the MIT license.
     * http://teamdf.com/jquery-plugins/license/
     *
     * @author Sam Sehnert
     * @desc A small plugin that checks whether elements are within
     *       the user visible viewport of a web browser.
     *       can accounts for vertical position, horizontal, or both
     */
    var $w = $(window);
    $.fn.visible = function(partial, hidden, direction, container) {
      if (this.length < 1) return;

      // Set direction default to 'both'.
      direction = direction || 'both';

      var $t = this.length > 1 ? this.eq(0) : this,
        isContained = typeof container !== 'undefined' && container !== null,
        $c = isContained ? $(container) : $w,
        wPosition = isContained ? $c.position() : 0,
        t = $t.get(0),
        vpWidth = $c.outerWidth(),
        vpHeight = $c.outerHeight(),
        clientSize = hidden === true ? t.offsetWidth * t.offsetHeight : true;

      if (typeof t.getBoundingClientRect === 'function') {
        // Use this native browser method, if available.
        var rec = t.getBoundingClientRect(),
          tViz = isContained
            ? rec.top - wPosition.top >= 0 && rec.top < vpHeight + wPosition.top
            : rec.top >= 0 && rec.top < vpHeight,
          bViz = isContained
            ? rec.bottom - wPosition.top > 0 &&
              rec.bottom <= vpHeight + wPosition.top
            : rec.bottom > 0 && rec.bottom <= vpHeight,
          lViz = isContained
            ? rec.left - wPosition.left >= 0 &&
              rec.left < vpWidth + wPosition.left
            : rec.left >= 0 && rec.left < vpWidth,
          rViz = isContained
            ? rec.right - wPosition.left > 0 &&
              rec.right < vpWidth + wPosition.left
            : rec.right > 0 && rec.right <= vpWidth,
          vVisible = partial ? tViz || bViz : tViz && bViz,
          hVisible = partial ? lViz || rViz : lViz && rViz,
          vVisible = rec.top < 0 && rec.bottom > vpHeight ? true : vVisible,
          hVisible = rec.left < 0 && rec.right > vpWidth ? true : hVisible;

        if (direction === 'both') return clientSize && vVisible && hVisible;
        else if (direction === 'vertical') return clientSize && vVisible;
        else if (direction === 'horizontal') return clientSize && hVisible;
      } else {
        var viewTop = isContained ? 0 : wPosition,
          viewBottom = viewTop + vpHeight,
          viewLeft = $c.scrollLeft(),
          viewRight = viewLeft + vpWidth,
          position = $t.position(),
          _top = position.top,
          _bottom = _top + $t.height(),
          _left = position.left,
          _right = _left + $t.width(),
          compareTop = partial === true ? _bottom : _top,
          compareBottom = partial === true ? _top : _bottom,
          compareLeft = partial === true ? _right : _left,
          compareRight = partial === true ? _left : _right;

        if (direction === 'both')
          return (
            !!clientSize &&
            (compareBottom <= viewBottom && compareTop >= viewTop) &&
            (compareRight <= viewRight && compareLeft >= viewLeft)
          );
        else if (direction === 'vertical')
          return (
            !!clientSize &&
            (compareBottom <= viewBottom && compareTop >= viewTop)
          );
        else if (direction === 'horizontal')
          return (
            !!clientSize &&
            (compareRight <= viewRight && compareLeft >= viewLeft)
          );
      }
    };

    /* Screentime */
    /*!
     * @preserve
     * Screentime.js | v0.2.0
     * Copyright (c) 2016 Rob Flaherty (@robflaherty)
     * Licensed under the MIT and GPL licenses.
     */

    var defaults = {
      fields: [],
      percentOnScreen: '50%',
      reportInterval: 10,
      googleAnalytics: false,
      callback: function() {}
    };

    $.screentime = function(options) {
      options = $.extend({}, defaults, options);

      // Convert perecent string to number
      options.percentOnScreen = parseInt(
        options.percentOnScreen.replace('%', ''),
        10
      );

      var counter = {};
      var cache = {};
      var log = {};
      var looker = null;
      var started = false;
      var universalGA, classicGA;

      if (!options.fields.length) {
        return;
      }

      if (options.googleAnalytics) {
        if (typeof ga === 'function') {
          universalGA = true;
        }

        if (typeof _gaq !== 'undefined' && typeof _gaq.push === 'function') {
          classicGA = true;
        }
      }

      /*
       * Utilities
       */

      /*!
       * visibly - v0.6 Aug 2011 - Page Visibility API Polyfill
       * http://github.com/addyosmani
       * Copyright (c) 2011 Addy Osmani
       * Dual licensed under the MIT and GPL licenses.
       *
       * Methods supported:
       * visibly.onVisible(callback)
       * visibly.onHidden(callback)
       * visibly.hidden()
       * visibly.visibilityState()
       * visibly.visibilitychange(callback(state));
       */

      (function() {
        window.visibly = {
          q: document,
          p: undefined,
          prefixes: ['webkit', 'ms', 'o', 'moz', 'khtml'],
          props: ['VisibilityState', 'visibilitychange', 'Hidden'],
          m: ['focus', 'blur'],
          visibleCallbacks: [],
          hiddenCallbacks: [],
          genericCallbacks: [],
          _callbacks: [],
          cachedPrefix: '',
          fn: null,
          onVisible: function(i) {
            if (typeof i == 'function') {
              this.visibleCallbacks.push(i);
            }
          },
          onHidden: function(i) {
            if (typeof i == 'function') {
              this.hiddenCallbacks.push(i);
            }
          },
          getPrefix: function() {
            if (!this.cachedPrefix) {
              for (var i = 0; (b = this.prefixes[i++]); ) {
                if (b + this.props[2] in this.q) {
                  this.cachedPrefix = b;
                  return this.cachedPrefix;
                }
              }
            }
          },
          visibilityState: function() {
            return this._getProp(0);
          },
          hidden: function() {
            return this._getProp(2);
          },
          visibilitychange: function(i) {
            if (typeof i == 'function') {
              this.genericCallbacks.push(i);
            }
            var t = this.genericCallbacks.length;
            if (t) {
              if (this.cachedPrefix) {
                while (t--) {
                  this.genericCallbacks[t].call(this, this.visibilityState());
                }
              } else {
                while (t--) {
                  this.genericCallbacks[t].call(this, arguments[0]);
                }
              }
            }
          },
          isSupported: function(i) {
            return this.cachedPrefix + this.props[2] in this.q;
          },
          _getProp: function(i) {
            return this.q[this.cachedPrefix + this.props[i]];
          },
          _execute: function(i) {
            if (i) {
              this._callbacks =
                i == 1 ? this.visibleCallbacks : this.hiddenCallbacks;
              var t = this._callbacks.length;
              while (t--) {
                this._callbacks[t]();
              }
            }
          },
          _visible: function() {
            window.visibly._execute(1);
            window.visibly.visibilitychange.call(window.visibly, 'visible');
          },
          _hidden: function() {
            window.visibly._execute(2);
            window.visibly.visibilitychange.call(window.visibly, 'hidden');
          },
          _nativeSwitch: function() {
            this[this._getProp(2) ? '_hidden' : '_visible']();
          },
          _listen: function() {
            try {
              if (!this.isSupported()) {
                if (this.q.addEventListener) {
                  window.addEventListener(this.m[0], this._visible, 1);
                  window.addEventListener(this.m[1], this._hidden, 1);
                } else {
                  if (this.q.attachEvent) {
                    this.q.attachEvent('onfocusin', this._visible);
                    this.q.attachEvent('onfocusout', this._hidden);
                  }
                }
              } else {
                this.q.addEventListener(
                  this.cachedPrefix + this.props[1],
                  function() {
                    window.visibly._nativeSwitch.apply(
                      window.visibly,
                      arguments
                    );
                  },
                  1
                );
              }
            } catch (i) {}
          },
          init: function() {
            this.getPrefix();
            this._listen();
          }
        };
        this.visibly.init();
      })();

      function random() {
        return Math.round(Math.random() * 2147483647);
      }

      /*
       * Constructors
       */

      function Field(elem) {
        this.selector = elem.selector;
        $elem = this.$elem = $(document.getElementById(elem.selector));
        this.name = elem.name;

        this.top = $elem.offset().top;
        this.height = $elem.height();
        this.bottom = this.top + this.height;
        this.width = $elem.width();
      }

      function Viewport() {
        var $window = $(window);

        this.top = $window.scrollTop();
        this.height = $window.height();
        this.bottom = this.top + this.height;
        this.width = $window.width();
      }

      /*
       * Do Stuff
       */

      function sendGAEvent(field, time) {
        if (universalGA) {
          ga(
            'send',
            'event',
            'Screentime',
            'Time on Screen',
            field,
            parseInt(time, 10),
            { nonInteraction: true }
          );
        }

        if (classicGA) {
          _gaq.push([
            '_trackEvent',
            'Screentime',
            'Time on Screen',
            field,
            parseInt(time, 10),
            true
          ]);
        }
      }

      function onScreen(viewport, fieldTarget) {
        var cond, buffered, partialView;
        var field = fieldTarget.$elem[0].getBoundingClientRect();

        // Field entirely within viewport
        if (field.bottom <= viewport.bottom && field.top >= viewport.top) {
          return true;
        }

        // Field bigger than viewport
        if (field.height > viewport.height) {
          cond =
            viewport.bottom - field.top > viewport.height / 2 &&
            field.bottom - viewport.top > viewport.height / 2;

          if (cond) {
            return true;
          }
        }

        // Partially in view
        buffered = field.height * (options.percentOnScreen / 100);
        partialView =
          viewport.bottom - buffered >= field.top &&
          field.bottom - buffered > viewport.top;

        return partialView;
      }

      function checkViewport() {
        var viewport = new Viewport();

        $.each(cache, function(key, val) {
          // added this condition to check visibility
          if (val.$elem.visible()) {
            log[key] += 1;
            counter[key] += 1;
          }
        });
      }

      function report() {
        var data = {};

        $.each(counter, function(key, val) {
          if (val > 0) {
            data[key] = val;
            counter[key] = 0;

            if (options.googleAnalytics) {
              sendGAEvent(key, val);
            }
          }
        });

        if (!$.isEmptyObject(data)) {
          options.callback.call(this, data, log);
        }
      }

      function startTimers() {
        if (!started) {
          checkViewport();
          started = true;
        }

        looker = setInterval(function() {
          checkViewport();
        }, 1000);

        reporter = setInterval(function() {
          report();
        }, options.reportInterval * 1000);
      }

      function stopTimers() {
        clearInterval(looker);
        clearInterval(reporter);
      }

      $.screentime.reset = function() {
        stopTimers();

        $.each(cache, function(key, val) {
          log[key] = 0;
          counter[key] = 0;
        });

        startTimers();
      };

      function init() {
        $.each(options.fields, function(index, elem) {
          var $el = $(document.getElementById(elem.selector));
          if ($el.length) {
            var field = new Field(elem);
            cache[field.name] = field;
            counter[field.name] = 0;
            log[field.name] = 0;
          }
        });

        startTimers();

        visibly.onHidden(function() {
          stopTimers();
        });

        visibly.onVisible(function() {
          stopTimers();
          startTimers();
        });
      }
      init();
    };
  }

  window.ScreenTimeFork = ScreenTimeFork;
})();
