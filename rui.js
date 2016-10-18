(function (window) {
    // 将一些全局对象，传到框架中的局部变量中。
    // 好处：提高访问性能。
    var iArray = [],
        push = iArray.push,
        document = window.document;
    // rui 就相当于$(jQuery)
    // 核心函数
    function rui(selector) {
        return new rui.fn.init(selector);
    }
    // 由于会经常调用rui.prototype,因此为其添加一个简写方式
    rui.fn = rui.prototype = {
        constructor: rui,
        selector: '', // 用来判断是rui对象的属性
        length: 0, // 保证rui对象在任何情况下都是伪数组对象
        // 创建init对象，
        // 参数：selector就是选择器，根据其获取dom元素，并且保存在init对象上。
        init: function (selector, context) {
            // handle: 无效值 null undefined false 空字符串
            if (!selector) return this;
            // handle: 字符串类型
            if (rui.isString(selector)) {
                // handle: html字符串 eg: '<p>123</p>'
                if (rui.isHTML(selector)) {
                    push.apply(this, rui.parseHTML(selector));
                } else { // handle: 选择器
                    push.apply(this, select(selector, context));
                    // 缓存选择器，如果结果被意外修改，可以用此属性追溯回原先的结果。
                    this.selector = selector;
                    this.context = context || document;
                }
                return this;
            }
            // handle: rui对象
            if (rui.isrui(selector)) {
                return selector;
            }
            // handle: 函数
            if (rui.isFunction(selector)) {
                // 缓存已经绑定过的事件处理函数
                var oldFn = window.onload;
                // 如果类型为函数
                if (rui.isFunction(oldFn)) {
                    // 给onload事件添加一个匿名的事件处理函数，在函数体内，
                    //  分别执行oldFn以及selector函数
                    window.onload = function () {
                        oldFn();
                        selector();
                    }
                } else { // 如果oldFn为无效值（除了函数类型）
                    window.onload = selector;
                }
                return this;
            }
            // 单一的dom元素
            if (rui.isDOM(selector)) {
                // 在当前rui实例上添加索引为0，值为传入的dom元素
                //   此时rui实例的长度为1
                this[0] = selector;
                this.length = 1;
                return this;
            }
            // dom数组
            if (rui.isArrayLike(selector)) {
                // 将dom数组中每一个dom元素添加到当前rui实例上，并且长度自动更新
                push.apply(this, selector);
                return this;
            }
        },
        each: function (callback) {
            // this就是rui对象，即each方法的调用者
            rui.each(this, callback);
            // 实现链式编程，将当前调用者返回
            return this;
        },
        get: function (index) {
            index = index * 1
            return window.isNaN(index) ? undefined : this[index];
        }
    }
    // 核心原型
    rui.fn.init.prototype = rui.fn;

    // 可扩展方法
    rui.extend = rui.fn.extend = function (source, target) {
        var k;
        if (source && typeof source === 'object') {
            for (k in source) {
                target = target || this;
                target[k] = source[k];
            }
        }
    }

    // 扩展类型判断方法
    rui.extend({
        // 判断是否为字符串
        isString: function (obj) {
            return !!obj && typeof obj === 'string';
        },
        // 判断是否为html
        isHTML: function (obj) {
            // 如果字符串满足一下要求就是html字符串
            // 1.以‘<’开头；2.以‘>’结尾；3.最小长度为3
            var _o = rui.trim(obj);
            return _o.charAt(0) === '<' && _o.charAt(_o.length - 1) === '>' &&
                _o.length >= 3;
        },
        // 判断是否为rui对象
        isrui: function (obj) {
            // 小技巧：如果有selector属性就是rui对象
            return typeof obj === 'object' && 'selector' in obj;
        },
        isFunction: function (obj) {
            return typeof obj === 'function';
        },
        // 判断是否为dom节点
        isDOM: function (obj) {
            return !!obj.nodeType;
        },
        // 判断是否为window对象
        isWindow: function (obj) {
            // window对象有一个特性，就是有一个window属性引用自己
            return 'window' in obj && obj.window === window;
        },
        isArrayLike: function (obj) {
            // 类数组：真数组，以及伪数组对象
            // 有length属性
            // 由于window和函数也有length属性，但不是伪数组对象，
            //  所以将它们过滤掉
            if (rui.isWindow(obj) || rui.isFunction(obj)) return false;
            return 'length' in obj && obj.length >= 0;
        }
    });

    // 扩展工具类方法
    rui.extend({
        each: function (obj, callback) {
            var i = 0,
                l = obj.length;
            for (; i < l;) {
                if (callback.call(obj[i], obj[i], i++) === false) break;
            }
        },
        trim: function (str) {
            if (!str) return '';
            return str.replace(/^\s+|\s+$/g,'');
        },
        parseHTML: function (html) {
            // 思路:
            // 1.创建一个div元素，并且给其innerHTML属性赋值为html
            // 2.声明一个数组，存储创建出来的所有html元素
            // 3.遍历div下所有子节点，依次添加到数组中
            // 4.返回数组。
            var ret, div;
            ret = [];
            div = document.createElement('div');
            div.innerHTML = html;
            rui.each(div.childNodes, function () {
                if (this.nodeType === 1) ret.push(this);
            });
            return ret;
        }
    });

    // css module
    rui.extend({
        setCss: function (dom, name, value) {
            // 如果value值不为undefined，那就是给dom设置单个样式值
            if (value !== undefined) {
                dom.style[name] = value;
            } else if (typeof name === 'object') {
                // 如果name的类型为object，那么就是给dom同时设置多个样式
                var k;
                for (k in name) {
                    dom.style[k] = name[k];
                }
            }
        },
        getCss: function (dom, name) {
            // 判断浏览器是否符合W3C标准
            return document.defaultView && document.defaultView.getComputedStyle ?
                document.defaultView.getComputedStyle(dom)[name] :
                dom.currentStyle[name];
        },
        hasClass: function (dom, className) {
            return (' ' + dom.className + ' ')
                    .indexOf(' ' + rui.trim(className) + ' ') > -1;
        },
        addClass: function (dom, className) {
            var _className = dom.className; // className = ' ' + className;
            if (!_className) dom.className = className;
            else {
                if (!rui.hasClass(dom, className))
                    dom.className += ' ' + className;
            }
        },
        removeClass: function (dom, className) {
            dom.className = rui.trim((' ' + dom.className + ' ')
                .replace(' ' + rui.trim(className) + ' ', ' '));
        },
        toggleClass: function (dom, className) {
            if (rui.hasClass(dom, className)) {
                rui.removeClass(dom, className);
            } else {
                rui.addClass(dom, className);
            }
        }
    });
    rui.fn.extend({
        css: function (name, value) {
            // 如果value等于undefined，那么就认为只给name传入值
            if (value === undefined) {
                // 如果name为对象，就表示同时设置多个样式
                if (typeof name === 'object') {
                    //rui.each();
                    return this.each(function () {
                        // this ->遍历到每一个dom元素
                        rui.setCss(this, name);
                    });
                } else { // 如果name 是一个字符串的话，表示获取相应的样式值
                    // 默认获取rui对象上的一个dom元素的样式值
                    // 首先判断当前rui对象上是否有dom元素，
                    // 如果有，就返回第一个dom元素的样式值
                    // 否则就是没有，那么就返回undefined。
                    return this.length > 0 ?
                        rui.getCss(this[0], name) :
                        undefined;
                }
            } else { // 如果value有值，那么就是rui对象上的所有dom元素设置单个样式值
                return this.each(function () {
                    rui.setCss(this, name, value);
                });
            }
        },
        hasClass: function (className) {
            // 默认还是判断rui对象上的第一个dom元素是否就有指定的样式类
            return this.length > 0 ?
                rui.hasClass(this[0], className) :
                false;
        },
        addClass: function (className) {
            // 给rui对象上所有dom元素都添加指定的样式类
            return this.each(function () {
                // this -> 遍历到的每一个rui对象上的dom元素
                rui.addClass(this, className);
            });
        },
        removeClass: function (className) {
            return this.each(function () {
                // 如果className为undefined，那么就将所有dom的样式类都移除
                if (className === undefined) {
                    this.className = '';
                    // this.removeAttribute('class');
                } else { // 如果指定了要删除的样式类，就将所有的dom移除指定的样式类
                    rui.removeClass(this, className);
                }
            });
        },
        // 如果当前dom有指定的样式类，就删除
        // 没有，就添加
        // this -> rui 对象
        toggleClass: function (className) {
            return this.each(function () {
                rui.toggleClass(this, className);
                // if (rui.hasClass(this, className)) {
                //     rui.removeClass(this, className);
                // } else {
                //     rui.addClass(this, className);
                // }
            });
        }
    });

    // attr module
    rui.extend({
        setAttr: function (dom, name, value) {
            dom.setAttribute(name, value);
        },
        getAttr: function (dom, name) {
            return dom.getAttribute(name);
        },
        setHTML: function (dom, html) {
            dom.innerHTML = html;
        },
        getHTML: function (dom) {
            return dom.innerHTML;
        },
        setVal: function (dom, v) {
            dom.value = v;
        },
        getVal: function (dom) {
            return dom.value;
        },
        getText: function (elem) {
            var ret = '',
                nodeType = elem.nodeType;
            if (nodeType === 1 || nodeType === 9 || nodeType === 11) {
                if (elem.textContent) {
                    return elem.textContent;
                } else {
                    for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
                        ret += getText(elem);
                    }
                }
            } else if (nodeType === 3) {
                return elem.nodeValue;
            }
            return ret;
        },
        setText: function (elem, txt) {
            if (elem.textContent) {
                elem.textContent = txt;
            } else {
                elem.innerHTML = '';
                elem.appendChild(document.createTextNode(txt));
            }
        }
    });
    rui.fn.extend({
        attr: function (name, value) {
            // 如果value为undefined，表示获取属性值
            // 默认返回rui对象上的第一dom元素的指定属性值。
            if (value === undefined) {
                return this.length > 0 ? rui.getAttr(this[0], name) :
                    undefined;
            } else { // 如果不为undefined，表示给rui对象上的所有dom元素设置指定的属性值
                return this.each(function () {
                    rui.setAttr(this, name, value);
                });
            }
        },
        html: function (html) {
            // 如果html没有传入值的话，就表示获取rui对象上第一个dom元素的innerHTML属性值
            if (html === undefined) {
                return this.length > 0 ? rui.getHTML(this[0]) : undefined;
            } else { // 如果被传入值，那么就是给rui对象上的所有dom元素设置innerHTML属性
                return this.each(function () {
                    rui.setHTML(this, html);
                });
            }
        },
        val: function (v) {
            if (v === undefined) {
                return this.length > 0 ? rui.getVal(this[0]) : undefined;
            } else {
                return this.each(function () {
                    rui.setVal(this, v);
                });
            }
        },
        text: function (txt) {
            if (txt === undefined) {
                return this[0] && rui.getText(this[0]);
            } else {
                return this.each(function () {
                    rui.setText(this, txt);
                });
            }
        }
    });

    // dom operation module
    rui.fn.extend({
        appendTo: function (target) {
            var self = this,
                // tlen,
                ret = [];
            target = rui(target);
            // tlen = target.length;

            target.each(function (elem, i) {
                self.each(function () {
                    //  var node = i === tlen - 1 ? this : this.cloneNode(true);
                    var node = i === 0 ? this : this.cloneNode(true);
                    elem.appendChild(node);
                    ret.push(node);
                    //elem.appendChild(this);
                });
            });
            return rui(ret);
        },
        append: function (source) {
            rui(source).appendTo(this);
            return this;
        },
        prependTo: function (target) {
            var self, firstNode, node, ret = [];
            // 将target转换成rui对象
            // 好处：1统一处理；2可以使用each方法遍历自己
            target = I(target);
            self = this; // 缓存this，即prependTo调用者
            // 遍历target上每一个dom元素
            target.each(function (elem, i) {
                // 保存当前dom元素的第一个子节点
                firstNode = this.firstChild;
                // 遍历被添加的rui对象
                self.each(function () {
                    // 如果此时遍历的是target上的第一个dom元素就不需要克隆节点
                    // 否则，就需要克隆。注意是深克隆
                    node = i === 0 ? this : this.cloneNode(true);
                    // 给elem添加子节点，并且要在firstNode节点之前
                    elem.insertBefore(node, firstNode);
                    // elem.insertBefore(node, elem.firstChild);
                    // 将被添加的节点存放在ret
                    ret.push(node);
                });
            });
            // 将ret转换为rui对象，并返回
            // 实现链式编程 --可参考appendTo
            return rui(ret);
        },
        prepend: function (source) {
            rui(source).prependTo(this);
            return this;
        },
        remove: function () {
            return this.each(function () {
                this.parentNode.removeChild(this);
            });
        },
        empty: function () {
            return this.each(function () {
                this.innerHTML = '';
            });
        },
        next: function () {
            var ret = [],
                node;
            this.each(function () {
                for (node = this.nextSibling; node; node = node.nextSibling) {
                    if (node.nodeType === 1) {
                        ret.push(node);
                        break;
                    }
                }
            });
            return ret;
        },
        nextAll: function () {
            var ret = [],
                node;
            this.each(function () {
                for (node = this.nextSibling; node; node = node.nextSibling) {
                    if (node.nodeType === 1) {
                        ret.push(node);
                    }
                }
            });
            return ret;
        },
        before: function (elem) {
            var node;
            elem = rui(elem);

            return this.each(function (dom, i) {
                elem.each(function () {
                    node = i === 0 ? this : this.cloneNode(true);
                    dom.parentNode.insertBefore(node, dom);
                });
            });
        },
        after: function (elem) {
            var node, nextNode;
            elem = rui(elem);
            this.each(function (dom, i) {
                nextNode = dom.nextSibling;
                elem.each(function () {
                    node = i === 0 ? this : this.cloneNode(true);
                    if (nextNode) {
                        dom.parentNode.insertBefore(node, nextNode);
                    } else {
                        dom.parentNode.appendChild(node);
                    }
                });
            });
        }
    });

    // event module
    rui.fn.extend({
        on: function (type, callback) {
            return this.each(function () {
                if (window.addEventListener) {
                    this.addEventListener(type, callback);
                } else {
                    this.attachEvent('on' + type, callback);
                }
            });
        },
        off: function (type, callback) {
            return this.each(function () {
                if (window.removeEventListener) {
                    this.removeEventListener(type, callback);
                } else {
                    this.detachEvent('on' + type, callback);
                }
            });
        }
    });

    // ['mouseenter','mouseleave','mousedown']
    rui.each(('mouseenter mouseleave mousedown mouseup keypress ' +
        'keydown keyup focus blur click dblclick scroll resize')
            .split(' '),
        function (type) {
            rui.fn[type] = function (callback) {
                return this.on(type, callback);
            }
        });
    // animation module
    rui.extend({
        kv: {
            left: 'offsetLeft',
            width: 'offsetWidth',
            top: 'offsetTop',
            height: 'offsetHeight'
        },
        easing: {
            linear: function (x, t, b, c, d) {
                return (c - b) * t / d;
            },
            minusspeed: function (x, t, b, c, d) {
                return (c - b) * t / d * (2 - t / d);
            }
        },
        // 获取所有属性的起始值
        getLocations: function (dom, target) {
            var k, o = {};
            for (k in target) {
                // var name = kv[k];
                // o[k] = dom[name];
                o[k] = dom[rui.kv[k]];
            }
            return o;
        },
        // 获取所有属性一定时间间隔内的位移量
        getTweens: function (time, locations, target, dur, easingName) {
            var k, o = {};
            for (k in target) {
                o[k] = rui.easing[easingName](null, time, locations[k],
                    parseInt(target[k]), dur);
            }
            return o;
        },
        // 根据位移量和起始值，为dom元素设置相应样式
        setStyles: function (dom, locations, tweens) {
            var k;
            for (k in tweens) {
                dom.style[k] = locations[k] + tweens[k] + 'px';
            }
        },
        // 根据所有属性的起始值和终止值,获取其相应总距离
        getDistances: function (locations, target) {
            var k, o = {};
            for (k in target) {
                o[k] = parseInt(target[k]) - locations[k];
            }
            return o;
        }
    });




    rui.fn.extend({
        animate: function (target, dur, easingName) {
            return this.each(function (dom) {
                var locations = rui.getLocations(dom, target),
                    distances = rui.getDistances(locations, target),
                    startTime,
                    timer = dom.timerId;
                startTime = +new Date;
                // 把时间转换成毫秒值，动画开始时间。
                function render() {
                    var tweens,
                        curTime = +new Date,
                        time = curTime - startTime,
                        isStop = !!dom.getAttribute('stopAni');
                    // stopAni值为1时，代表要停止动画，并且做好收尾。
                    if (isStop) { // 动画非正常出口
                        // 动画已停止，删除stopAni属性，防止影响下次判断
                        dom.removeAttribute('stopAni');
                        // 此时dom没有动画,所以要删除timerId属性,
                        // 否则会影响该dom是否处于动画中的判断
                        dom.removeAttribute('timerId');
                        return;
                    }
                    // 如果经历时间大于等于指定总时间，那么就表示要到达终点
                    if (time >= dur) { // 动画正常结束出口
                        tweens = distances; // 此时，产生的位移就是总距离
                        dom.removeAttribute('timerId');
                    } else {
                        // 此时的位移就是 速度 X 时间
                        //  tween = easing.linear(null, time, location, target, dur);
                        tweens = rui.getTweens(time, locations, target, dur, easingName);
                        window.requestAnimationFrame(render);
                    }
                    // 设置dom样式
                    rui.setStyles(dom, locations, tweens);
                }

                // 如果timer不为undefined,那么表示该dom正处于动画中
                // 不再执行其他动画.
                // 否则执行动画
                if (!timer) {
                    timer = window.requestAnimationFrame(render);
                    // 给dom添加一个timerId属性用来判断该dom是否处于动画中
                    // 如果timerId不为0,表示处于动画中;
                    // 否则没有动画
                    dom.setAttribute('timerId', timer);
                }
            });
        },
        stopAnimating: function () {
            return this.each(function (dom) {
                if (dom.getAttribute('timerId')) {
                    dom.setAttribute('stopAni', 1);
                }
            });
        },
        isAnimating: function () {
            return !!this[0] && !!this[0].getAttribute('timerId');
        }
    });

    rui.extend({
        easeInQuad: function (x, t, b, c, d) {
            return c * (t /= d) * t + b;
        },
        easeOutQuad: function (x, t, b, c, d) {
            return -c * (t /= d) * (t - 2) + b;
        },
        easeInOutQuad: function (x, t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t + b;
            return -c / 2 * ((--t) * (t - 2) - 1) + b;
        },
        easeInCubic: function (x, t, b, c, d) {
            return c * (t /= d) * t * t + b;
        },
        easeOutCubic: function (x, t, b, c, d) {
            return c * ((t = t / d - 1) * t * t + 1) + b;
        },
        easeInOutCubic: function (x, t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
            return c / 2 * ((t -= 2) * t * t + 2) + b;
        },
        easeInQuart: function (x, t, b, c, d) {
            return c * (t /= d) * t * t * t + b;
        },
        easeOutQuart: function (x, t, b, c, d) {
            return -c * ((t = t / d - 1) * t * t * t - 1) + b;
        },
        easeInOutQuart: function (x, t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
            return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
        },
        easeInQuint: function (x, t, b, c, d) {
            return c * (t /= d) * t * t * t * t + b;
        },
        easeOutQuint: function (x, t, b, c, d) {
            return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
        },
        easeInOutQuint: function (x, t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
            return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
        },
        easeInSine: function (x, t, b, c, d) {
            return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
        },
        easeOutSine: function (x, t, b, c, d) {
            return c * Math.sin(t / d * (Math.PI / 2)) + b;
        },
        easeInOutSine: function (x, t, b, c, d) {
            return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
        },
        easeInExpo: function (x, t, b, c, d) {
            return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
        },
        easeOutExpo: function (x, t, b, c, d) {
            return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
        },
        easeInOutExpo: function (x, t, b, c, d) {
            if (t == 0) return b;
            if (t == d) return b + c;
            if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
            return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
        },
        easeInCirc: function (x, t, b, c, d) {
            return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
        },
        easeOutCirc: function (x, t, b, c, d) {
            return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
        },
        easeInOutCirc: function (x, t, b, c, d) {
            if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
            return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
        },
        easeInElastic: function (x, t, b, c, d) {
            var s = 1.70158;
            var p = 0;
            var a = c;
            if (t == 0) return b;
            if ((t /= d) == 1) return b + c;
            if (!p) p = d * .3;
            if (a < Math.abs(c)) {
                a = c;
                var s = p / 4;
            } else var s = p / (2 * Math.PI) * Math.asin(c / a);
            return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
        },
        easeOutElastic: function (x, t, b, c, d) {
            var s = 1.70158;
            var p = 0;
            var a = c;
            if (t == 0) return b;
            if ((t /= d) == 1) return b + c;
            if (!p) p = d * .3;
            if (a < Math.abs(c)) {
                a = c;
                var s = p / 4;
            } else var s = p / (2 * Math.PI) * Math.asin(c / a);
            return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
        },
        easeInOutElastic: function (x, t, b, c, d) {
            var s = 1.70158;
            var p = 0;
            var a = c;
            if (t == 0) return b;
            if ((t /= d / 2) == 2) return b + c;
            if (!p) p = d * (.3 * 1.5);
            if (a < Math.abs(c)) {
                a = c;
                var s = p / 4;
            } else var s = p / (2 * Math.PI) * Math.asin(c / a);
            if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
            return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
        },
        easeInBack: function (x, t, b, c, d, s) {
            if (s == undefined) s = 1.70158;
            return c * (t /= d) * t * ((s + 1) * t - s) + b;
        },
        easeOutBack: function (x, t, b, c, d, s) {
            if (s == undefined) s = 1.70158;
            return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
        },
        easeInOutBack: function (x, t, b, c, d, s) {
            if (s == undefined) s = 1.70158;
            if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
            return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
        },
        easeOutBounce: function (x, t, b, c, d) {
            if ((t /= d) < (1 / 2.75)) {
                return c * (7.5625 * t * t) + b;
            } else if (t < (2 / 2.75)) {
                return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
            } else if (t < (2.5 / 2.75)) {
                return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
            } else {
                return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
            }
        }
    }, rui.easing);

    // Ajax module
    function createXmlHttp() {
        var xhr;
        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else {
            xhr = new ActiveXObject('Microsoft.XMLHTTP');
        }
        return xhr;
    }

    function formatParams(data) {
        var ret = [],
            k;
        // 过滤空值
        if (!data) return null;
        for (k in data) {
            ret.push(encodeURIComponent(k) + '=' + encodeURIComponent(data[k]));
        }
        // 在链接上加上随机数，防止获取缓存数据
        ret.push(('_=' + Math.random()).replace('.', ''));
        return ret.join('&');
    }
    rui.extend({
        AjaxSetting: {
            url: '',
            type: 'GET',
            datatype: 'json',
            async: 'true',
            success: function () {
            },
            fail: function () {
            },
            data: null,
            onreadystatechange: function (success, context, xhr, fail) {
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            var data;
                            if (context.datatype.toLowerCase() === 'json') {
                                data = JSON.parse(xhr.responseText);
                            } else {
                                data = xhr.responseText;
                            }
                            success && success.call(context, data, xhr);
                        } else {
                            fail && fail.call({message: 'failed.'}, xhr);
                        }
                    }
                }
            }
        },
        Ajax: function (options) {
            var xhr, data, context ={};
            if (!options || !options.url) {
                throw  new Error('参数异常.');
            }
            // 将默认Ajax设置拷贝到context
            rui.extend(rui.AjaxSetting, context);
            // 将用户自定义设置覆盖context
            rui.extend(options, context);
            context.type = context.type.toUpperCase();

            // 创建请求对象
            xhr = createXmlHttp();
            // 格式化参数
            data = formatParams(context.data);
            if (context.type === 'GET') {
                // 格式化url参数
                var url = !!context.data && !!data ?
                context.url + '?' + data :
                    context.url;
                xhr.open('GET', url, context.async);
            }
            else {
                xhr.open('POST', context.url, context.async);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
            }
            // 注册状态监听事件
            context.onreadystatechange(context.success, context, xhr, context.fail);
            // 发送请求
            xhr.send(context.type === 'GET' ? null : data);
}
    });

    // // 创建init对象，
    // // 参数：selector就是选择器，根据其获取dom元素，并且保存在init对象上。
    // function init(selector) {
    //
    // }

    // 暴露在外部
    window.I = window.rui = rui;

    var select = (function () {
        var rnative = /^[^{]+\{\s*\[native \w/,
            rquickExpr = /^(?:#([\w-]+)|\.([\w-]+)|(\w+)|(\*))$/,
            support = {
                getElementsByClassName: rnative.test(document.getElementsByClassName)
            };

        function getTag(tagName, context, results) {
            results = results || []; // 赋初值，默认为空数组
            results.push.apply(results, context.getElementsByTagName(tagName));
            return results;
        }

        function getId(idName, results) {
            results = results || []; // 赋初值，默认为空数组
            var node = document.getElementById(idName);
            // 如果node不为null，则将node添加到results
            if (node) results.push(node);
            return results;
        }

        function getClass(className, context, results) {
            results = results || []; // 赋初值，默认为空数组
            if (support.getElementsByClassName) { // 如果支持
                results.push.apply(results, context.getElementsByClassName(className));
            } else { // 如果不支持
                var nodes = getTag('*', context);
                each(nodes, function () {
                    // 如果当前遍历到dom元素具有指定样式类
                    if ((' ' + this.className + ' ').indexOf(' ' + trim(className) + ' ') > -1)
                        results.push(this);
                });
            }
            return results;
        }

        function get(selector, context, results) {
            //results = results || [];
            context = context || document; // 为context赋初值
            var match = rquickExpr.exec(selector);
            if (match) { // 如果match不为null
                // 如果组1的值为有效值，就是id选择器
                // 不需要上下文模式
                if (match[1]) results = getId(match[1]);
                else { // 其他基本选择器就需要考虑上下文
                    // 统一context数据类型
                    // 如果context为标签，那么就将其转换成数组
                    var ntype = context.nodeType;
                    if (ntype === 1 || ntype === 9 || ntype === 11) context = [context];
                    // 如果context为string类型，就认为是选择器，那么就根据选择器筛选出相应的dom元素
                    else if (typeof context === 'string') context = get(context);
                    //处理上下文 eg.context = [div1, div2] ==> 'p'
                    each(context, function () {
                        // 注意：context有可能函数多个元素，那么就要实现结果集的累加，
                        //    因此就要给每个基本选择器传入results
                        // 如果组2的值为有效值，就是class选择器
                        if (match[2]) results = getClass(match[2], this, results);
                        // 如果组3的值为有效值，就是tag选择器
                        else if (match[3]) results = getTag(match[3], this, results);
                        // 如果组4的值为有效值，就是统配
                        else if (match[4]) results = getTag('*', this, results);
                    });
                }
            }
            return results;
        }

        function select(selector, context, results) {
            results = results || [];
            each(selector.split(','), function () {
                var res = context;
                each(this.split(' '), function () {
                    res = get(this.valueOf(), res);
                });
                results.push.apply(results, res);
            });
            return results;
        }

        function each(obj, callback) {
            var i = 0,
                l = obj.length;
            for (; i < l;) {
                if (callback.call(obj[i], obj[i], i++) === false) break;
            }
        }

        // 功能：去掉收尾空白
        function trim(str) {
            return str.replace(/^\s+|\s+$/g, '');
        }
        return select;
    }());
}(window));
