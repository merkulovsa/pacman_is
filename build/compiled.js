var _Group = function () {
    this._tweens = {};
    this._tweensAddedDuringUpdate = {};
};
_Group.prototype = {
    getAll: function () {
        return Object.keys(this._tweens).map(function (tweenId) {
            return this._tweens[tweenId];
        }.bind(this));
    },
    removeAll: function () {
        this._tweens = {};
    },
    add: function (tween) {
        this._tweens[tween.getId()] = tween;
        this._tweensAddedDuringUpdate[tween.getId()] = tween;
    },
    remove: function (tween) {
        delete this._tweens[tween.getId()];
        delete this._tweensAddedDuringUpdate[tween.getId()];
    },
    update: function (time, preserve) {
        var tweenIds = Object.keys(this._tweens);
        if (tweenIds.length === 0) {
            return false;
        }
        time = time !== undefined ? time : TWEEN.now();
        while (tweenIds.length > 0) {
            this._tweensAddedDuringUpdate = {};
            for (var i = 0; i < tweenIds.length; i++) {
                var tween = this._tweens[tweenIds[i]];
                if (tween && tween.update(time) === false) {
                    tween._isPlaying = false;
                    if (!preserve) {
                        delete this._tweens[tweenIds[i]];
                    }
                }
            }
            tweenIds = Object.keys(this._tweensAddedDuringUpdate);
        }
        return true;
    }
};
var TWEEN = new _Group();
TWEEN.Group = _Group;
TWEEN._nextId = 0;
TWEEN.nextId = function () {
    return TWEEN._nextId++;
};
if (typeof (self) === 'undefined' && typeof (process) !== 'undefined' && process.hrtime) {
    TWEEN.now = function () {
        var time = process.hrtime();
        return time[0] * 1000 + time[1] / 1000000;
    };
}
else if (typeof (self) !== 'undefined' &&
    self.performance !== undefined &&
    self.performance.now !== undefined) {
    TWEEN.now = self.performance.now.bind(self.performance);
}
else if (Date.now !== undefined) {
    TWEEN.now = Date.now;
}
else {
    TWEEN.now = function () {
        return new Date().getTime();
    };
}
TWEEN.Tween = function (object, group) {
    this._isPaused = false;
    this._pauseStart = null;
    this._object = object;
    this._valuesStart = {};
    this._valuesEnd = {};
    this._valuesStartRepeat = {};
    this._duration = 1000;
    this._repeat = 0;
    this._repeatDelayTime = undefined;
    this._yoyo = false;
    this._isPlaying = false;
    this._reversed = false;
    this._delayTime = 0;
    this._startTime = null;
    this._easingFunction = TWEEN.Easing.Linear.None;
    this._interpolationFunction = TWEEN.Interpolation.Linear;
    this._chainedTweens = [];
    this._onStartCallback = null;
    this._onStartCallbackFired = false;
    this._onUpdateCallback = null;
    this._onRepeatCallback = null;
    this._onCompleteCallback = null;
    this._onStopCallback = null;
    this._group = group || TWEEN;
    this._id = TWEEN.nextId();
};
TWEEN.Tween.prototype = {
    getId: function () {
        return this._id;
    },
    isPlaying: function () {
        return this._isPlaying;
    },
    isPaused: function () {
        return this._isPaused;
    },
    to: function (properties, duration) {
        this._valuesEnd = Object.create(properties);
        if (duration !== undefined) {
            this._duration = duration;
        }
        return this;
    },
    duration: function duration(d) {
        this._duration = d;
        return this;
    },
    start: function (time) {
        this._group.add(this);
        this._isPlaying = true;
        this._isPaused = false;
        this._onStartCallbackFired = false;
        this._startTime = time !== undefined ? typeof time === 'string' ? TWEEN.now() + parseFloat(time) : time : TWEEN.now();
        this._startTime += this._delayTime;
        for (var property in this._valuesEnd) {
            if (this._valuesEnd[property] instanceof Array) {
                if (this._valuesEnd[property].length === 0) {
                    continue;
                }
                this._valuesEnd[property] = [this._object[property]].concat(this._valuesEnd[property]);
            }
            if (this._object[property] === undefined) {
                continue;
            }
            if (typeof (this._valuesStart[property]) === 'undefined') {
                this._valuesStart[property] = this._object[property];
            }
            if ((this._valuesStart[property] instanceof Array) === false) {
                this._valuesStart[property] *= 1.0;
            }
            this._valuesStartRepeat[property] = this._valuesStart[property] || 0;
        }
        return this;
    },
    stop: function () {
        if (!this._isPlaying) {
            return this;
        }
        this._group.remove(this);
        this._isPlaying = false;
        this._isPaused = false;
        if (this._onStopCallback !== null) {
            this._onStopCallback(this._object);
        }
        this.stopChainedTweens();
        return this;
    },
    end: function () {
        this.update(Infinity);
        return this;
    },
    pause: function (time) {
        if (this._isPaused || !this._isPlaying) {
            return this;
        }
        this._isPaused = true;
        this._pauseStart = time === undefined ? TWEEN.now() : time;
        this._group.remove(this);
        return this;
    },
    resume: function (time) {
        if (!this._isPaused || !this._isPlaying) {
            return this;
        }
        this._isPaused = false;
        this._startTime += (time === undefined ? TWEEN.now() : time)
            - this._pauseStart;
        this._pauseStart = 0;
        this._group.add(this);
        return this;
    },
    stopChainedTweens: function () {
        for (var i = 0, numChainedTweens = this._chainedTweens.length; i < numChainedTweens; i++) {
            this._chainedTweens[i].stop();
        }
    },
    group: function (group) {
        this._group = group;
        return this;
    },
    delay: function (amount) {
        this._delayTime = amount;
        return this;
    },
    repeat: function (times) {
        this._repeat = times;
        return this;
    },
    repeatDelay: function (amount) {
        this._repeatDelayTime = amount;
        return this;
    },
    yoyo: function (yoyo) {
        this._yoyo = yoyo;
        return this;
    },
    easing: function (easingFunction) {
        this._easingFunction = easingFunction;
        return this;
    },
    interpolation: function (interpolationFunction) {
        this._interpolationFunction = interpolationFunction;
        return this;
    },
    chain: function () {
        this._chainedTweens = arguments;
        return this;
    },
    onStart: function (callback) {
        this._onStartCallback = callback;
        return this;
    },
    onUpdate: function (callback) {
        this._onUpdateCallback = callback;
        return this;
    },
    onRepeat: function onRepeat(callback) {
        this._onRepeatCallback = callback;
        return this;
    },
    onComplete: function (callback) {
        this._onCompleteCallback = callback;
        return this;
    },
    onStop: function (callback) {
        this._onStopCallback = callback;
        return this;
    },
    update: function (time) {
        var property;
        var elapsed;
        var value;
        if (time < this._startTime) {
            return true;
        }
        if (this._onStartCallbackFired === false) {
            if (this._onStartCallback !== null) {
                this._onStartCallback(this._object);
            }
            this._onStartCallbackFired = true;
        }
        elapsed = (time - this._startTime) / this._duration;
        elapsed = (this._duration === 0 || elapsed > 1) ? 1 : elapsed;
        value = this._easingFunction(elapsed);
        for (property in this._valuesEnd) {
            if (this._valuesStart[property] === undefined) {
                continue;
            }
            var start = this._valuesStart[property] || 0;
            var end = this._valuesEnd[property];
            if (end instanceof Array) {
                this._object[property] = this._interpolationFunction(end, value);
            }
            else {
                if (typeof (end) === 'string') {
                    if (end.charAt(0) === '+' || end.charAt(0) === '-') {
                        end = start + parseFloat(end);
                    }
                    else {
                        end = parseFloat(end);
                    }
                }
                if (typeof (end) === 'number') {
                    this._object[property] = start + (end - start) * value;
                }
            }
        }
        if (this._onUpdateCallback !== null) {
            this._onUpdateCallback(this._object, elapsed);
        }
        if (elapsed === 1) {
            if (this._repeat > 0) {
                if (isFinite(this._repeat)) {
                    this._repeat--;
                }
                for (property in this._valuesStartRepeat) {
                    if (typeof (this._valuesEnd[property]) === 'string') {
                        this._valuesStartRepeat[property] = this._valuesStartRepeat[property] + parseFloat(this._valuesEnd[property]);
                    }
                    if (this._yoyo) {
                        var tmp = this._valuesStartRepeat[property];
                        this._valuesStartRepeat[property] = this._valuesEnd[property];
                        this._valuesEnd[property] = tmp;
                    }
                    this._valuesStart[property] = this._valuesStartRepeat[property];
                }
                if (this._yoyo) {
                    this._reversed = !this._reversed;
                }
                if (this._repeatDelayTime !== undefined) {
                    this._startTime = time + this._repeatDelayTime;
                }
                else {
                    this._startTime = time + this._delayTime;
                }
                if (this._onRepeatCallback !== null) {
                    this._onRepeatCallback(this._object);
                }
                return true;
            }
            else {
                if (this._onCompleteCallback !== null) {
                    this._onCompleteCallback(this._object);
                }
                for (var i = 0, numChainedTweens = this._chainedTweens.length; i < numChainedTweens; i++) {
                    this._chainedTweens[i].start(this._startTime + this._duration);
                }
                return false;
            }
        }
        return true;
    }
};
TWEEN.Easing = {
    Linear: {
        None: function (k) {
            return k;
        }
    },
    Quadratic: {
        In: function (k) {
            return k * k;
        },
        Out: function (k) {
            return k * (2 - k);
        },
        InOut: function (k) {
            if ((k *= 2) < 1) {
                return 0.5 * k * k;
            }
            return -0.5 * (--k * (k - 2) - 1);
        }
    },
    Cubic: {
        In: function (k) {
            return k * k * k;
        },
        Out: function (k) {
            return --k * k * k + 1;
        },
        InOut: function (k) {
            if ((k *= 2) < 1) {
                return 0.5 * k * k * k;
            }
            return 0.5 * ((k -= 2) * k * k + 2);
        }
    },
    Quartic: {
        In: function (k) {
            return k * k * k * k;
        },
        Out: function (k) {
            return 1 - (--k * k * k * k);
        },
        InOut: function (k) {
            if ((k *= 2) < 1) {
                return 0.5 * k * k * k * k;
            }
            return -0.5 * ((k -= 2) * k * k * k - 2);
        }
    },
    Quintic: {
        In: function (k) {
            return k * k * k * k * k;
        },
        Out: function (k) {
            return --k * k * k * k * k + 1;
        },
        InOut: function (k) {
            if ((k *= 2) < 1) {
                return 0.5 * k * k * k * k * k;
            }
            return 0.5 * ((k -= 2) * k * k * k * k + 2);
        }
    },
    Sinusoidal: {
        In: function (k) {
            return 1 - Math.cos(k * Math.PI / 2);
        },
        Out: function (k) {
            return Math.sin(k * Math.PI / 2);
        },
        InOut: function (k) {
            return 0.5 * (1 - Math.cos(Math.PI * k));
        }
    },
    Exponential: {
        In: function (k) {
            return k === 0 ? 0 : Math.pow(1024, k - 1);
        },
        Out: function (k) {
            return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
        },
        InOut: function (k) {
            if (k === 0) {
                return 0;
            }
            if (k === 1) {
                return 1;
            }
            if ((k *= 2) < 1) {
                return 0.5 * Math.pow(1024, k - 1);
            }
            return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2);
        }
    },
    Circular: {
        In: function (k) {
            return 1 - Math.sqrt(1 - k * k);
        },
        Out: function (k) {
            return Math.sqrt(1 - (--k * k));
        },
        InOut: function (k) {
            if ((k *= 2) < 1) {
                return -0.5 * (Math.sqrt(1 - k * k) - 1);
            }
            return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
        }
    },
    Elastic: {
        In: function (k) {
            if (k === 0) {
                return 0;
            }
            if (k === 1) {
                return 1;
            }
            return -Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
        },
        Out: function (k) {
            if (k === 0) {
                return 0;
            }
            if (k === 1) {
                return 1;
            }
            return Math.pow(2, -10 * k) * Math.sin((k - 0.1) * 5 * Math.PI) + 1;
        },
        InOut: function (k) {
            if (k === 0) {
                return 0;
            }
            if (k === 1) {
                return 1;
            }
            k *= 2;
            if (k < 1) {
                return -0.5 * Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
            }
            return 0.5 * Math.pow(2, -10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI) + 1;
        }
    },
    Back: {
        In: function (k) {
            var s = 1.70158;
            return k * k * ((s + 1) * k - s);
        },
        Out: function (k) {
            var s = 1.70158;
            return --k * k * ((s + 1) * k + s) + 1;
        },
        InOut: function (k) {
            var s = 1.70158 * 1.525;
            if ((k *= 2) < 1) {
                return 0.5 * (k * k * ((s + 1) * k - s));
            }
            return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
        }
    },
    Bounce: {
        In: function (k) {
            return 1 - TWEEN.Easing.Bounce.Out(1 - k);
        },
        Out: function (k) {
            if (k < (1 / 2.75)) {
                return 7.5625 * k * k;
            }
            else if (k < (2 / 2.75)) {
                return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
            }
            else if (k < (2.5 / 2.75)) {
                return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
            }
            else {
                return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
            }
        },
        InOut: function (k) {
            if (k < 0.5) {
                return TWEEN.Easing.Bounce.In(k * 2) * 0.5;
            }
            return TWEEN.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;
        }
    }
};
TWEEN.Interpolation = {
    Linear: function (v, k) {
        var m = v.length - 1;
        var f = m * k;
        var i = Math.floor(f);
        var fn = TWEEN.Interpolation.Utils.Linear;
        if (k < 0) {
            return fn(v[0], v[1], f);
        }
        if (k > 1) {
            return fn(v[m], v[m - 1], m - f);
        }
        return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);
    },
    Bezier: function (v, k) {
        var b = 0;
        var n = v.length - 1;
        var pw = Math.pow;
        var bn = TWEEN.Interpolation.Utils.Bernstein;
        for (var i = 0; i <= n; i++) {
            b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
        }
        return b;
    },
    CatmullRom: function (v, k) {
        var m = v.length - 1;
        var f = m * k;
        var i = Math.floor(f);
        var fn = TWEEN.Interpolation.Utils.CatmullRom;
        if (v[0] === v[m]) {
            if (k < 0) {
                i = Math.floor(f = m * (1 + k));
            }
            return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);
        }
        else {
            if (k < 0) {
                return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
            }
            if (k > 1) {
                return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
            }
            return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);
        }
    },
    Utils: {
        Linear: function (p0, p1, t) {
            return (p1 - p0) * t + p0;
        },
        Bernstein: function (n, i) {
            var fc = TWEEN.Interpolation.Utils.Factorial;
            return fc(n) / fc(i) / fc(n - i);
        },
        Factorial: (function () {
            var a = [1];
            return function (n) {
                var s = 1;
                if (a[n]) {
                    return a[n];
                }
                for (var i = n; i > 1; i--) {
                    s *= i;
                }
                a[n] = s;
                return s;
            };
        })(),
        CatmullRom: function (p0, p1, p2, p3, t) {
            var v0 = (p2 - p0) * 0.5;
            var v1 = (p3 - p1) * 0.5;
            var t2 = t * t;
            var t3 = t * t2;
            return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
        }
    }
};
(function (root) {
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return TWEEN;
        });
    }
    else if (typeof module !== 'undefined' && typeof exports === 'object') {
        module.exports = TWEEN;
    }
    else if (root !== undefined) {
        root.TWEEN = TWEEN;
    }
})(this);
var PIXI = (function (exports) {
    'use strict';
    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};
    function commonjsRequire() {
        throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
    }
    function unwrapExports(x) {
        return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }
    function createCommonjsModule(fn, module) {
        return module = { exports: {} }, fn(module, module.exports), module.exports;
    }
    function getCjsExportFromNamespace(n) {
        return n && n['default'] || n;
    }
    var promise = createCommonjsModule(function (module, exports) {
        (function (global) {
            var NativePromise = global['Promise'];
            var nativePromiseSupported = NativePromise &&
                'resolve' in NativePromise &&
                'reject' in NativePromise &&
                'all' in NativePromise &&
                'race' in NativePromise &&
                (function () {
                    var resolve;
                    new NativePromise(function (r) { resolve = r; });
                    return typeof resolve === 'function';
                })();
            if ('object' !== 'undefined' && exports) {
                exports.Promise = nativePromiseSupported ? NativePromise : Promise;
                exports.Polyfill = Promise;
            }
            else {
                if (typeof undefined == 'function' && undefined.amd) {
                    undefined(function () {
                        return nativePromiseSupported ? NativePromise : Promise;
                    });
                }
                else {
                    if (!nativePromiseSupported) {
                        global['Promise'] = Promise;
                    }
                }
            }
            var PENDING = 'pending';
            var SEALED = 'sealed';
            var FULFILLED = 'fulfilled';
            var REJECTED = 'rejected';
            var NOOP = function () { };
            function isArray(value) {
                return Object.prototype.toString.call(value) === '[object Array]';
            }
            var asyncSetTimer = typeof setImmediate !== 'undefined' ? setImmediate : setTimeout;
            var asyncQueue = [];
            var asyncTimer;
            function asyncFlush() {
                for (var i = 0; i < asyncQueue.length; i++) {
                    asyncQueue[i][0](asyncQueue[i][1]);
                }
                asyncQueue = [];
                asyncTimer = false;
            }
            function asyncCall(callback, arg) {
                asyncQueue.push([callback, arg]);
                if (!asyncTimer) {
                    asyncTimer = true;
                    asyncSetTimer(asyncFlush, 0);
                }
            }
            function invokeResolver(resolver, promise) {
                function resolvePromise(value) {
                    resolve(promise, value);
                }
                function rejectPromise(reason) {
                    reject(promise, reason);
                }
                try {
                    resolver(resolvePromise, rejectPromise);
                }
                catch (e) {
                    rejectPromise(e);
                }
            }
            function invokeCallback(subscriber) {
                var owner = subscriber.owner;
                var settled = owner.state_;
                var value = owner.data_;
                var callback = subscriber[settled];
                var promise = subscriber.then;
                if (typeof callback === 'function') {
                    settled = FULFILLED;
                    try {
                        value = callback(value);
                    }
                    catch (e) {
                        reject(promise, e);
                    }
                }
                if (!handleThenable(promise, value)) {
                    if (settled === FULFILLED) {
                        resolve(promise, value);
                    }
                    if (settled === REJECTED) {
                        reject(promise, value);
                    }
                }
            }
            function handleThenable(promise, value) {
                var resolved;
                try {
                    if (promise === value) {
                        throw new TypeError('A promises callback cannot return that same promise.');
                    }
                    if (value && (typeof value === 'function' || typeof value === 'object')) {
                        var then = value.then;
                        if (typeof then === 'function') {
                            then.call(value, function (val) {
                                if (!resolved) {
                                    resolved = true;
                                    if (value !== val) {
                                        resolve(promise, val);
                                    }
                                    else {
                                        fulfill(promise, val);
                                    }
                                }
                            }, function (reason) {
                                if (!resolved) {
                                    resolved = true;
                                    reject(promise, reason);
                                }
                            });
                            return true;
                        }
                    }
                }
                catch (e) {
                    if (!resolved) {
                        reject(promise, e);
                    }
                    return true;
                }
                return false;
            }
            function resolve(promise, value) {
                if (promise === value || !handleThenable(promise, value)) {
                    fulfill(promise, value);
                }
            }
            function fulfill(promise, value) {
                if (promise.state_ === PENDING) {
                    promise.state_ = SEALED;
                    promise.data_ = value;
                    asyncCall(publishFulfillment, promise);
                }
            }
            function reject(promise, reason) {
                if (promise.state_ === PENDING) {
                    promise.state_ = SEALED;
                    promise.data_ = reason;
                    asyncCall(publishRejection, promise);
                }
            }
            function publish(promise) {
                var callbacks = promise.then_;
                promise.then_ = undefined;
                for (var i = 0; i < callbacks.length; i++) {
                    invokeCallback(callbacks[i]);
                }
            }
            function publishFulfillment(promise) {
                promise.state_ = FULFILLED;
                publish(promise);
            }
            function publishRejection(promise) {
                promise.state_ = REJECTED;
                publish(promise);
            }
            function Promise(resolver) {
                if (typeof resolver !== 'function') {
                    throw new TypeError('Promise constructor takes a function argument');
                }
                if (this instanceof Promise === false) {
                    throw new TypeError('Failed to construct \'Promise\': Please use the \'new\' operator, this object constructor cannot be called as a function.');
                }
                this.then_ = [];
                invokeResolver(resolver, this);
            }
            Promise.prototype = {
                constructor: Promise,
                state_: PENDING,
                then_: null,
                data_: undefined,
                then: function (onFulfillment, onRejection) {
                    var subscriber = {
                        owner: this,
                        then: new this.constructor(NOOP),
                        fulfilled: onFulfillment,
                        rejected: onRejection
                    };
                    if (this.state_ === FULFILLED || this.state_ === REJECTED) {
                        asyncCall(invokeCallback, subscriber);
                    }
                    else {
                        this.then_.push(subscriber);
                    }
                    return subscriber.then;
                },
                'catch': function (onRejection) {
                    return this.then(null, onRejection);
                }
            };
            Promise.all = function (promises) {
                var Class = this;
                if (!isArray(promises)) {
                    throw new TypeError('You must pass an array to Promise.all().');
                }
                return new Class(function (resolve, reject) {
                    var results = [];
                    var remaining = 0;
                    function resolver(index) {
                        remaining++;
                        return function (value) {
                            results[index] = value;
                            if (!--remaining) {
                                resolve(results);
                            }
                        };
                    }
                    for (var i = 0, promise; i < promises.length; i++) {
                        promise = promises[i];
                        if (promise && typeof promise.then === 'function') {
                            promise.then(resolver(i), reject);
                        }
                        else {
                            results[i] = promise;
                        }
                    }
                    if (!remaining) {
                        resolve(results);
                    }
                });
            };
            Promise.race = function (promises) {
                var Class = this;
                if (!isArray(promises)) {
                    throw new TypeError('You must pass an array to Promise.race().');
                }
                return new Class(function (resolve, reject) {
                    for (var i = 0, promise; i < promises.length; i++) {
                        promise = promises[i];
                        if (promise && typeof promise.then === 'function') {
                            promise.then(resolve, reject);
                        }
                        else {
                            resolve(promise);
                        }
                    }
                });
            };
            Promise.resolve = function (value) {
                var Class = this;
                if (value && typeof value === 'object' && value.constructor === Class) {
                    return value;
                }
                return new Class(function (resolve) {
                    resolve(value);
                });
            };
            Promise.reject = function (reason) {
                var Class = this;
                return new Class(function (resolve, reject) {
                    reject(reason);
                });
            };
        })(typeof window != 'undefined' ? window : typeof commonjsGlobal != 'undefined' ? commonjsGlobal : typeof self != 'undefined' ? self : commonjsGlobal);
    });
    var promise_1 = promise.Promise;
    var promise_2 = promise.Polyfill;
    'use strict';
    var getOwnPropertySymbols = Object.getOwnPropertySymbols;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var propIsEnumerable = Object.prototype.propertyIsEnumerable;
    function toObject(val) {
        if (val === null || val === undefined) {
            throw new TypeError('Object.assign cannot be called with null or undefined');
        }
        return Object(val);
    }
    function shouldUseNative() {
        try {
            if (!Object.assign) {
                return false;
            }
            var test1 = new String('abc');
            test1[5] = 'de';
            if (Object.getOwnPropertyNames(test1)[0] === '5') {
                return false;
            }
            var test2 = {};
            for (var i = 0; i < 10; i++) {
                test2['_' + String.fromCharCode(i)] = i;
            }
            var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
                return test2[n];
            });
            if (order2.join('') !== '0123456789') {
                return false;
            }
            var test3 = {};
            'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
                test3[letter] = letter;
            });
            if (Object.keys(Object.assign({}, test3)).join('') !==
                'abcdefghijklmnopqrst') {
                return false;
            }
            return true;
        }
        catch (err) {
            return false;
        }
    }
    var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
        var arguments$1 = arguments;
        var from;
        var to = toObject(target);
        var symbols;
        for (var s = 1; s < arguments.length; s++) {
            from = Object(arguments$1[s]);
            for (var key in from) {
                if (hasOwnProperty.call(from, key)) {
                    to[key] = from[key];
                }
            }
            if (getOwnPropertySymbols) {
                symbols = getOwnPropertySymbols(from);
                for (var i = 0; i < symbols.length; i++) {
                    if (propIsEnumerable.call(from, symbols[i])) {
                        to[symbols[i]] = from[symbols[i]];
                    }
                }
            }
        }
        return to;
    };
    if (!window.Promise) {
        window.Promise = promise_2;
    }
    if (!Object.assign) {
        Object.assign = objectAssign;
    }
    var commonjsGlobal$1 = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};
    var ONE_FRAME_TIME = 16;
    if (!(Date.now && Date.prototype.getTime)) {
        Date.now = function now() {
            return new Date().getTime();
        };
    }
    if (!(commonjsGlobal$1.performance && commonjsGlobal$1.performance.now)) {
        var startTime = Date.now();
        if (!commonjsGlobal$1.performance) {
            commonjsGlobal$1.performance = {};
        }
        commonjsGlobal$1.performance.now = function () { return Date.now() - startTime; };
    }
    var lastTime = Date.now();
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !commonjsGlobal$1.requestAnimationFrame; ++x) {
        var p = vendors[x];
        commonjsGlobal$1.requestAnimationFrame = commonjsGlobal$1[(p + "RequestAnimationFrame")];
        commonjsGlobal$1.cancelAnimationFrame = commonjsGlobal$1[(p + "CancelAnimationFrame")] || commonjsGlobal$1[(p + "CancelRequestAnimationFrame")];
    }
    if (!commonjsGlobal$1.requestAnimationFrame) {
        commonjsGlobal$1.requestAnimationFrame = function (callback) {
            if (typeof callback !== 'function') {
                throw new TypeError((callback + "is not a function"));
            }
            var currentTime = Date.now();
            var delay = ONE_FRAME_TIME + lastTime - currentTime;
            if (delay < 0) {
                delay = 0;
            }
            lastTime = currentTime;
            return setTimeout(function () {
                lastTime = Date.now();
                callback(performance.now());
            }, delay);
        };
    }
    if (!commonjsGlobal$1.cancelAnimationFrame) {
        commonjsGlobal$1.cancelAnimationFrame = function (id) { return clearTimeout(id); };
    }
    if (!Math.sign) {
        Math.sign = function mathSign(x) {
            x = Number(x);
            if (x === 0 || isNaN(x)) {
                return x;
            }
            return x > 0 ? 1 : -1;
        };
    }
    if (!Number.isInteger) {
        Number.isInteger = function numberIsInteger(value) {
            return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
        };
    }
    if (!window.ArrayBuffer) {
        window.ArrayBuffer = Array;
    }
    if (!window.Float32Array) {
        window.Float32Array = Array;
    }
    if (!window.Uint32Array) {
        window.Uint32Array = Array;
    }
    if (!window.Uint16Array) {
        window.Uint16Array = Array;
    }
    if (!window.Uint8Array) {
        window.Uint8Array = Array;
    }
    if (!window.Int32Array) {
        window.Int32Array = Array;
    }
    var appleIphone = /iPhone/i;
    var appleIpod = /iPod/i;
    var appleTablet = /iPad/i;
    var androidPhone = /\bAndroid(?:.+)Mobile\b/i;
    var androidTablet = /Android/i;
    var amazonPhone = /(?:SD4930UR|\bSilk(?:.+)Mobile\b)/i;
    var amazonTablet = /Silk/i;
    var windowsPhone = /Windows Phone/i;
    var windowsTablet = /\bWindows(?:.+)ARM\b/i;
    var otherBlackBerry = /BlackBerry/i;
    var otherBlackBerry10 = /BB10/i;
    var otherOpera = /Opera Mini/i;
    var otherChrome = /\b(CriOS|Chrome)(?:.+)Mobile/i;
    var otherFirefox = /Mobile(?:.+)Firefox\b/i;
    function match(regex, userAgent) {
        return regex.test(userAgent);
    }
    function isMobile(userAgent) {
        userAgent =
            userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
        var tmp = userAgent.split('[FBAN');
        if (typeof tmp[1] !== 'undefined') {
            userAgent = tmp[0];
        }
        tmp = userAgent.split('Twitter');
        if (typeof tmp[1] !== 'undefined') {
            userAgent = tmp[0];
        }
        var result = {
            apple: {
                phone: match(appleIphone, userAgent) && !match(windowsPhone, userAgent),
                ipod: match(appleIpod, userAgent),
                tablet: !match(appleIphone, userAgent) &&
                    match(appleTablet, userAgent) &&
                    !match(windowsPhone, userAgent),
                device: (match(appleIphone, userAgent) ||
                    match(appleIpod, userAgent) ||
                    match(appleTablet, userAgent)) &&
                    !match(windowsPhone, userAgent),
            },
            amazon: {
                phone: match(amazonPhone, userAgent),
                tablet: !match(amazonPhone, userAgent) && match(amazonTablet, userAgent),
                device: match(amazonPhone, userAgent) || match(amazonTablet, userAgent),
            },
            android: {
                phone: (!match(windowsPhone, userAgent) && match(amazonPhone, userAgent)) ||
                    (!match(windowsPhone, userAgent) && match(androidPhone, userAgent)),
                tablet: !match(windowsPhone, userAgent) &&
                    !match(amazonPhone, userAgent) &&
                    !match(androidPhone, userAgent) &&
                    (match(amazonTablet, userAgent) || match(androidTablet, userAgent)),
                device: (!match(windowsPhone, userAgent) &&
                    (match(amazonPhone, userAgent) ||
                        match(amazonTablet, userAgent) ||
                        match(androidPhone, userAgent) ||
                        match(androidTablet, userAgent))) ||
                    match(/\bokhttp\b/i, userAgent),
            },
            windows: {
                phone: match(windowsPhone, userAgent),
                tablet: match(windowsTablet, userAgent),
                device: match(windowsPhone, userAgent) || match(windowsTablet, userAgent),
            },
            other: {
                blackberry: match(otherBlackBerry, userAgent),
                blackberry10: match(otherBlackBerry10, userAgent),
                opera: match(otherOpera, userAgent),
                firefox: match(otherFirefox, userAgent),
                chrome: match(otherChrome, userAgent),
                device: match(otherBlackBerry, userAgent) ||
                    match(otherBlackBerry10, userAgent) ||
                    match(otherOpera, userAgent) ||
                    match(otherFirefox, userAgent) ||
                    match(otherChrome, userAgent),
            },
            any: false,
            phone: false,
            tablet: false,
        };
        result.any =
            result.apple.device ||
                result.android.device ||
                result.windows.device ||
                result.other.device;
        result.phone =
            result.apple.phone || result.android.phone || result.windows.phone;
        result.tablet =
            result.apple.tablet || result.android.tablet || result.windows.tablet;
        return result;
    }
    var isMobile$1 = isMobile();
    function maxRecommendedTextures(max) {
        var allowMax = true;
        if (isMobile$1.tablet || isMobile$1.phone) {
            allowMax = false;
            if (isMobile$1.apple.device) {
                var match = (navigator.userAgent).match(/OS (\d+)_(\d+)?/);
                if (match) {
                    var majorVersion = parseInt(match[1], 10);
                    if (majorVersion >= 11) {
                        allowMax = true;
                    }
                }
            }
            if (isMobile$1.android.device) {
                var match$1 = (navigator.userAgent).match(/Android\s([0-9.]*)/);
                if (match$1) {
                    var majorVersion$1 = parseInt(match$1[1], 10);
                    if (majorVersion$1 >= 7) {
                        allowMax = true;
                    }
                }
            }
        }
        return allowMax ? max : 4;
    }
    function canUploadSameBuffer() {
        return !isMobile$1.apple.device;
    }
    var settings = {
        MIPMAP_TEXTURES: 1,
        ANISOTROPIC_LEVEL: 0,
        RESOLUTION: 1,
        FILTER_RESOLUTION: 1,
        SPRITE_MAX_TEXTURES: maxRecommendedTextures(32),
        SPRITE_BATCH_SIZE: 4096,
        RENDER_OPTIONS: {
            view: null,
            antialias: false,
            forceFXAA: false,
            autoDensity: false,
            transparent: false,
            backgroundColor: 0x000000,
            clearBeforeRender: true,
            preserveDrawingBuffer: false,
            width: 800,
            height: 600,
            legacy: false,
        },
        GC_MODE: 0,
        GC_MAX_IDLE: 60 * 60,
        GC_MAX_CHECK_COUNT: 60 * 10,
        WRAP_MODE: 33071,
        SCALE_MODE: 1,
        PRECISION_VERTEX: 'highp',
        PRECISION_FRAGMENT: isMobile$1.apple.device ? 'highp' : 'mediump',
        CAN_UPLOAD_SAME_BUFFER: canUploadSameBuffer(),
        CREATE_IMAGE_BITMAP: false,
        ROUND_PIXELS: false,
    };
    var eventemitter3 = createCommonjsModule(function (module) {
        'use strict';
        var has = Object.prototype.hasOwnProperty, prefix = '~';
        function Events() { }
        if (Object.create) {
            Events.prototype = Object.create(null);
            if (!new Events().__proto__) {
                prefix = false;
            }
        }
        function EE(fn, context, once) {
            this.fn = fn;
            this.context = context;
            this.once = once || false;
        }
        function addListener(emitter, event, fn, context, once) {
            if (typeof fn !== 'function') {
                throw new TypeError('The listener must be a function');
            }
            var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
            if (!emitter._events[evt]) {
                emitter._events[evt] = listener, emitter._eventsCount++;
            }
            else if (!emitter._events[evt].fn) {
                emitter._events[evt].push(listener);
            }
            else {
                emitter._events[evt] = [emitter._events[evt], listener];
            }
            return emitter;
        }
        function clearEvent(emitter, evt) {
            if (--emitter._eventsCount === 0) {
                emitter._events = new Events();
            }
            else {
                delete emitter._events[evt];
            }
        }
        function EventEmitter() {
            this._events = new Events();
            this._eventsCount = 0;
        }
        EventEmitter.prototype.eventNames = function eventNames() {
            var names = [], events, name;
            if (this._eventsCount === 0) {
                return names;
            }
            for (name in (events = this._events)) {
                if (has.call(events, name)) {
                    names.push(prefix ? name.slice(1) : name);
                }
            }
            if (Object.getOwnPropertySymbols) {
                return names.concat(Object.getOwnPropertySymbols(events));
            }
            return names;
        };
        EventEmitter.prototype.listeners = function listeners(event) {
            var evt = prefix ? prefix + event : event, handlers = this._events[evt];
            if (!handlers) {
                return [];
            }
            if (handlers.fn) {
                return [handlers.fn];
            }
            for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
                ee[i] = handlers[i].fn;
            }
            return ee;
        };
        EventEmitter.prototype.listenerCount = function listenerCount(event) {
            var evt = prefix ? prefix + event : event, listeners = this._events[evt];
            if (!listeners) {
                return 0;
            }
            if (listeners.fn) {
                return 1;
            }
            return listeners.length;
        };
        EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
            var arguments$1 = arguments;
            var evt = prefix ? prefix + event : event;
            if (!this._events[evt]) {
                return false;
            }
            var listeners = this._events[evt], len = arguments.length, args, i;
            if (listeners.fn) {
                if (listeners.once) {
                    this.removeListener(event, listeners.fn, undefined, true);
                }
                switch (len) {
                    case 1: return listeners.fn.call(listeners.context), true;
                    case 2: return listeners.fn.call(listeners.context, a1), true;
                    case 3: return listeners.fn.call(listeners.context, a1, a2), true;
                    case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
                    case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
                    case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
                }
                for (i = 1, args = new Array(len - 1); i < len; i++) {
                    args[i - 1] = arguments$1[i];
                }
                listeners.fn.apply(listeners.context, args);
            }
            else {
                var length = listeners.length, j;
                for (i = 0; i < length; i++) {
                    if (listeners[i].once) {
                        this.removeListener(event, listeners[i].fn, undefined, true);
                    }
                    switch (len) {
                        case 1:
                            listeners[i].fn.call(listeners[i].context);
                            break;
                        case 2:
                            listeners[i].fn.call(listeners[i].context, a1);
                            break;
                        case 3:
                            listeners[i].fn.call(listeners[i].context, a1, a2);
                            break;
                        case 4:
                            listeners[i].fn.call(listeners[i].context, a1, a2, a3);
                            break;
                        default:
                            if (!args) {
                                for (j = 1, args = new Array(len - 1); j < len; j++) {
                                    args[j - 1] = arguments$1[j];
                                }
                            }
                            listeners[i].fn.apply(listeners[i].context, args);
                    }
                }
            }
            return true;
        };
        EventEmitter.prototype.on = function on(event, fn, context) {
            return addListener(this, event, fn, context, false);
        };
        EventEmitter.prototype.once = function once(event, fn, context) {
            return addListener(this, event, fn, context, true);
        };
        EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
            var evt = prefix ? prefix + event : event;
            if (!this._events[evt]) {
                return this;
            }
            if (!fn) {
                clearEvent(this, evt);
                return this;
            }
            var listeners = this._events[evt];
            if (listeners.fn) {
                if (listeners.fn === fn &&
                    (!once || listeners.once) &&
                    (!context || listeners.context === context)) {
                    clearEvent(this, evt);
                }
            }
            else {
                for (var i = 0, events = [], length = listeners.length; i < length; i++) {
                    if (listeners[i].fn !== fn ||
                        (once && !listeners[i].once) ||
                        (context && listeners[i].context !== context)) {
                        events.push(listeners[i]);
                    }
                }
                if (events.length) {
                    this._events[evt] = events.length === 1 ? events[0] : events;
                }
                else {
                    clearEvent(this, evt);
                }
            }
            return this;
        };
        EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
            var evt;
            if (event) {
                evt = prefix ? prefix + event : event;
                if (this._events[evt]) {
                    clearEvent(this, evt);
                }
            }
            else {
                this._events = new Events();
                this._eventsCount = 0;
            }
            return this;
        };
        EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
        EventEmitter.prototype.addListener = EventEmitter.prototype.on;
        EventEmitter.prefixed = prefix;
        EventEmitter.EventEmitter = EventEmitter;
        if ('undefined' !== 'object') {
            module.exports = EventEmitter;
        }
    });
    'use strict';
    var earcut_1 = earcut;
    var default_1 = earcut;
    function earcut(data, holeIndices, dim) {
        dim = dim || 2;
        var hasHoles = holeIndices && holeIndices.length, outerLen = hasHoles ? holeIndices[0] * dim : data.length, outerNode = linkedList(data, 0, outerLen, dim, true), triangles = [];
        if (!outerNode || outerNode.next === outerNode.prev) {
            return triangles;
        }
        var minX, minY, maxX, maxY, x, y, invSize;
        if (hasHoles) {
            outerNode = eliminateHoles(data, holeIndices, outerNode, dim);
        }
        if (data.length > 80 * dim) {
            minX = maxX = data[0];
            minY = maxY = data[1];
            for (var i = dim; i < outerLen; i += dim) {
                x = data[i];
                y = data[i + 1];
                if (x < minX) {
                    minX = x;
                }
                if (y < minY) {
                    minY = y;
                }
                if (x > maxX) {
                    maxX = x;
                }
                if (y > maxY) {
                    maxY = y;
                }
            }
            invSize = Math.max(maxX - minX, maxY - minY);
            invSize = invSize !== 0 ? 1 / invSize : 0;
        }
        earcutLinked(outerNode, triangles, dim, minX, minY, invSize);
        return triangles;
    }
    function linkedList(data, start, end, dim, clockwise) {
        var i, last;
        if (clockwise === (signedArea(data, start, end, dim) > 0)) {
            for (i = start; i < end; i += dim) {
                last = insertNode(i, data[i], data[i + 1], last);
            }
        }
        else {
            for (i = end - dim; i >= start; i -= dim) {
                last = insertNode(i, data[i], data[i + 1], last);
            }
        }
        if (last && equals(last, last.next)) {
            removeNode(last);
            last = last.next;
        }
        return last;
    }
    function filterPoints(start, end) {
        if (!start) {
            return start;
        }
        if (!end) {
            end = start;
        }
        var p = start, again;
        do {
            again = false;
            if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
                removeNode(p);
                p = end = p.prev;
                if (p === p.next) {
                    break;
                }
                again = true;
            }
            else {
                p = p.next;
            }
        } while (again || p !== end);
        return end;
    }
    function earcutLinked(ear, triangles, dim, minX, minY, invSize, pass) {
        if (!ear) {
            return;
        }
        if (!pass && invSize) {
            indexCurve(ear, minX, minY, invSize);
        }
        var stop = ear, prev, next;
        while (ear.prev !== ear.next) {
            prev = ear.prev;
            next = ear.next;
            if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {
                triangles.push(prev.i / dim);
                triangles.push(ear.i / dim);
                triangles.push(next.i / dim);
                removeNode(ear);
                ear = next.next;
                stop = next.next;
                continue;
            }
            ear = next;
            if (ear === stop) {
                if (!pass) {
                    earcutLinked(filterPoints(ear), triangles, dim, minX, minY, invSize, 1);
                }
                else if (pass === 1) {
                    ear = cureLocalIntersections(filterPoints(ear), triangles, dim);
                    earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);
                }
                else if (pass === 2) {
                    splitEarcut(ear, triangles, dim, minX, minY, invSize);
                }
                break;
            }
        }
    }
    function isEar(ear) {
        var a = ear.prev, b = ear, c = ear.next;
        if (area(a, b, c) >= 0) {
            return false;
        }
        var p = ear.next.next;
        while (p !== ear.prev) {
            if (pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                area(p.prev, p, p.next) >= 0) {
                return false;
            }
            p = p.next;
        }
        return true;
    }
    function isEarHashed(ear, minX, minY, invSize) {
        var a = ear.prev, b = ear, c = ear.next;
        if (area(a, b, c) >= 0) {
            return false;
        }
        var minTX = a.x < b.x ? (a.x < c.x ? a.x : c.x) : (b.x < c.x ? b.x : c.x), minTY = a.y < b.y ? (a.y < c.y ? a.y : c.y) : (b.y < c.y ? b.y : c.y), maxTX = a.x > b.x ? (a.x > c.x ? a.x : c.x) : (b.x > c.x ? b.x : c.x), maxTY = a.y > b.y ? (a.y > c.y ? a.y : c.y) : (b.y > c.y ? b.y : c.y);
        var minZ = zOrder(minTX, minTY, minX, minY, invSize), maxZ = zOrder(maxTX, maxTY, minX, minY, invSize);
        var p = ear.prevZ, n = ear.nextZ;
        while (p && p.z >= minZ && n && n.z <= maxZ) {
            if (p !== ear.prev && p !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                area(p.prev, p, p.next) >= 0) {
                return false;
            }
            p = p.prevZ;
            if (n !== ear.prev && n !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
                area(n.prev, n, n.next) >= 0) {
                return false;
            }
            n = n.nextZ;
        }
        while (p && p.z >= minZ) {
            if (p !== ear.prev && p !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                area(p.prev, p, p.next) >= 0) {
                return false;
            }
            p = p.prevZ;
        }
        while (n && n.z <= maxZ) {
            if (n !== ear.prev && n !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
                area(n.prev, n, n.next) >= 0) {
                return false;
            }
            n = n.nextZ;
        }
        return true;
    }
    function cureLocalIntersections(start, triangles, dim) {
        var p = start;
        do {
            var a = p.prev, b = p.next.next;
            if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {
                triangles.push(a.i / dim);
                triangles.push(p.i / dim);
                triangles.push(b.i / dim);
                removeNode(p);
                removeNode(p.next);
                p = start = b;
            }
            p = p.next;
        } while (p !== start);
        return filterPoints(p);
    }
    function splitEarcut(start, triangles, dim, minX, minY, invSize) {
        var a = start;
        do {
            var b = a.next.next;
            while (b !== a.prev) {
                if (a.i !== b.i && isValidDiagonal(a, b)) {
                    var c = splitPolygon(a, b);
                    a = filterPoints(a, a.next);
                    c = filterPoints(c, c.next);
                    earcutLinked(a, triangles, dim, minX, minY, invSize);
                    earcutLinked(c, triangles, dim, minX, minY, invSize);
                    return;
                }
                b = b.next;
            }
            a = a.next;
        } while (a !== start);
    }
    function eliminateHoles(data, holeIndices, outerNode, dim) {
        var queue = [], i, len, start, end, list;
        for (i = 0, len = holeIndices.length; i < len; i++) {
            start = holeIndices[i] * dim;
            end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
            list = linkedList(data, start, end, dim, false);
            if (list === list.next) {
                list.steiner = true;
            }
            queue.push(getLeftmost(list));
        }
        queue.sort(compareX);
        for (i = 0; i < queue.length; i++) {
            eliminateHole(queue[i], outerNode);
            outerNode = filterPoints(outerNode, outerNode.next);
        }
        return outerNode;
    }
    function compareX(a, b) {
        return a.x - b.x;
    }
    function eliminateHole(hole, outerNode) {
        outerNode = findHoleBridge(hole, outerNode);
        if (outerNode) {
            var b = splitPolygon(outerNode, hole);
            filterPoints(outerNode, outerNode.next);
            filterPoints(b, b.next);
        }
    }
    function findHoleBridge(hole, outerNode) {
        var p = outerNode, hx = hole.x, hy = hole.y, qx = -Infinity, m;
        do {
            if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
                var x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
                if (x <= hx && x > qx) {
                    qx = x;
                    if (x === hx) {
                        if (hy === p.y) {
                            return p;
                        }
                        if (hy === p.next.y) {
                            return p.next;
                        }
                    }
                    m = p.x < p.next.x ? p : p.next;
                }
            }
            p = p.next;
        } while (p !== outerNode);
        if (!m) {
            return null;
        }
        if (hx === qx) {
            return m;
        }
        var stop = m, mx = m.x, my = m.y, tanMin = Infinity, tan;
        p = m;
        do {
            if (hx >= p.x && p.x >= mx && hx !== p.x &&
                pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {
                tan = Math.abs(hy - p.y) / (hx - p.x);
                if (locallyInside(p, hole) &&
                    (tan < tanMin || (tan === tanMin && (p.x > m.x || (p.x === m.x && sectorContainsSector(m, p)))))) {
                    m = p;
                    tanMin = tan;
                }
            }
            p = p.next;
        } while (p !== stop);
        return m;
    }
    function sectorContainsSector(m, p) {
        return area(m.prev, m, p.prev) < 0 && area(p.next, m, m.next) < 0;
    }
    function indexCurve(start, minX, minY, invSize) {
        var p = start;
        do {
            if (p.z === null) {
                p.z = zOrder(p.x, p.y, minX, minY, invSize);
            }
            p.prevZ = p.prev;
            p.nextZ = p.next;
            p = p.next;
        } while (p !== start);
        p.prevZ.nextZ = null;
        p.prevZ = null;
        sortLinked(p);
    }
    function sortLinked(list) {
        var i, p, q, e, tail, numMerges, pSize, qSize, inSize = 1;
        do {
            p = list;
            list = null;
            tail = null;
            numMerges = 0;
            while (p) {
                numMerges++;
                q = p;
                pSize = 0;
                for (i = 0; i < inSize; i++) {
                    pSize++;
                    q = q.nextZ;
                    if (!q) {
                        break;
                    }
                }
                qSize = inSize;
                while (pSize > 0 || (qSize > 0 && q)) {
                    if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z)) {
                        e = p;
                        p = p.nextZ;
                        pSize--;
                    }
                    else {
                        e = q;
                        q = q.nextZ;
                        qSize--;
                    }
                    if (tail) {
                        tail.nextZ = e;
                    }
                    else {
                        list = e;
                    }
                    e.prevZ = tail;
                    tail = e;
                }
                p = q;
            }
            tail.nextZ = null;
            inSize *= 2;
        } while (numMerges > 1);
        return list;
    }
    function zOrder(x, y, minX, minY, invSize) {
        x = 32767 * (x - minX) * invSize;
        y = 32767 * (y - minY) * invSize;
        x = (x | (x << 8)) & 0x00FF00FF;
        x = (x | (x << 4)) & 0x0F0F0F0F;
        x = (x | (x << 2)) & 0x33333333;
        x = (x | (x << 1)) & 0x55555555;
        y = (y | (y << 8)) & 0x00FF00FF;
        y = (y | (y << 4)) & 0x0F0F0F0F;
        y = (y | (y << 2)) & 0x33333333;
        y = (y | (y << 1)) & 0x55555555;
        return x | (y << 1);
    }
    function getLeftmost(start) {
        var p = start, leftmost = start;
        do {
            if (p.x < leftmost.x || (p.x === leftmost.x && p.y < leftmost.y)) {
                leftmost = p;
            }
            p = p.next;
        } while (p !== start);
        return leftmost;
    }
    function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
        return (cx - px) * (ay - py) - (ax - px) * (cy - py) >= 0 &&
            (ax - px) * (by - py) - (bx - px) * (ay - py) >= 0 &&
            (bx - px) * (cy - py) - (cx - px) * (by - py) >= 0;
    }
    function isValidDiagonal(a, b) {
        return a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) &&
            (locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b) &&
                (area(a.prev, a, b.prev) || area(a, b.prev, b)) ||
                equals(a, b) && area(a.prev, a, a.next) > 0 && area(b.prev, b, b.next) > 0);
    }
    function area(p, q, r) {
        return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    }
    function equals(p1, p2) {
        return p1.x === p2.x && p1.y === p2.y;
    }
    function intersects(p1, q1, p2, q2) {
        var o1 = sign(area(p1, q1, p2));
        var o2 = sign(area(p1, q1, q2));
        var o3 = sign(area(p2, q2, p1));
        var o4 = sign(area(p2, q2, q1));
        if (o1 !== o2 && o3 !== o4) {
            return true;
        }
        if (o1 === 0 && onSegment(p1, p2, q1)) {
            return true;
        }
        if (o2 === 0 && onSegment(p1, q2, q1)) {
            return true;
        }
        if (o3 === 0 && onSegment(p2, p1, q2)) {
            return true;
        }
        if (o4 === 0 && onSegment(p2, q1, q2)) {
            return true;
        }
        return false;
    }
    function onSegment(p, q, r) {
        return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
    }
    function sign(num) {
        return num > 0 ? 1 : num < 0 ? -1 : 0;
    }
    function intersectsPolygon(a, b) {
        var p = a;
        do {
            if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i &&
                intersects(p, p.next, a, b)) {
                return true;
            }
            p = p.next;
        } while (p !== a);
        return false;
    }
    function locallyInside(a, b) {
        return area(a.prev, a, a.next) < 0 ?
            area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 :
            area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
    }
    function middleInside(a, b) {
        var p = a, inside = false, px = (a.x + b.x) / 2, py = (a.y + b.y) / 2;
        do {
            if (((p.y > py) !== (p.next.y > py)) && p.next.y !== p.y &&
                (px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x)) {
                inside = !inside;
            }
            p = p.next;
        } while (p !== a);
        return inside;
    }
    function splitPolygon(a, b) {
        var a2 = new Node(a.i, a.x, a.y), b2 = new Node(b.i, b.x, b.y), an = a.next, bp = b.prev;
        a.next = b;
        b.prev = a;
        a2.next = an;
        an.prev = a2;
        b2.next = a2;
        a2.prev = b2;
        bp.next = b2;
        b2.prev = bp;
        return b2;
    }
    function insertNode(i, x, y, last) {
        var p = new Node(i, x, y);
        if (!last) {
            p.prev = p;
            p.next = p;
        }
        else {
            p.next = last.next;
            p.prev = last;
            last.next.prev = p;
            last.next = p;
        }
        return p;
    }
    function removeNode(p) {
        p.next.prev = p.prev;
        p.prev.next = p.next;
        if (p.prevZ) {
            p.prevZ.nextZ = p.nextZ;
        }
        if (p.nextZ) {
            p.nextZ.prevZ = p.prevZ;
        }
    }
    function Node(i, x, y) {
        this.i = i;
        this.x = x;
        this.y = y;
        this.prev = null;
        this.next = null;
        this.z = null;
        this.prevZ = null;
        this.nextZ = null;
        this.steiner = false;
    }
    earcut.deviation = function (data, holeIndices, dim, triangles) {
        var hasHoles = holeIndices && holeIndices.length;
        var outerLen = hasHoles ? holeIndices[0] * dim : data.length;
        var polygonArea = Math.abs(signedArea(data, 0, outerLen, dim));
        if (hasHoles) {
            for (var i = 0, len = holeIndices.length; i < len; i++) {
                var start = holeIndices[i] * dim;
                var end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
                polygonArea -= Math.abs(signedArea(data, start, end, dim));
            }
        }
        var trianglesArea = 0;
        for (i = 0; i < triangles.length; i += 3) {
            var a = triangles[i] * dim;
            var b = triangles[i + 1] * dim;
            var c = triangles[i + 2] * dim;
            trianglesArea += Math.abs((data[a] - data[c]) * (data[b + 1] - data[a + 1]) -
                (data[a] - data[b]) * (data[c + 1] - data[a + 1]));
        }
        return polygonArea === 0 && trianglesArea === 0 ? 0 :
            Math.abs((trianglesArea - polygonArea) / polygonArea);
    };
    function signedArea(data, start, end, dim) {
        var sum = 0;
        for (var i = start, j = end - dim; i < end; i += dim) {
            sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
            j = i;
        }
        return sum;
    }
    earcut.flatten = function (data) {
        var dim = data[0][0].length, result = { vertices: [], holes: [], dimensions: dim }, holeIndex = 0;
        for (var i = 0; i < data.length; i++) {
            for (var j = 0; j < data[i].length; j++) {
                for (var d = 0; d < dim; d++) {
                    result.vertices.push(data[i][j][d]);
                }
            }
            if (i > 0) {
                holeIndex += data[i - 1].length;
                result.holes.push(holeIndex);
            }
        }
        return result;
    };
    earcut_1.default = default_1;
    var punycode = createCommonjsModule(function (module, exports) {
        ;
        (function (root) {
            var freeExports = 'object' == 'object' && exports &&
                !exports.nodeType && exports;
            var freeModule = 'object' == 'object' && module &&
                !module.nodeType && module;
            var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal;
            if (freeGlobal.global === freeGlobal ||
                freeGlobal.window === freeGlobal ||
                freeGlobal.self === freeGlobal) {
                root = freeGlobal;
            }
            var punycode, maxInt = 2147483647, base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700, initialBias = 72, initialN = 128, delimiter = '-', regexPunycode = /^xn--/, regexNonASCII = /[^\x20-\x7E]/, regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, errors = {
                'overflow': 'Overflow: input needs wider integers to process',
                'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
                'invalid-input': 'Invalid input'
            }, baseMinusTMin = base - tMin, floor = Math.floor, stringFromCharCode = String.fromCharCode, key;
            function error(type) {
                throw RangeError(errors[type]);
            }
            function map(array, fn) {
                var length = array.length;
                var result = [];
                while (length--) {
                    result[length] = fn(array[length]);
                }
                return result;
            }
            function mapDomain(string, fn) {
                var parts = string.split('@');
                var result = '';
                if (parts.length > 1) {
                    result = parts[0] + '@';
                    string = parts[1];
                }
                string = string.replace(regexSeparators, '\x2E');
                var labels = string.split('.');
                var encoded = map(labels, fn).join('.');
                return result + encoded;
            }
            function ucs2decode(string) {
                var output = [], counter = 0, length = string.length, value, extra;
                while (counter < length) {
                    value = string.charCodeAt(counter++);
                    if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
                        extra = string.charCodeAt(counter++);
                        if ((extra & 0xFC00) == 0xDC00) {
                            output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
                        }
                        else {
                            output.push(value);
                            counter--;
                        }
                    }
                    else {
                        output.push(value);
                    }
                }
                return output;
            }
            function ucs2encode(array) {
                return map(array, function (value) {
                    var output = '';
                    if (value > 0xFFFF) {
                        value -= 0x10000;
                        output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
                        value = 0xDC00 | value & 0x3FF;
                    }
                    output += stringFromCharCode(value);
                    return output;
                }).join('');
            }
            function basicToDigit(codePoint) {
                if (codePoint - 48 < 10) {
                    return codePoint - 22;
                }
                if (codePoint - 65 < 26) {
                    return codePoint - 65;
                }
                if (codePoint - 97 < 26) {
                    return codePoint - 97;
                }
                return base;
            }
            function digitToBasic(digit, flag) {
                return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
            }
            function adapt(delta, numPoints, firstTime) {
                var k = 0;
                delta = firstTime ? floor(delta / damp) : delta >> 1;
                delta += floor(delta / numPoints);
                for (; delta > baseMinusTMin * tMax >> 1; k += base) {
                    delta = floor(delta / baseMinusTMin);
                }
                return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
            }
            function decode(input) {
                var output = [], inputLength = input.length, out, i = 0, n = initialN, bias = initialBias, basic, j, index, oldi, w, k, digit, t, baseMinusT;
                basic = input.lastIndexOf(delimiter);
                if (basic < 0) {
                    basic = 0;
                }
                for (j = 0; j < basic; ++j) {
                    if (input.charCodeAt(j) >= 0x80) {
                        error('not-basic');
                    }
                    output.push(input.charCodeAt(j));
                }
                for (index = basic > 0 ? basic + 1 : 0; index < inputLength;) {
                    for (oldi = i, w = 1, k = base;; k += base) {
                        if (index >= inputLength) {
                            error('invalid-input');
                        }
                        digit = basicToDigit(input.charCodeAt(index++));
                        if (digit >= base || digit > floor((maxInt - i) / w)) {
                            error('overflow');
                        }
                        i += digit * w;
                        t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
                        if (digit < t) {
                            break;
                        }
                        baseMinusT = base - t;
                        if (w > floor(maxInt / baseMinusT)) {
                            error('overflow');
                        }
                        w *= baseMinusT;
                    }
                    out = output.length + 1;
                    bias = adapt(i - oldi, out, oldi == 0);
                    if (floor(i / out) > maxInt - n) {
                        error('overflow');
                    }
                    n += floor(i / out);
                    i %= out;
                    output.splice(i++, 0, n);
                }
                return ucs2encode(output);
            }
            function encode(input) {
                var n, delta, handledCPCount, basicLength, bias, j, m, q, k, t, currentValue, output = [], inputLength, handledCPCountPlusOne, baseMinusT, qMinusT;
                input = ucs2decode(input);
                inputLength = input.length;
                n = initialN;
                delta = 0;
                bias = initialBias;
                for (j = 0; j < inputLength; ++j) {
                    currentValue = input[j];
                    if (currentValue < 0x80) {
                        output.push(stringFromCharCode(currentValue));
                    }
                }
                handledCPCount = basicLength = output.length;
                if (basicLength) {
                    output.push(delimiter);
                }
                while (handledCPCount < inputLength) {
                    for (m = maxInt, j = 0; j < inputLength; ++j) {
                        currentValue = input[j];
                        if (currentValue >= n && currentValue < m) {
                            m = currentValue;
                        }
                    }
                    handledCPCountPlusOne = handledCPCount + 1;
                    if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
                        error('overflow');
                    }
                    delta += (m - n) * handledCPCountPlusOne;
                    n = m;
                    for (j = 0; j < inputLength; ++j) {
                        currentValue = input[j];
                        if (currentValue < n && ++delta > maxInt) {
                            error('overflow');
                        }
                        if (currentValue == n) {
                            for (q = delta, k = base;; k += base) {
                                t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
                                if (q < t) {
                                    break;
                                }
                                qMinusT = q - t;
                                baseMinusT = base - t;
                                output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
                                q = floor(qMinusT / baseMinusT);
                            }
                            output.push(stringFromCharCode(digitToBasic(q, 0)));
                            bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
                            delta = 0;
                            ++handledCPCount;
                        }
                    }
                    ++delta;
                    ++n;
                }
                return output.join('');
            }
            function toUnicode(input) {
                return mapDomain(input, function (string) {
                    return regexPunycode.test(string)
                        ? decode(string.slice(4).toLowerCase())
                        : string;
                });
            }
            function toASCII(input) {
                return mapDomain(input, function (string) {
                    return regexNonASCII.test(string)
                        ? 'xn--' + encode(string)
                        : string;
                });
            }
            punycode = {
                'version': '1.3.2',
                'ucs2': {
                    'decode': ucs2decode,
                    'encode': ucs2encode
                },
                'decode': decode,
                'encode': encode,
                'toASCII': toASCII,
                'toUnicode': toUnicode
            };
            if (typeof undefined == 'function' &&
                typeof undefined.amd == 'object' &&
                undefined.amd) {
                undefined('punycode', function () {
                    return punycode;
                });
            }
            else if (freeExports && freeModule) {
                if (module.exports == freeExports) {
                    freeModule.exports = punycode;
                }
                else {
                    for (key in punycode) {
                        punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
                    }
                }
            }
            else {
                root.punycode = punycode;
            }
        }(commonjsGlobal));
    });
    'use strict';
    var util = {
        isString: function (arg) {
            return typeof (arg) === 'string';
        },
        isObject: function (arg) {
            return typeof (arg) === 'object' && arg !== null;
        },
        isNull: function (arg) {
            return arg === null;
        },
        isNullOrUndefined: function (arg) {
            return arg == null;
        }
    };
    var util_1 = util.isString;
    var util_2 = util.isObject;
    var util_3 = util.isNull;
    var util_4 = util.isNullOrUndefined;
    'use strict';
    function hasOwnProperty$1(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    }
    var decode = function (qs, sep, eq, options) {
        sep = sep || '&';
        eq = eq || '=';
        var obj = {};
        if (typeof qs !== 'string' || qs.length === 0) {
            return obj;
        }
        var regexp = /\+/g;
        qs = qs.split(sep);
        var maxKeys = 1000;
        if (options && typeof options.maxKeys === 'number') {
            maxKeys = options.maxKeys;
        }
        var len = qs.length;
        if (maxKeys > 0 && len > maxKeys) {
            len = maxKeys;
        }
        for (var i = 0; i < len; ++i) {
            var x = qs[i].replace(regexp, '%20'), idx = x.indexOf(eq), kstr, vstr, k, v;
            if (idx >= 0) {
                kstr = x.substr(0, idx);
                vstr = x.substr(idx + 1);
            }
            else {
                kstr = x;
                vstr = '';
            }
            k = decodeURIComponent(kstr);
            v = decodeURIComponent(vstr);
            if (!hasOwnProperty$1(obj, k)) {
                obj[k] = v;
            }
            else if (Array.isArray(obj[k])) {
                obj[k].push(v);
            }
            else {
                obj[k] = [obj[k], v];
            }
        }
        return obj;
    };
    'use strict';
    var stringifyPrimitive = function (v) {
        switch (typeof v) {
            case 'string':
                return v;
            case 'boolean':
                return v ? 'true' : 'false';
            case 'number':
                return isFinite(v) ? v : '';
            default:
                return '';
        }
    };
    var encode = function (obj, sep, eq, name) {
        sep = sep || '&';
        eq = eq || '=';
        if (obj === null) {
            obj = undefined;
        }
        if (typeof obj === 'object') {
            return Object.keys(obj).map(function (k) {
                var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
                if (Array.isArray(obj[k])) {
                    return obj[k].map(function (v) {
                        return ks + encodeURIComponent(stringifyPrimitive(v));
                    }).join(sep);
                }
                else {
                    return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
                }
            }).join(sep);
        }
        if (!name) {
            return '';
        }
        return encodeURIComponent(stringifyPrimitive(name)) + eq +
            encodeURIComponent(stringifyPrimitive(obj));
    };
    var querystring = createCommonjsModule(function (module, exports) {
        'use strict';
        exports.decode = exports.parse = decode;
        exports.encode = exports.stringify = encode;
    });
    var querystring_1 = querystring.decode;
    var querystring_2 = querystring.parse;
    var querystring_3 = querystring.encode;
    var querystring_4 = querystring.stringify;
    'use strict';
    var parse = urlParse;
    var resolve = urlResolve;
    var resolveObject = urlResolveObject;
    var format = urlFormat;
    var Url_1 = Url;
    function Url() {
        this.protocol = null;
        this.slashes = null;
        this.auth = null;
        this.host = null;
        this.port = null;
        this.hostname = null;
        this.hash = null;
        this.search = null;
        this.query = null;
        this.pathname = null;
        this.path = null;
        this.href = null;
    }
    var protocolPattern = /^([a-z0-9.+-]+:)/i, portPattern = /:[0-9]*$/, simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/, delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'], unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims), autoEscape = ['\''].concat(unwise), nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape), hostEndingChars = ['/', '?', '#'], hostnameMaxLen = 255, hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/, hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/, unsafeProtocol = {
        'javascript': true,
        'javascript:': true
    }, hostlessProtocol = {
        'javascript': true,
        'javascript:': true
    }, slashedProtocol = {
        'http': true,
        'https': true,
        'ftp': true,
        'gopher': true,
        'file': true,
        'http:': true,
        'https:': true,
        'ftp:': true,
        'gopher:': true,
        'file:': true
    };
    function urlParse(url, parseQueryString, slashesDenoteHost) {
        if (url && util.isObject(url) && url instanceof Url) {
            return url;
        }
        var u = new Url;
        u.parse(url, parseQueryString, slashesDenoteHost);
        return u;
    }
    Url.prototype.parse = function (url, parseQueryString, slashesDenoteHost) {
        if (!util.isString(url)) {
            throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
        }
        var queryIndex = url.indexOf('?'), splitter = (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#', uSplit = url.split(splitter), slashRegex = /\\/g;
        uSplit[0] = uSplit[0].replace(slashRegex, '/');
        url = uSplit.join(splitter);
        var rest = url;
        rest = rest.trim();
        if (!slashesDenoteHost && url.split('#').length === 1) {
            var simplePath = simplePathPattern.exec(rest);
            if (simplePath) {
                this.path = rest;
                this.href = rest;
                this.pathname = simplePath[1];
                if (simplePath[2]) {
                    this.search = simplePath[2];
                    if (parseQueryString) {
                        this.query = querystring.parse(this.search.substr(1));
                    }
                    else {
                        this.query = this.search.substr(1);
                    }
                }
                else if (parseQueryString) {
                    this.search = '';
                    this.query = {};
                }
                return this;
            }
        }
        var proto = protocolPattern.exec(rest);
        if (proto) {
            proto = proto[0];
            var lowerProto = proto.toLowerCase();
            this.protocol = lowerProto;
            rest = rest.substr(proto.length);
        }
        if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
            var slashes = rest.substr(0, 2) === '//';
            if (slashes && !(proto && hostlessProtocol[proto])) {
                rest = rest.substr(2);
                this.slashes = true;
            }
        }
        if (!hostlessProtocol[proto] &&
            (slashes || (proto && !slashedProtocol[proto]))) {
            var hostEnd = -1;
            for (var i = 0; i < hostEndingChars.length; i++) {
                var hec = rest.indexOf(hostEndingChars[i]);
                if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
                    hostEnd = hec;
                }
            }
            var auth, atSign;
            if (hostEnd === -1) {
                atSign = rest.lastIndexOf('@');
            }
            else {
                atSign = rest.lastIndexOf('@', hostEnd);
            }
            if (atSign !== -1) {
                auth = rest.slice(0, atSign);
                rest = rest.slice(atSign + 1);
                this.auth = decodeURIComponent(auth);
            }
            hostEnd = -1;
            for (var i = 0; i < nonHostChars.length; i++) {
                var hec = rest.indexOf(nonHostChars[i]);
                if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
                    hostEnd = hec;
                }
            }
            if (hostEnd === -1) {
                hostEnd = rest.length;
            }
            this.host = rest.slice(0, hostEnd);
            rest = rest.slice(hostEnd);
            this.parseHost();
            this.hostname = this.hostname || '';
            var ipv6Hostname = this.hostname[0] === '[' &&
                this.hostname[this.hostname.length - 1] === ']';
            if (!ipv6Hostname) {
                var hostparts = this.hostname.split(/\./);
                for (var i = 0, l = hostparts.length; i < l; i++) {
                    var part = hostparts[i];
                    if (!part) {
                        continue;
                    }
                    if (!part.match(hostnamePartPattern)) {
                        var newpart = '';
                        for (var j = 0, k = part.length; j < k; j++) {
                            if (part.charCodeAt(j) > 127) {
                                newpart += 'x';
                            }
                            else {
                                newpart += part[j];
                            }
                        }
                        if (!newpart.match(hostnamePartPattern)) {
                            var validParts = hostparts.slice(0, i);
                            var notHost = hostparts.slice(i + 1);
                            var bit = part.match(hostnamePartStart);
                            if (bit) {
                                validParts.push(bit[1]);
                                notHost.unshift(bit[2]);
                            }
                            if (notHost.length) {
                                rest = '/' + notHost.join('.') + rest;
                            }
                            this.hostname = validParts.join('.');
                            break;
                        }
                    }
                }
            }
            if (this.hostname.length > hostnameMaxLen) {
                this.hostname = '';
            }
            else {
                this.hostname = this.hostname.toLowerCase();
            }
            if (!ipv6Hostname) {
                this.hostname = punycode.toASCII(this.hostname);
            }
            var p = this.port ? ':' + this.port : '';
            var h = this.hostname || '';
            this.host = h + p;
            this.href += this.host;
            if (ipv6Hostname) {
                this.hostname = this.hostname.substr(1, this.hostname.length - 2);
                if (rest[0] !== '/') {
                    rest = '/' + rest;
                }
            }
        }
        if (!unsafeProtocol[lowerProto]) {
            for (var i = 0, l = autoEscape.length; i < l; i++) {
                var ae = autoEscape[i];
                if (rest.indexOf(ae) === -1) {
                    continue;
                }
                var esc = encodeURIComponent(ae);
                if (esc === ae) {
                    esc = escape(ae);
                }
                rest = rest.split(ae).join(esc);
            }
        }
        var hash = rest.indexOf('#');
        if (hash !== -1) {
            this.hash = rest.substr(hash);
            rest = rest.slice(0, hash);
        }
        var qm = rest.indexOf('?');
        if (qm !== -1) {
            this.search = rest.substr(qm);
            this.query = rest.substr(qm + 1);
            if (parseQueryString) {
                this.query = querystring.parse(this.query);
            }
            rest = rest.slice(0, qm);
        }
        else if (parseQueryString) {
            this.search = '';
            this.query = {};
        }
        if (rest) {
            this.pathname = rest;
        }
        if (slashedProtocol[lowerProto] &&
            this.hostname && !this.pathname) {
            this.pathname = '/';
        }
        if (this.pathname || this.search) {
            var p = this.pathname || '';
            var s = this.search || '';
            this.path = p + s;
        }
        this.href = this.format();
        return this;
    };
    function urlFormat(obj) {
        if (util.isString(obj)) {
            obj = urlParse(obj);
        }
        if (!(obj instanceof Url)) {
            return Url.prototype.format.call(obj);
        }
        return obj.format();
    }
    Url.prototype.format = function () {
        var auth = this.auth || '';
        if (auth) {
            auth = encodeURIComponent(auth);
            auth = auth.replace(/%3A/i, ':');
            auth += '@';
        }
        var protocol = this.protocol || '', pathname = this.pathname || '', hash = this.hash || '', host = false, query = '';
        if (this.host) {
            host = auth + this.host;
        }
        else if (this.hostname) {
            host = auth + (this.hostname.indexOf(':') === -1 ?
                this.hostname :
                '[' + this.hostname + ']');
            if (this.port) {
                host += ':' + this.port;
            }
        }
        if (this.query &&
            util.isObject(this.query) &&
            Object.keys(this.query).length) {
            query = querystring.stringify(this.query);
        }
        var search = this.search || (query && ('?' + query)) || '';
        if (protocol && protocol.substr(-1) !== ':') {
            protocol += ':';
        }
        if (this.slashes ||
            (!protocol || slashedProtocol[protocol]) && host !== false) {
            host = '//' + (host || '');
            if (pathname && pathname.charAt(0) !== '/') {
                pathname = '/' + pathname;
            }
        }
        else if (!host) {
            host = '';
        }
        if (hash && hash.charAt(0) !== '#') {
            hash = '#' + hash;
        }
        if (search && search.charAt(0) !== '?') {
            search = '?' + search;
        }
        pathname = pathname.replace(/[?#]/g, function (match) {
            return encodeURIComponent(match);
        });
        search = search.replace('#', '%23');
        return protocol + host + pathname + search + hash;
    };
    function urlResolve(source, relative) {
        return urlParse(source, false, true).resolve(relative);
    }
    Url.prototype.resolve = function (relative) {
        return this.resolveObject(urlParse(relative, false, true)).format();
    };
    function urlResolveObject(source, relative) {
        if (!source) {
            return relative;
        }
        return urlParse(source, false, true).resolveObject(relative);
    }
    Url.prototype.resolveObject = function (relative) {
        if (util.isString(relative)) {
            var rel = new Url();
            rel.parse(relative, false, true);
            relative = rel;
        }
        var result = new Url();
        var tkeys = Object.keys(this);
        for (var tk = 0; tk < tkeys.length; tk++) {
            var tkey = tkeys[tk];
            result[tkey] = this[tkey];
        }
        result.hash = relative.hash;
        if (relative.href === '') {
            result.href = result.format();
            return result;
        }
        if (relative.slashes && !relative.protocol) {
            var rkeys = Object.keys(relative);
            for (var rk = 0; rk < rkeys.length; rk++) {
                var rkey = rkeys[rk];
                if (rkey !== 'protocol') {
                    result[rkey] = relative[rkey];
                }
            }
            if (slashedProtocol[result.protocol] &&
                result.hostname && !result.pathname) {
                result.path = result.pathname = '/';
            }
            result.href = result.format();
            return result;
        }
        if (relative.protocol && relative.protocol !== result.protocol) {
            if (!slashedProtocol[relative.protocol]) {
                var keys = Object.keys(relative);
                for (var v = 0; v < keys.length; v++) {
                    var k = keys[v];
                    result[k] = relative[k];
                }
                result.href = result.format();
                return result;
            }
            result.protocol = relative.protocol;
            if (!relative.host && !hostlessProtocol[relative.protocol]) {
                var relPath = (relative.pathname || '').split('/');
                while (relPath.length && !(relative.host = relPath.shift())) {
                    ;
                }
                if (!relative.host) {
                    relative.host = '';
                }
                if (!relative.hostname) {
                    relative.hostname = '';
                }
                if (relPath[0] !== '') {
                    relPath.unshift('');
                }
                if (relPath.length < 2) {
                    relPath.unshift('');
                }
                result.pathname = relPath.join('/');
            }
            else {
                result.pathname = relative.pathname;
            }
            result.search = relative.search;
            result.query = relative.query;
            result.host = relative.host || '';
            result.auth = relative.auth;
            result.hostname = relative.hostname || relative.host;
            result.port = relative.port;
            if (result.pathname || result.search) {
                var p = result.pathname || '';
                var s = result.search || '';
                result.path = p + s;
            }
            result.slashes = result.slashes || relative.slashes;
            result.href = result.format();
            return result;
        }
        var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'), isRelAbs = (relative.host ||
            relative.pathname && relative.pathname.charAt(0) === '/'), mustEndAbs = (isRelAbs || isSourceAbs ||
            (result.host && relative.pathname)), removeAllDots = mustEndAbs, srcPath = result.pathname && result.pathname.split('/') || [], relPath = relative.pathname && relative.pathname.split('/') || [], psychotic = result.protocol && !slashedProtocol[result.protocol];
        if (psychotic) {
            result.hostname = '';
            result.port = null;
            if (result.host) {
                if (srcPath[0] === '') {
                    srcPath[0] = result.host;
                }
                else {
                    srcPath.unshift(result.host);
                }
            }
            result.host = '';
            if (relative.protocol) {
                relative.hostname = null;
                relative.port = null;
                if (relative.host) {
                    if (relPath[0] === '') {
                        relPath[0] = relative.host;
                    }
                    else {
                        relPath.unshift(relative.host);
                    }
                }
                relative.host = null;
            }
            mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
        }
        if (isRelAbs) {
            result.host = (relative.host || relative.host === '') ?
                relative.host : result.host;
            result.hostname = (relative.hostname || relative.hostname === '') ?
                relative.hostname : result.hostname;
            result.search = relative.search;
            result.query = relative.query;
            srcPath = relPath;
        }
        else if (relPath.length) {
            if (!srcPath) {
                srcPath = [];
            }
            srcPath.pop();
            srcPath = srcPath.concat(relPath);
            result.search = relative.search;
            result.query = relative.query;
        }
        else if (!util.isNullOrUndefined(relative.search)) {
            if (psychotic) {
                result.hostname = result.host = srcPath.shift();
                var authInHost = result.host && result.host.indexOf('@') > 0 ?
                    result.host.split('@') : false;
                if (authInHost) {
                    result.auth = authInHost.shift();
                    result.host = result.hostname = authInHost.shift();
                }
            }
            result.search = relative.search;
            result.query = relative.query;
            if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
                result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
            }
            result.href = result.format();
            return result;
        }
        if (!srcPath.length) {
            result.pathname = null;
            if (result.search) {
                result.path = '/' + result.search;
            }
            else {
                result.path = null;
            }
            result.href = result.format();
            return result;
        }
        var last = srcPath.slice(-1)[0];
        var hasTrailingSlash = ((result.host || relative.host || srcPath.length > 1) &&
            (last === '.' || last === '..') || last === '');
        var up = 0;
        for (var i = srcPath.length; i >= 0; i--) {
            last = srcPath[i];
            if (last === '.') {
                srcPath.splice(i, 1);
            }
            else if (last === '..') {
                srcPath.splice(i, 1);
                up++;
            }
            else if (up) {
                srcPath.splice(i, 1);
                up--;
            }
        }
        if (!mustEndAbs && !removeAllDots) {
            for (; up--; up) {
                srcPath.unshift('..');
            }
        }
        if (mustEndAbs && srcPath[0] !== '' &&
            (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
            srcPath.unshift('');
        }
        if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
            srcPath.push('');
        }
        var isAbsolute = srcPath[0] === '' ||
            (srcPath[0] && srcPath[0].charAt(0) === '/');
        if (psychotic) {
            result.hostname = result.host = isAbsolute ? '' :
                srcPath.length ? srcPath.shift() : '';
            var authInHost = result.host && result.host.indexOf('@') > 0 ?
                result.host.split('@') : false;
            if (authInHost) {
                result.auth = authInHost.shift();
                result.host = result.hostname = authInHost.shift();
            }
        }
        mustEndAbs = mustEndAbs || (result.host && srcPath.length);
        if (mustEndAbs && !isAbsolute) {
            srcPath.unshift('');
        }
        if (!srcPath.length) {
            result.pathname = null;
            result.path = null;
        }
        else {
            result.pathname = srcPath.join('/');
        }
        if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
            result.path = (result.pathname ? result.pathname : '') +
                (result.search ? result.search : '');
        }
        result.auth = relative.auth || result.auth;
        result.slashes = result.slashes || relative.slashes;
        result.href = result.format();
        return result;
    };
    Url.prototype.parseHost = function () {
        var host = this.host;
        var port = portPattern.exec(host);
        if (port) {
            port = port[0];
            if (port !== ':') {
                this.port = port.substr(1);
            }
            host = host.substr(0, host.length - port.length);
        }
        if (host) {
            this.hostname = host;
        }
    };
    var url = {
        parse: parse,
        resolve: resolve,
        resolveObject: resolveObject,
        format: format,
        Url: Url_1
    };
    (function (ENV) {
        ENV[ENV["WEBGL_LEGACY"] = 0] = "WEBGL_LEGACY";
        ENV[ENV["WEBGL"] = 1] = "WEBGL";
        ENV[ENV["WEBGL2"] = 2] = "WEBGL2";
    })(exports.ENV || (exports.ENV = {}));
    (function (RENDERER_TYPE) {
        RENDERER_TYPE[RENDERER_TYPE["UNKNOWN"] = 0] = "UNKNOWN";
        RENDERER_TYPE[RENDERER_TYPE["WEBGL"] = 1] = "WEBGL";
        RENDERER_TYPE[RENDERER_TYPE["CANVAS"] = 2] = "CANVAS";
    })(exports.RENDERER_TYPE || (exports.RENDERER_TYPE = {}));
    (function (BLEND_MODES) {
        BLEND_MODES[BLEND_MODES["NORMAL"] = 0] = "NORMAL";
        BLEND_MODES[BLEND_MODES["ADD"] = 1] = "ADD";
        BLEND_MODES[BLEND_MODES["MULTIPLY"] = 2] = "MULTIPLY";
        BLEND_MODES[BLEND_MODES["SCREEN"] = 3] = "SCREEN";
        BLEND_MODES[BLEND_MODES["OVERLAY"] = 4] = "OVERLAY";
        BLEND_MODES[BLEND_MODES["DARKEN"] = 5] = "DARKEN";
        BLEND_MODES[BLEND_MODES["LIGHTEN"] = 6] = "LIGHTEN";
        BLEND_MODES[BLEND_MODES["COLOR_DODGE"] = 7] = "COLOR_DODGE";
        BLEND_MODES[BLEND_MODES["COLOR_BURN"] = 8] = "COLOR_BURN";
        BLEND_MODES[BLEND_MODES["HARD_LIGHT"] = 9] = "HARD_LIGHT";
        BLEND_MODES[BLEND_MODES["SOFT_LIGHT"] = 10] = "SOFT_LIGHT";
        BLEND_MODES[BLEND_MODES["DIFFERENCE"] = 11] = "DIFFERENCE";
        BLEND_MODES[BLEND_MODES["EXCLUSION"] = 12] = "EXCLUSION";
        BLEND_MODES[BLEND_MODES["HUE"] = 13] = "HUE";
        BLEND_MODES[BLEND_MODES["SATURATION"] = 14] = "SATURATION";
        BLEND_MODES[BLEND_MODES["COLOR"] = 15] = "COLOR";
        BLEND_MODES[BLEND_MODES["LUMINOSITY"] = 16] = "LUMINOSITY";
        BLEND_MODES[BLEND_MODES["NORMAL_NPM"] = 17] = "NORMAL_NPM";
        BLEND_MODES[BLEND_MODES["ADD_NPM"] = 18] = "ADD_NPM";
        BLEND_MODES[BLEND_MODES["SCREEN_NPM"] = 19] = "SCREEN_NPM";
        BLEND_MODES[BLEND_MODES["NONE"] = 20] = "NONE";
        BLEND_MODES[BLEND_MODES["SRC_OVER"] = 0] = "SRC_OVER";
        BLEND_MODES[BLEND_MODES["SRC_IN"] = 21] = "SRC_IN";
        BLEND_MODES[BLEND_MODES["SRC_OUT"] = 22] = "SRC_OUT";
        BLEND_MODES[BLEND_MODES["SRC_ATOP"] = 23] = "SRC_ATOP";
        BLEND_MODES[BLEND_MODES["DST_OVER"] = 24] = "DST_OVER";
        BLEND_MODES[BLEND_MODES["DST_IN"] = 25] = "DST_IN";
        BLEND_MODES[BLEND_MODES["DST_OUT"] = 26] = "DST_OUT";
        BLEND_MODES[BLEND_MODES["DST_ATOP"] = 27] = "DST_ATOP";
        BLEND_MODES[BLEND_MODES["ERASE"] = 26] = "ERASE";
        BLEND_MODES[BLEND_MODES["SUBTRACT"] = 28] = "SUBTRACT";
        BLEND_MODES[BLEND_MODES["XOR"] = 29] = "XOR";
    })(exports.BLEND_MODES || (exports.BLEND_MODES = {}));
    (function (DRAW_MODES) {
        DRAW_MODES[DRAW_MODES["POINTS"] = 0] = "POINTS";
        DRAW_MODES[DRAW_MODES["LINES"] = 1] = "LINES";
        DRAW_MODES[DRAW_MODES["LINE_LOOP"] = 2] = "LINE_LOOP";
        DRAW_MODES[DRAW_MODES["LINE_STRIP"] = 3] = "LINE_STRIP";
        DRAW_MODES[DRAW_MODES["TRIANGLES"] = 4] = "TRIANGLES";
        DRAW_MODES[DRAW_MODES["TRIANGLE_STRIP"] = 5] = "TRIANGLE_STRIP";
        DRAW_MODES[DRAW_MODES["TRIANGLE_FAN"] = 6] = "TRIANGLE_FAN";
    })(exports.DRAW_MODES || (exports.DRAW_MODES = {}));
    (function (FORMATS) {
        FORMATS[FORMATS["RGBA"] = 6408] = "RGBA";
        FORMATS[FORMATS["RGB"] = 6407] = "RGB";
        FORMATS[FORMATS["ALPHA"] = 6406] = "ALPHA";
        FORMATS[FORMATS["LUMINANCE"] = 6409] = "LUMINANCE";
        FORMATS[FORMATS["LUMINANCE_ALPHA"] = 6410] = "LUMINANCE_ALPHA";
        FORMATS[FORMATS["DEPTH_COMPONENT"] = 6402] = "DEPTH_COMPONENT";
        FORMATS[FORMATS["DEPTH_STENCIL"] = 34041] = "DEPTH_STENCIL";
    })(exports.FORMATS || (exports.FORMATS = {}));
    (function (TARGETS) {
        TARGETS[TARGETS["TEXTURE_2D"] = 3553] = "TEXTURE_2D";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP"] = 34067] = "TEXTURE_CUBE_MAP";
        TARGETS[TARGETS["TEXTURE_2D_ARRAY"] = 35866] = "TEXTURE_2D_ARRAY";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_X"] = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_X"] = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_Y"] = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_Y"] = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_Z"] = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_Z"] = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z";
    })(exports.TARGETS || (exports.TARGETS = {}));
    (function (TYPES) {
        TYPES[TYPES["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
        TYPES[TYPES["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
        TYPES[TYPES["UNSIGNED_SHORT_5_6_5"] = 33635] = "UNSIGNED_SHORT_5_6_5";
        TYPES[TYPES["UNSIGNED_SHORT_4_4_4_4"] = 32819] = "UNSIGNED_SHORT_4_4_4_4";
        TYPES[TYPES["UNSIGNED_SHORT_5_5_5_1"] = 32820] = "UNSIGNED_SHORT_5_5_5_1";
        TYPES[TYPES["FLOAT"] = 5126] = "FLOAT";
        TYPES[TYPES["HALF_FLOAT"] = 36193] = "HALF_FLOAT";
    })(exports.TYPES || (exports.TYPES = {}));
    (function (SCALE_MODES) {
        SCALE_MODES[SCALE_MODES["NEAREST"] = 0] = "NEAREST";
        SCALE_MODES[SCALE_MODES["LINEAR"] = 1] = "LINEAR";
    })(exports.SCALE_MODES || (exports.SCALE_MODES = {}));
    (function (WRAP_MODES) {
        WRAP_MODES[WRAP_MODES["CLAMP"] = 33071] = "CLAMP";
        WRAP_MODES[WRAP_MODES["REPEAT"] = 10497] = "REPEAT";
        WRAP_MODES[WRAP_MODES["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
    })(exports.WRAP_MODES || (exports.WRAP_MODES = {}));
    (function (MIPMAP_MODES) {
        MIPMAP_MODES[MIPMAP_MODES["OFF"] = 0] = "OFF";
        MIPMAP_MODES[MIPMAP_MODES["POW2"] = 1] = "POW2";
        MIPMAP_MODES[MIPMAP_MODES["ON"] = 2] = "ON";
    })(exports.MIPMAP_MODES || (exports.MIPMAP_MODES = {}));
    (function (ALPHA_MODES) {
        ALPHA_MODES[ALPHA_MODES["NPM"] = 0] = "NPM";
        ALPHA_MODES[ALPHA_MODES["UNPACK"] = 1] = "UNPACK";
        ALPHA_MODES[ALPHA_MODES["PMA"] = 2] = "PMA";
        ALPHA_MODES[ALPHA_MODES["NO_PREMULTIPLIED_ALPHA"] = 0] = "NO_PREMULTIPLIED_ALPHA";
        ALPHA_MODES[ALPHA_MODES["PREMULTIPLY_ON_UPLOAD"] = 1] = "PREMULTIPLY_ON_UPLOAD";
        ALPHA_MODES[ALPHA_MODES["PREMULTIPLY_ALPHA"] = 2] = "PREMULTIPLY_ALPHA";
    })(exports.ALPHA_MODES || (exports.ALPHA_MODES = {}));
    (function (GC_MODES) {
        GC_MODES[GC_MODES["AUTO"] = 0] = "AUTO";
        GC_MODES[GC_MODES["MANUAL"] = 1] = "MANUAL";
    })(exports.GC_MODES || (exports.GC_MODES = {}));
    (function (PRECISION) {
        PRECISION["LOW"] = "lowp";
        PRECISION["MEDIUM"] = "mediump";
        PRECISION["HIGH"] = "highp";
    })(exports.PRECISION || (exports.PRECISION = {}));
    (function (MASK_TYPES) {
        MASK_TYPES[MASK_TYPES["NONE"] = 0] = "NONE";
        MASK_TYPES[MASK_TYPES["SCISSOR"] = 1] = "SCISSOR";
        MASK_TYPES[MASK_TYPES["STENCIL"] = 2] = "STENCIL";
        MASK_TYPES[MASK_TYPES["SPRITE"] = 3] = "SPRITE";
    })(exports.MASK_TYPES || (exports.MASK_TYPES = {}));
    settings.RETINA_PREFIX = /@([0-9\.]+)x/;
    settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = true;
    var saidHello = false;
    var VERSION = '5.2.1';
    function skipHello() {
        saidHello = true;
    }
    function sayHello(type) {
        var _a;
        if (saidHello) {
            return;
        }
        if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
            var args = [
                "\n %c %c %c PixiJS " + VERSION + " - \u2730 " + type + " \u2730  %c  %c  http://www.pixijs.com/  %c %c \u2665%c\u2665%c\u2665 \n\n",
                'background: #ff66a5; padding:5px 0;',
                'background: #ff66a5; padding:5px 0;',
                'color: #ff66a5; background: #030307; padding:5px 0;',
                'background: #ff66a5; padding:5px 0;',
                'background: #ffc3dc; padding:5px 0;',
                'background: #ff66a5; padding:5px 0;',
                'color: #ff2424; background: #fff; padding:5px 0;',
                'color: #ff2424; background: #fff; padding:5px 0;',
                'color: #ff2424; background: #fff; padding:5px 0;'
            ];
            (_a = window.console).log.apply(_a, args);
        }
        else if (window.console) {
            window.console.log("PixiJS " + VERSION + " - " + type + " - http://www.pixijs.com/");
        }
        saidHello = true;
    }
    var supported;
    function isWebGLSupported() {
        if (typeof supported === 'undefined') {
            supported = (function supported() {
                var contextOptions = {
                    stencil: true,
                    failIfMajorPerformanceCaveat: settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT,
                };
                try {
                    if (!window.WebGLRenderingContext) {
                        return false;
                    }
                    var canvas = document.createElement('canvas');
                    var gl = (canvas.getContext('webgl', contextOptions)
                        || canvas.getContext('experimental-webgl', contextOptions));
                    var success = !!(gl && gl.getContextAttributes().stencil);
                    if (gl) {
                        var loseContext = gl.getExtension('WEBGL_lose_context');
                        if (loseContext) {
                            loseContext.loseContext();
                        }
                    }
                    gl = null;
                    return success;
                }
                catch (e) {
                    return false;
                }
            })();
        }
        return supported;
    }
    function hex2rgb(hex, out) {
        out = out || [];
        out[0] = ((hex >> 16) & 0xFF) / 255;
        out[1] = ((hex >> 8) & 0xFF) / 255;
        out[2] = (hex & 0xFF) / 255;
        return out;
    }
    function hex2string(hex) {
        var hexString = hex.toString(16);
        hexString = '000000'.substr(0, 6 - hexString.length) + hexString;
        return "#" + hexString;
    }
    function string2hex(string) {
        if (typeof string === 'string' && string[0] === '#') {
            string = string.substr(1);
        }
        return parseInt(string, 16);
    }
    function rgb2hex(rgb) {
        return (((rgb[0] * 255) << 16) + ((rgb[1] * 255) << 8) + (rgb[2] * 255 | 0));
    }
    function mapPremultipliedBlendModes() {
        var pm = [];
        var npm = [];
        for (var i = 0; i < 32; i++) {
            pm[i] = i;
            npm[i] = i;
        }
        pm[exports.BLEND_MODES.NORMAL_NPM] = exports.BLEND_MODES.NORMAL;
        pm[exports.BLEND_MODES.ADD_NPM] = exports.BLEND_MODES.ADD;
        pm[exports.BLEND_MODES.SCREEN_NPM] = exports.BLEND_MODES.SCREEN;
        npm[exports.BLEND_MODES.NORMAL] = exports.BLEND_MODES.NORMAL_NPM;
        npm[exports.BLEND_MODES.ADD] = exports.BLEND_MODES.ADD_NPM;
        npm[exports.BLEND_MODES.SCREEN] = exports.BLEND_MODES.SCREEN_NPM;
        var array = [];
        array.push(npm);
        array.push(pm);
        return array;
    }
    var premultiplyBlendMode = mapPremultipliedBlendModes();
    function correctBlendMode(blendMode, premultiplied) {
        return premultiplyBlendMode[premultiplied ? 1 : 0][blendMode];
    }
    function premultiplyRgba(rgb, alpha, out, premultiply) {
        out = out || new Float32Array(4);
        if (premultiply || premultiply === undefined) {
            out[0] = rgb[0] * alpha;
            out[1] = rgb[1] * alpha;
            out[2] = rgb[2] * alpha;
        }
        else {
            out[0] = rgb[0];
            out[1] = rgb[1];
            out[2] = rgb[2];
        }
        out[3] = alpha;
        return out;
    }
    function premultiplyTint(tint, alpha) {
        if (alpha === 1.0) {
            return (alpha * 255 << 24) + tint;
        }
        if (alpha === 0.0) {
            return 0;
        }
        var R = ((tint >> 16) & 0xFF);
        var G = ((tint >> 8) & 0xFF);
        var B = (tint & 0xFF);
        R = ((R * alpha) + 0.5) | 0;
        G = ((G * alpha) + 0.5) | 0;
        B = ((B * alpha) + 0.5) | 0;
        return (alpha * 255 << 24) + (R << 16) + (G << 8) + B;
    }
    function premultiplyTintToRgba(tint, alpha, out, premultiply) {
        out = out || new Float32Array(4);
        out[0] = ((tint >> 16) & 0xFF) / 255.0;
        out[1] = ((tint >> 8) & 0xFF) / 255.0;
        out[2] = (tint & 0xFF) / 255.0;
        if (premultiply || premultiply === undefined) {
            out[0] *= alpha;
            out[1] *= alpha;
            out[2] *= alpha;
        }
        out[3] = alpha;
        return out;
    }
    function createIndicesForQuads(size, outBuffer) {
        if (outBuffer === void 0) {
            outBuffer = null;
        }
        var totalIndices = size * 6;
        outBuffer = outBuffer || new Uint16Array(totalIndices);
        if (outBuffer.length !== totalIndices) {
            throw new Error("Out buffer length is incorrect, got " + outBuffer.length + " and expected " + totalIndices);
        }
        for (var i = 0, j = 0; i < totalIndices; i += 6, j += 4) {
            outBuffer[i + 0] = j + 0;
            outBuffer[i + 1] = j + 1;
            outBuffer[i + 2] = j + 2;
            outBuffer[i + 3] = j + 0;
            outBuffer[i + 4] = j + 2;
            outBuffer[i + 5] = j + 3;
        }
        return outBuffer;
    }
    function getBufferType(array) {
        if (array.BYTES_PER_ELEMENT === 4) {
            if (array instanceof Float32Array) {
                return 'Float32Array';
            }
            else if (array instanceof Uint32Array) {
                return 'Uint32Array';
            }
            return 'Int32Array';
        }
        else if (array.BYTES_PER_ELEMENT === 2) {
            if (array instanceof Uint16Array) {
                return 'Uint16Array';
            }
        }
        else if (array.BYTES_PER_ELEMENT === 1) {
            if (array instanceof Uint8Array) {
                return 'Uint8Array';
            }
        }
        return null;
    }
    var map = { Float32Array: Float32Array, Uint32Array: Uint32Array, Int32Array: Int32Array, Uint8Array: Uint8Array };
    function interleaveTypedArrays(arrays, sizes) {
        var outSize = 0;
        var stride = 0;
        var views = {};
        for (var i = 0; i < arrays.length; i++) {
            stride += sizes[i];
            outSize += arrays[i].length;
        }
        var buffer = new ArrayBuffer(outSize * 4);
        var out = null;
        var littleOffset = 0;
        for (var i = 0; i < arrays.length; i++) {
            var size = sizes[i];
            var array = arrays[i];
            var type = getBufferType(array);
            if (!views[type]) {
                views[type] = new map[type](buffer);
            }
            out = views[type];
            for (var j = 0; j < array.length; j++) {
                var indexStart = ((j / size | 0) * stride) + littleOffset;
                var index = j % size;
                out[indexStart + index] = array[j];
            }
            littleOffset += size;
        }
        return new Float32Array(buffer);
    }
    function nextPow2(v) {
        v += v === 0 ? 1 : 0;
        --v;
        v |= v >>> 1;
        v |= v >>> 2;
        v |= v >>> 4;
        v |= v >>> 8;
        v |= v >>> 16;
        return v + 1;
    }
    function isPow2(v) {
        return !(v & (v - 1)) && (!!v);
    }
    function log2(v) {
        var r = (v > 0xFFFF ? 1 : 0) << 4;
        v >>>= r;
        var shift = (v > 0xFF ? 1 : 0) << 3;
        v >>>= shift;
        r |= shift;
        shift = (v > 0xF ? 1 : 0) << 2;
        v >>>= shift;
        r |= shift;
        shift = (v > 0x3 ? 1 : 0) << 1;
        v >>>= shift;
        r |= shift;
        return r | (v >> 1);
    }
    function removeItems(arr, startIdx, removeCount) {
        var length = arr.length;
        var i;
        if (startIdx >= length || removeCount === 0) {
            return;
        }
        removeCount = (startIdx + removeCount > length ? length - startIdx : removeCount);
        var len = length - removeCount;
        for (i = startIdx; i < len; ++i) {
            arr[i] = arr[i + removeCount];
        }
        arr.length = len;
    }
    function sign$1(n) {
        if (n === 0) {
            return 0;
        }
        return n < 0 ? -1 : 1;
    }
    var nextUid = 0;
    function uid() {
        return ++nextUid;
    }
    var warnings = {};
    function deprecation(version, message, ignoreDepth) {
        if (ignoreDepth === void 0) {
            ignoreDepth = 3;
        }
        if (warnings[message]) {
            return;
        }
        var stack = new Error().stack;
        if (typeof stack === 'undefined') {
            console.warn('PixiJS Deprecation Warning: ', message + "\nDeprecated since v" + version);
        }
        else {
            stack = stack.split('\n').splice(ignoreDepth).join('\n');
            if (console.groupCollapsed) {
                console.groupCollapsed('%cPixiJS Deprecation Warning: %c%s', 'color:#614108;background:#fffbe6', 'font-weight:normal;color:#614108;background:#fffbe6', message + "\nDeprecated since v" + version);
                console.warn(stack);
                console.groupEnd();
            }
            else {
                console.warn('PixiJS Deprecation Warning: ', message + "\nDeprecated since v" + version);
                console.warn(stack);
            }
        }
        warnings[message] = true;
    }
    var ProgramCache = {};
    var TextureCache = Object.create(null);
    var BaseTextureCache = Object.create(null);
    function destroyTextureCache() {
        var key;
        for (key in TextureCache) {
            TextureCache[key].destroy();
        }
        for (key in BaseTextureCache) {
            BaseTextureCache[key].destroy();
        }
    }
    function clearTextureCache() {
        var key;
        for (key in TextureCache) {
            delete TextureCache[key];
        }
        for (key in BaseTextureCache) {
            delete BaseTextureCache[key];
        }
    }
    var CanvasRenderTarget = (function () {
        function CanvasRenderTarget(width, height, resolution) {
            this.canvas = document.createElement('canvas');
            this.context = this.canvas.getContext('2d');
            this.resolution = resolution || settings.RESOLUTION;
            this.resize(width, height);
        }
        CanvasRenderTarget.prototype.clear = function () {
            this.context.setTransform(1, 0, 0, 1, 0, 0);
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        };
        CanvasRenderTarget.prototype.resize = function (width, height) {
            this.canvas.width = width * this.resolution;
            this.canvas.height = height * this.resolution;
        };
        CanvasRenderTarget.prototype.destroy = function () {
            this.context = null;
            this.canvas = null;
        };
        Object.defineProperty(CanvasRenderTarget.prototype, "width", {
            get: function () {
                return this.canvas.width;
            },
            set: function (val) {
                this.canvas.width = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CanvasRenderTarget.prototype, "height", {
            get: function () {
                return this.canvas.height;
            },
            set: function (val) {
                this.canvas.height = val;
            },
            enumerable: true,
            configurable: true
        });
        return CanvasRenderTarget;
    }());
    function trimCanvas(canvas) {
        var width = canvas.width;
        var height = canvas.height;
        var context = canvas.getContext('2d');
        var imageData = context.getImageData(0, 0, width, height);
        var pixels = imageData.data;
        var len = pixels.length;
        var bound = {
            top: null,
            left: null,
            right: null,
            bottom: null,
        };
        var data = null;
        var i;
        var x;
        var y;
        for (i = 0; i < len; i += 4) {
            if (pixels[i + 3] !== 0) {
                x = (i / 4) % width;
                y = ~~((i / 4) / width);
                if (bound.top === null) {
                    bound.top = y;
                }
                if (bound.left === null) {
                    bound.left = x;
                }
                else if (x < bound.left) {
                    bound.left = x;
                }
                if (bound.right === null) {
                    bound.right = x + 1;
                }
                else if (bound.right < x) {
                    bound.right = x + 1;
                }
                if (bound.bottom === null) {
                    bound.bottom = y;
                }
                else if (bound.bottom < y) {
                    bound.bottom = y;
                }
            }
        }
        if (bound.top !== null) {
            width = bound.right - bound.left;
            height = bound.bottom - bound.top + 1;
            data = context.getImageData(bound.left, bound.top, width, height);
        }
        return {
            height: height,
            width: width,
            data: data,
        };
    }
    var DATA_URI = /^\s*data:(?:([\w-]+)\/([\w+.-]+))?(?:;charset=([\w-]+))?(?:;(base64))?,(.*)/i;
    function decomposeDataUri(dataUri) {
        var dataUriMatch = DATA_URI.exec(dataUri);
        if (dataUriMatch) {
            return {
                mediaType: dataUriMatch[1] ? dataUriMatch[1].toLowerCase() : undefined,
                subType: dataUriMatch[2] ? dataUriMatch[2].toLowerCase() : undefined,
                charset: dataUriMatch[3] ? dataUriMatch[3].toLowerCase() : undefined,
                encoding: dataUriMatch[4] ? dataUriMatch[4].toLowerCase() : undefined,
                data: dataUriMatch[5],
            };
        }
        return undefined;
    }
    var tempAnchor;
    function determineCrossOrigin(url, loc) {
        if (loc === void 0) {
            loc = window.location;
        }
        if (url.indexOf('data:') === 0) {
            return '';
        }
        loc = loc || window.location;
        if (!tempAnchor) {
            tempAnchor = document.createElement('a');
        }
        tempAnchor.href = url;
        var parsedUrl = parse(tempAnchor.href);
        var samePort = (!parsedUrl.port && loc.port === '') || (parsedUrl.port === loc.port);
        if (parsedUrl.hostname !== loc.hostname || !samePort || parsedUrl.protocol !== loc.protocol) {
            return 'anonymous';
        }
        return '';
    }
    function getResolutionOfUrl(url, defaultValue) {
        var resolution = settings.RETINA_PREFIX.exec(url);
        if (resolution) {
            return parseFloat(resolution[1]);
        }
        return defaultValue !== undefined ? defaultValue : 1;
    }
    var utils_es = ({
        BaseTextureCache: BaseTextureCache,
        CanvasRenderTarget: CanvasRenderTarget,
        DATA_URI: DATA_URI,
        ProgramCache: ProgramCache,
        TextureCache: TextureCache,
        clearTextureCache: clearTextureCache,
        correctBlendMode: correctBlendMode,
        createIndicesForQuads: createIndicesForQuads,
        decomposeDataUri: decomposeDataUri,
        deprecation: deprecation,
        destroyTextureCache: destroyTextureCache,
        determineCrossOrigin: determineCrossOrigin,
        getBufferType: getBufferType,
        getResolutionOfUrl: getResolutionOfUrl,
        hex2rgb: hex2rgb,
        hex2string: hex2string,
        interleaveTypedArrays: interleaveTypedArrays,
        isPow2: isPow2,
        isWebGLSupported: isWebGLSupported,
        log2: log2,
        nextPow2: nextPow2,
        premultiplyBlendMode: premultiplyBlendMode,
        premultiplyRgba: premultiplyRgba,
        premultiplyTint: premultiplyTint,
        premultiplyTintToRgba: premultiplyTintToRgba,
        removeItems: removeItems,
        rgb2hex: rgb2hex,
        sayHello: sayHello,
        sign: sign$1,
        skipHello: skipHello,
        string2hex: string2hex,
        trimCanvas: trimCanvas,
        uid: uid,
        isMobile: isMobile$1,
        EventEmitter: eventemitter3,
        earcut: earcut_1,
        url: url
    });
    var Point = (function () {
        function Point(x, y) {
            if (x === void 0) {
                x = 0;
            }
            if (y === void 0) {
                y = 0;
            }
            this.x = x;
            this.y = y;
        }
        Point.prototype.clone = function () {
            return new Point(this.x, this.y);
        };
        Point.prototype.copyFrom = function (p) {
            this.set(p.x, p.y);
            return this;
        };
        Point.prototype.copyTo = function (p) {
            p.set(this.x, this.y);
            return p;
        };
        Point.prototype.equals = function (p) {
            return (p.x === this.x) && (p.y === this.y);
        };
        Point.prototype.set = function (x, y) {
            if (x === void 0) {
                x = 0;
            }
            if (y === void 0) {
                y = x;
            }
            this.x = x;
            this.y = y;
            return this;
        };
        return Point;
    }());
    var ObservablePoint = (function () {
        function ObservablePoint(cb, scope, x, y) {
            if (x === void 0) {
                x = 0;
            }
            if (y === void 0) {
                y = 0;
            }
            this._x = x;
            this._y = y;
            this.cb = cb;
            this.scope = scope;
        }
        ObservablePoint.prototype.clone = function (cb, scope) {
            if (cb === void 0) {
                cb = this.cb;
            }
            if (scope === void 0) {
                scope = this.scope;
            }
            return new ObservablePoint(cb, scope, this._x, this._y);
        };
        ObservablePoint.prototype.set = function (x, y) {
            if (x === void 0) {
                x = 0;
            }
            if (y === void 0) {
                y = x;
            }
            if (this._x !== x || this._y !== y) {
                this._x = x;
                this._y = y;
                this.cb.call(this.scope);
            }
            return this;
        };
        ObservablePoint.prototype.copyFrom = function (p) {
            if (this._x !== p.x || this._y !== p.y) {
                this._x = p.x;
                this._y = p.y;
                this.cb.call(this.scope);
            }
            return this;
        };
        ObservablePoint.prototype.copyTo = function (p) {
            p.set(this._x, this._y);
            return p;
        };
        ObservablePoint.prototype.equals = function (p) {
            return (p.x === this._x) && (p.y === this._y);
        };
        Object.defineProperty(ObservablePoint.prototype, "x", {
            get: function () {
                return this._x;
            },
            set: function (value) {
                if (this._x !== value) {
                    this._x = value;
                    this.cb.call(this.scope);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObservablePoint.prototype, "y", {
            get: function () {
                return this._y;
            },
            set: function (value) {
                if (this._y !== value) {
                    this._y = value;
                    this.cb.call(this.scope);
                }
            },
            enumerable: true,
            configurable: true
        });
        return ObservablePoint;
    }());
    var PI_2 = Math.PI * 2;
    var RAD_TO_DEG = 180 / Math.PI;
    var DEG_TO_RAD = Math.PI / 180;
    (function (SHAPES) {
        SHAPES[SHAPES["POLY"] = 0] = "POLY";
        SHAPES[SHAPES["RECT"] = 1] = "RECT";
        SHAPES[SHAPES["CIRC"] = 2] = "CIRC";
        SHAPES[SHAPES["ELIP"] = 3] = "ELIP";
        SHAPES[SHAPES["RREC"] = 4] = "RREC";
    })(exports.SHAPES || (exports.SHAPES = {}));
    var Matrix = (function () {
        function Matrix(a, b, c, d, tx, ty) {
            if (a === void 0) {
                a = 1;
            }
            if (b === void 0) {
                b = 0;
            }
            if (c === void 0) {
                c = 0;
            }
            if (d === void 0) {
                d = 1;
            }
            if (tx === void 0) {
                tx = 0;
            }
            if (ty === void 0) {
                ty = 0;
            }
            this.array = null;
            this.a = a;
            this.b = b;
            this.c = c;
            this.d = d;
            this.tx = tx;
            this.ty = ty;
        }
        Matrix.prototype.fromArray = function (array) {
            this.a = array[0];
            this.b = array[1];
            this.c = array[3];
            this.d = array[4];
            this.tx = array[2];
            this.ty = array[5];
        };
        Matrix.prototype.set = function (a, b, c, d, tx, ty) {
            this.a = a;
            this.b = b;
            this.c = c;
            this.d = d;
            this.tx = tx;
            this.ty = ty;
            return this;
        };
        Matrix.prototype.toArray = function (transpose, out) {
            if (!this.array) {
                this.array = new Float32Array(9);
            }
            var array = out || this.array;
            if (transpose) {
                array[0] = this.a;
                array[1] = this.b;
                array[2] = 0;
                array[3] = this.c;
                array[4] = this.d;
                array[5] = 0;
                array[6] = this.tx;
                array[7] = this.ty;
                array[8] = 1;
            }
            else {
                array[0] = this.a;
                array[1] = this.c;
                array[2] = this.tx;
                array[3] = this.b;
                array[4] = this.d;
                array[5] = this.ty;
                array[6] = 0;
                array[7] = 0;
                array[8] = 1;
            }
            return array;
        };
        Matrix.prototype.apply = function (pos, newPos) {
            newPos = newPos || new Point();
            var x = pos.x;
            var y = pos.y;
            newPos.x = (this.a * x) + (this.c * y) + this.tx;
            newPos.y = (this.b * x) + (this.d * y) + this.ty;
            return newPos;
        };
        Matrix.prototype.applyInverse = function (pos, newPos) {
            newPos = newPos || new Point();
            var id = 1 / ((this.a * this.d) + (this.c * -this.b));
            var x = pos.x;
            var y = pos.y;
            newPos.x = (this.d * id * x) + (-this.c * id * y) + (((this.ty * this.c) - (this.tx * this.d)) * id);
            newPos.y = (this.a * id * y) + (-this.b * id * x) + (((-this.ty * this.a) + (this.tx * this.b)) * id);
            return newPos;
        };
        Matrix.prototype.translate = function (x, y) {
            this.tx += x;
            this.ty += y;
            return this;
        };
        Matrix.prototype.scale = function (x, y) {
            this.a *= x;
            this.d *= y;
            this.c *= x;
            this.b *= y;
            this.tx *= x;
            this.ty *= y;
            return this;
        };
        Matrix.prototype.rotate = function (angle) {
            var cos = Math.cos(angle);
            var sin = Math.sin(angle);
            var a1 = this.a;
            var c1 = this.c;
            var tx1 = this.tx;
            this.a = (a1 * cos) - (this.b * sin);
            this.b = (a1 * sin) + (this.b * cos);
            this.c = (c1 * cos) - (this.d * sin);
            this.d = (c1 * sin) + (this.d * cos);
            this.tx = (tx1 * cos) - (this.ty * sin);
            this.ty = (tx1 * sin) + (this.ty * cos);
            return this;
        };
        Matrix.prototype.append = function (matrix) {
            var a1 = this.a;
            var b1 = this.b;
            var c1 = this.c;
            var d1 = this.d;
            this.a = (matrix.a * a1) + (matrix.b * c1);
            this.b = (matrix.a * b1) + (matrix.b * d1);
            this.c = (matrix.c * a1) + (matrix.d * c1);
            this.d = (matrix.c * b1) + (matrix.d * d1);
            this.tx = (matrix.tx * a1) + (matrix.ty * c1) + this.tx;
            this.ty = (matrix.tx * b1) + (matrix.ty * d1) + this.ty;
            return this;
        };
        Matrix.prototype.setTransform = function (x, y, pivotX, pivotY, scaleX, scaleY, rotation, skewX, skewY) {
            this.a = Math.cos(rotation + skewY) * scaleX;
            this.b = Math.sin(rotation + skewY) * scaleX;
            this.c = -Math.sin(rotation - skewX) * scaleY;
            this.d = Math.cos(rotation - skewX) * scaleY;
            this.tx = x - ((pivotX * this.a) + (pivotY * this.c));
            this.ty = y - ((pivotX * this.b) + (pivotY * this.d));
            return this;
        };
        Matrix.prototype.prepend = function (matrix) {
            var tx1 = this.tx;
            if (matrix.a !== 1 || matrix.b !== 0 || matrix.c !== 0 || matrix.d !== 1) {
                var a1 = this.a;
                var c1 = this.c;
                this.a = (a1 * matrix.a) + (this.b * matrix.c);
                this.b = (a1 * matrix.b) + (this.b * matrix.d);
                this.c = (c1 * matrix.a) + (this.d * matrix.c);
                this.d = (c1 * matrix.b) + (this.d * matrix.d);
            }
            this.tx = (tx1 * matrix.a) + (this.ty * matrix.c) + matrix.tx;
            this.ty = (tx1 * matrix.b) + (this.ty * matrix.d) + matrix.ty;
            return this;
        };
        Matrix.prototype.decompose = function (transform) {
            var a = this.a;
            var b = this.b;
            var c = this.c;
            var d = this.d;
            var skewX = -Math.atan2(-c, d);
            var skewY = Math.atan2(b, a);
            var delta = Math.abs(skewX + skewY);
            if (delta < 0.00001 || Math.abs(PI_2 - delta) < 0.00001) {
                transform.rotation = skewY;
                transform.skew.x = transform.skew.y = 0;
            }
            else {
                transform.rotation = 0;
                transform.skew.x = skewX;
                transform.skew.y = skewY;
            }
            transform.scale.x = Math.sqrt((a * a) + (b * b));
            transform.scale.y = Math.sqrt((c * c) + (d * d));
            transform.position.x = this.tx;
            transform.position.y = this.ty;
            return transform;
        };
        Matrix.prototype.invert = function () {
            var a1 = this.a;
            var b1 = this.b;
            var c1 = this.c;
            var d1 = this.d;
            var tx1 = this.tx;
            var n = (a1 * d1) - (b1 * c1);
            this.a = d1 / n;
            this.b = -b1 / n;
            this.c = -c1 / n;
            this.d = a1 / n;
            this.tx = ((c1 * this.ty) - (d1 * tx1)) / n;
            this.ty = -((a1 * this.ty) - (b1 * tx1)) / n;
            return this;
        };
        Matrix.prototype.identity = function () {
            this.a = 1;
            this.b = 0;
            this.c = 0;
            this.d = 1;
            this.tx = 0;
            this.ty = 0;
            return this;
        };
        Matrix.prototype.clone = function () {
            var matrix = new Matrix();
            matrix.a = this.a;
            matrix.b = this.b;
            matrix.c = this.c;
            matrix.d = this.d;
            matrix.tx = this.tx;
            matrix.ty = this.ty;
            return matrix;
        };
        Matrix.prototype.copyTo = function (matrix) {
            matrix.a = this.a;
            matrix.b = this.b;
            matrix.c = this.c;
            matrix.d = this.d;
            matrix.tx = this.tx;
            matrix.ty = this.ty;
            return matrix;
        };
        Matrix.prototype.copyFrom = function (matrix) {
            this.a = matrix.a;
            this.b = matrix.b;
            this.c = matrix.c;
            this.d = matrix.d;
            this.tx = matrix.tx;
            this.ty = matrix.ty;
            return this;
        };
        Object.defineProperty(Matrix, "IDENTITY", {
            get: function () {
                return new Matrix();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix, "TEMP_MATRIX", {
            get: function () {
                return new Matrix();
            },
            enumerable: true,
            configurable: true
        });
        return Matrix;
    }());
    var ux = [1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1, 0, 1];
    var uy = [0, 1, 1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1];
    var vx = [0, -1, -1, -1, 0, 1, 1, 1, 0, 1, 1, 1, 0, -1, -1, -1];
    var vy = [1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, 1, 1, 1, 0, -1];
    var rotationCayley = [];
    var rotationMatrices = [];
    var signum = Math.sign;
    function init() {
        for (var i = 0; i < 16; i++) {
            var row = [];
            rotationCayley.push(row);
            for (var j = 0; j < 16; j++) {
                var _ux = signum((ux[i] * ux[j]) + (vx[i] * uy[j]));
                var _uy = signum((uy[i] * ux[j]) + (vy[i] * uy[j]));
                var _vx = signum((ux[i] * vx[j]) + (vx[i] * vy[j]));
                var _vy = signum((uy[i] * vx[j]) + (vy[i] * vy[j]));
                for (var k = 0; k < 16; k++) {
                    if (ux[k] === _ux && uy[k] === _uy
                        && vx[k] === _vx && vy[k] === _vy) {
                        row.push(k);
                        break;
                    }
                }
            }
        }
        for (var i = 0; i < 16; i++) {
            var mat = new Matrix();
            mat.set(ux[i], uy[i], vx[i], vy[i], 0, 0);
            rotationMatrices.push(mat);
        }
    }
    init();
    var groupD8 = {
        E: 0,
        SE: 1,
        S: 2,
        SW: 3,
        W: 4,
        NW: 5,
        N: 6,
        NE: 7,
        MIRROR_VERTICAL: 8,
        MAIN_DIAGONAL: 10,
        MIRROR_HORIZONTAL: 12,
        REVERSE_DIAGONAL: 14,
        uX: function (ind) { return ux[ind]; },
        uY: function (ind) { return uy[ind]; },
        vX: function (ind) { return vx[ind]; },
        vY: function (ind) { return vy[ind]; },
        inv: function (rotation) {
            if (rotation & 8) {
                return rotation & 15;
            }
            return (-rotation) & 7;
        },
        add: function (rotationSecond, rotationFirst) { return (rotationCayley[rotationSecond][rotationFirst]); },
        sub: function (rotationSecond, rotationFirst) { return (rotationCayley[rotationSecond][groupD8.inv(rotationFirst)]); },
        rotate180: function (rotation) { return rotation ^ 4; },
        isVertical: function (rotation) { return (rotation & 3) === 2; },
        byDirection: function (dx, dy) {
            if (Math.abs(dx) * 2 <= Math.abs(dy)) {
                if (dy >= 0) {
                    return groupD8.S;
                }
                return groupD8.N;
            }
            else if (Math.abs(dy) * 2 <= Math.abs(dx)) {
                if (dx > 0) {
                    return groupD8.E;
                }
                return groupD8.W;
            }
            else if (dy > 0) {
                if (dx > 0) {
                    return groupD8.SE;
                }
                return groupD8.SW;
            }
            else if (dx > 0) {
                return groupD8.NE;
            }
            return groupD8.NW;
        },
        matrixAppendRotationInv: function (matrix, rotation, tx, ty) {
            if (tx === void 0) {
                tx = 0;
            }
            if (ty === void 0) {
                ty = 0;
            }
            var mat = rotationMatrices[groupD8.inv(rotation)];
            mat.tx = tx;
            mat.ty = ty;
            matrix.append(mat);
        },
    };
    var Transform = (function () {
        function Transform() {
            this.worldTransform = new Matrix();
            this.localTransform = new Matrix();
            this.position = new ObservablePoint(this.onChange, this, 0, 0);
            this.scale = new ObservablePoint(this.onChange, this, 1, 1);
            this.pivot = new ObservablePoint(this.onChange, this, 0, 0);
            this.skew = new ObservablePoint(this.updateSkew, this, 0, 0);
            this._rotation = 0;
            this._cx = 1;
            this._sx = 0;
            this._cy = 0;
            this._sy = 1;
            this._localID = 0;
            this._currentLocalID = 0;
            this._worldID = 0;
            this._parentID = 0;
        }
        Transform.prototype.onChange = function () {
            this._localID++;
        };
        Transform.prototype.updateSkew = function () {
            this._cx = Math.cos(this._rotation + this.skew.y);
            this._sx = Math.sin(this._rotation + this.skew.y);
            this._cy = -Math.sin(this._rotation - this.skew.x);
            this._sy = Math.cos(this._rotation - this.skew.x);
            this._localID++;
        };
        Transform.prototype.updateLocalTransform = function () {
            var lt = this.localTransform;
            if (this._localID !== this._currentLocalID) {
                lt.a = this._cx * this.scale.x;
                lt.b = this._sx * this.scale.x;
                lt.c = this._cy * this.scale.y;
                lt.d = this._sy * this.scale.y;
                lt.tx = this.position.x - ((this.pivot.x * lt.a) + (this.pivot.y * lt.c));
                lt.ty = this.position.y - ((this.pivot.x * lt.b) + (this.pivot.y * lt.d));
                this._currentLocalID = this._localID;
                this._parentID = -1;
            }
        };
        Transform.prototype.updateTransform = function (parentTransform) {
            var lt = this.localTransform;
            if (this._localID !== this._currentLocalID) {
                lt.a = this._cx * this.scale.x;
                lt.b = this._sx * this.scale.x;
                lt.c = this._cy * this.scale.y;
                lt.d = this._sy * this.scale.y;
                lt.tx = this.position.x - ((this.pivot.x * lt.a) + (this.pivot.y * lt.c));
                lt.ty = this.position.y - ((this.pivot.x * lt.b) + (this.pivot.y * lt.d));
                this._currentLocalID = this._localID;
                this._parentID = -1;
            }
            if (this._parentID !== parentTransform._worldID) {
                var pt = parentTransform.worldTransform;
                var wt = this.worldTransform;
                wt.a = (lt.a * pt.a) + (lt.b * pt.c);
                wt.b = (lt.a * pt.b) + (lt.b * pt.d);
                wt.c = (lt.c * pt.a) + (lt.d * pt.c);
                wt.d = (lt.c * pt.b) + (lt.d * pt.d);
                wt.tx = (lt.tx * pt.a) + (lt.ty * pt.c) + pt.tx;
                wt.ty = (lt.tx * pt.b) + (lt.ty * pt.d) + pt.ty;
                this._parentID = parentTransform._worldID;
                this._worldID++;
            }
        };
        Transform.prototype.setFromMatrix = function (matrix) {
            matrix.decompose(this);
            this._localID++;
        };
        Object.defineProperty(Transform.prototype, "rotation", {
            get: function () {
                return this._rotation;
            },
            set: function (value) {
                if (this._rotation !== value) {
                    this._rotation = value;
                    this.updateSkew();
                }
            },
            enumerable: true,
            configurable: true
        });
        Transform.IDENTITY = new Transform();
        return Transform;
    }());
    var Rectangle = (function () {
        function Rectangle(x, y, width, height) {
            if (x === void 0) {
                x = 0;
            }
            if (y === void 0) {
                y = 0;
            }
            if (width === void 0) {
                width = 0;
            }
            if (height === void 0) {
                height = 0;
            }
            this.x = Number(x);
            this.y = Number(y);
            this.width = Number(width);
            this.height = Number(height);
            this.type = exports.SHAPES.RECT;
        }
        Object.defineProperty(Rectangle.prototype, "left", {
            get: function () {
                return this.x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "right", {
            get: function () {
                return this.x + this.width;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "top", {
            get: function () {
                return this.y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "bottom", {
            get: function () {
                return this.y + this.height;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle, "EMPTY", {
            get: function () {
                return new Rectangle(0, 0, 0, 0);
            },
            enumerable: true,
            configurable: true
        });
        Rectangle.prototype.clone = function () {
            return new Rectangle(this.x, this.y, this.width, this.height);
        };
        Rectangle.prototype.copyFrom = function (rectangle) {
            this.x = rectangle.x;
            this.y = rectangle.y;
            this.width = rectangle.width;
            this.height = rectangle.height;
            return this;
        };
        Rectangle.prototype.copyTo = function (rectangle) {
            rectangle.x = this.x;
            rectangle.y = this.y;
            rectangle.width = this.width;
            rectangle.height = this.height;
            return rectangle;
        };
        Rectangle.prototype.contains = function (x, y) {
            if (this.width <= 0 || this.height <= 0) {
                return false;
            }
            if (x >= this.x && x < this.x + this.width) {
                if (y >= this.y && y < this.y + this.height) {
                    return true;
                }
            }
            return false;
        };
        Rectangle.prototype.pad = function (paddingX, paddingY) {
            if (paddingX === void 0) {
                paddingX = 0;
            }
            if (paddingY === void 0) {
                paddingY = paddingX;
            }
            this.x -= paddingX;
            this.y -= paddingY;
            this.width += paddingX * 2;
            this.height += paddingY * 2;
            return this;
        };
        Rectangle.prototype.fit = function (rectangle) {
            var x1 = Math.max(this.x, rectangle.x);
            var x2 = Math.min(this.x + this.width, rectangle.x + rectangle.width);
            var y1 = Math.max(this.y, rectangle.y);
            var y2 = Math.min(this.y + this.height, rectangle.y + rectangle.height);
            this.x = x1;
            this.width = Math.max(x2 - x1, 0);
            this.y = y1;
            this.height = Math.max(y2 - y1, 0);
            return this;
        };
        Rectangle.prototype.ceil = function (resolution, eps) {
            if (resolution === void 0) {
                resolution = 1;
            }
            if (eps === void 0) {
                eps = 0.001;
            }
            var x2 = Math.ceil((this.x + this.width - eps) * resolution) / resolution;
            var y2 = Math.ceil((this.y + this.height - eps) * resolution) / resolution;
            this.x = Math.floor((this.x + eps) * resolution) / resolution;
            this.y = Math.floor((this.y + eps) * resolution) / resolution;
            this.width = x2 - this.x;
            this.height = y2 - this.y;
            return this;
        };
        Rectangle.prototype.enlarge = function (rectangle) {
            var x1 = Math.min(this.x, rectangle.x);
            var x2 = Math.max(this.x + this.width, rectangle.x + rectangle.width);
            var y1 = Math.min(this.y, rectangle.y);
            var y2 = Math.max(this.y + this.height, rectangle.y + rectangle.height);
            this.x = x1;
            this.width = x2 - x1;
            this.y = y1;
            this.height = y2 - y1;
            return this;
        };
        return Rectangle;
    }());
    var Circle = (function () {
        function Circle(x, y, radius) {
            if (x === void 0) {
                x = 0;
            }
            if (y === void 0) {
                y = 0;
            }
            if (radius === void 0) {
                radius = 0;
            }
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.type = exports.SHAPES.CIRC;
        }
        Circle.prototype.clone = function () {
            return new Circle(this.x, this.y, this.radius);
        };
        Circle.prototype.contains = function (x, y) {
            if (this.radius <= 0) {
                return false;
            }
            var r2 = this.radius * this.radius;
            var dx = (this.x - x);
            var dy = (this.y - y);
            dx *= dx;
            dy *= dy;
            return (dx + dy <= r2);
        };
        Circle.prototype.getBounds = function () {
            return new Rectangle(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
        };
        return Circle;
    }());
    var Ellipse = (function () {
        function Ellipse(x, y, halfWidth, halfHeight) {
            if (x === void 0) {
                x = 0;
            }
            if (y === void 0) {
                y = 0;
            }
            if (halfWidth === void 0) {
                halfWidth = 0;
            }
            if (halfHeight === void 0) {
                halfHeight = 0;
            }
            this.x = x;
            this.y = y;
            this.width = halfWidth;
            this.height = halfHeight;
            this.type = exports.SHAPES.ELIP;
        }
        Ellipse.prototype.clone = function () {
            return new Ellipse(this.x, this.y, this.width, this.height);
        };
        Ellipse.prototype.contains = function (x, y) {
            if (this.width <= 0 || this.height <= 0) {
                return false;
            }
            var normx = ((x - this.x) / this.width);
            var normy = ((y - this.y) / this.height);
            normx *= normx;
            normy *= normy;
            return (normx + normy <= 1);
        };
        Ellipse.prototype.getBounds = function () {
            return new Rectangle(this.x - this.width, this.y - this.height, this.width, this.height);
        };
        return Ellipse;
    }());
    var Polygon = (function () {
        function Polygon() {
            var arguments$1 = arguments;
            var points = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                points[_i] = arguments$1[_i];
            }
            if (Array.isArray(points[0])) {
                points = points[0];
            }
            if (points[0] instanceof Point) {
                points = points;
                var p = [];
                for (var i = 0, il = points.length; i < il; i++) {
                    p.push(points[i].x, points[i].y);
                }
                points = p;
            }
            this.points = points;
            this.type = exports.SHAPES.POLY;
            this.closeStroke = true;
        }
        Polygon.prototype.clone = function () {
            var points = this.points.slice();
            var polygon = new Polygon(points);
            polygon.closeStroke = this.closeStroke;
            return polygon;
        };
        Polygon.prototype.contains = function (x, y) {
            var inside = false;
            var length = this.points.length / 2;
            for (var i = 0, j = length - 1; i < length; j = i++) {
                var xi = this.points[i * 2];
                var yi = this.points[(i * 2) + 1];
                var xj = this.points[j * 2];
                var yj = this.points[(j * 2) + 1];
                var intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * ((y - yi) / (yj - yi))) + xi);
                if (intersect) {
                    inside = !inside;
                }
            }
            return inside;
        };
        return Polygon;
    }());
    var RoundedRectangle = (function () {
        function RoundedRectangle(x, y, width, height, radius) {
            if (x === void 0) {
                x = 0;
            }
            if (y === void 0) {
                y = 0;
            }
            if (width === void 0) {
                width = 0;
            }
            if (height === void 0) {
                height = 0;
            }
            if (radius === void 0) {
                radius = 20;
            }
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.radius = radius;
            this.type = exports.SHAPES.RREC;
        }
        RoundedRectangle.prototype.clone = function () {
            return new RoundedRectangle(this.x, this.y, this.width, this.height, this.radius);
        };
        RoundedRectangle.prototype.contains = function (x, y) {
            if (this.width <= 0 || this.height <= 0) {
                return false;
            }
            if (x >= this.x && x <= this.x + this.width) {
                if (y >= this.y && y <= this.y + this.height) {
                    if ((y >= this.y + this.radius && y <= this.y + this.height - this.radius)
                        || (x >= this.x + this.radius && x <= this.x + this.width - this.radius)) {
                        return true;
                    }
                    var dx = x - (this.x + this.radius);
                    var dy = y - (this.y + this.radius);
                    var radius2 = this.radius * this.radius;
                    if ((dx * dx) + (dy * dy) <= radius2) {
                        return true;
                    }
                    dx = x - (this.x + this.width - this.radius);
                    if ((dx * dx) + (dy * dy) <= radius2) {
                        return true;
                    }
                    dy = y - (this.y + this.height - this.radius);
                    if ((dx * dx) + (dy * dy) <= radius2) {
                        return true;
                    }
                    dx = x - (this.x + this.radius);
                    if ((dx * dx) + (dy * dy) <= radius2) {
                        return true;
                    }
                }
            }
            return false;
        };
        return RoundedRectangle;
    }());
    settings.SORTABLE_CHILDREN = false;
    var Bounds = function Bounds() {
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
        this.rect = null;
    };
    Bounds.prototype.isEmpty = function isEmpty() {
        return this.minX > this.maxX || this.minY > this.maxY;
    };
    Bounds.prototype.clear = function clear() {
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
    };
    Bounds.prototype.getRectangle = function getRectangle(rect) {
        if (this.minX > this.maxX || this.minY > this.maxY) {
            return Rectangle.EMPTY;
        }
        rect = rect || new Rectangle(0, 0, 1, 1);
        rect.x = this.minX;
        rect.y = this.minY;
        rect.width = this.maxX - this.minX;
        rect.height = this.maxY - this.minY;
        return rect;
    };
    Bounds.prototype.addPoint = function addPoint(point) {
        this.minX = Math.min(this.minX, point.x);
        this.maxX = Math.max(this.maxX, point.x);
        this.minY = Math.min(this.minY, point.y);
        this.maxY = Math.max(this.maxY, point.y);
    };
    Bounds.prototype.addQuad = function addQuad(vertices) {
        var minX = this.minX;
        var minY = this.minY;
        var maxX = this.maxX;
        var maxY = this.maxY;
        var x = vertices[0];
        var y = vertices[1];
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;
        x = vertices[2];
        y = vertices[3];
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;
        x = vertices[4];
        y = vertices[5];
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;
        x = vertices[6];
        y = vertices[7];
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    };
    Bounds.prototype.addFrame = function addFrame(transform, x0, y0, x1, y1) {
        this.addFrameMatrix(transform.worldTransform, x0, y0, x1, y1);
    };
    Bounds.prototype.addFrameMatrix = function addFrameMatrix(matrix, x0, y0, x1, y1) {
        var a = matrix.a;
        var b = matrix.b;
        var c = matrix.c;
        var d = matrix.d;
        var tx = matrix.tx;
        var ty = matrix.ty;
        var minX = this.minX;
        var minY = this.minY;
        var maxX = this.maxX;
        var maxY = this.maxY;
        var x = (a * x0) + (c * y0) + tx;
        var y = (b * x0) + (d * y0) + ty;
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;
        x = (a * x1) + (c * y0) + tx;
        y = (b * x1) + (d * y0) + ty;
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;
        x = (a * x0) + (c * y1) + tx;
        y = (b * x0) + (d * y1) + ty;
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;
        x = (a * x1) + (c * y1) + tx;
        y = (b * x1) + (d * y1) + ty;
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    };
    Bounds.prototype.addVertexData = function addVertexData(vertexData, beginOffset, endOffset) {
        var minX = this.minX;
        var minY = this.minY;
        var maxX = this.maxX;
        var maxY = this.maxY;
        for (var i = beginOffset; i < endOffset; i += 2) {
            var x = vertexData[i];
            var y = vertexData[i + 1];
            minX = x < minX ? x : minX;
            minY = y < minY ? y : minY;
            maxX = x > maxX ? x : maxX;
            maxY = y > maxY ? y : maxY;
        }
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    };
    Bounds.prototype.addVertices = function addVertices(transform, vertices, beginOffset, endOffset) {
        this.addVerticesMatrix(transform.worldTransform, vertices, beginOffset, endOffset);
    };
    Bounds.prototype.addVerticesMatrix = function addVerticesMatrix(matrix, vertices, beginOffset, endOffset, padX, padY) {
        var a = matrix.a;
        var b = matrix.b;
        var c = matrix.c;
        var d = matrix.d;
        var tx = matrix.tx;
        var ty = matrix.ty;
        padX = padX || 0;
        padY = padY || 0;
        var minX = this.minX;
        var minY = this.minY;
        var maxX = this.maxX;
        var maxY = this.maxY;
        for (var i = beginOffset; i < endOffset; i += 2) {
            var rawX = vertices[i];
            var rawY = vertices[i + 1];
            var x = (a * rawX) + (c * rawY) + tx;
            var y = (d * rawY) + (b * rawX) + ty;
            minX = Math.min(minX, x - padX);
            maxX = Math.max(maxX, x + padX);
            minY = Math.min(minY, y - padY);
            maxY = Math.max(maxY, y + padY);
        }
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    };
    Bounds.prototype.addBounds = function addBounds(bounds) {
        var minX = this.minX;
        var minY = this.minY;
        var maxX = this.maxX;
        var maxY = this.maxY;
        this.minX = bounds.minX < minX ? bounds.minX : minX;
        this.minY = bounds.minY < minY ? bounds.minY : minY;
        this.maxX = bounds.maxX > maxX ? bounds.maxX : maxX;
        this.maxY = bounds.maxY > maxY ? bounds.maxY : maxY;
    };
    Bounds.prototype.addBoundsMask = function addBoundsMask(bounds, mask) {
        var _minX = bounds.minX > mask.minX ? bounds.minX : mask.minX;
        var _minY = bounds.minY > mask.minY ? bounds.minY : mask.minY;
        var _maxX = bounds.maxX < mask.maxX ? bounds.maxX : mask.maxX;
        var _maxY = bounds.maxY < mask.maxY ? bounds.maxY : mask.maxY;
        if (_minX <= _maxX && _minY <= _maxY) {
            var minX = this.minX;
            var minY = this.minY;
            var maxX = this.maxX;
            var maxY = this.maxY;
            this.minX = _minX < minX ? _minX : minX;
            this.minY = _minY < minY ? _minY : minY;
            this.maxX = _maxX > maxX ? _maxX : maxX;
            this.maxY = _maxY > maxY ? _maxY : maxY;
        }
    };
    Bounds.prototype.addBoundsMatrix = function addBoundsMatrix(bounds, matrix) {
        this.addFrameMatrix(matrix, bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
    };
    Bounds.prototype.addBoundsArea = function addBoundsArea(bounds, area) {
        var _minX = bounds.minX > area.x ? bounds.minX : area.x;
        var _minY = bounds.minY > area.y ? bounds.minY : area.y;
        var _maxX = bounds.maxX < area.x + area.width ? bounds.maxX : (area.x + area.width);
        var _maxY = bounds.maxY < area.y + area.height ? bounds.maxY : (area.y + area.height);
        if (_minX <= _maxX && _minY <= _maxY) {
            var minX = this.minX;
            var minY = this.minY;
            var maxX = this.maxX;
            var maxY = this.maxY;
            this.minX = _minX < minX ? _minX : minX;
            this.minY = _minY < minY ? _minY : minY;
            this.maxX = _maxX > maxX ? _maxX : maxX;
            this.maxY = _maxY > maxY ? _maxY : maxY;
        }
    };
    Bounds.prototype.pad = function pad(paddingX, paddingY) {
        paddingX = paddingX || 0;
        paddingY = paddingY || ((paddingY !== 0) ? paddingX : 0);
        if (!this.isEmpty()) {
            this.minX -= paddingX;
            this.maxX += paddingX;
            this.minY -= paddingY;
            this.maxY += paddingY;
        }
    };
    Bounds.prototype.addFramePad = function addFramePad(x0, y0, x1, y1, padX, padY) {
        x0 -= padX;
        y0 -= padY;
        x1 += padX;
        y1 += padY;
        this.minX = this.minX < x0 ? this.minX : x0;
        this.maxX = this.maxX > x1 ? this.maxX : x1;
        this.minY = this.minY < y0 ? this.minY : y0;
        this.maxY = this.maxY > y1 ? this.maxY : y1;
    };
    var DisplayObject = (function (EventEmitter) {
        function DisplayObject() {
            EventEmitter.call(this);
            this.tempDisplayObjectParent = null;
            this.transform = new Transform();
            this.alpha = 1;
            this.visible = true;
            this.renderable = true;
            this.parent = null;
            this.worldAlpha = 1;
            this._lastSortedIndex = 0;
            this._zIndex = 0;
            this.filterArea = null;
            this.filters = null;
            this._enabledFilters = null;
            this._bounds = new Bounds();
            this._boundsID = 0;
            this._lastBoundsID = -1;
            this._boundsRect = null;
            this._localBoundsRect = null;
            this._mask = null;
            this._destroyed = false;
            this.isSprite = false;
            this.isMask = false;
        }
        if (EventEmitter) {
            DisplayObject.__proto__ = EventEmitter;
        }
        DisplayObject.prototype = Object.create(EventEmitter && EventEmitter.prototype);
        DisplayObject.prototype.constructor = DisplayObject;
        var prototypeAccessors = { _tempDisplayObjectParent: { configurable: true }, x: { configurable: true }, y: { configurable: true }, worldTransform: { configurable: true }, localTransform: { configurable: true }, position: { configurable: true }, scale: { configurable: true }, pivot: { configurable: true }, skew: { configurable: true }, rotation: { configurable: true }, angle: { configurable: true }, zIndex: { configurable: true }, worldVisible: { configurable: true }, mask: { configurable: true } };
        DisplayObject.mixin = function mixin(source) {
            var keys = Object.keys(source);
            for (var i = 0; i < keys.length; ++i) {
                var propertyName = keys[i];
                Object.defineProperty(DisplayObject.prototype, propertyName, Object.getOwnPropertyDescriptor(source, propertyName));
            }
        };
        prototypeAccessors._tempDisplayObjectParent.get = function () {
            if (this.tempDisplayObjectParent === null) {
                this.tempDisplayObjectParent = new DisplayObject();
            }
            return this.tempDisplayObjectParent;
        };
        DisplayObject.prototype.updateTransform = function updateTransform() {
            this._boundsID++;
            this.transform.updateTransform(this.parent.transform);
            this.worldAlpha = this.alpha * this.parent.worldAlpha;
        };
        DisplayObject.prototype.calculateBounds = function calculateBounds() {
        };
        DisplayObject.prototype._recursivePostUpdateTransform = function _recursivePostUpdateTransform() {
            if (this.parent) {
                this.parent._recursivePostUpdateTransform();
                this.transform.updateTransform(this.parent.transform);
            }
            else {
                this.transform.updateTransform(this._tempDisplayObjectParent.transform);
            }
        };
        DisplayObject.prototype.getBounds = function getBounds(skipUpdate, rect) {
            if (!skipUpdate) {
                if (!this.parent) {
                    this.parent = this._tempDisplayObjectParent;
                    this.updateTransform();
                    this.parent = null;
                }
                else {
                    this._recursivePostUpdateTransform();
                    this.updateTransform();
                }
            }
            if (this._boundsID !== this._lastBoundsID) {
                this.calculateBounds();
                this._lastBoundsID = this._boundsID;
            }
            if (!rect) {
                if (!this._boundsRect) {
                    this._boundsRect = new Rectangle();
                }
                rect = this._boundsRect;
            }
            return this._bounds.getRectangle(rect);
        };
        DisplayObject.prototype.getLocalBounds = function getLocalBounds(rect) {
            var transformRef = this.transform;
            var parentRef = this.parent;
            this.parent = null;
            this.transform = this._tempDisplayObjectParent.transform;
            if (!rect) {
                if (!this._localBoundsRect) {
                    this._localBoundsRect = new Rectangle();
                }
                rect = this._localBoundsRect;
            }
            var bounds = this.getBounds(false, rect);
            this.parent = parentRef;
            this.transform = transformRef;
            return bounds;
        };
        DisplayObject.prototype.toGlobal = function toGlobal(position, point, skipUpdate) {
            if (skipUpdate === void 0) {
                skipUpdate = false;
            }
            if (!skipUpdate) {
                this._recursivePostUpdateTransform();
                if (!this.parent) {
                    this.parent = this._tempDisplayObjectParent;
                    this.displayObjectUpdateTransform();
                    this.parent = null;
                }
                else {
                    this.displayObjectUpdateTransform();
                }
            }
            return this.worldTransform.apply(position, point);
        };
        DisplayObject.prototype.toLocal = function toLocal(position, from, point, skipUpdate) {
            if (from) {
                position = from.toGlobal(position, point, skipUpdate);
            }
            if (!skipUpdate) {
                this._recursivePostUpdateTransform();
                if (!this.parent) {
                    this.parent = this._tempDisplayObjectParent;
                    this.displayObjectUpdateTransform();
                    this.parent = null;
                }
                else {
                    this.displayObjectUpdateTransform();
                }
            }
            return this.worldTransform.applyInverse(position, point);
        };
        DisplayObject.prototype.render = function render(renderer) {
        };
        DisplayObject.prototype.setParent = function setParent(container) {
            if (!container || !container.addChild) {
                throw new Error('setParent: Argument must be a Container');
            }
            container.addChild(this);
            return container;
        };
        DisplayObject.prototype.setTransform = function setTransform(x, y, scaleX, scaleY, rotation, skewX, skewY, pivotX, pivotY) {
            if (x === void 0) {
                x = 0;
            }
            if (y === void 0) {
                y = 0;
            }
            if (scaleX === void 0) {
                scaleX = 1;
            }
            if (scaleY === void 0) {
                scaleY = 1;
            }
            if (rotation === void 0) {
                rotation = 0;
            }
            if (skewX === void 0) {
                skewX = 0;
            }
            if (skewY === void 0) {
                skewY = 0;
            }
            if (pivotX === void 0) {
                pivotX = 0;
            }
            if (pivotY === void 0) {
                pivotY = 0;
            }
            this.position.x = x;
            this.position.y = y;
            this.scale.x = !scaleX ? 1 : scaleX;
            this.scale.y = !scaleY ? 1 : scaleY;
            this.rotation = rotation;
            this.skew.x = skewX;
            this.skew.y = skewY;
            this.pivot.x = pivotX;
            this.pivot.y = pivotY;
            return this;
        };
        DisplayObject.prototype.destroy = function destroy() {
            if (this.parent) {
                this.parent.removeChild(this);
            }
            this.removeAllListeners();
            this.transform = null;
            this.parent = null;
            this._bounds = null;
            this._currentBounds = null;
            this._mask = null;
            this.filters = null;
            this.filterArea = null;
            this.hitArea = null;
            this.interactive = false;
            this.interactiveChildren = false;
            this._destroyed = true;
        };
        prototypeAccessors.x.get = function () {
            return this.position.x;
        };
        prototypeAccessors.x.set = function (value) {
            this.transform.position.x = value;
        };
        prototypeAccessors.y.get = function () {
            return this.position.y;
        };
        prototypeAccessors.y.set = function (value) {
            this.transform.position.y = value;
        };
        prototypeAccessors.worldTransform.get = function () {
            return this.transform.worldTransform;
        };
        prototypeAccessors.localTransform.get = function () {
            return this.transform.localTransform;
        };
        prototypeAccessors.position.get = function () {
            return this.transform.position;
        };
        prototypeAccessors.position.set = function (value) {
            this.transform.position.copyFrom(value);
        };
        prototypeAccessors.scale.get = function () {
            return this.transform.scale;
        };
        prototypeAccessors.scale.set = function (value) {
            this.transform.scale.copyFrom(value);
        };
        prototypeAccessors.pivot.get = function () {
            return this.transform.pivot;
        };
        prototypeAccessors.pivot.set = function (value) {
            this.transform.pivot.copyFrom(value);
        };
        prototypeAccessors.skew.get = function () {
            return this.transform.skew;
        };
        prototypeAccessors.skew.set = function (value) {
            this.transform.skew.copyFrom(value);
        };
        prototypeAccessors.rotation.get = function () {
            return this.transform.rotation;
        };
        prototypeAccessors.rotation.set = function (value) {
            this.transform.rotation = value;
        };
        prototypeAccessors.angle.get = function () {
            return this.transform.rotation * RAD_TO_DEG;
        };
        prototypeAccessors.angle.set = function (value) {
            this.transform.rotation = value * DEG_TO_RAD;
        };
        prototypeAccessors.zIndex.get = function () {
            return this._zIndex;
        };
        prototypeAccessors.zIndex.set = function (value) {
            this._zIndex = value;
            if (this.parent) {
                this.parent.sortDirty = true;
            }
        };
        prototypeAccessors.worldVisible.get = function () {
            var item = this;
            do {
                if (!item.visible) {
                    return false;
                }
                item = item.parent;
            } while (item);
            return true;
        };
        prototypeAccessors.mask.get = function () {
            return this._mask;
        };
        prototypeAccessors.mask.set = function (value) {
            if (this._mask) {
                var maskObject = this._mask.maskObject || this._mask;
                maskObject.renderable = true;
                maskObject.isMask = false;
            }
            this._mask = value;
            if (this._mask) {
                var maskObject$1 = this._mask.maskObject || this._mask;
                maskObject$1.renderable = false;
                maskObject$1.isMask = true;
            }
        };
        Object.defineProperties(DisplayObject.prototype, prototypeAccessors);
        return DisplayObject;
    }(eventemitter3));
    DisplayObject.prototype.displayObjectUpdateTransform = DisplayObject.prototype.updateTransform;
    function sortChildren(a, b) {
        if (a.zIndex === b.zIndex) {
            return a._lastSortedIndex - b._lastSortedIndex;
        }
        return a.zIndex - b.zIndex;
    }
    var Container = (function (DisplayObject) {
        function Container() {
            DisplayObject.call(this);
            this.children = [];
            this.sortableChildren = settings.SORTABLE_CHILDREN;
            this.sortDirty = false;
        }
        if (DisplayObject) {
            Container.__proto__ = DisplayObject;
        }
        Container.prototype = Object.create(DisplayObject && DisplayObject.prototype);
        Container.prototype.constructor = Container;
        var prototypeAccessors = { width: { configurable: true }, height: { configurable: true } };
        Container.prototype.onChildrenChange = function onChildrenChange() {
        };
        Container.prototype.addChild = function addChild(child) {
            var arguments$1 = arguments;
            var argumentsLength = arguments.length;
            if (argumentsLength > 1) {
                for (var i = 0; i < argumentsLength; i++) {
                    this.addChild(arguments$1[i]);
                }
            }
            else {
                if (child.parent) {
                    child.parent.removeChild(child);
                }
                child.parent = this;
                this.sortDirty = true;
                child.transform._parentID = -1;
                this.children.push(child);
                this._boundsID++;
                this.onChildrenChange(this.children.length - 1);
                this.emit('childAdded', child, this, this.children.length - 1);
                child.emit('added', this);
            }
            return child;
        };
        Container.prototype.addChildAt = function addChildAt(child, index) {
            if (index < 0 || index > this.children.length) {
                throw new Error((child + "addChildAt: The index " + index + " supplied is out of bounds " + (this.children.length)));
            }
            if (child.parent) {
                child.parent.removeChild(child);
            }
            child.parent = this;
            this.sortDirty = true;
            child.transform._parentID = -1;
            this.children.splice(index, 0, child);
            this._boundsID++;
            this.onChildrenChange(index);
            child.emit('added', this);
            this.emit('childAdded', child, this, index);
            return child;
        };
        Container.prototype.swapChildren = function swapChildren(child, child2) {
            if (child === child2) {
                return;
            }
            var index1 = this.getChildIndex(child);
            var index2 = this.getChildIndex(child2);
            this.children[index1] = child2;
            this.children[index2] = child;
            this.onChildrenChange(index1 < index2 ? index1 : index2);
        };
        Container.prototype.getChildIndex = function getChildIndex(child) {
            var index = this.children.indexOf(child);
            if (index === -1) {
                throw new Error('The supplied DisplayObject must be a child of the caller');
            }
            return index;
        };
        Container.prototype.setChildIndex = function setChildIndex(child, index) {
            if (index < 0 || index >= this.children.length) {
                throw new Error(("The index " + index + " supplied is out of bounds " + (this.children.length)));
            }
            var currentIndex = this.getChildIndex(child);
            removeItems(this.children, currentIndex, 1);
            this.children.splice(index, 0, child);
            this.onChildrenChange(index);
        };
        Container.prototype.getChildAt = function getChildAt(index) {
            if (index < 0 || index >= this.children.length) {
                throw new Error(("getChildAt: Index (" + index + ") does not exist."));
            }
            return this.children[index];
        };
        Container.prototype.removeChild = function removeChild(child) {
            var arguments$1 = arguments;
            var argumentsLength = arguments.length;
            if (argumentsLength > 1) {
                for (var i = 0; i < argumentsLength; i++) {
                    this.removeChild(arguments$1[i]);
                }
            }
            else {
                var index = this.children.indexOf(child);
                if (index === -1) {
                    return null;
                }
                child.parent = null;
                child.transform._parentID = -1;
                removeItems(this.children, index, 1);
                this._boundsID++;
                this.onChildrenChange(index);
                child.emit('removed', this);
                this.emit('childRemoved', child, this, index);
            }
            return child;
        };
        Container.prototype.removeChildAt = function removeChildAt(index) {
            var child = this.getChildAt(index);
            child.parent = null;
            child.transform._parentID = -1;
            removeItems(this.children, index, 1);
            this._boundsID++;
            this.onChildrenChange(index);
            child.emit('removed', this);
            this.emit('childRemoved', child, this, index);
            return child;
        };
        Container.prototype.removeChildren = function removeChildren(beginIndex, endIndex) {
            if (beginIndex === void 0) {
                beginIndex = 0;
            }
            var begin = beginIndex;
            var end = typeof endIndex === 'number' ? endIndex : this.children.length;
            var range = end - begin;
            var removed;
            if (range > 0 && range <= end) {
                removed = this.children.splice(begin, range);
                for (var i = 0; i < removed.length; ++i) {
                    removed[i].parent = null;
                    if (removed[i].transform) {
                        removed[i].transform._parentID = -1;
                    }
                }
                this._boundsID++;
                this.onChildrenChange(beginIndex);
                for (var i$1 = 0; i$1 < removed.length; ++i$1) {
                    removed[i$1].emit('removed', this);
                    this.emit('childRemoved', removed[i$1], this, i$1);
                }
                return removed;
            }
            else if (range === 0 && this.children.length === 0) {
                return [];
            }
            throw new RangeError('removeChildren: numeric values are outside the acceptable range.');
        };
        Container.prototype.sortChildren = function sortChildren$1() {
            var sortRequired = false;
            for (var i = 0, j = this.children.length; i < j; ++i) {
                var child = this.children[i];
                child._lastSortedIndex = i;
                if (!sortRequired && child.zIndex !== 0) {
                    sortRequired = true;
                }
            }
            if (sortRequired && this.children.length > 1) {
                this.children.sort(sortChildren);
            }
            this.sortDirty = false;
        };
        Container.prototype.updateTransform = function updateTransform() {
            if (this.sortableChildren && this.sortDirty) {
                this.sortChildren();
            }
            this._boundsID++;
            this.transform.updateTransform(this.parent.transform);
            this.worldAlpha = this.alpha * this.parent.worldAlpha;
            for (var i = 0, j = this.children.length; i < j; ++i) {
                var child = this.children[i];
                if (child.visible) {
                    child.updateTransform();
                }
            }
        };
        Container.prototype.calculateBounds = function calculateBounds() {
            this._bounds.clear();
            this._calculateBounds();
            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];
                if (!child.visible || !child.renderable) {
                    continue;
                }
                child.calculateBounds();
                if (child._mask) {
                    var maskObject = child._mask.maskObject || child._mask;
                    maskObject.calculateBounds();
                    this._bounds.addBoundsMask(child._bounds, maskObject._bounds);
                }
                else if (child.filterArea) {
                    this._bounds.addBoundsArea(child._bounds, child.filterArea);
                }
                else {
                    this._bounds.addBounds(child._bounds);
                }
            }
            this._lastBoundsID = this._boundsID;
        };
        Container.prototype._calculateBounds = function _calculateBounds() {
        };
        Container.prototype.render = function render(renderer) {
            if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
                return;
            }
            if (this._mask || (this.filters && this.filters.length)) {
                this.renderAdvanced(renderer);
            }
            else {
                this._render(renderer);
                for (var i = 0, j = this.children.length; i < j; ++i) {
                    this.children[i].render(renderer);
                }
            }
        };
        Container.prototype.renderAdvanced = function renderAdvanced(renderer) {
            renderer.batch.flush();
            var filters = this.filters;
            var mask = this._mask;
            if (filters) {
                if (!this._enabledFilters) {
                    this._enabledFilters = [];
                }
                this._enabledFilters.length = 0;
                for (var i = 0; i < filters.length; i++) {
                    if (filters[i].enabled) {
                        this._enabledFilters.push(filters[i]);
                    }
                }
                if (this._enabledFilters.length) {
                    renderer.filter.push(this, this._enabledFilters);
                }
            }
            if (mask) {
                renderer.mask.push(this, this._mask);
            }
            this._render(renderer);
            for (var i$1 = 0, j = this.children.length; i$1 < j; i$1++) {
                this.children[i$1].render(renderer);
            }
            renderer.batch.flush();
            if (mask) {
                renderer.mask.pop(this, this._mask);
            }
            if (filters && this._enabledFilters && this._enabledFilters.length) {
                renderer.filter.pop();
            }
        };
        Container.prototype._render = function _render(renderer) {
        };
        Container.prototype.destroy = function destroy(options) {
            DisplayObject.prototype.destroy.call(this);
            this.sortDirty = false;
            var destroyChildren = typeof options === 'boolean' ? options : options && options.children;
            var oldChildren = this.removeChildren(0, this.children.length);
            if (destroyChildren) {
                for (var i = 0; i < oldChildren.length; ++i) {
                    oldChildren[i].destroy(options);
                }
            }
        };
        prototypeAccessors.width.get = function () {
            return this.scale.x * this.getLocalBounds().width;
        };
        prototypeAccessors.width.set = function (value) {
            var width = this.getLocalBounds().width;
            if (width !== 0) {
                this.scale.x = value / width;
            }
            else {
                this.scale.x = 1;
            }
            this._width = value;
        };
        prototypeAccessors.height.get = function () {
            return this.scale.y * this.getLocalBounds().height;
        };
        prototypeAccessors.height.set = function (value) {
            var height = this.getLocalBounds().height;
            if (height !== 0) {
                this.scale.y = value / height;
            }
            else {
                this.scale.y = 1;
            }
            this._height = value;
        };
        Object.defineProperties(Container.prototype, prototypeAccessors);
        return Container;
    }(DisplayObject));
    Container.prototype.containerUpdateTransform = Container.prototype.updateTransform;
    var accessibleTarget = {
        accessible: false,
        accessibleTitle: null,
        accessibleHint: null,
        tabIndex: 0,
        _accessibleActive: false,
        _accessibleDiv: false,
        accessibleType: 'button',
        accessiblePointerEvents: 'auto',
        accessibleChildren: true,
    };
    DisplayObject.mixin(accessibleTarget);
    var KEY_CODE_TAB = 9;
    var DIV_TOUCH_SIZE = 100;
    var DIV_TOUCH_POS_X = 0;
    var DIV_TOUCH_POS_Y = 0;
    var DIV_TOUCH_ZINDEX = 2;
    var DIV_HOOK_SIZE = 1;
    var DIV_HOOK_POS_X = -1000;
    var DIV_HOOK_POS_Y = -1000;
    var DIV_HOOK_ZINDEX = 2;
    var AccessibilityManager = function AccessibilityManager(renderer) {
        this._hookDiv = null;
        if (isMobile$1.tablet || isMobile$1.phone) {
            this.createTouchHook();
        }
        var div = document.createElement('div');
        div.style.width = DIV_TOUCH_SIZE + "px";
        div.style.height = DIV_TOUCH_SIZE + "px";
        div.style.position = 'absolute';
        div.style.top = DIV_TOUCH_POS_X + "px";
        div.style.left = DIV_TOUCH_POS_Y + "px";
        div.style.zIndex = DIV_TOUCH_ZINDEX;
        this.div = div;
        this.pool = [];
        this.renderId = 0;
        this.debug = false;
        this.renderer = renderer;
        this.children = [];
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this.isActive = false;
        this.isMobileAccessibility = false;
        window.addEventListener('keydown', this._onKeyDown, false);
    };
    AccessibilityManager.prototype.createTouchHook = function createTouchHook() {
        var this$1 = this;
        var hookDiv = document.createElement('button');
        hookDiv.style.width = DIV_HOOK_SIZE + "px";
        hookDiv.style.height = DIV_HOOK_SIZE + "px";
        hookDiv.style.position = 'absolute';
        hookDiv.style.top = DIV_HOOK_POS_X + "px";
        hookDiv.style.left = DIV_HOOK_POS_Y + "px";
        hookDiv.style.zIndex = DIV_HOOK_ZINDEX;
        hookDiv.style.backgroundColor = '#FF0000';
        hookDiv.title = 'HOOK DIV';
        hookDiv.addEventListener('focus', function () {
            this$1.isMobileAccessibility = true;
            this$1.activate();
            this$1.destroyTouchHook();
        });
        document.body.appendChild(hookDiv);
        this._hookDiv = hookDiv;
    };
    AccessibilityManager.prototype.destroyTouchHook = function destroyTouchHook() {
        if (!this._hookDiv) {
            return;
        }
        document.body.removeChild(this._hookDiv);
        this._hookDiv = null;
    };
    AccessibilityManager.prototype.activate = function activate() {
        if (this.isActive) {
            return;
        }
        this.isActive = true;
        window.document.addEventListener('mousemove', this._onMouseMove, true);
        window.removeEventListener('keydown', this._onKeyDown, false);
        this.renderer.on('postrender', this.update, this);
        if (this.renderer.view.parentNode) {
            this.renderer.view.parentNode.appendChild(this.div);
        }
    };
    AccessibilityManager.prototype.deactivate = function deactivate() {
        if (!this.isActive || this.isMobileAccessibility) {
            return;
        }
        this.isActive = false;
        window.document.removeEventListener('mousemove', this._onMouseMove, true);
        window.addEventListener('keydown', this._onKeyDown, false);
        this.renderer.off('postrender', this.update);
        if (this.div.parentNode) {
            this.div.parentNode.removeChild(this.div);
        }
    };
    AccessibilityManager.prototype.updateAccessibleObjects = function updateAccessibleObjects(displayObject) {
        if (!displayObject.visible || !displayObject.accessibleChildren) {
            return;
        }
        if (displayObject.accessible && displayObject.interactive) {
            if (!displayObject._accessibleActive) {
                this.addChild(displayObject);
            }
            displayObject.renderId = this.renderId;
        }
        var children = displayObject.children;
        for (var i = 0; i < children.length; i++) {
            this.updateAccessibleObjects(children[i]);
        }
    };
    AccessibilityManager.prototype.update = function update() {
        if (!this.renderer.renderingToScreen) {
            return;
        }
        this.updateAccessibleObjects(this.renderer._lastObjectRendered);
        var rect = this.renderer.view.getBoundingClientRect();
        var sx = rect.width / this.renderer.width;
        var sy = rect.height / this.renderer.height;
        var div = this.div;
        div.style.left = (rect.left) + "px";
        div.style.top = (rect.top) + "px";
        div.style.width = (this.renderer.width) + "px";
        div.style.height = (this.renderer.height) + "px";
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            if (child.renderId !== this.renderId) {
                child._accessibleActive = false;
                removeItems(this.children, i, 1);
                this.div.removeChild(child._accessibleDiv);
                this.pool.push(child._accessibleDiv);
                child._accessibleDiv = null;
                i--;
                if (this.children.length === 0) {
                    this.deactivate();
                }
            }
            else {
                div = child._accessibleDiv;
                var hitArea = child.hitArea;
                var wt = child.worldTransform;
                if (child.hitArea) {
                    div.style.left = ((wt.tx + (hitArea.x * wt.a)) * sx) + "px";
                    div.style.top = ((wt.ty + (hitArea.y * wt.d)) * sy) + "px";
                    div.style.width = (hitArea.width * wt.a * sx) + "px";
                    div.style.height = (hitArea.height * wt.d * sy) + "px";
                }
                else {
                    hitArea = child.getBounds();
                    this.capHitArea(hitArea);
                    div.style.left = (hitArea.x * sx) + "px";
                    div.style.top = (hitArea.y * sy) + "px";
                    div.style.width = (hitArea.width * sx) + "px";
                    div.style.height = (hitArea.height * sy) + "px";
                    if (div.title !== child.accessibleTitle && child.accessibleTitle !== null) {
                        div.title = child.accessibleTitle;
                    }
                    if (div.getAttribute('aria-label') !== child.accessibleHint
                        && child.accessibleHint !== null) {
                        div.setAttribute('aria-label', child.accessibleHint);
                    }
                }
                if (child.accessibleTitle !== div.title || child.tabIndex !== div.tabIndex) {
                    div.title = child.accessibleTitle;
                    div.tabIndex = child.tabIndex;
                    if (this.debug) {
                        this.updateDebugHTML(div);
                    }
                }
            }
        }
        this.renderId++;
    };
    AccessibilityManager.prototype.updateDebugHTML = function updateDebugHTML(div) {
        div.innerHTML = "type: " + (div.type) + "</br> title : " + (div.title) + "</br> tabIndex: " + (div.tabIndex);
    };
    AccessibilityManager.prototype.capHitArea = function capHitArea(hitArea) {
        if (hitArea.x < 0) {
            hitArea.width += hitArea.x;
            hitArea.x = 0;
        }
        if (hitArea.y < 0) {
            hitArea.height += hitArea.y;
            hitArea.y = 0;
        }
        if (hitArea.x + hitArea.width > this.renderer.width) {
            hitArea.width = this.renderer.width - hitArea.x;
        }
        if (hitArea.y + hitArea.height > this.renderer.height) {
            hitArea.height = this.renderer.height - hitArea.y;
        }
    };
    AccessibilityManager.prototype.addChild = function addChild(displayObject) {
        var div = this.pool.pop();
        if (!div) {
            div = document.createElement('button');
            div.style.width = DIV_TOUCH_SIZE + "px";
            div.style.height = DIV_TOUCH_SIZE + "px";
            div.style.backgroundColor = this.debug ? 'rgba(255,255,255,0.5)' : 'transparent';
            div.style.position = 'absolute';
            div.style.zIndex = DIV_TOUCH_ZINDEX;
            div.style.borderStyle = 'none';
            if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
                div.setAttribute('aria-live', 'off');
            }
            else {
                div.setAttribute('aria-live', 'polite');
            }
            if (navigator.userAgent.match(/rv:.*Gecko\//)) {
                div.setAttribute('aria-relevant', 'additions');
            }
            else {
                div.setAttribute('aria-relevant', 'text');
            }
            div.addEventListener('click', this._onClick.bind(this));
            div.addEventListener('focus', this._onFocus.bind(this));
            div.addEventListener('focusout', this._onFocusOut.bind(this));
        }
        div.style.pointerEvents = displayObject.accessiblePointerEvents;
        div.type = displayObject.accessibleType;
        if (displayObject.accessibleTitle && displayObject.accessibleTitle !== null) {
            div.title = displayObject.accessibleTitle;
        }
        else if (!displayObject.accessibleHint
            || displayObject.accessibleHint === null) {
            div.title = "displayObject " + (displayObject.tabIndex);
        }
        if (displayObject.accessibleHint
            && displayObject.accessibleHint !== null) {
            div.setAttribute('aria-label', displayObject.accessibleHint);
        }
        if (this.debug) {
            this.updateDebugHTML(div);
        }
        displayObject._accessibleActive = true;
        displayObject._accessibleDiv = div;
        div.displayObject = displayObject;
        this.children.push(displayObject);
        this.div.appendChild(displayObject._accessibleDiv);
        displayObject._accessibleDiv.tabIndex = displayObject.tabIndex;
    };
    AccessibilityManager.prototype._onClick = function _onClick(e) {
        var interactionManager = this.renderer.plugins.interaction;
        interactionManager.dispatchEvent(e.target.displayObject, 'click', interactionManager.eventData);
        interactionManager.dispatchEvent(e.target.displayObject, 'pointertap', interactionManager.eventData);
        interactionManager.dispatchEvent(e.target.displayObject, 'tap', interactionManager.eventData);
    };
    AccessibilityManager.prototype._onFocus = function _onFocus(e) {
        if (!e.target.getAttribute('aria-live', 'off')) {
            e.target.setAttribute('aria-live', 'assertive');
        }
        var interactionManager = this.renderer.plugins.interaction;
        interactionManager.dispatchEvent(e.target.displayObject, 'mouseover', interactionManager.eventData);
    };
    AccessibilityManager.prototype._onFocusOut = function _onFocusOut(e) {
        if (!e.target.getAttribute('aria-live', 'off')) {
            e.target.setAttribute('aria-live', 'polite');
        }
        var interactionManager = this.renderer.plugins.interaction;
        interactionManager.dispatchEvent(e.target.displayObject, 'mouseout', interactionManager.eventData);
    };
    AccessibilityManager.prototype._onKeyDown = function _onKeyDown(e) {
        if (e.keyCode !== KEY_CODE_TAB) {
            return;
        }
        this.activate();
    };
    AccessibilityManager.prototype._onMouseMove = function _onMouseMove(e) {
        if (e.movementX === 0 && e.movementY === 0) {
            return;
        }
        this.deactivate();
    };
    AccessibilityManager.prototype.destroy = function destroy() {
        this.destroyTouchHook();
        this.div = null;
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].div = null;
        }
        window.document.removeEventListener('mousemove', this._onMouseMove, true);
        window.removeEventListener('keydown', this._onKeyDown);
        this.pool = null;
        this.children = null;
        this.renderer = null;
    };
    var accessibility_es = ({
        AccessibilityManager: AccessibilityManager,
        accessibleTarget: accessibleTarget
    });
    settings.TARGET_FPMS = 0.06;
    (function (UPDATE_PRIORITY) {
        UPDATE_PRIORITY[UPDATE_PRIORITY["INTERACTION"] = 50] = "INTERACTION";
        UPDATE_PRIORITY[UPDATE_PRIORITY["HIGH"] = 25] = "HIGH";
        UPDATE_PRIORITY[UPDATE_PRIORITY["NORMAL"] = 0] = "NORMAL";
        UPDATE_PRIORITY[UPDATE_PRIORITY["LOW"] = -25] = "LOW";
        UPDATE_PRIORITY[UPDATE_PRIORITY["UTILITY"] = -50] = "UTILITY";
    })(exports.UPDATE_PRIORITY || (exports.UPDATE_PRIORITY = {}));
    var TickerListener = (function () {
        function TickerListener(fn, context, priority, once) {
            if (context === void 0) {
                context = null;
            }
            if (priority === void 0) {
                priority = 0;
            }
            if (once === void 0) {
                once = false;
            }
            this.fn = fn;
            this.context = context;
            this.priority = priority;
            this.once = once;
            this.next = null;
            this.previous = null;
            this._destroyed = false;
        }
        TickerListener.prototype.match = function (fn, context) {
            if (context === void 0) {
                context = null;
            }
            return this.fn === fn && this.context === context;
        };
        TickerListener.prototype.emit = function (deltaTime) {
            if (this.fn) {
                if (this.context) {
                    this.fn.call(this.context, deltaTime);
                }
                else {
                    this.fn(deltaTime);
                }
            }
            var redirect = this.next;
            if (this.once) {
                this.destroy(true);
            }
            if (this._destroyed) {
                this.next = null;
            }
            return redirect;
        };
        TickerListener.prototype.connect = function (previous) {
            this.previous = previous;
            if (previous.next) {
                previous.next.previous = this;
            }
            this.next = previous.next;
            previous.next = this;
        };
        TickerListener.prototype.destroy = function (hard) {
            if (hard === void 0) {
                hard = false;
            }
            this._destroyed = true;
            this.fn = null;
            this.context = null;
            if (this.previous) {
                this.previous.next = this.next;
            }
            if (this.next) {
                this.next.previous = this.previous;
            }
            var redirect = this.next;
            this.next = hard ? null : redirect;
            this.previous = null;
            return redirect;
        };
        return TickerListener;
    }());
    var Ticker = (function () {
        function Ticker() {
            var _this = this;
            this._head = new TickerListener(null, null, Infinity);
            this._requestId = null;
            this._maxElapsedMS = 100;
            this._minElapsedMS = 0;
            this.autoStart = false;
            this.deltaTime = 1;
            this.deltaMS = 1 / settings.TARGET_FPMS;
            this.elapsedMS = 1 / settings.TARGET_FPMS;
            this.lastTime = -1;
            this.speed = 1;
            this.started = false;
            this._protected = false;
            this._lastFrame = -1;
            this._tick = function (time) {
                _this._requestId = null;
                if (_this.started) {
                    _this.update(time);
                    if (_this.started && _this._requestId === null && _this._head.next) {
                        _this._requestId = requestAnimationFrame(_this._tick);
                    }
                }
            };
        }
        Ticker.prototype._requestIfNeeded = function () {
            if (this._requestId === null && this._head.next) {
                this.lastTime = performance.now();
                this._lastFrame = this.lastTime;
                this._requestId = requestAnimationFrame(this._tick);
            }
        };
        Ticker.prototype._cancelIfNeeded = function () {
            if (this._requestId !== null) {
                cancelAnimationFrame(this._requestId);
                this._requestId = null;
            }
        };
        Ticker.prototype._startIfPossible = function () {
            if (this.started) {
                this._requestIfNeeded();
            }
            else if (this.autoStart) {
                this.start();
            }
        };
        Ticker.prototype.add = function (fn, context, priority) {
            if (priority === void 0) {
                priority = exports.UPDATE_PRIORITY.NORMAL;
            }
            return this._addListener(new TickerListener(fn, context, priority));
        };
        Ticker.prototype.addOnce = function (fn, context, priority) {
            if (priority === void 0) {
                priority = exports.UPDATE_PRIORITY.NORMAL;
            }
            return this._addListener(new TickerListener(fn, context, priority, true));
        };
        Ticker.prototype._addListener = function (listener) {
            var current = this._head.next;
            var previous = this._head;
            if (!current) {
                listener.connect(previous);
            }
            else {
                while (current) {
                    if (listener.priority > current.priority) {
                        listener.connect(previous);
                        break;
                    }
                    previous = current;
                    current = current.next;
                }
                if (!listener.previous) {
                    listener.connect(previous);
                }
            }
            this._startIfPossible();
            return this;
        };
        Ticker.prototype.remove = function (fn, context) {
            var listener = this._head.next;
            while (listener) {
                if (listener.match(fn, context)) {
                    listener = listener.destroy();
                }
                else {
                    listener = listener.next;
                }
            }
            if (!this._head.next) {
                this._cancelIfNeeded();
            }
            return this;
        };
        Object.defineProperty(Ticker.prototype, "count", {
            get: function () {
                if (!this._head) {
                    return 0;
                }
                var count = 0;
                var current = this._head;
                while ((current = current.next)) {
                    count++;
                }
                return count;
            },
            enumerable: true,
            configurable: true
        });
        Ticker.prototype.start = function () {
            if (!this.started) {
                this.started = true;
                this._requestIfNeeded();
            }
        };
        Ticker.prototype.stop = function () {
            if (this.started) {
                this.started = false;
                this._cancelIfNeeded();
            }
        };
        Ticker.prototype.destroy = function () {
            if (!this._protected) {
                this.stop();
                var listener = this._head.next;
                while (listener) {
                    listener = listener.destroy(true);
                }
                this._head.destroy();
                this._head = null;
            }
        };
        Ticker.prototype.update = function (currentTime) {
            if (currentTime === void 0) {
                currentTime = performance.now();
            }
            var elapsedMS;
            if (currentTime > this.lastTime) {
                elapsedMS = this.elapsedMS = currentTime - this.lastTime;
                if (elapsedMS > this._maxElapsedMS) {
                    elapsedMS = this._maxElapsedMS;
                }
                elapsedMS *= this.speed;
                if (this._minElapsedMS) {
                    var delta = currentTime - this._lastFrame | 0;
                    if (delta < this._minElapsedMS) {
                        return;
                    }
                    this._lastFrame = currentTime - (delta % this._minElapsedMS);
                }
                this.deltaMS = elapsedMS;
                this.deltaTime = this.deltaMS * settings.TARGET_FPMS;
                var head = this._head;
                var listener = head.next;
                while (listener) {
                    listener = listener.emit(this.deltaTime);
                }
                if (!head.next) {
                    this._cancelIfNeeded();
                }
            }
            else {
                this.deltaTime = this.deltaMS = this.elapsedMS = 0;
            }
            this.lastTime = currentTime;
        };
        Object.defineProperty(Ticker.prototype, "FPS", {
            get: function () {
                return 1000 / this.elapsedMS;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Ticker.prototype, "minFPS", {
            get: function () {
                return 1000 / this._maxElapsedMS;
            },
            set: function (fps) {
                var minFPS = Math.min(this.maxFPS, fps);
                var minFPMS = Math.min(Math.max(0, minFPS) / 1000, settings.TARGET_FPMS);
                this._maxElapsedMS = 1 / minFPMS;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Ticker.prototype, "maxFPS", {
            get: function () {
                if (this._minElapsedMS) {
                    return Math.round(1000 / this._minElapsedMS);
                }
                return 0;
            },
            set: function (fps) {
                if (fps === 0) {
                    this._minElapsedMS = 0;
                }
                else {
                    var maxFPS = Math.max(this.minFPS, fps);
                    this._minElapsedMS = 1 / (maxFPS / 1000);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Ticker, "shared", {
            get: function () {
                if (!Ticker._shared) {
                    var shared = Ticker._shared = new Ticker();
                    shared.autoStart = true;
                    shared._protected = true;
                }
                return Ticker._shared;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Ticker, "system", {
            get: function () {
                if (!Ticker._system) {
                    var system = Ticker._system = new Ticker();
                    system.autoStart = true;
                    system._protected = true;
                }
                return Ticker._system;
            },
            enumerable: true,
            configurable: true
        });
        return Ticker;
    }());
    var TickerPlugin = (function () {
        function TickerPlugin() {
        }
        TickerPlugin.init = function (options) {
            var _this = this;
            options = Object.assign({
                autoStart: true,
                sharedTicker: false,
            }, options);
            Object.defineProperty(this, 'ticker', {
                set: function (ticker) {
                    if (this._ticker) {
                        this._ticker.remove(this.render, this);
                    }
                    this._ticker = ticker;
                    if (ticker) {
                        ticker.add(this.render, this, exports.UPDATE_PRIORITY.LOW);
                    }
                },
                get: function () {
                    return this._ticker;
                },
            });
            this.stop = function () {
                _this._ticker.stop();
            };
            this.start = function () {
                _this._ticker.start();
            };
            this._ticker = null;
            this.ticker = options.sharedTicker ? Ticker.shared : new Ticker();
            if (options.autoStart) {
                this.start();
            }
        };
        TickerPlugin.destroy = function () {
            if (this._ticker) {
                var oldTicker = this._ticker;
                this.ticker = null;
                oldTicker.destroy();
            }
        };
        return TickerPlugin;
    }());
    var InteractionData = function InteractionData() {
        this.global = new Point();
        this.target = null;
        this.originalEvent = null;
        this.identifier = null;
        this.isPrimary = false;
        this.button = 0;
        this.buttons = 0;
        this.width = 0;
        this.height = 0;
        this.tiltX = 0;
        this.tiltY = 0;
        this.pointerType = null;
        this.pressure = 0;
        this.rotationAngle = 0;
        this.twist = 0;
        this.tangentialPressure = 0;
    };
    var prototypeAccessors = { pointerId: { configurable: true } };
    prototypeAccessors.pointerId.get = function () {
        return this.identifier;
    };
    InteractionData.prototype.getLocalPosition = function getLocalPosition(displayObject, point, globalPos) {
        return displayObject.worldTransform.applyInverse(globalPos || this.global, point);
    };
    InteractionData.prototype.copyEvent = function copyEvent(event) {
        if (event.isPrimary) {
            this.isPrimary = true;
        }
        this.button = event.button;
        this.buttons = Number.isInteger(event.buttons) ? event.buttons : event.which;
        this.width = event.width;
        this.height = event.height;
        this.tiltX = event.tiltX;
        this.tiltY = event.tiltY;
        this.pointerType = event.pointerType;
        this.pressure = event.pressure;
        this.rotationAngle = event.rotationAngle;
        this.twist = event.twist || 0;
        this.tangentialPressure = event.tangentialPressure || 0;
    };
    InteractionData.prototype.reset = function reset() {
        this.isPrimary = false;
    };
    Object.defineProperties(InteractionData.prototype, prototypeAccessors);
    var InteractionEvent = function InteractionEvent() {
        this.stopped = false;
        this.stopsPropagatingAt = null;
        this.stopPropagationHint = false;
        this.target = null;
        this.currentTarget = null;
        this.type = null;
        this.data = null;
    };
    InteractionEvent.prototype.stopPropagation = function stopPropagation() {
        this.stopped = true;
        this.stopPropagationHint = true;
        this.stopsPropagatingAt = this.currentTarget;
    };
    InteractionEvent.prototype.reset = function reset() {
        this.stopped = false;
        this.stopsPropagatingAt = null;
        this.stopPropagationHint = false;
        this.currentTarget = null;
        this.target = null;
    };
    var InteractionTrackingData = function InteractionTrackingData(pointerId) {
        this._pointerId = pointerId;
        this._flags = InteractionTrackingData.FLAGS.NONE;
    };
    var prototypeAccessors$1 = { pointerId: { configurable: true }, flags: { configurable: true }, none: { configurable: true }, over: { configurable: true }, rightDown: { configurable: true }, leftDown: { configurable: true } };
    InteractionTrackingData.prototype._doSet = function _doSet(flag, yn) {
        if (yn) {
            this._flags = this._flags | flag;
        }
        else {
            this._flags = this._flags & (~flag);
        }
    };
    prototypeAccessors$1.pointerId.get = function () {
        return this._pointerId;
    };
    prototypeAccessors$1.flags.get = function () {
        return this._flags;
    };
    prototypeAccessors$1.flags.set = function (flags) {
        this._flags = flags;
    };
    prototypeAccessors$1.none.get = function () {
        return this._flags === this.constructor.FLAGS.NONE;
    };
    prototypeAccessors$1.over.get = function () {
        return (this._flags & this.constructor.FLAGS.OVER) !== 0;
    };
    prototypeAccessors$1.over.set = function (yn) {
        this._doSet(this.constructor.FLAGS.OVER, yn);
    };
    prototypeAccessors$1.rightDown.get = function () {
        return (this._flags & this.constructor.FLAGS.RIGHT_DOWN) !== 0;
    };
    prototypeAccessors$1.rightDown.set = function (yn) {
        this._doSet(this.constructor.FLAGS.RIGHT_DOWN, yn);
    };
    prototypeAccessors$1.leftDown.get = function () {
        return (this._flags & this.constructor.FLAGS.LEFT_DOWN) !== 0;
    };
    prototypeAccessors$1.leftDown.set = function (yn) {
        this._doSet(this.constructor.FLAGS.LEFT_DOWN, yn);
    };
    Object.defineProperties(InteractionTrackingData.prototype, prototypeAccessors$1);
    InteractionTrackingData.FLAGS = Object.freeze({
        NONE: 0,
        OVER: 1 << 0,
        LEFT_DOWN: 1 << 1,
        RIGHT_DOWN: 1 << 2,
    });
    var TreeSearch = function TreeSearch() {
        this._tempPoint = new Point();
    };
    TreeSearch.prototype.recursiveFindHit = function recursiveFindHit(interactionEvent, displayObject, func, hitTest, interactive) {
        if (!displayObject || !displayObject.visible) {
            return false;
        }
        var point = interactionEvent.data.global;
        interactive = displayObject.interactive || interactive;
        var hit = false;
        var interactiveParent = interactive;
        var hitTestChildren = true;
        if (displayObject.hitArea) {
            if (hitTest) {
                displayObject.worldTransform.applyInverse(point, this._tempPoint);
                if (!displayObject.hitArea.contains(this._tempPoint.x, this._tempPoint.y)) {
                    hitTest = false;
                    hitTestChildren = false;
                }
                else {
                    hit = true;
                }
            }
            interactiveParent = false;
        }
        else if (displayObject._mask) {
            if (hitTest) {
                if (!(displayObject._mask.containsPoint && displayObject._mask.containsPoint(point))) {
                    hitTest = false;
                }
            }
        }
        if (hitTestChildren && displayObject.interactiveChildren && displayObject.children) {
            var children = displayObject.children;
            for (var i = children.length - 1; i >= 0; i--) {
                var child = children[i];
                var childHit = this.recursiveFindHit(interactionEvent, child, func, hitTest, interactiveParent);
                if (childHit) {
                    if (!child.parent) {
                        continue;
                    }
                    interactiveParent = false;
                    if (childHit) {
                        if (interactionEvent.target) {
                            hitTest = false;
                        }
                        hit = true;
                    }
                }
            }
        }
        if (interactive) {
            if (hitTest && !interactionEvent.target) {
                if (!displayObject.hitArea && displayObject.containsPoint) {
                    if (displayObject.containsPoint(point)) {
                        hit = true;
                    }
                }
            }
            if (displayObject.interactive) {
                if (hit && !interactionEvent.target) {
                    interactionEvent.target = displayObject;
                }
                if (func) {
                    func(interactionEvent, displayObject, !!hit);
                }
            }
        }
        return hit;
    };
    TreeSearch.prototype.findHit = function findHit(interactionEvent, displayObject, func, hitTest) {
        this.recursiveFindHit(interactionEvent, displayObject, func, hitTest, false);
    };
    var interactiveTarget = {
        interactive: false,
        interactiveChildren: true,
        hitArea: null,
        get buttonMode() {
            return this.cursor === 'pointer';
        },
        set buttonMode(value) {
            if (value) {
                this.cursor = 'pointer';
            }
            else if (this.cursor === 'pointer') {
                this.cursor = null;
            }
        },
        cursor: null,
        get trackedPointers() {
            if (this._trackedPointers === undefined) {
                this._trackedPointers = {};
            }
            return this._trackedPointers;
        },
        _trackedPointers: undefined,
    };
    DisplayObject.mixin(interactiveTarget);
    var MOUSE_POINTER_ID = 1;
    var hitTestEvent = {
        target: null,
        data: {
            global: null,
        },
    };
    var InteractionManager = (function (EventEmitter) {
        function InteractionManager(renderer, options) {
            EventEmitter.call(this);
            options = options || {};
            this.renderer = renderer;
            this.autoPreventDefault = options.autoPreventDefault !== undefined ? options.autoPreventDefault : true;
            this.interactionFrequency = options.interactionFrequency || 10;
            this.mouse = new InteractionData();
            this.mouse.identifier = MOUSE_POINTER_ID;
            this.mouse.global.set(-999999);
            this.activeInteractionData = {};
            this.activeInteractionData[MOUSE_POINTER_ID] = this.mouse;
            this.interactionDataPool = [];
            this.eventData = new InteractionEvent();
            this.interactionDOMElement = null;
            this.moveWhenInside = false;
            this.eventsAdded = false;
            this.tickerAdded = false;
            this.mouseOverRenderer = false;
            this.supportsTouchEvents = 'ontouchstart' in window;
            this.supportsPointerEvents = !!window.PointerEvent;
            this.onPointerUp = this.onPointerUp.bind(this);
            this.processPointerUp = this.processPointerUp.bind(this);
            this.onPointerCancel = this.onPointerCancel.bind(this);
            this.processPointerCancel = this.processPointerCancel.bind(this);
            this.onPointerDown = this.onPointerDown.bind(this);
            this.processPointerDown = this.processPointerDown.bind(this);
            this.onPointerMove = this.onPointerMove.bind(this);
            this.processPointerMove = this.processPointerMove.bind(this);
            this.onPointerOut = this.onPointerOut.bind(this);
            this.processPointerOverOut = this.processPointerOverOut.bind(this);
            this.onPointerOver = this.onPointerOver.bind(this);
            this.cursorStyles = {
                default: 'inherit',
                pointer: 'pointer',
            };
            this.currentCursorMode = null;
            this.cursor = null;
            this.resolution = 1;
            this.delayedEvents = [];
            this.search = new TreeSearch();
            this._useSystemTicker = options.useSystemTicker !== undefined ? options.useSystemTicker : true;
            this.setTargetElement(this.renderer.view, this.renderer.resolution);
        }
        if (EventEmitter) {
            InteractionManager.__proto__ = EventEmitter;
        }
        InteractionManager.prototype = Object.create(EventEmitter && EventEmitter.prototype);
        InteractionManager.prototype.constructor = InteractionManager;
        var prototypeAccessors = { useSystemTicker: { configurable: true } };
        prototypeAccessors.useSystemTicker.get = function () {
            return this._useSystemTicker;
        };
        prototypeAccessors.useSystemTicker.set = function (useSystemTicker) {
            this._useSystemTicker = useSystemTicker;
            if (useSystemTicker) {
                this.addTickerListener();
            }
            else {
                this.removeTickerListener();
            }
        };
        InteractionManager.prototype.hitTest = function hitTest(globalPoint, root) {
            hitTestEvent.target = null;
            hitTestEvent.data.global = globalPoint;
            if (!root) {
                root = this.renderer._lastObjectRendered;
            }
            this.processInteractive(hitTestEvent, root, null, true);
            return hitTestEvent.target;
        };
        InteractionManager.prototype.setTargetElement = function setTargetElement(element, resolution) {
            if (resolution === void 0) {
                resolution = 1;
            }
            this.removeTickerListener();
            this.removeEvents();
            this.interactionDOMElement = element;
            this.resolution = resolution;
            this.addEvents();
            this.addTickerListener();
        };
        InteractionManager.prototype.addTickerListener = function addTickerListener() {
            if (this.tickerAdded || !this.interactionDOMElement || !this._useSystemTicker) {
                return;
            }
            Ticker.system.add(this.tickerUpdate, this, exports.UPDATE_PRIORITY.INTERACTION);
            this.tickerAdded = true;
        };
        InteractionManager.prototype.removeTickerListener = function removeTickerListener() {
            if (!this.tickerAdded) {
                return;
            }
            Ticker.system.remove(this.tickerUpdate, this);
            this.tickerAdded = false;
        };
        InteractionManager.prototype.addEvents = function addEvents() {
            if (this.eventsAdded || !this.interactionDOMElement) {
                return;
            }
            if (window.navigator.msPointerEnabled) {
                this.interactionDOMElement.style['-ms-content-zooming'] = 'none';
                this.interactionDOMElement.style['-ms-touch-action'] = 'none';
            }
            else if (this.supportsPointerEvents) {
                this.interactionDOMElement.style['touch-action'] = 'none';
            }
            if (this.supportsPointerEvents) {
                window.document.addEventListener('pointermove', this.onPointerMove, true);
                this.interactionDOMElement.addEventListener('pointerdown', this.onPointerDown, true);
                this.interactionDOMElement.addEventListener('pointerleave', this.onPointerOut, true);
                this.interactionDOMElement.addEventListener('pointerover', this.onPointerOver, true);
                window.addEventListener('pointercancel', this.onPointerCancel, true);
                window.addEventListener('pointerup', this.onPointerUp, true);
            }
            else {
                window.document.addEventListener('mousemove', this.onPointerMove, true);
                this.interactionDOMElement.addEventListener('mousedown', this.onPointerDown, true);
                this.interactionDOMElement.addEventListener('mouseout', this.onPointerOut, true);
                this.interactionDOMElement.addEventListener('mouseover', this.onPointerOver, true);
                window.addEventListener('mouseup', this.onPointerUp, true);
            }
            if (this.supportsTouchEvents) {
                this.interactionDOMElement.addEventListener('touchstart', this.onPointerDown, true);
                this.interactionDOMElement.addEventListener('touchcancel', this.onPointerCancel, true);
                this.interactionDOMElement.addEventListener('touchend', this.onPointerUp, true);
                this.interactionDOMElement.addEventListener('touchmove', this.onPointerMove, true);
            }
            this.eventsAdded = true;
        };
        InteractionManager.prototype.removeEvents = function removeEvents() {
            if (!this.eventsAdded || !this.interactionDOMElement) {
                return;
            }
            if (window.navigator.msPointerEnabled) {
                this.interactionDOMElement.style['-ms-content-zooming'] = '';
                this.interactionDOMElement.style['-ms-touch-action'] = '';
            }
            else if (this.supportsPointerEvents) {
                this.interactionDOMElement.style['touch-action'] = '';
            }
            if (this.supportsPointerEvents) {
                window.document.removeEventListener('pointermove', this.onPointerMove, true);
                this.interactionDOMElement.removeEventListener('pointerdown', this.onPointerDown, true);
                this.interactionDOMElement.removeEventListener('pointerleave', this.onPointerOut, true);
                this.interactionDOMElement.removeEventListener('pointerover', this.onPointerOver, true);
                window.removeEventListener('pointercancel', this.onPointerCancel, true);
                window.removeEventListener('pointerup', this.onPointerUp, true);
            }
            else {
                window.document.removeEventListener('mousemove', this.onPointerMove, true);
                this.interactionDOMElement.removeEventListener('mousedown', this.onPointerDown, true);
                this.interactionDOMElement.removeEventListener('mouseout', this.onPointerOut, true);
                this.interactionDOMElement.removeEventListener('mouseover', this.onPointerOver, true);
                window.removeEventListener('mouseup', this.onPointerUp, true);
            }
            if (this.supportsTouchEvents) {
                this.interactionDOMElement.removeEventListener('touchstart', this.onPointerDown, true);
                this.interactionDOMElement.removeEventListener('touchcancel', this.onPointerCancel, true);
                this.interactionDOMElement.removeEventListener('touchend', this.onPointerUp, true);
                this.interactionDOMElement.removeEventListener('touchmove', this.onPointerMove, true);
            }
            this.interactionDOMElement = null;
            this.eventsAdded = false;
        };
        InteractionManager.prototype.tickerUpdate = function tickerUpdate(deltaTime) {
            this._deltaTime += deltaTime;
            if (this._deltaTime < this.interactionFrequency) {
                return;
            }
            this._deltaTime = 0;
            this.update();
        };
        InteractionManager.prototype.update = function update() {
            if (!this.interactionDOMElement) {
                return;
            }
            if (this.didMove) {
                this.didMove = false;
                return;
            }
            this.cursor = null;
            for (var k in this.activeInteractionData) {
                if (this.activeInteractionData.hasOwnProperty(k)) {
                    var interactionData = this.activeInteractionData[k];
                    if (interactionData.originalEvent && interactionData.pointerType !== 'touch') {
                        var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, interactionData.originalEvent, interactionData);
                        this.processInteractive(interactionEvent, this.renderer._lastObjectRendered, this.processPointerOverOut, true);
                    }
                }
            }
            this.setCursorMode(this.cursor);
        };
        InteractionManager.prototype.setCursorMode = function setCursorMode(mode) {
            mode = mode || 'default';
            if (this.currentCursorMode === mode) {
                return;
            }
            this.currentCursorMode = mode;
            var style = this.cursorStyles[mode];
            if (style) {
                switch (typeof style) {
                    case 'string':
                        this.interactionDOMElement.style.cursor = style;
                        break;
                    case 'function':
                        style(mode);
                        break;
                    case 'object':
                        Object.assign(this.interactionDOMElement.style, style);
                        break;
                }
            }
            else if (typeof mode === 'string' && !Object.prototype.hasOwnProperty.call(this.cursorStyles, mode)) {
                this.interactionDOMElement.style.cursor = mode;
            }
        };
        InteractionManager.prototype.dispatchEvent = function dispatchEvent(displayObject, eventString, eventData) {
            if (!eventData.stopPropagationHint || displayObject === eventData.stopsPropagatingAt) {
                eventData.currentTarget = displayObject;
                eventData.type = eventString;
                displayObject.emit(eventString, eventData);
                if (displayObject[eventString]) {
                    displayObject[eventString](eventData);
                }
            }
        };
        InteractionManager.prototype.delayDispatchEvent = function delayDispatchEvent(displayObject, eventString, eventData) {
            this.delayedEvents.push({ displayObject: displayObject, eventString: eventString, eventData: eventData });
        };
        InteractionManager.prototype.mapPositionToPoint = function mapPositionToPoint(point, x, y) {
            var rect;
            if (!this.interactionDOMElement.parentElement) {
                rect = { x: 0, y: 0, width: 0, height: 0 };
            }
            else {
                rect = this.interactionDOMElement.getBoundingClientRect();
            }
            var resolutionMultiplier = 1.0 / this.resolution;
            point.x = ((x - rect.left) * (this.interactionDOMElement.width / rect.width)) * resolutionMultiplier;
            point.y = ((y - rect.top) * (this.interactionDOMElement.height / rect.height)) * resolutionMultiplier;
        };
        InteractionManager.prototype.processInteractive = function processInteractive(interactionEvent, displayObject, func, hitTest) {
            var hit = this.search.findHit(interactionEvent, displayObject, func, hitTest);
            var delayedEvents = this.delayedEvents;
            if (!delayedEvents.length) {
                return hit;
            }
            interactionEvent.stopPropagationHint = false;
            var delayedLen = delayedEvents.length;
            this.delayedEvents = [];
            for (var i = 0; i < delayedLen; i++) {
                var ref = delayedEvents[i];
                var displayObject$1 = ref.displayObject;
                var eventString = ref.eventString;
                var eventData = ref.eventData;
                if (eventData.stopsPropagatingAt === displayObject$1) {
                    eventData.stopPropagationHint = true;
                }
                this.dispatchEvent(displayObject$1, eventString, eventData);
            }
            return hit;
        };
        InteractionManager.prototype.onPointerDown = function onPointerDown(originalEvent) {
            if (this.supportsTouchEvents && originalEvent.pointerType === 'touch') {
                return;
            }
            var events = this.normalizeToPointerData(originalEvent);
            if (this.autoPreventDefault && events[0].isNormalized) {
                var cancelable = originalEvent.cancelable || !('cancelable' in originalEvent);
                if (cancelable) {
                    originalEvent.preventDefault();
                }
            }
            var eventLen = events.length;
            for (var i = 0; i < eventLen; i++) {
                var event = events[i];
                var interactionData = this.getInteractionDataForPointerId(event);
                var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
                interactionEvent.data.originalEvent = originalEvent;
                this.processInteractive(interactionEvent, this.renderer._lastObjectRendered, this.processPointerDown, true);
                this.emit('pointerdown', interactionEvent);
                if (event.pointerType === 'touch') {
                    this.emit('touchstart', interactionEvent);
                }
                else if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
                    var isRightButton = event.button === 2;
                    this.emit(isRightButton ? 'rightdown' : 'mousedown', this.eventData);
                }
            }
        };
        InteractionManager.prototype.processPointerDown = function processPointerDown(interactionEvent, displayObject, hit) {
            var data = interactionEvent.data;
            var id = interactionEvent.data.identifier;
            if (hit) {
                if (!displayObject.trackedPointers[id]) {
                    displayObject.trackedPointers[id] = new InteractionTrackingData(id);
                }
                this.dispatchEvent(displayObject, 'pointerdown', interactionEvent);
                if (data.pointerType === 'touch') {
                    this.dispatchEvent(displayObject, 'touchstart', interactionEvent);
                }
                else if (data.pointerType === 'mouse' || data.pointerType === 'pen') {
                    var isRightButton = data.button === 2;
                    if (isRightButton) {
                        displayObject.trackedPointers[id].rightDown = true;
                    }
                    else {
                        displayObject.trackedPointers[id].leftDown = true;
                    }
                    this.dispatchEvent(displayObject, isRightButton ? 'rightdown' : 'mousedown', interactionEvent);
                }
            }
        };
        InteractionManager.prototype.onPointerComplete = function onPointerComplete(originalEvent, cancelled, func) {
            var events = this.normalizeToPointerData(originalEvent);
            var eventLen = events.length;
            var eventAppend = originalEvent.target !== this.interactionDOMElement ? 'outside' : '';
            for (var i = 0; i < eventLen; i++) {
                var event = events[i];
                var interactionData = this.getInteractionDataForPointerId(event);
                var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
                interactionEvent.data.originalEvent = originalEvent;
                this.processInteractive(interactionEvent, this.renderer._lastObjectRendered, func, cancelled || !eventAppend);
                this.emit(cancelled ? 'pointercancel' : ("pointerup" + eventAppend), interactionEvent);
                if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
                    var isRightButton = event.button === 2;
                    this.emit(isRightButton ? ("rightup" + eventAppend) : ("mouseup" + eventAppend), interactionEvent);
                }
                else if (event.pointerType === 'touch') {
                    this.emit(cancelled ? 'touchcancel' : ("touchend" + eventAppend), interactionEvent);
                    this.releaseInteractionDataForPointerId(event.pointerId, interactionData);
                }
            }
        };
        InteractionManager.prototype.onPointerCancel = function onPointerCancel(event) {
            if (this.supportsTouchEvents && event.pointerType === 'touch') {
                return;
            }
            this.onPointerComplete(event, true, this.processPointerCancel);
        };
        InteractionManager.prototype.processPointerCancel = function processPointerCancel(interactionEvent, displayObject) {
            var data = interactionEvent.data;
            var id = interactionEvent.data.identifier;
            if (displayObject.trackedPointers[id] !== undefined) {
                delete displayObject.trackedPointers[id];
                this.dispatchEvent(displayObject, 'pointercancel', interactionEvent);
                if (data.pointerType === 'touch') {
                    this.dispatchEvent(displayObject, 'touchcancel', interactionEvent);
                }
            }
        };
        InteractionManager.prototype.onPointerUp = function onPointerUp(event) {
            if (this.supportsTouchEvents && event.pointerType === 'touch') {
                return;
            }
            this.onPointerComplete(event, false, this.processPointerUp);
        };
        InteractionManager.prototype.processPointerUp = function processPointerUp(interactionEvent, displayObject, hit) {
            var data = interactionEvent.data;
            var id = interactionEvent.data.identifier;
            var trackingData = displayObject.trackedPointers[id];
            var isTouch = data.pointerType === 'touch';
            var isMouse = (data.pointerType === 'mouse' || data.pointerType === 'pen');
            var isMouseTap = false;
            if (isMouse) {
                var isRightButton = data.button === 2;
                var flags = InteractionTrackingData.FLAGS;
                var test = isRightButton ? flags.RIGHT_DOWN : flags.LEFT_DOWN;
                var isDown = trackingData !== undefined && (trackingData.flags & test);
                if (hit) {
                    this.dispatchEvent(displayObject, isRightButton ? 'rightup' : 'mouseup', interactionEvent);
                    if (isDown) {
                        this.dispatchEvent(displayObject, isRightButton ? 'rightclick' : 'click', interactionEvent);
                        isMouseTap = true;
                    }
                }
                else if (isDown) {
                    this.dispatchEvent(displayObject, isRightButton ? 'rightupoutside' : 'mouseupoutside', interactionEvent);
                }
                if (trackingData) {
                    if (isRightButton) {
                        trackingData.rightDown = false;
                    }
                    else {
                        trackingData.leftDown = false;
                    }
                }
            }
            if (hit) {
                this.dispatchEvent(displayObject, 'pointerup', interactionEvent);
                if (isTouch) {
                    this.dispatchEvent(displayObject, 'touchend', interactionEvent);
                }
                if (trackingData) {
                    if (!isMouse || isMouseTap) {
                        this.dispatchEvent(displayObject, 'pointertap', interactionEvent);
                    }
                    if (isTouch) {
                        this.dispatchEvent(displayObject, 'tap', interactionEvent);
                        trackingData.over = false;
                    }
                }
            }
            else if (trackingData) {
                this.dispatchEvent(displayObject, 'pointerupoutside', interactionEvent);
                if (isTouch) {
                    this.dispatchEvent(displayObject, 'touchendoutside', interactionEvent);
                }
            }
            if (trackingData && trackingData.none) {
                delete displayObject.trackedPointers[id];
            }
        };
        InteractionManager.prototype.onPointerMove = function onPointerMove(originalEvent) {
            if (this.supportsTouchEvents && originalEvent.pointerType === 'touch') {
                return;
            }
            var events = this.normalizeToPointerData(originalEvent);
            if (events[0].pointerType === 'mouse' || events[0].pointerType === 'pen') {
                this.didMove = true;
                this.cursor = null;
            }
            var eventLen = events.length;
            for (var i = 0; i < eventLen; i++) {
                var event = events[i];
                var interactionData = this.getInteractionDataForPointerId(event);
                var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
                interactionEvent.data.originalEvent = originalEvent;
                this.processInteractive(interactionEvent, this.renderer._lastObjectRendered, this.processPointerMove, true);
                this.emit('pointermove', interactionEvent);
                if (event.pointerType === 'touch') {
                    this.emit('touchmove', interactionEvent);
                }
                if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
                    this.emit('mousemove', interactionEvent);
                }
            }
            if (events[0].pointerType === 'mouse') {
                this.setCursorMode(this.cursor);
            }
        };
        InteractionManager.prototype.processPointerMove = function processPointerMove(interactionEvent, displayObject, hit) {
            var data = interactionEvent.data;
            var isTouch = data.pointerType === 'touch';
            var isMouse = (data.pointerType === 'mouse' || data.pointerType === 'pen');
            if (isMouse) {
                this.processPointerOverOut(interactionEvent, displayObject, hit);
            }
            if (!this.moveWhenInside || hit) {
                this.dispatchEvent(displayObject, 'pointermove', interactionEvent);
                if (isTouch) {
                    this.dispatchEvent(displayObject, 'touchmove', interactionEvent);
                }
                if (isMouse) {
                    this.dispatchEvent(displayObject, 'mousemove', interactionEvent);
                }
            }
        };
        InteractionManager.prototype.onPointerOut = function onPointerOut(originalEvent) {
            if (this.supportsTouchEvents && originalEvent.pointerType === 'touch') {
                return;
            }
            var events = this.normalizeToPointerData(originalEvent);
            var event = events[0];
            if (event.pointerType === 'mouse') {
                this.mouseOverRenderer = false;
                this.setCursorMode(null);
            }
            var interactionData = this.getInteractionDataForPointerId(event);
            var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
            interactionEvent.data.originalEvent = event;
            this.processInteractive(interactionEvent, this.renderer._lastObjectRendered, this.processPointerOverOut, false);
            this.emit('pointerout', interactionEvent);
            if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
                this.emit('mouseout', interactionEvent);
            }
            else {
                this.releaseInteractionDataForPointerId(interactionData.identifier);
            }
        };
        InteractionManager.prototype.processPointerOverOut = function processPointerOverOut(interactionEvent, displayObject, hit) {
            var data = interactionEvent.data;
            var id = interactionEvent.data.identifier;
            var isMouse = (data.pointerType === 'mouse' || data.pointerType === 'pen');
            var trackingData = displayObject.trackedPointers[id];
            if (hit && !trackingData) {
                trackingData = displayObject.trackedPointers[id] = new InteractionTrackingData(id);
            }
            if (trackingData === undefined) {
                return;
            }
            if (hit && this.mouseOverRenderer) {
                if (!trackingData.over) {
                    trackingData.over = true;
                    this.delayDispatchEvent(displayObject, 'pointerover', interactionEvent);
                    if (isMouse) {
                        this.delayDispatchEvent(displayObject, 'mouseover', interactionEvent);
                    }
                }
                if (isMouse && this.cursor === null) {
                    this.cursor = displayObject.cursor;
                }
            }
            else if (trackingData.over) {
                trackingData.over = false;
                this.dispatchEvent(displayObject, 'pointerout', this.eventData);
                if (isMouse) {
                    this.dispatchEvent(displayObject, 'mouseout', interactionEvent);
                }
                if (trackingData.none) {
                    delete displayObject.trackedPointers[id];
                }
            }
        };
        InteractionManager.prototype.onPointerOver = function onPointerOver(originalEvent) {
            var events = this.normalizeToPointerData(originalEvent);
            var event = events[0];
            var interactionData = this.getInteractionDataForPointerId(event);
            var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
            interactionEvent.data.originalEvent = event;
            if (event.pointerType === 'mouse') {
                this.mouseOverRenderer = true;
            }
            this.emit('pointerover', interactionEvent);
            if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
                this.emit('mouseover', interactionEvent);
            }
        };
        InteractionManager.prototype.getInteractionDataForPointerId = function getInteractionDataForPointerId(event) {
            var pointerId = event.pointerId;
            var interactionData;
            if (pointerId === MOUSE_POINTER_ID || event.pointerType === 'mouse') {
                interactionData = this.mouse;
            }
            else if (this.activeInteractionData[pointerId]) {
                interactionData = this.activeInteractionData[pointerId];
            }
            else {
                interactionData = this.interactionDataPool.pop() || new InteractionData();
                interactionData.identifier = pointerId;
                this.activeInteractionData[pointerId] = interactionData;
            }
            interactionData.copyEvent(event);
            return interactionData;
        };
        InteractionManager.prototype.releaseInteractionDataForPointerId = function releaseInteractionDataForPointerId(pointerId) {
            var interactionData = this.activeInteractionData[pointerId];
            if (interactionData) {
                delete this.activeInteractionData[pointerId];
                interactionData.reset();
                this.interactionDataPool.push(interactionData);
            }
        };
        InteractionManager.prototype.configureInteractionEventForDOMEvent = function configureInteractionEventForDOMEvent(interactionEvent, pointerEvent, interactionData) {
            interactionEvent.data = interactionData;
            this.mapPositionToPoint(interactionData.global, pointerEvent.clientX, pointerEvent.clientY);
            if (pointerEvent.pointerType === 'touch') {
                pointerEvent.globalX = interactionData.global.x;
                pointerEvent.globalY = interactionData.global.y;
            }
            interactionData.originalEvent = pointerEvent;
            interactionEvent.reset();
            return interactionEvent;
        };
        InteractionManager.prototype.normalizeToPointerData = function normalizeToPointerData(event) {
            var normalizedEvents = [];
            if (this.supportsTouchEvents && event instanceof TouchEvent) {
                for (var i = 0, li = event.changedTouches.length; i < li; i++) {
                    var touch = event.changedTouches[i];
                    if (typeof touch.button === 'undefined') {
                        touch.button = event.touches.length ? 1 : 0;
                    }
                    if (typeof touch.buttons === 'undefined') {
                        touch.buttons = event.touches.length ? 1 : 0;
                    }
                    if (typeof touch.isPrimary === 'undefined') {
                        touch.isPrimary = event.touches.length === 1 && event.type === 'touchstart';
                    }
                    if (typeof touch.width === 'undefined') {
                        touch.width = touch.radiusX || 1;
                    }
                    if (typeof touch.height === 'undefined') {
                        touch.height = touch.radiusY || 1;
                    }
                    if (typeof touch.tiltX === 'undefined') {
                        touch.tiltX = 0;
                    }
                    if (typeof touch.tiltY === 'undefined') {
                        touch.tiltY = 0;
                    }
                    if (typeof touch.pointerType === 'undefined') {
                        touch.pointerType = 'touch';
                    }
                    if (typeof touch.pointerId === 'undefined') {
                        touch.pointerId = touch.identifier || 0;
                    }
                    if (typeof touch.pressure === 'undefined') {
                        touch.pressure = touch.force || 0.5;
                    }
                    if (typeof touch.twist === 'undefined') {
                        touch.twist = 0;
                    }
                    if (typeof touch.tangentialPressure === 'undefined') {
                        touch.tangentialPressure = 0;
                    }
                    if (typeof touch.layerX === 'undefined') {
                        touch.layerX = touch.offsetX = touch.clientX;
                    }
                    if (typeof touch.layerY === 'undefined') {
                        touch.layerY = touch.offsetY = touch.clientY;
                    }
                    touch.isNormalized = true;
                    normalizedEvents.push(touch);
                }
            }
            else if (event instanceof MouseEvent && (!this.supportsPointerEvents || !(event instanceof window.PointerEvent))) {
                if (typeof event.isPrimary === 'undefined') {
                    event.isPrimary = true;
                }
                if (typeof event.width === 'undefined') {
                    event.width = 1;
                }
                if (typeof event.height === 'undefined') {
                    event.height = 1;
                }
                if (typeof event.tiltX === 'undefined') {
                    event.tiltX = 0;
                }
                if (typeof event.tiltY === 'undefined') {
                    event.tiltY = 0;
                }
                if (typeof event.pointerType === 'undefined') {
                    event.pointerType = 'mouse';
                }
                if (typeof event.pointerId === 'undefined') {
                    event.pointerId = MOUSE_POINTER_ID;
                }
                if (typeof event.pressure === 'undefined') {
                    event.pressure = 0.5;
                }
                if (typeof event.twist === 'undefined') {
                    event.twist = 0;
                }
                if (typeof event.tangentialPressure === 'undefined') {
                    event.tangentialPressure = 0;
                }
                event.isNormalized = true;
                normalizedEvents.push(event);
            }
            else {
                normalizedEvents.push(event);
            }
            return normalizedEvents;
        };
        InteractionManager.prototype.destroy = function destroy() {
            this.removeEvents();
            this.removeTickerListener();
            this.removeAllListeners();
            this.renderer = null;
            this.mouse = null;
            this.eventData = null;
            this.interactionDOMElement = null;
            this.onPointerDown = null;
            this.processPointerDown = null;
            this.onPointerUp = null;
            this.processPointerUp = null;
            this.onPointerCancel = null;
            this.processPointerCancel = null;
            this.onPointerMove = null;
            this.processPointerMove = null;
            this.onPointerOut = null;
            this.processPointerOverOut = null;
            this.onPointerOver = null;
            this.search = null;
        };
        Object.defineProperties(InteractionManager.prototype, prototypeAccessors);
        return InteractionManager;
    }(eventemitter3));
    var interaction_es = ({
        InteractionData: InteractionData,
        InteractionEvent: InteractionEvent,
        InteractionManager: InteractionManager,
        InteractionTrackingData: InteractionTrackingData,
        interactiveTarget: interactiveTarget
    });
    var Runner = (function () {
        function Runner(name) {
            this.items = [];
            this._name = name;
            this._aliasCount = 0;
        }
        Runner.prototype.emit = function (a0, a1, a2, a3, a4, a5, a6, a7) {
            if (arguments.length > 8) {
                throw new Error('max arguments reached');
            }
            var _a = this, name = _a.name, items = _a.items;
            this._aliasCount++;
            for (var i = 0, len = items.length; i < len; i++) {
                items[i][name](a0, a1, a2, a3, a4, a5, a6, a7);
            }
            if (items === this.items) {
                this._aliasCount--;
            }
            return this;
        };
        Runner.prototype.ensureNonAliasedItems = function () {
            if (this._aliasCount > 0 && this.items.length > 1) {
                this._aliasCount = 0;
                this.items = this.items.slice(0);
            }
        };
        Runner.prototype.add = function (item) {
            if (item[this._name]) {
                this.ensureNonAliasedItems();
                this.remove(item);
                this.items.push(item);
            }
            return this;
        };
        Runner.prototype.remove = function (item) {
            var index = this.items.indexOf(item);
            if (index !== -1) {
                this.ensureNonAliasedItems();
                this.items.splice(index, 1);
            }
            return this;
        };
        Runner.prototype.contains = function (item) {
            return this.items.indexOf(item) !== -1;
        };
        Runner.prototype.removeAll = function () {
            this.ensureNonAliasedItems();
            this.items.length = 0;
            return this;
        };
        Runner.prototype.destroy = function () {
            this.removeAll();
            this.items = null;
            this._name = null;
        };
        Object.defineProperty(Runner.prototype, "empty", {
            get: function () {
                return this.items.length === 0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Runner.prototype, "name", {
            get: function () {
                return this._name;
            },
            enumerable: true,
            configurable: true
        });
        return Runner;
    }());
    Object.defineProperties(Runner.prototype, {
        dispatch: { value: Runner.prototype.emit },
        run: { value: Runner.prototype.emit },
    });
    var Resource = function Resource(width, height) {
        if (width === void 0) {
            width = 0;
        }
        if (height === void 0) {
            height = 0;
        }
        this._width = width;
        this._height = height;
        this.destroyed = false;
        this.internal = false;
        this.onResize = new Runner('setRealSize', 2);
        this.onUpdate = new Runner('update');
        this.onError = new Runner('onError', 1);
    };
    var prototypeAccessors$2 = { valid: { configurable: true }, width: { configurable: true }, height: { configurable: true } };
    Resource.prototype.bind = function bind(baseTexture) {
        this.onResize.add(baseTexture);
        this.onUpdate.add(baseTexture);
        this.onError.add(baseTexture);
        if (this._width || this._height) {
            this.onResize.run(this._width, this._height);
        }
    };
    Resource.prototype.unbind = function unbind(baseTexture) {
        this.onResize.remove(baseTexture);
        this.onUpdate.remove(baseTexture);
        this.onError.remove(baseTexture);
    };
    Resource.prototype.resize = function resize(width, height) {
        if (width !== this._width || height !== this._height) {
            this._width = width;
            this._height = height;
            this.onResize.run(width, height);
        }
    };
    prototypeAccessors$2.valid.get = function () {
        return !!this._width && !!this._height;
    };
    Resource.prototype.update = function update() {
        if (!this.destroyed) {
            this.onUpdate.run();
        }
    };
    Resource.prototype.load = function load() {
        return Promise.resolve();
    };
    prototypeAccessors$2.width.get = function () {
        return this._width;
    };
    prototypeAccessors$2.height.get = function () {
        return this._height;
    };
    Resource.prototype.upload = function upload(renderer, baseTexture, glTexture) {
        return false;
    };
    Resource.prototype.style = function style(renderer, baseTexture, glTexture) {
        return false;
    };
    Resource.prototype.dispose = function dispose() {
    };
    Resource.prototype.destroy = function destroy() {
        if (!this.destroyed) {
            this.destroyed = true;
            this.dispose();
            this.onError.removeAll();
            this.onError = null;
            this.onResize.removeAll();
            this.onResize = null;
            this.onUpdate.removeAll();
            this.onUpdate = null;
        }
    };
    Object.defineProperties(Resource.prototype, prototypeAccessors$2);
    var BaseImageResource = (function (Resource) {
        function BaseImageResource(source) {
            var width = source.naturalWidth || source.videoWidth || source.width;
            var height = source.naturalHeight || source.videoHeight || source.height;
            Resource.call(this, width, height);
            this.source = source;
            this.noSubImage = false;
        }
        if (Resource) {
            BaseImageResource.__proto__ = Resource;
        }
        BaseImageResource.prototype = Object.create(Resource && Resource.prototype);
        BaseImageResource.prototype.constructor = BaseImageResource;
        BaseImageResource.crossOrigin = function crossOrigin(element, url, crossorigin) {
            if (crossorigin === undefined && url.indexOf('data:') !== 0) {
                element.crossOrigin = determineCrossOrigin(url);
            }
            else if (crossorigin !== false) {
                element.crossOrigin = typeof crossorigin === 'string' ? crossorigin : 'anonymous';
            }
        };
        BaseImageResource.prototype.upload = function upload(renderer, baseTexture, glTexture, source) {
            var gl = renderer.gl;
            var width = baseTexture.realWidth;
            var height = baseTexture.realHeight;
            source = source || this.source;
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, baseTexture.alphaMode === exports.ALPHA_MODES.UNPACK);
            if (!this.noSubImage
                && baseTexture.target === gl.TEXTURE_2D
                && glTexture.width === width
                && glTexture.height === height) {
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, baseTexture.format, baseTexture.type, source);
            }
            else {
                glTexture.width = width;
                glTexture.height = height;
                gl.texImage2D(baseTexture.target, 0, baseTexture.format, baseTexture.format, baseTexture.type, source);
            }
            return true;
        };
        BaseImageResource.prototype.update = function update() {
            if (this.destroyed) {
                return;
            }
            var width = this.source.naturalWidth || this.source.videoWidth || this.source.width;
            var height = this.source.naturalHeight || this.source.videoHeight || this.source.height;
            this.resize(width, height);
            Resource.prototype.update.call(this);
        };
        BaseImageResource.prototype.dispose = function dispose() {
            this.source = null;
        };
        return BaseImageResource;
    }(Resource));
    var ImageResource = (function (BaseImageResource) {
        function ImageResource(source, options) {
            options = options || {};
            if (!(source instanceof HTMLImageElement)) {
                var imageElement = new Image();
                BaseImageResource.crossOrigin(imageElement, source, options.crossorigin);
                imageElement.src = source;
                source = imageElement;
            }
            BaseImageResource.call(this, source);
            if (!source.complete && !!this._width && !!this._height) {
                this._width = 0;
                this._height = 0;
            }
            this.url = source.src;
            this._process = null;
            this.preserveBitmap = false;
            this.createBitmap = (options.createBitmap !== undefined
                ? options.createBitmap : settings.CREATE_IMAGE_BITMAP) && !!window.createImageBitmap;
            this.alphaMode = typeof options.alphaMode === 'number' ? options.alphaMode : null;
            if (options.premultiplyAlpha !== undefined) {
                this.premultiplyAlpha = options.premultiplyAlpha;
            }
            this.bitmap = null;
            this._load = null;
            if (options.autoLoad !== false) {
                this.load();
            }
        }
        if (BaseImageResource) {
            ImageResource.__proto__ = BaseImageResource;
        }
        ImageResource.prototype = Object.create(BaseImageResource && BaseImageResource.prototype);
        ImageResource.prototype.constructor = ImageResource;
        ImageResource.prototype.load = function load(createBitmap) {
            var this$1 = this;
            if (createBitmap !== undefined) {
                this.createBitmap = createBitmap;
            }
            if (this._load) {
                return this._load;
            }
            this._load = new Promise(function (resolve) {
                this$1.url = this$1.source.src;
                var ref = this$1;
                var source = ref.source;
                var completed = function () {
                    if (this$1.destroyed) {
                        return;
                    }
                    source.onload = null;
                    source.onerror = null;
                    this$1.resize(source.width, source.height);
                    this$1._load = null;
                    if (this$1.createBitmap) {
                        resolve(this$1.process());
                    }
                    else {
                        resolve(this$1);
                    }
                };
                if (source.complete && source.src) {
                    completed();
                }
                else {
                    source.onload = completed;
                    source.onerror = function (event) { return this$1.onError.run(event); };
                }
            });
            return this._load;
        };
        ImageResource.prototype.process = function process() {
            var this$1 = this;
            if (this._process !== null) {
                return this._process;
            }
            if (this.bitmap !== null || !window.createImageBitmap) {
                return Promise.resolve(this);
            }
            this._process = window.createImageBitmap(this.source, 0, 0, this.source.width, this.source.height, {
                premultiplyAlpha: this.premultiplyAlpha === exports.ALPHA_MODES.UNPACK ? 'premultiply' : 'none',
            })
                .then(function (bitmap) {
                if (this$1.destroyed) {
                    return Promise.reject();
                }
                this$1.bitmap = bitmap;
                this$1.update();
                this$1._process = null;
                return Promise.resolve(this$1);
            });
            return this._process;
        };
        ImageResource.prototype.upload = function upload(renderer, baseTexture, glTexture) {
            if (typeof this.alphaMode === 'number') {
                baseTexture.alphaMode = this.alphaMode;
            }
            if (!this.createBitmap) {
                return BaseImageResource.prototype.upload.call(this, renderer, baseTexture, glTexture);
            }
            if (!this.bitmap) {
                this.process();
                if (!this.bitmap) {
                    return false;
                }
            }
            BaseImageResource.prototype.upload.call(this, renderer, baseTexture, glTexture, this.bitmap);
            if (!this.preserveBitmap) {
                var flag = true;
                for (var key in baseTexture._glTextures) {
                    var otherTex = baseTexture._glTextures[key];
                    if (otherTex !== glTexture && otherTex.dirtyId !== baseTexture.dirtyId) {
                        flag = false;
                        break;
                    }
                }
                if (flag) {
                    if (this.bitmap.close) {
                        this.bitmap.close();
                    }
                    this.bitmap = null;
                }
            }
            return true;
        };
        ImageResource.prototype.dispose = function dispose() {
            this.source.onload = null;
            this.source.onerror = null;
            BaseImageResource.prototype.dispose.call(this);
            if (this.bitmap) {
                this.bitmap.close();
                this.bitmap = null;
            }
            this._process = null;
            this._load = null;
        };
        return ImageResource;
    }(BaseImageResource));
    var INSTALLED = [];
    function autoDetectResource(source, options) {
        if (!source) {
            return null;
        }
        var extension = '';
        if (typeof source === 'string') {
            var result = (/\.(\w{3,4})(?:$|\?|#)/i).exec(source);
            if (result) {
                extension = result[1].toLowerCase();
            }
        }
        for (var i = INSTALLED.length - 1; i >= 0; --i) {
            var ResourcePlugin = INSTALLED[i];
            if (ResourcePlugin.test && ResourcePlugin.test(source, extension)) {
                return new ResourcePlugin(source, options);
            }
        }
        return new ImageResource(source, options);
    }
    var BufferResource = (function (Resource) {
        function BufferResource(source, options) {
            var ref = options || {};
            var width = ref.width;
            var height = ref.height;
            if (!width || !height) {
                throw new Error('BufferResource width or height invalid');
            }
            Resource.call(this, width, height);
            this.data = source;
        }
        if (Resource) {
            BufferResource.__proto__ = Resource;
        }
        BufferResource.prototype = Object.create(Resource && Resource.prototype);
        BufferResource.prototype.constructor = BufferResource;
        BufferResource.prototype.upload = function upload(renderer, baseTexture, glTexture) {
            var gl = renderer.gl;
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, baseTexture.alphaMode === exports.ALPHA_MODES.UNPACK);
            if (glTexture.width === baseTexture.width && glTexture.height === baseTexture.height) {
                gl.texSubImage2D(baseTexture.target, 0, 0, 0, baseTexture.width, baseTexture.height, baseTexture.format, baseTexture.type, this.data);
            }
            else {
                glTexture.width = baseTexture.width;
                glTexture.height = baseTexture.height;
                gl.texImage2D(baseTexture.target, 0, glTexture.internalFormat, baseTexture.width, baseTexture.height, 0, baseTexture.format, glTexture.type, this.data);
            }
            return true;
        };
        BufferResource.prototype.dispose = function dispose() {
            this.data = null;
        };
        BufferResource.test = function test(source) {
            return source instanceof Float32Array
                || source instanceof Uint8Array
                || source instanceof Uint32Array;
        };
        return BufferResource;
    }(Resource));
    var defaultBufferOptions = {
        scaleMode: exports.SCALE_MODES.NEAREST,
        format: exports.FORMATS.RGBA,
        alphaMode: exports.ALPHA_MODES.NPM,
    };
    var BaseTexture = (function (EventEmitter) {
        function BaseTexture(resource, options) {
            if (resource === void 0) {
                resource = null;
            }
            if (options === void 0) {
                options = null;
            }
            EventEmitter.call(this);
            options = options || {};
            var alphaMode = options.alphaMode;
            var mipmap = options.mipmap;
            var anisotropicLevel = options.anisotropicLevel;
            var scaleMode = options.scaleMode;
            var width = options.width;
            var height = options.height;
            var wrapMode = options.wrapMode;
            var format = options.format;
            var type = options.type;
            var target = options.target;
            var resolution = options.resolution;
            var resourceOptions = options.resourceOptions;
            if (resource && !(resource instanceof Resource)) {
                resource = autoDetectResource(resource, resourceOptions);
                resource.internal = true;
            }
            this.width = width || 0;
            this.height = height || 0;
            this.resolution = resolution || settings.RESOLUTION;
            this.mipmap = mipmap !== undefined ? mipmap : settings.MIPMAP_TEXTURES;
            this.anisotropicLevel = anisotropicLevel !== undefined ? anisotropicLevel : settings.ANISOTROPIC_LEVEL;
            this.wrapMode = wrapMode || settings.WRAP_MODE;
            this.scaleMode = scaleMode !== undefined ? scaleMode : settings.SCALE_MODE;
            this.format = format || exports.FORMATS.RGBA;
            this.type = type || exports.TYPES.UNSIGNED_BYTE;
            this.target = target || exports.TARGETS.TEXTURE_2D;
            this.alphaMode = alphaMode !== undefined ? alphaMode : exports.ALPHA_MODES.UNPACK;
            if (options.premultiplyAlpha !== undefined) {
                this.premultiplyAlpha = options.premultiplyAlpha;
            }
            this.uid = uid();
            this.touched = 0;
            this.isPowerOfTwo = false;
            this._refreshPOT();
            this._glTextures = {};
            this.dirtyId = 0;
            this.dirtyStyleId = 0;
            this.cacheId = null;
            this.valid = width > 0 && height > 0;
            this.textureCacheIds = [];
            this.destroyed = false;
            this.resource = null;
            this._batchEnabled = 0;
            this._batchLocation = 0;
            this.setResource(resource);
        }
        if (EventEmitter) {
            BaseTexture.__proto__ = EventEmitter;
        }
        BaseTexture.prototype = Object.create(EventEmitter && EventEmitter.prototype);
        BaseTexture.prototype.constructor = BaseTexture;
        var prototypeAccessors = { realWidth: { configurable: true }, realHeight: { configurable: true } };
        prototypeAccessors.realWidth.get = function () {
            return Math.ceil((this.width * this.resolution) - 1e-4);
        };
        prototypeAccessors.realHeight.get = function () {
            return Math.ceil((this.height * this.resolution) - 1e-4);
        };
        BaseTexture.prototype.setStyle = function setStyle(scaleMode, mipmap) {
            var dirty;
            if (scaleMode !== undefined && scaleMode !== this.scaleMode) {
                this.scaleMode = scaleMode;
                dirty = true;
            }
            if (mipmap !== undefined && mipmap !== this.mipmap) {
                this.mipmap = mipmap;
                dirty = true;
            }
            if (dirty) {
                this.dirtyStyleId++;
            }
            return this;
        };
        BaseTexture.prototype.setSize = function setSize(width, height, resolution) {
            this.resolution = resolution || this.resolution;
            this.width = width;
            this.height = height;
            this._refreshPOT();
            this.update();
            return this;
        };
        BaseTexture.prototype.setRealSize = function setRealSize(realWidth, realHeight, resolution) {
            this.resolution = resolution || this.resolution;
            this.width = realWidth / this.resolution;
            this.height = realHeight / this.resolution;
            this._refreshPOT();
            this.update();
            return this;
        };
        BaseTexture.prototype._refreshPOT = function _refreshPOT() {
            this.isPowerOfTwo = isPow2(this.realWidth) && isPow2(this.realHeight);
        };
        BaseTexture.prototype.setResolution = function setResolution(resolution) {
            var oldResolution = this.resolution;
            if (oldResolution === resolution) {
                return this;
            }
            this.resolution = resolution;
            if (this.valid) {
                this.width = this.width * oldResolution / resolution;
                this.height = this.height * oldResolution / resolution;
                this.emit('update', this);
            }
            this._refreshPOT();
            return this;
        };
        BaseTexture.prototype.setResource = function setResource(resource) {
            if (this.resource === resource) {
                return this;
            }
            if (this.resource) {
                throw new Error('Resource can be set only once');
            }
            resource.bind(this);
            this.resource = resource;
            return this;
        };
        BaseTexture.prototype.update = function update() {
            if (!this.valid) {
                if (this.width > 0 && this.height > 0) {
                    this.valid = true;
                    this.emit('loaded', this);
                    this.emit('update', this);
                }
            }
            else {
                this.dirtyId++;
                this.dirtyStyleId++;
                this.emit('update', this);
            }
        };
        BaseTexture.prototype.onError = function onError(event) {
            this.emit('error', this, event);
        };
        BaseTexture.prototype.destroy = function destroy() {
            if (this.resource) {
                this.resource.unbind(this);
                if (this.resource.internal) {
                    this.resource.destroy();
                }
                this.resource = null;
            }
            if (this.cacheId) {
                delete BaseTextureCache[this.cacheId];
                delete TextureCache[this.cacheId];
                this.cacheId = null;
            }
            this.dispose();
            BaseTexture.removeFromCache(this);
            this.textureCacheIds = null;
            this.destroyed = true;
        };
        BaseTexture.prototype.dispose = function dispose() {
            this.emit('dispose', this);
        };
        BaseTexture.from = function from(source, options, strict) {
            if (strict === void 0) {
                strict = settings.STRICT_TEXTURE_CACHE;
            }
            var isFrame = typeof source === 'string';
            var cacheId = null;
            if (isFrame) {
                cacheId = source;
            }
            else {
                if (!source._pixiId) {
                    source._pixiId = "pixiid_" + (uid());
                }
                cacheId = source._pixiId;
            }
            var baseTexture = BaseTextureCache[cacheId];
            if (isFrame && strict && !baseTexture) {
                throw new Error(("The cacheId \"" + cacheId + "\" does not exist in BaseTextureCache."));
            }
            if (!baseTexture) {
                baseTexture = new BaseTexture(source, options);
                baseTexture.cacheId = cacheId;
                BaseTexture.addToCache(baseTexture, cacheId);
            }
            return baseTexture;
        };
        BaseTexture.fromBuffer = function fromBuffer(buffer, width, height, options) {
            buffer = buffer || new Float32Array(width * height * 4);
            var resource = new BufferResource(buffer, { width: width, height: height });
            var type = buffer instanceof Float32Array ? exports.TYPES.FLOAT : exports.TYPES.UNSIGNED_BYTE;
            return new BaseTexture(resource, Object.assign(defaultBufferOptions, options || { width: width, height: height, type: type }));
        };
        BaseTexture.addToCache = function addToCache(baseTexture, id) {
            if (id) {
                if (baseTexture.textureCacheIds.indexOf(id) === -1) {
                    baseTexture.textureCacheIds.push(id);
                }
                if (BaseTextureCache[id]) {
                    console.warn(("BaseTexture added to the cache with an id [" + id + "] that already had an entry"));
                }
                BaseTextureCache[id] = baseTexture;
            }
        };
        BaseTexture.removeFromCache = function removeFromCache(baseTexture) {
            if (typeof baseTexture === 'string') {
                var baseTextureFromCache = BaseTextureCache[baseTexture];
                if (baseTextureFromCache) {
                    var index = baseTextureFromCache.textureCacheIds.indexOf(baseTexture);
                    if (index > -1) {
                        baseTextureFromCache.textureCacheIds.splice(index, 1);
                    }
                    delete BaseTextureCache[baseTexture];
                    return baseTextureFromCache;
                }
            }
            else if (baseTexture && baseTexture.textureCacheIds) {
                for (var i = 0; i < baseTexture.textureCacheIds.length; ++i) {
                    delete BaseTextureCache[baseTexture.textureCacheIds[i]];
                }
                baseTexture.textureCacheIds.length = 0;
                return baseTexture;
            }
            return null;
        };
        Object.defineProperties(BaseTexture.prototype, prototypeAccessors);
        return BaseTexture;
    }(eventemitter3));
    BaseTexture._globalBatch = 0;
    var ArrayResource = (function (Resource) {
        function ArrayResource(source, options) {
            options = options || {};
            var urls;
            var length = source;
            if (Array.isArray(source)) {
                urls = source;
                length = source.length;
            }
            Resource.call(this, options.width, options.height);
            this.items = [];
            this.itemDirtyIds = [];
            for (var i = 0; i < length; i++) {
                var partTexture = new BaseTexture();
                this.items.push(partTexture);
                this.itemDirtyIds.push(-1);
            }
            this.length = length;
            this._load = null;
            if (urls) {
                for (var i$1 = 0; i$1 < length; i$1++) {
                    this.addResourceAt(autoDetectResource(urls[i$1], options), i$1);
                }
            }
        }
        if (Resource) {
            ArrayResource.__proto__ = Resource;
        }
        ArrayResource.prototype = Object.create(Resource && Resource.prototype);
        ArrayResource.prototype.constructor = ArrayResource;
        ArrayResource.prototype.dispose = function dispose() {
            for (var i = 0, len = this.length; i < len; i++) {
                this.items[i].destroy();
            }
            this.items = null;
            this.itemDirtyIds = null;
            this._load = null;
        };
        ArrayResource.prototype.addResourceAt = function addResourceAt(resource, index) {
            var baseTexture = this.items[index];
            if (!baseTexture) {
                throw new Error(("Index " + index + " is out of bounds"));
            }
            if (resource.valid && !this.valid) {
                this.resize(resource.width, resource.height);
            }
            this.items[index].setResource(resource);
            return this;
        };
        ArrayResource.prototype.bind = function bind(baseTexture) {
            Resource.prototype.bind.call(this, baseTexture);
            baseTexture.target = exports.TARGETS.TEXTURE_2D_ARRAY;
            for (var i = 0; i < this.length; i++) {
                this.items[i].on('update', baseTexture.update, baseTexture);
            }
        };
        ArrayResource.prototype.unbind = function unbind(baseTexture) {
            Resource.prototype.unbind.call(this, baseTexture);
            for (var i = 0; i < this.length; i++) {
                this.items[i].off('update', baseTexture.update, baseTexture);
            }
        };
        ArrayResource.prototype.load = function load() {
            var this$1 = this;
            if (this._load) {
                return this._load;
            }
            var resources = this.items.map(function (item) { return item.resource; });
            var promises = resources.map(function (item) { return item.load(); });
            this._load = Promise.all(promises)
                .then(function () {
                var ref = resources[0];
                var width = ref.width;
                var height = ref.height;
                this$1.resize(width, height);
                return Promise.resolve(this$1);
            });
            return this._load;
        };
        ArrayResource.prototype.upload = function upload(renderer, texture, glTexture) {
            var ref = this;
            var length = ref.length;
            var itemDirtyIds = ref.itemDirtyIds;
            var items = ref.items;
            var gl = renderer.gl;
            if (glTexture.dirtyId < 0) {
                gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, texture.format, this._width, this._height, length, 0, texture.format, texture.type, null);
            }
            for (var i = 0; i < length; i++) {
                var item = items[i];
                if (itemDirtyIds[i] < item.dirtyId) {
                    itemDirtyIds[i] = item.dirtyId;
                    if (item.valid) {
                        gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, item.resource.width, item.resource.height, 1, texture.format, texture.type, item.resource.source);
                    }
                }
            }
            return true;
        };
        return ArrayResource;
    }(Resource));
    var CanvasResource = (function (BaseImageResource) {
        function CanvasResource() {
            BaseImageResource.apply(this, arguments);
        }
        if (BaseImageResource) {
            CanvasResource.__proto__ = BaseImageResource;
        }
        CanvasResource.prototype = Object.create(BaseImageResource && BaseImageResource.prototype);
        CanvasResource.prototype.constructor = CanvasResource;
        CanvasResource.test = function test(source) {
            var OffscreenCanvas = window.OffscreenCanvas;
            if (OffscreenCanvas && source instanceof OffscreenCanvas) {
                return true;
            }
            return source instanceof HTMLCanvasElement;
        };
        return CanvasResource;
    }(BaseImageResource));
    var CubeResource = (function (ArrayResource) {
        function CubeResource(source, options) {
            options = options || {};
            ArrayResource.call(this, source, options);
            if (this.length !== CubeResource.SIDES) {
                throw new Error(("Invalid length. Got " + (this.length) + ", expected 6"));
            }
            for (var i = 0; i < CubeResource.SIDES; i++) {
                this.items[i].target = exports.TARGETS.TEXTURE_CUBE_MAP_POSITIVE_X + i;
            }
            if (options.autoLoad !== false) {
                this.load();
            }
        }
        if (ArrayResource) {
            CubeResource.__proto__ = ArrayResource;
        }
        CubeResource.prototype = Object.create(ArrayResource && ArrayResource.prototype);
        CubeResource.prototype.constructor = CubeResource;
        CubeResource.prototype.bind = function bind(baseTexture) {
            ArrayResource.prototype.bind.call(this, baseTexture);
            baseTexture.target = exports.TARGETS.TEXTURE_CUBE_MAP;
        };
        CubeResource.prototype.upload = function upload(renderer, baseTexture, glTexture) {
            var dirty = this.itemDirtyIds;
            for (var i = 0; i < CubeResource.SIDES; i++) {
                var side = this.items[i];
                if (dirty[i] < side.dirtyId) {
                    dirty[i] = side.dirtyId;
                    if (side.valid) {
                        side.resource.upload(renderer, side, glTexture);
                    }
                }
            }
            return true;
        };
        return CubeResource;
    }(ArrayResource));
    CubeResource.SIDES = 6;
    var SVGResource = (function (BaseImageResource) {
        function SVGResource(source, options) {
            options = options || {};
            BaseImageResource.call(this, document.createElement('canvas'));
            this._width = 0;
            this._height = 0;
            this.svg = source;
            this.scale = options.scale || 1;
            this._overrideWidth = options.width;
            this._overrideHeight = options.height;
            this._resolve = null;
            this._crossorigin = options.crossorigin;
            this._load = null;
            if (options.autoLoad !== false) {
                this.load();
            }
        }
        if (BaseImageResource) {
            SVGResource.__proto__ = BaseImageResource;
        }
        SVGResource.prototype = Object.create(BaseImageResource && BaseImageResource.prototype);
        SVGResource.prototype.constructor = SVGResource;
        SVGResource.prototype.load = function load() {
            var this$1 = this;
            if (this._load) {
                return this._load;
            }
            this._load = new Promise(function (resolve) {
                this$1._resolve = function () {
                    this$1.resize(this$1.source.width, this$1.source.height);
                    resolve(this$1);
                };
                if ((/^\<svg/).test(this$1.svg.trim())) {
                    if (!btoa) {
                        throw new Error('Your browser doesn\'t support base64 conversions.');
                    }
                    this$1.svg = "data:image/svg+xml;base64," + (btoa(unescape(encodeURIComponent(this$1.svg))));
                }
                this$1._loadSvg();
            });
            return this._load;
        };
        SVGResource.prototype._loadSvg = function _loadSvg() {
            var this$1 = this;
            var tempImage = new Image();
            BaseImageResource.crossOrigin(tempImage, this.svg, this._crossorigin);
            tempImage.src = this.svg;
            tempImage.onerror = function (event) {
                tempImage.onerror = null;
                this$1.onError.run(event);
            };
            tempImage.onload = function () {
                var svgWidth = tempImage.width;
                var svgHeight = tempImage.height;
                if (!svgWidth || !svgHeight) {
                    throw new Error('The SVG image must have width and height defined (in pixels), canvas API needs them.');
                }
                var width = svgWidth * this$1.scale;
                var height = svgHeight * this$1.scale;
                if (this$1._overrideWidth || this$1._overrideHeight) {
                    width = this$1._overrideWidth || this$1._overrideHeight / svgHeight * svgWidth;
                    height = this$1._overrideHeight || this$1._overrideWidth / svgWidth * svgHeight;
                }
                width = Math.round(width);
                height = Math.round(height);
                var canvas = this$1.source;
                canvas.width = width;
                canvas.height = height;
                canvas._pixiId = "canvas_" + (uid());
                canvas
                    .getContext('2d')
                    .drawImage(tempImage, 0, 0, svgWidth, svgHeight, 0, 0, width, height);
                this$1._resolve();
                this$1._resolve = null;
            };
        };
        SVGResource.getSize = function getSize(svgString) {
            var sizeMatch = SVGResource.SVG_SIZE.exec(svgString);
            var size = {};
            if (sizeMatch) {
                size[sizeMatch[1]] = Math.round(parseFloat(sizeMatch[3]));
                size[sizeMatch[5]] = Math.round(parseFloat(sizeMatch[7]));
            }
            return size;
        };
        SVGResource.prototype.dispose = function dispose() {
            BaseImageResource.prototype.dispose.call(this);
            this._resolve = null;
            this._crossorigin = null;
        };
        SVGResource.test = function test(source, extension) {
            return extension === 'svg'
                || (typeof source === 'string' && source.indexOf('data:image/svg+xml;base64') === 0)
                || (typeof source === 'string' && source.indexOf('<svg') === 0);
        };
        return SVGResource;
    }(BaseImageResource));
    SVGResource.SVG_SIZE = /<svg[^>]*(?:\s(width|height)=('|")(\d*(?:\.\d+)?)(?:px)?('|"))[^>]*(?:\s(width|height)=('|")(\d*(?:\.\d+)?)(?:px)?('|"))[^>]*>/i;
    var VideoResource = (function (BaseImageResource) {
        function VideoResource(source, options) {
            options = options || {};
            if (!(source instanceof HTMLVideoElement)) {
                var videoElement = document.createElement('video');
                videoElement.setAttribute('preload', 'auto');
                videoElement.setAttribute('webkit-playsinline', '');
                videoElement.setAttribute('playsinline', '');
                if (typeof source === 'string') {
                    source = [source];
                }
                BaseImageResource.crossOrigin(videoElement, (source[0].src || source[0]), options.crossorigin);
                for (var i = 0; i < source.length; ++i) {
                    var sourceElement = document.createElement('source');
                    var ref = source[i];
                    var src = ref.src;
                    var mime = ref.mime;
                    src = src || source[i];
                    var baseSrc = src.split('?').shift().toLowerCase();
                    var ext = baseSrc.substr(baseSrc.lastIndexOf('.') + 1);
                    mime = mime || ("video/" + ext);
                    sourceElement.src = src;
                    sourceElement.type = mime;
                    videoElement.appendChild(sourceElement);
                }
                source = videoElement;
            }
            BaseImageResource.call(this, source);
            this.noSubImage = true;
            this._autoUpdate = true;
            this._isAutoUpdating = false;
            this._updateFPS = options.updateFPS || 0;
            this._msToNextUpdate = 0;
            this.autoPlay = options.autoPlay !== false;
            this._load = null;
            this._resolve = null;
            this._onCanPlay = this._onCanPlay.bind(this);
            this._onError = this._onError.bind(this);
            if (options.autoLoad !== false) {
                this.load();
            }
        }
        if (BaseImageResource) {
            VideoResource.__proto__ = BaseImageResource;
        }
        VideoResource.prototype = Object.create(BaseImageResource && BaseImageResource.prototype);
        VideoResource.prototype.constructor = VideoResource;
        var prototypeAccessors = { autoUpdate: { configurable: true }, updateFPS: { configurable: true } };
        VideoResource.prototype.update = function update(deltaTime) {
            if (deltaTime === void 0) {
                deltaTime = 0;
            }
            if (!this.destroyed) {
                var elapsedMS = Ticker.shared.elapsedMS * this.source.playbackRate;
                this._msToNextUpdate = Math.floor(this._msToNextUpdate - elapsedMS);
                if (!this._updateFPS || this._msToNextUpdate <= 0) {
                    BaseImageResource.prototype.update.call(this, deltaTime);
                    this._msToNextUpdate = this._updateFPS ? Math.floor(1000 / this._updateFPS) : 0;
                }
            }
        };
        VideoResource.prototype.load = function load() {
            var this$1 = this;
            if (this._load) {
                return this._load;
            }
            var source = this.source;
            if ((source.readyState === source.HAVE_ENOUGH_DATA || source.readyState === source.HAVE_FUTURE_DATA)
                && source.width && source.height) {
                source.complete = true;
            }
            source.addEventListener('play', this._onPlayStart.bind(this));
            source.addEventListener('pause', this._onPlayStop.bind(this));
            if (!this._isSourceReady()) {
                source.addEventListener('canplay', this._onCanPlay);
                source.addEventListener('canplaythrough', this._onCanPlay);
                source.addEventListener('error', this._onError, true);
            }
            else {
                this._onCanPlay();
            }
            this._load = new Promise(function (resolve) {
                if (this$1.valid) {
                    resolve(this$1);
                }
                else {
                    this$1._resolve = resolve;
                    source.load();
                }
            });
            return this._load;
        };
        VideoResource.prototype._onError = function _onError() {
            this.source.removeEventListener('error', this._onError, true);
            this.onError.run(event);
        };
        VideoResource.prototype._isSourcePlaying = function _isSourcePlaying() {
            var source = this.source;
            return (source.currentTime > 0 && source.paused === false && source.ended === false && source.readyState > 2);
        };
        VideoResource.prototype._isSourceReady = function _isSourceReady() {
            return this.source.readyState === 3 || this.source.readyState === 4;
        };
        VideoResource.prototype._onPlayStart = function _onPlayStart() {
            if (!this.valid) {
                this._onCanPlay();
            }
            if (!this._isAutoUpdating && this.autoUpdate) {
                Ticker.shared.add(this.update, this);
                this._isAutoUpdating = true;
            }
        };
        VideoResource.prototype._onPlayStop = function _onPlayStop() {
            if (this._isAutoUpdating) {
                Ticker.shared.remove(this.update, this);
                this._isAutoUpdating = false;
            }
        };
        VideoResource.prototype._onCanPlay = function _onCanPlay() {
            var ref = this;
            var source = ref.source;
            source.removeEventListener('canplay', this._onCanPlay);
            source.removeEventListener('canplaythrough', this._onCanPlay);
            var valid = this.valid;
            this.resize(source.videoWidth, source.videoHeight);
            if (!valid && this._resolve) {
                this._resolve(this);
                this._resolve = null;
            }
            if (this._isSourcePlaying()) {
                this._onPlayStart();
            }
            else if (this.autoPlay) {
                source.play();
            }
        };
        VideoResource.prototype.dispose = function dispose() {
            if (this._isAutoUpdating) {
                Ticker.shared.remove(this.update, this);
            }
            if (this.source) {
                this.source.removeEventListener('error', this._onError, true);
                this.source.pause();
                this.source.src = '';
                this.source.load();
            }
            BaseImageResource.prototype.dispose.call(this);
        };
        prototypeAccessors.autoUpdate.get = function () {
            return this._autoUpdate;
        };
        prototypeAccessors.autoUpdate.set = function (value) {
            if (value !== this._autoUpdate) {
                this._autoUpdate = value;
                if (!this._autoUpdate && this._isAutoUpdating) {
                    Ticker.shared.remove(this.update, this);
                    this._isAutoUpdating = false;
                }
                else if (this._autoUpdate && !this._isAutoUpdating) {
                    Ticker.shared.add(this.update, this);
                    this._isAutoUpdating = true;
                }
            }
        };
        prototypeAccessors.updateFPS.get = function () {
            return this._updateFPS;
        };
        prototypeAccessors.updateFPS.set = function (value) {
            if (value !== this._updateFPS) {
                this._updateFPS = value;
            }
        };
        VideoResource.test = function test(source, extension) {
            return (source instanceof HTMLVideoElement)
                || VideoResource.TYPES.indexOf(extension) > -1;
        };
        Object.defineProperties(VideoResource.prototype, prototypeAccessors);
        return VideoResource;
    }(BaseImageResource));
    VideoResource.TYPES = ['mp4', 'm4v', 'webm', 'ogg', 'ogv', 'h264', 'avi', 'mov'];
    var ImageBitmapResource = (function (BaseImageResource) {
        function ImageBitmapResource() {
            BaseImageResource.apply(this, arguments);
        }
        if (BaseImageResource) {
            ImageBitmapResource.__proto__ = BaseImageResource;
        }
        ImageBitmapResource.prototype = Object.create(BaseImageResource && BaseImageResource.prototype);
        ImageBitmapResource.prototype.constructor = ImageBitmapResource;
        ImageBitmapResource.test = function test(source) {
            return !!window.createImageBitmap && source instanceof ImageBitmap;
        };
        return ImageBitmapResource;
    }(BaseImageResource));
    INSTALLED.push(ImageResource, ImageBitmapResource, CanvasResource, VideoResource, SVGResource, BufferResource, CubeResource, ArrayResource);
    var index = ({
        INSTALLED: INSTALLED,
        autoDetectResource: autoDetectResource,
        ArrayResource: ArrayResource,
        BufferResource: BufferResource,
        CanvasResource: CanvasResource,
        CubeResource: CubeResource,
        ImageResource: ImageResource,
        ImageBitmapResource: ImageBitmapResource,
        SVGResource: SVGResource,
        VideoResource: VideoResource,
        Resource: Resource,
        BaseImageResource: BaseImageResource
    });
    var System = function System(renderer) {
        this.renderer = renderer;
    };
    System.prototype.destroy = function destroy() {
        this.renderer = null;
    };
    var DepthResource = (function (BufferResource) {
        function DepthResource() {
            BufferResource.apply(this, arguments);
        }
        if (BufferResource) {
            DepthResource.__proto__ = BufferResource;
        }
        DepthResource.prototype = Object.create(BufferResource && BufferResource.prototype);
        DepthResource.prototype.constructor = DepthResource;
        DepthResource.prototype.upload = function upload(renderer, baseTexture, glTexture) {
            var gl = renderer.gl;
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, baseTexture.alphaMode === exports.ALPHA_MODES.UNPACK);
            if (glTexture.width === baseTexture.width && glTexture.height === baseTexture.height) {
                gl.texSubImage2D(baseTexture.target, 0, 0, 0, baseTexture.width, baseTexture.height, baseTexture.format, baseTexture.type, this.data);
            }
            else {
                glTexture.width = baseTexture.width;
                glTexture.height = baseTexture.height;
                gl.texImage2D(baseTexture.target, 0, gl.DEPTH_COMPONENT16, baseTexture.width, baseTexture.height, 0, baseTexture.format, baseTexture.type, this.data);
            }
            return true;
        };
        return DepthResource;
    }(BufferResource));
    var Framebuffer = function Framebuffer(width, height) {
        this.width = Math.ceil(width || 100);
        this.height = Math.ceil(height || 100);
        this.stencil = false;
        this.depth = false;
        this.dirtyId = 0;
        this.dirtyFormat = 0;
        this.dirtySize = 0;
        this.depthTexture = null;
        this.colorTextures = [];
        this.glFramebuffers = {};
        this.disposeRunner = new Runner('disposeFramebuffer', 2);
    };
    var prototypeAccessors$1$1 = { colorTexture: { configurable: true } };
    prototypeAccessors$1$1.colorTexture.get = function () {
        return this.colorTextures[0];
    };
    Framebuffer.prototype.addColorTexture = function addColorTexture(index, texture) {
        if (index === void 0) {
            index = 0;
        }
        this.colorTextures[index] = texture || new BaseTexture(null, { scaleMode: 0,
            resolution: 1,
            mipmap: false,
            width: this.width,
            height: this.height });
        this.dirtyId++;
        this.dirtyFormat++;
        return this;
    };
    Framebuffer.prototype.addDepthTexture = function addDepthTexture(texture) {
        this.depthTexture = texture || new BaseTexture(new DepthResource(null, { width: this.width, height: this.height }), { scaleMode: 0,
            resolution: 1,
            width: this.width,
            height: this.height,
            mipmap: false,
            format: exports.FORMATS.DEPTH_COMPONENT,
            type: exports.TYPES.UNSIGNED_SHORT });
        this.dirtyId++;
        this.dirtyFormat++;
        return this;
    };
    Framebuffer.prototype.enableDepth = function enableDepth() {
        this.depth = true;
        this.dirtyId++;
        this.dirtyFormat++;
        return this;
    };
    Framebuffer.prototype.enableStencil = function enableStencil() {
        this.stencil = true;
        this.dirtyId++;
        this.dirtyFormat++;
        return this;
    };
    Framebuffer.prototype.resize = function resize(width, height) {
        width = Math.ceil(width);
        height = Math.ceil(height);
        if (width === this.width && height === this.height) {
            return;
        }
        this.width = width;
        this.height = height;
        this.dirtyId++;
        this.dirtySize++;
        for (var i = 0; i < this.colorTextures.length; i++) {
            var texture = this.colorTextures[i];
            var resolution = texture.resolution;
            texture.setSize(width / resolution, height / resolution);
        }
        if (this.depthTexture) {
            var resolution$1 = this.depthTexture.resolution;
            this.depthTexture.setSize(width / resolution$1, height / resolution$1);
        }
    };
    Framebuffer.prototype.dispose = function dispose() {
        this.disposeRunner.run(this, false);
    };
    Object.defineProperties(Framebuffer.prototype, prototypeAccessors$1$1);
    var BaseRenderTexture = (function (BaseTexture) {
        function BaseRenderTexture(options) {
            if (typeof options === 'number') {
                var width$1 = arguments[0];
                var height$1 = arguments[1];
                var scaleMode = arguments[2];
                var resolution = arguments[3];
                options = { width: width$1, height: height$1, scaleMode: scaleMode, resolution: resolution };
            }
            BaseTexture.call(this, null, options);
            var ref = options || {};
            var width = ref.width;
            var height = ref.height;
            this.mipmap = false;
            this.width = Math.ceil(width) || 100;
            this.height = Math.ceil(height) || 100;
            this.valid = true;
            this._canvasRenderTarget = null;
            this.clearColor = [0, 0, 0, 0];
            this.framebuffer = new Framebuffer(this.width * this.resolution, this.height * this.resolution)
                .addColorTexture(0, this);
            this.maskStack = [];
            this.filterStack = [{}];
        }
        if (BaseTexture) {
            BaseRenderTexture.__proto__ = BaseTexture;
        }
        BaseRenderTexture.prototype = Object.create(BaseTexture && BaseTexture.prototype);
        BaseRenderTexture.prototype.constructor = BaseRenderTexture;
        BaseRenderTexture.prototype.resize = function resize(width, height) {
            width = Math.ceil(width);
            height = Math.ceil(height);
            this.framebuffer.resize(width * this.resolution, height * this.resolution);
        };
        BaseRenderTexture.prototype.dispose = function dispose() {
            this.framebuffer.dispose();
            BaseTexture.prototype.dispose.call(this);
        };
        BaseRenderTexture.prototype.destroy = function destroy() {
            BaseTexture.prototype.destroy.call(this, true);
            this.framebuffer = null;
        };
        return BaseRenderTexture;
    }(BaseTexture));
    var TextureUvs = function TextureUvs() {
        this.x0 = 0;
        this.y0 = 0;
        this.x1 = 1;
        this.y1 = 0;
        this.x2 = 1;
        this.y2 = 1;
        this.x3 = 0;
        this.y3 = 1;
        this.uvsFloat32 = new Float32Array(8);
    };
    TextureUvs.prototype.set = function set(frame, baseFrame, rotate) {
        var tw = baseFrame.width;
        var th = baseFrame.height;
        if (rotate) {
            var w2 = frame.width / 2 / tw;
            var h2 = frame.height / 2 / th;
            var cX = (frame.x / tw) + w2;
            var cY = (frame.y / th) + h2;
            rotate = groupD8.add(rotate, groupD8.NW);
            this.x0 = cX + (w2 * groupD8.uX(rotate));
            this.y0 = cY + (h2 * groupD8.uY(rotate));
            rotate = groupD8.add(rotate, 2);
            this.x1 = cX + (w2 * groupD8.uX(rotate));
            this.y1 = cY + (h2 * groupD8.uY(rotate));
            rotate = groupD8.add(rotate, 2);
            this.x2 = cX + (w2 * groupD8.uX(rotate));
            this.y2 = cY + (h2 * groupD8.uY(rotate));
            rotate = groupD8.add(rotate, 2);
            this.x3 = cX + (w2 * groupD8.uX(rotate));
            this.y3 = cY + (h2 * groupD8.uY(rotate));
        }
        else {
            this.x0 = frame.x / tw;
            this.y0 = frame.y / th;
            this.x1 = (frame.x + frame.width) / tw;
            this.y1 = frame.y / th;
            this.x2 = (frame.x + frame.width) / tw;
            this.y2 = (frame.y + frame.height) / th;
            this.x3 = frame.x / tw;
            this.y3 = (frame.y + frame.height) / th;
        }
        this.uvsFloat32[0] = this.x0;
        this.uvsFloat32[1] = this.y0;
        this.uvsFloat32[2] = this.x1;
        this.uvsFloat32[3] = this.y1;
        this.uvsFloat32[4] = this.x2;
        this.uvsFloat32[5] = this.y2;
        this.uvsFloat32[6] = this.x3;
        this.uvsFloat32[7] = this.y3;
    };
    var DEFAULT_UVS = new TextureUvs();
    var Texture = (function (EventEmitter) {
        function Texture(baseTexture, frame, orig, trim, rotate, anchor) {
            EventEmitter.call(this);
            this.noFrame = false;
            if (!frame) {
                this.noFrame = true;
                frame = new Rectangle(0, 0, 1, 1);
            }
            if (baseTexture instanceof Texture) {
                baseTexture = baseTexture.baseTexture;
            }
            this.baseTexture = baseTexture;
            this._frame = frame;
            this.trim = trim;
            this.valid = false;
            this.requiresUpdate = false;
            this._uvs = DEFAULT_UVS;
            this.uvMatrix = null;
            this.orig = orig || frame;
            this._rotate = Number(rotate || 0);
            if (rotate === true) {
                this._rotate = 2;
            }
            else if (this._rotate % 2 !== 0) {
                throw new Error('attempt to use diamond-shaped UVs. If you are sure, set rotation manually');
            }
            this.defaultAnchor = anchor ? new Point(anchor.x, anchor.y) : new Point(0, 0);
            this._updateID = 0;
            this.textureCacheIds = [];
            if (!baseTexture.valid) {
                baseTexture.once('loaded', this.onBaseTextureUpdated, this);
            }
            else if (this.noFrame) {
                if (baseTexture.valid) {
                    this.onBaseTextureUpdated(baseTexture);
                }
            }
            else {
                this.frame = frame;
            }
            if (this.noFrame) {
                baseTexture.on('update', this.onBaseTextureUpdated, this);
            }
        }
        if (EventEmitter) {
            Texture.__proto__ = EventEmitter;
        }
        Texture.prototype = Object.create(EventEmitter && EventEmitter.prototype);
        Texture.prototype.constructor = Texture;
        var prototypeAccessors = { resolution: { configurable: true }, frame: { configurable: true }, rotate: { configurable: true }, width: { configurable: true }, height: { configurable: true } };
        Texture.prototype.update = function update() {
            if (this.baseTexture.resource) {
                this.baseTexture.resource.update();
            }
        };
        Texture.prototype.onBaseTextureUpdated = function onBaseTextureUpdated(baseTexture) {
            if (this.noFrame) {
                if (!this.baseTexture.valid) {
                    return;
                }
                this._frame.width = baseTexture.width;
                this._frame.height = baseTexture.height;
                this.valid = true;
                this.updateUvs();
            }
            else {
                this.frame = this._frame;
            }
            this.emit('update', this);
        };
        Texture.prototype.destroy = function destroy(destroyBase) {
            if (this.baseTexture) {
                if (destroyBase) {
                    var ref = this.baseTexture;
                    var resource = ref.resource;
                    if (resource && TextureCache[resource.url]) {
                        Texture.removeFromCache(resource.url);
                    }
                    this.baseTexture.destroy();
                }
                this.baseTexture.off('update', this.onBaseTextureUpdated, this);
                this.baseTexture = null;
            }
            this._frame = null;
            this._uvs = null;
            this.trim = null;
            this.orig = null;
            this.valid = false;
            Texture.removeFromCache(this);
            this.textureCacheIds = null;
        };
        Texture.prototype.clone = function clone() {
            return new Texture(this.baseTexture, this.frame, this.orig, this.trim, this.rotate, this.defaultAnchor);
        };
        Texture.prototype.updateUvs = function updateUvs() {
            if (this._uvs === DEFAULT_UVS) {
                this._uvs = new TextureUvs();
            }
            this._uvs.set(this._frame, this.baseTexture, this.rotate);
            this._updateID++;
        };
        Texture.from = function from(source, options, strict) {
            if (options === void 0) {
                options = {};
            }
            if (strict === void 0) {
                strict = settings.STRICT_TEXTURE_CACHE;
            }
            var isFrame = typeof source === 'string';
            var cacheId = null;
            if (isFrame) {
                cacheId = source;
            }
            else {
                if (!source._pixiId) {
                    source._pixiId = "pixiid_" + (uid());
                }
                cacheId = source._pixiId;
            }
            var texture = TextureCache[cacheId];
            if (isFrame && strict && !texture) {
                throw new Error(("The cacheId \"" + cacheId + "\" does not exist in TextureCache."));
            }
            if (!texture) {
                if (!options.resolution) {
                    options.resolution = getResolutionOfUrl(source);
                }
                texture = new Texture(new BaseTexture(source, options));
                texture.baseTexture.cacheId = cacheId;
                BaseTexture.addToCache(texture.baseTexture, cacheId);
                Texture.addToCache(texture, cacheId);
            }
            return texture;
        };
        Texture.fromBuffer = function fromBuffer(buffer, width, height, options) {
            return new Texture(BaseTexture.fromBuffer(buffer, width, height, options));
        };
        Texture.fromLoader = function fromLoader(source, imageUrl, name) {
            var resource = new ImageResource(source);
            resource.url = imageUrl;
            var baseTexture = new BaseTexture(resource, {
                scaleMode: settings.SCALE_MODE,
                resolution: getResolutionOfUrl(imageUrl),
            });
            var texture = new Texture(baseTexture);
            if (!name) {
                name = imageUrl;
            }
            BaseTexture.addToCache(texture.baseTexture, name);
            Texture.addToCache(texture, name);
            if (name !== imageUrl) {
                BaseTexture.addToCache(texture.baseTexture, imageUrl);
                Texture.addToCache(texture, imageUrl);
            }
            return texture;
        };
        Texture.addToCache = function addToCache(texture, id) {
            if (id) {
                if (texture.textureCacheIds.indexOf(id) === -1) {
                    texture.textureCacheIds.push(id);
                }
                if (TextureCache[id]) {
                    console.warn(("Texture added to the cache with an id [" + id + "] that already had an entry"));
                }
                TextureCache[id] = texture;
            }
        };
        Texture.removeFromCache = function removeFromCache(texture) {
            if (typeof texture === 'string') {
                var textureFromCache = TextureCache[texture];
                if (textureFromCache) {
                    var index = textureFromCache.textureCacheIds.indexOf(texture);
                    if (index > -1) {
                        textureFromCache.textureCacheIds.splice(index, 1);
                    }
                    delete TextureCache[texture];
                    return textureFromCache;
                }
            }
            else if (texture && texture.textureCacheIds) {
                for (var i = 0; i < texture.textureCacheIds.length; ++i) {
                    if (TextureCache[texture.textureCacheIds[i]] === texture) {
                        delete TextureCache[texture.textureCacheIds[i]];
                    }
                }
                texture.textureCacheIds.length = 0;
                return texture;
            }
            return null;
        };
        prototypeAccessors.resolution.get = function () {
            return this.baseTexture.resolution;
        };
        prototypeAccessors.frame.get = function () {
            return this._frame;
        };
        prototypeAccessors.frame.set = function (frame) {
            this._frame = frame;
            this.noFrame = false;
            var x = frame.x;
            var y = frame.y;
            var width = frame.width;
            var height = frame.height;
            var xNotFit = x + width > this.baseTexture.width;
            var yNotFit = y + height > this.baseTexture.height;
            if (xNotFit || yNotFit) {
                var relationship = xNotFit && yNotFit ? 'and' : 'or';
                var errorX = "X: " + x + " + " + width + " = " + (x + width) + " > " + (this.baseTexture.width);
                var errorY = "Y: " + y + " + " + height + " = " + (y + height) + " > " + (this.baseTexture.height);
                throw new Error('Texture Error: frame does not fit inside the base Texture dimensions: '
                    + errorX + " " + relationship + " " + errorY);
            }
            this.valid = width && height && this.baseTexture.valid;
            if (!this.trim && !this.rotate) {
                this.orig = frame;
            }
            if (this.valid) {
                this.updateUvs();
            }
        };
        prototypeAccessors.rotate.get = function () {
            return this._rotate;
        };
        prototypeAccessors.rotate.set = function (rotate) {
            this._rotate = rotate;
            if (this.valid) {
                this.updateUvs();
            }
        };
        prototypeAccessors.width.get = function () {
            return this.orig.width;
        };
        prototypeAccessors.height.get = function () {
            return this.orig.height;
        };
        Object.defineProperties(Texture.prototype, prototypeAccessors);
        return Texture;
    }(eventemitter3));
    function createWhiteTexture() {
        var canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        var context = canvas.getContext('2d');
        context.fillStyle = 'white';
        context.fillRect(0, 0, 16, 16);
        return new Texture(new BaseTexture(new CanvasResource(canvas)));
    }
    function removeAllHandlers(tex) {
        tex.destroy = function _emptyDestroy() { };
        tex.on = function _emptyOn() { };
        tex.once = function _emptyOnce() { };
        tex.emit = function _emptyEmit() { };
    }
    Texture.EMPTY = new Texture(new BaseTexture());
    removeAllHandlers(Texture.EMPTY);
    removeAllHandlers(Texture.EMPTY.baseTexture);
    Texture.WHITE = createWhiteTexture();
    removeAllHandlers(Texture.WHITE);
    removeAllHandlers(Texture.WHITE.baseTexture);
    var RenderTexture = (function (Texture) {
        function RenderTexture(baseRenderTexture, frame) {
            var _legacyRenderer = null;
            if (!(baseRenderTexture instanceof BaseRenderTexture)) {
                var width = arguments[1];
                var height = arguments[2];
                var scaleMode = arguments[3];
                var resolution = arguments[4];
                console.warn(("Please use RenderTexture.create(" + width + ", " + height + ") instead of the ctor directly."));
                _legacyRenderer = arguments[0];
                frame = null;
                baseRenderTexture = new BaseRenderTexture({
                    width: width,
                    height: height,
                    scaleMode: scaleMode,
                    resolution: resolution,
                });
            }
            Texture.call(this, baseRenderTexture, frame);
            this.legacyRenderer = _legacyRenderer;
            this.valid = true;
            this.filterFrame = null;
            this.filterPoolKey = null;
            this.updateUvs();
        }
        if (Texture) {
            RenderTexture.__proto__ = Texture;
        }
        RenderTexture.prototype = Object.create(Texture && Texture.prototype);
        RenderTexture.prototype.constructor = RenderTexture;
        RenderTexture.prototype.resize = function resize(width, height, resizeBaseTexture) {
            if (resizeBaseTexture === void 0) {
                resizeBaseTexture = true;
            }
            width = Math.ceil(width);
            height = Math.ceil(height);
            this.valid = (width > 0 && height > 0);
            this._frame.width = this.orig.width = width;
            this._frame.height = this.orig.height = height;
            if (resizeBaseTexture) {
                this.baseTexture.resize(width, height);
            }
            this.updateUvs();
        };
        RenderTexture.prototype.setResolution = function setResolution(resolution) {
            var ref = this;
            var baseTexture = ref.baseTexture;
            if (baseTexture.resolution === resolution) {
                return;
            }
            baseTexture.setResolution(resolution);
            this.resize(baseTexture.width, baseTexture.height, false);
        };
        RenderTexture.create = function create(options) {
            if (typeof options === 'number') {
                options = {
                    width: options,
                    height: arguments[1],
                    scaleMode: arguments[2],
                    resolution: arguments[3],
                };
            }
            return new RenderTexture(new BaseRenderTexture(options));
        };
        return RenderTexture;
    }(Texture));
    var RenderTexturePool = function RenderTexturePool(textureOptions) {
        this.texturePool = {};
        this.textureOptions = textureOptions || {};
        this.enableFullScreen = false;
        this._pixelsWidth = 0;
        this._pixelsHeight = 0;
    };
    RenderTexturePool.prototype.createTexture = function createTexture(realWidth, realHeight) {
        var baseRenderTexture = new BaseRenderTexture(Object.assign({
            width: realWidth,
            height: realHeight,
            resolution: 1,
        }, this.textureOptions));
        return new RenderTexture(baseRenderTexture);
    };
    RenderTexturePool.prototype.getOptimalTexture = function getOptimalTexture(minWidth, minHeight, resolution) {
        if (resolution === void 0) {
            resolution = 1;
        }
        var key = RenderTexturePool.SCREEN_KEY;
        minWidth *= resolution;
        minHeight *= resolution;
        if (!this.enableFullScreen || minWidth !== this._pixelsWidth || minHeight !== this._pixelsHeight) {
            minWidth = nextPow2(minWidth);
            minHeight = nextPow2(minHeight);
            key = ((minWidth & 0xFFFF) << 16) | (minHeight & 0xFFFF);
        }
        if (!this.texturePool[key]) {
            this.texturePool[key] = [];
        }
        var renderTexture = this.texturePool[key].pop();
        if (!renderTexture) {
            renderTexture = this.createTexture(minWidth, minHeight);
        }
        renderTexture.filterPoolKey = key;
        renderTexture.setResolution(resolution);
        return renderTexture;
    };
    RenderTexturePool.prototype.getFilterTexture = function getFilterTexture(input, resolution) {
        var filterTexture = this.getOptimalTexture(input.width, input.height, resolution || input.resolution);
        filterTexture.filterFrame = input.filterFrame;
        return filterTexture;
    };
    RenderTexturePool.prototype.returnTexture = function returnTexture(renderTexture) {
        var key = renderTexture.filterPoolKey;
        renderTexture.filterFrame = null;
        this.texturePool[key].push(renderTexture);
    };
    RenderTexturePool.prototype.returnFilterTexture = function returnFilterTexture(renderTexture) {
        this.returnTexture(renderTexture);
    };
    RenderTexturePool.prototype.clear = function clear(destroyTextures) {
        destroyTextures = destroyTextures !== false;
        if (destroyTextures) {
            for (var i in this.texturePool) {
                var textures = this.texturePool[i];
                if (textures) {
                    for (var j = 0; j < textures.length; j++) {
                        textures[j].destroy(true);
                    }
                }
            }
        }
        this.texturePool = {};
    };
    RenderTexturePool.prototype.setScreenSize = function setScreenSize(size) {
        if (size.width === this._pixelsWidth
            && size.height === this._pixelsHeight) {
            return;
        }
        var screenKey = RenderTexturePool.SCREEN_KEY;
        var textures = this.texturePool[screenKey];
        this.enableFullScreen = size.width > 0 && size.height > 0;
        if (textures) {
            for (var j = 0; j < textures.length; j++) {
                textures[j].destroy(true);
            }
        }
        this.texturePool[screenKey] = [];
        this._pixelsWidth = size.width;
        this._pixelsHeight = size.height;
    };
    RenderTexturePool.SCREEN_KEY = 'screen';
    var Attribute = function Attribute(buffer, size, normalized, type, stride, start, instance) {
        if (normalized === void 0) {
            normalized = false;
        }
        if (type === void 0) {
            type = 5126;
        }
        this.buffer = buffer;
        this.size = size;
        this.normalized = normalized;
        this.type = type;
        this.stride = stride;
        this.start = start;
        this.instance = instance;
    };
    Attribute.prototype.destroy = function destroy() {
        this.buffer = null;
    };
    Attribute.from = function from(buffer, size, normalized, type, stride) {
        return new Attribute(buffer, size, normalized, type, stride);
    };
    var UID = 0;
    var Buffer = function Buffer(data, _static, index) {
        if (_static === void 0) {
            _static = true;
        }
        if (index === void 0) {
            index = false;
        }
        this.data = data || new Float32Array(1);
        this._glBuffers = {};
        this._updateID = 0;
        this.index = index;
        this.static = _static;
        this.id = UID++;
        this.disposeRunner = new Runner('disposeBuffer', 2);
    };
    Buffer.prototype.update = function update(data) {
        this.data = data || this.data;
        this._updateID++;
    };
    Buffer.prototype.dispose = function dispose() {
        this.disposeRunner.run(this, false);
    };
    Buffer.prototype.destroy = function destroy() {
        this.dispose();
        this.data = null;
    };
    Buffer.from = function from(data) {
        if (data instanceof Array) {
            data = new Float32Array(data);
        }
        return new Buffer(data);
    };
    function getBufferType$1(array) {
        if (array.BYTES_PER_ELEMENT === 4) {
            if (array instanceof Float32Array) {
                return 'Float32Array';
            }
            else if (array instanceof Uint32Array) {
                return 'Uint32Array';
            }
            return 'Int32Array';
        }
        else if (array.BYTES_PER_ELEMENT === 2) {
            if (array instanceof Uint16Array) {
                return 'Uint16Array';
            }
        }
        else if (array.BYTES_PER_ELEMENT === 1) {
            if (array instanceof Uint8Array) {
                return 'Uint8Array';
            }
        }
        return null;
    }
    var map$1 = {
        Float32Array: Float32Array,
        Uint32Array: Uint32Array,
        Int32Array: Int32Array,
        Uint8Array: Uint8Array,
    };
    function interleaveTypedArrays$1(arrays, sizes) {
        var outSize = 0;
        var stride = 0;
        var views = {};
        for (var i = 0; i < arrays.length; i++) {
            stride += sizes[i];
            outSize += arrays[i].length;
        }
        var buffer = new ArrayBuffer(outSize * 4);
        var out = null;
        var littleOffset = 0;
        for (var i$1 = 0; i$1 < arrays.length; i$1++) {
            var size = sizes[i$1];
            var array = arrays[i$1];
            var type = getBufferType$1(array);
            if (!views[type]) {
                views[type] = new map$1[type](buffer);
            }
            out = views[type];
            for (var j = 0; j < array.length; j++) {
                var indexStart = ((j / size | 0) * stride) + littleOffset;
                var index = j % size;
                out[indexStart + index] = array[j];
            }
            littleOffset += size;
        }
        return new Float32Array(buffer);
    }
    var byteSizeMap = { 5126: 4, 5123: 2, 5121: 1 };
    var UID$1 = 0;
    var map$1$1 = {
        Float32Array: Float32Array,
        Uint32Array: Uint32Array,
        Int32Array: Int32Array,
        Uint8Array: Uint8Array,
        Uint16Array: Uint16Array,
    };
    var Geometry = function Geometry(buffers, attributes) {
        if (buffers === void 0) {
            buffers = [];
        }
        if (attributes === void 0) {
            attributes = {};
        }
        this.buffers = buffers;
        this.indexBuffer = null;
        this.attributes = attributes;
        this.glVertexArrayObjects = {};
        this.id = UID$1++;
        this.instanced = false;
        this.instanceCount = 1;
        this.disposeRunner = new Runner('disposeGeometry', 2);
        this.refCount = 0;
    };
    Geometry.prototype.addAttribute = function addAttribute(id, buffer, size, normalized, type, stride, start, instance) {
        if (normalized === void 0) {
            normalized = false;
        }
        if (instance === void 0) {
            instance = false;
        }
        if (!buffer) {
            throw new Error('You must pass a buffer when creating an attribute');
        }
        if (!buffer.data) {
            if (buffer instanceof Array) {
                buffer = new Float32Array(buffer);
            }
            buffer = new Buffer(buffer);
        }
        var ids = id.split('|');
        if (ids.length > 1) {
            for (var i = 0; i < ids.length; i++) {
                this.addAttribute(ids[i], buffer, size, normalized, type);
            }
            return this;
        }
        var bufferIndex = this.buffers.indexOf(buffer);
        if (bufferIndex === -1) {
            this.buffers.push(buffer);
            bufferIndex = this.buffers.length - 1;
        }
        this.attributes[id] = new Attribute(bufferIndex, size, normalized, type, stride, start, instance);
        this.instanced = this.instanced || instance;
        return this;
    };
    Geometry.prototype.getAttribute = function getAttribute(id) {
        return this.attributes[id];
    };
    Geometry.prototype.getBuffer = function getBuffer(id) {
        return this.buffers[this.getAttribute(id).buffer];
    };
    Geometry.prototype.addIndex = function addIndex(buffer) {
        if (!buffer.data) {
            if (buffer instanceof Array) {
                buffer = new Uint16Array(buffer);
            }
            buffer = new Buffer(buffer);
        }
        buffer.index = true;
        this.indexBuffer = buffer;
        if (this.buffers.indexOf(buffer) === -1) {
            this.buffers.push(buffer);
        }
        return this;
    };
    Geometry.prototype.getIndex = function getIndex() {
        return this.indexBuffer;
    };
    Geometry.prototype.interleave = function interleave() {
        if (this.buffers.length === 1 || (this.buffers.length === 2 && this.indexBuffer)) {
            return this;
        }
        var arrays = [];
        var sizes = [];
        var interleavedBuffer = new Buffer();
        var i;
        for (i in this.attributes) {
            var attribute = this.attributes[i];
            var buffer = this.buffers[attribute.buffer];
            arrays.push(buffer.data);
            sizes.push((attribute.size * byteSizeMap[attribute.type]) / 4);
            attribute.buffer = 0;
        }
        interleavedBuffer.data = interleaveTypedArrays$1(arrays, sizes);
        for (i = 0; i < this.buffers.length; i++) {
            if (this.buffers[i] !== this.indexBuffer) {
                this.buffers[i].destroy();
            }
        }
        this.buffers = [interleavedBuffer];
        if (this.indexBuffer) {
            this.buffers.push(this.indexBuffer);
        }
        return this;
    };
    Geometry.prototype.getSize = function getSize() {
        for (var i in this.attributes) {
            var attribute = this.attributes[i];
            var buffer = this.buffers[attribute.buffer];
            return buffer.data.length / ((attribute.stride / 4) || attribute.size);
        }
        return 0;
    };
    Geometry.prototype.dispose = function dispose() {
        this.disposeRunner.run(this, false);
    };
    Geometry.prototype.destroy = function destroy() {
        this.dispose();
        this.buffers = null;
        this.indexBuffer = null;
        this.attributes = null;
    };
    Geometry.prototype.clone = function clone() {
        var geometry = new Geometry();
        for (var i = 0; i < this.buffers.length; i++) {
            geometry.buffers[i] = new Buffer(this.buffers[i].data.slice());
        }
        for (var i$1 in this.attributes) {
            var attrib = this.attributes[i$1];
            geometry.attributes[i$1] = new Attribute(attrib.buffer, attrib.size, attrib.normalized, attrib.type, attrib.stride, attrib.start, attrib.instance);
        }
        if (this.indexBuffer) {
            geometry.indexBuffer = geometry.buffers[this.buffers.indexOf(this.indexBuffer)];
            geometry.indexBuffer.index = true;
        }
        return geometry;
    };
    Geometry.merge = function merge(geometries) {
        var geometryOut = new Geometry();
        var arrays = [];
        var sizes = [];
        var offsets = [];
        var geometry;
        for (var i = 0; i < geometries.length; i++) {
            geometry = geometries[i];
            for (var j = 0; j < geometry.buffers.length; j++) {
                sizes[j] = sizes[j] || 0;
                sizes[j] += geometry.buffers[j].data.length;
                offsets[j] = 0;
            }
        }
        for (var i$1 = 0; i$1 < geometry.buffers.length; i$1++) {
            arrays[i$1] = new map$1$1[getBufferType$1(geometry.buffers[i$1].data)](sizes[i$1]);
            geometryOut.buffers[i$1] = new Buffer(arrays[i$1]);
        }
        for (var i$2 = 0; i$2 < geometries.length; i$2++) {
            geometry = geometries[i$2];
            for (var j$1 = 0; j$1 < geometry.buffers.length; j$1++) {
                arrays[j$1].set(geometry.buffers[j$1].data, offsets[j$1]);
                offsets[j$1] += geometry.buffers[j$1].data.length;
            }
        }
        geometryOut.attributes = geometry.attributes;
        if (geometry.indexBuffer) {
            geometryOut.indexBuffer = geometryOut.buffers[geometry.buffers.indexOf(geometry.indexBuffer)];
            geometryOut.indexBuffer.index = true;
            var offset = 0;
            var stride = 0;
            var offset2 = 0;
            var bufferIndexToCount = 0;
            for (var i$3 = 0; i$3 < geometry.buffers.length; i$3++) {
                if (geometry.buffers[i$3] !== geometry.indexBuffer) {
                    bufferIndexToCount = i$3;
                    break;
                }
            }
            for (var i$4 in geometry.attributes) {
                var attribute = geometry.attributes[i$4];
                if ((attribute.buffer | 0) === bufferIndexToCount) {
                    stride += ((attribute.size * byteSizeMap[attribute.type]) / 4);
                }
            }
            for (var i$5 = 0; i$5 < geometries.length; i$5++) {
                var indexBufferData = geometries[i$5].indexBuffer.data;
                for (var j$2 = 0; j$2 < indexBufferData.length; j$2++) {
                    geometryOut.indexBuffer.data[j$2 + offset2] += offset;
                }
                offset += geometry.buffers[bufferIndexToCount].data.length / (stride);
                offset2 += indexBufferData.length;
            }
        }
        return geometryOut;
    };
    var Quad = (function (Geometry) {
        function Quad() {
            Geometry.call(this);
            this.addAttribute('aVertexPosition', [
                0, 0,
                1, 0,
                1, 1,
                0, 1
            ])
                .addIndex([0, 1, 3, 2]);
        }
        if (Geometry) {
            Quad.__proto__ = Geometry;
        }
        Quad.prototype = Object.create(Geometry && Geometry.prototype);
        Quad.prototype.constructor = Quad;
        return Quad;
    }(Geometry));
    var QuadUv = (function (Geometry) {
        function QuadUv() {
            Geometry.call(this);
            this.vertices = new Float32Array([
                -1, -1,
                1, -1,
                1, 1,
                -1, 1
            ]);
            this.uvs = new Float32Array([
                0, 0,
                1, 0,
                1, 1,
                0, 1
            ]);
            this.vertexBuffer = new Buffer(this.vertices);
            this.uvBuffer = new Buffer(this.uvs);
            this.addAttribute('aVertexPosition', this.vertexBuffer)
                .addAttribute('aTextureCoord', this.uvBuffer)
                .addIndex([0, 1, 2, 0, 2, 3]);
        }
        if (Geometry) {
            QuadUv.__proto__ = Geometry;
        }
        QuadUv.prototype = Object.create(Geometry && Geometry.prototype);
        QuadUv.prototype.constructor = QuadUv;
        QuadUv.prototype.map = function map(targetTextureFrame, destinationFrame) {
            var x = 0;
            var y = 0;
            this.uvs[0] = x;
            this.uvs[1] = y;
            this.uvs[2] = x + (destinationFrame.width / targetTextureFrame.width);
            this.uvs[3] = y;
            this.uvs[4] = x + (destinationFrame.width / targetTextureFrame.width);
            this.uvs[5] = y + (destinationFrame.height / targetTextureFrame.height);
            this.uvs[6] = x;
            this.uvs[7] = y + (destinationFrame.height / targetTextureFrame.height);
            x = destinationFrame.x;
            y = destinationFrame.y;
            this.vertices[0] = x;
            this.vertices[1] = y;
            this.vertices[2] = x + destinationFrame.width;
            this.vertices[3] = y;
            this.vertices[4] = x + destinationFrame.width;
            this.vertices[5] = y + destinationFrame.height;
            this.vertices[6] = x;
            this.vertices[7] = y + destinationFrame.height;
            this.invalidate();
            return this;
        };
        QuadUv.prototype.invalidate = function invalidate() {
            this.vertexBuffer._updateID++;
            this.uvBuffer._updateID++;
            return this;
        };
        return QuadUv;
    }(Geometry));
    var UID$2 = 0;
    var UniformGroup = function UniformGroup(uniforms, _static) {
        this.uniforms = uniforms;
        this.group = true;
        this.syncUniforms = {};
        this.dirtyId = 0;
        this.id = UID$2++;
        this.static = !!_static;
    };
    UniformGroup.prototype.update = function update() {
        this.dirtyId++;
    };
    UniformGroup.prototype.add = function add(name, uniforms, _static) {
        this.uniforms[name] = new UniformGroup(uniforms, _static);
    };
    UniformGroup.from = function from(uniforms, _static) {
        return new UniformGroup(uniforms, _static);
    };
    var FilterState = function FilterState() {
        this.renderTexture = null;
        this.target = null;
        this.legacy = false;
        this.resolution = 1;
        this.sourceFrame = new Rectangle();
        this.destinationFrame = new Rectangle();
        this.filters = [];
    };
    FilterState.prototype.clear = function clear() {
        this.target = null;
        this.filters = null;
        this.renderTexture = null;
    };
    var FilterSystem = (function (System) {
        function FilterSystem(renderer) {
            System.call(this, renderer);
            this.defaultFilterStack = [{}];
            this.texturePool = new RenderTexturePool();
            this.texturePool.setScreenSize(renderer.view);
            this.statePool = [];
            this.quad = new Quad();
            this.quadUv = new QuadUv();
            this.tempRect = new Rectangle();
            this.activeState = {};
            this.globalUniforms = new UniformGroup({
                outputFrame: this.tempRect,
                inputSize: new Float32Array(4),
                inputPixel: new Float32Array(4),
                inputClamp: new Float32Array(4),
                resolution: 1,
                filterArea: new Float32Array(4),
                filterClamp: new Float32Array(4),
            }, true);
            this._pixelsWidth = renderer.view.width;
            this._pixelsHeight = renderer.view.height;
        }
        if (System) {
            FilterSystem.__proto__ = System;
        }
        FilterSystem.prototype = Object.create(System && System.prototype);
        FilterSystem.prototype.constructor = FilterSystem;
        FilterSystem.prototype.push = function push(target, filters) {
            var renderer = this.renderer;
            var filterStack = this.defaultFilterStack;
            var state = this.statePool.pop() || new FilterState();
            var resolution = filters[0].resolution;
            var padding = filters[0].padding;
            var autoFit = filters[0].autoFit;
            var legacy = filters[0].legacy;
            for (var i = 1; i < filters.length; i++) {
                var filter = filters[i];
                resolution = Math.min(resolution, filter.resolution);
                padding = Math.max(padding, filter.padding);
                autoFit = autoFit || filter.autoFit;
                legacy = legacy || filter.legacy;
            }
            if (filterStack.length === 1) {
                this.defaultFilterStack[0].renderTexture = renderer.renderTexture.current;
            }
            filterStack.push(state);
            state.resolution = resolution;
            state.legacy = legacy;
            state.target = target;
            state.sourceFrame.copyFrom(target.filterArea || target.getBounds(true));
            state.sourceFrame.pad(padding);
            if (autoFit) {
                state.sourceFrame.fit(this.renderer.renderTexture.sourceFrame);
            }
            state.sourceFrame.ceil(resolution);
            state.renderTexture = this.getOptimalFilterTexture(state.sourceFrame.width, state.sourceFrame.height, resolution);
            state.filters = filters;
            state.destinationFrame.width = state.renderTexture.width;
            state.destinationFrame.height = state.renderTexture.height;
            state.renderTexture.filterFrame = state.sourceFrame;
            renderer.renderTexture.bind(state.renderTexture, state.sourceFrame);
            renderer.renderTexture.clear();
        };
        FilterSystem.prototype.pop = function pop() {
            var filterStack = this.defaultFilterStack;
            var state = filterStack.pop();
            var filters = state.filters;
            this.activeState = state;
            var globalUniforms = this.globalUniforms.uniforms;
            globalUniforms.outputFrame = state.sourceFrame;
            globalUniforms.resolution = state.resolution;
            var inputSize = globalUniforms.inputSize;
            var inputPixel = globalUniforms.inputPixel;
            var inputClamp = globalUniforms.inputClamp;
            inputSize[0] = state.destinationFrame.width;
            inputSize[1] = state.destinationFrame.height;
            inputSize[2] = 1.0 / inputSize[0];
            inputSize[3] = 1.0 / inputSize[1];
            inputPixel[0] = inputSize[0] * state.resolution;
            inputPixel[1] = inputSize[1] * state.resolution;
            inputPixel[2] = 1.0 / inputPixel[0];
            inputPixel[3] = 1.0 / inputPixel[1];
            inputClamp[0] = 0.5 * inputPixel[2];
            inputClamp[1] = 0.5 * inputPixel[3];
            inputClamp[2] = (state.sourceFrame.width * inputSize[2]) - (0.5 * inputPixel[2]);
            inputClamp[3] = (state.sourceFrame.height * inputSize[3]) - (0.5 * inputPixel[3]);
            if (state.legacy) {
                var filterArea = globalUniforms.filterArea;
                filterArea[0] = state.destinationFrame.width;
                filterArea[1] = state.destinationFrame.height;
                filterArea[2] = state.sourceFrame.x;
                filterArea[3] = state.sourceFrame.y;
                globalUniforms.filterClamp = globalUniforms.inputClamp;
            }
            this.globalUniforms.update();
            var lastState = filterStack[filterStack.length - 1];
            if (filters.length === 1) {
                filters[0].apply(this, state.renderTexture, lastState.renderTexture, false, state);
                this.returnFilterTexture(state.renderTexture);
            }
            else {
                var flip = state.renderTexture;
                var flop = this.getOptimalFilterTexture(flip.width, flip.height, state.resolution);
                flop.filterFrame = flip.filterFrame;
                var i = 0;
                for (i = 0; i < filters.length - 1; ++i) {
                    filters[i].apply(this, flip, flop, true, state);
                    var t = flip;
                    flip = flop;
                    flop = t;
                }
                filters[i].apply(this, flip, lastState.renderTexture, false, state);
                this.returnFilterTexture(flip);
                this.returnFilterTexture(flop);
            }
            state.clear();
            this.statePool.push(state);
        };
        FilterSystem.prototype.applyFilter = function applyFilter(filter, input, output, clear) {
            var renderer = this.renderer;
            renderer.renderTexture.bind(output, output ? output.filterFrame : null);
            if (clear) {
                renderer.renderTexture.clear();
            }
            filter.uniforms.uSampler = input;
            filter.uniforms.filterGlobals = this.globalUniforms;
            renderer.state.set(filter.state);
            renderer.shader.bind(filter);
            if (filter.legacy) {
                this.quadUv.map(input._frame, input.filterFrame);
                renderer.geometry.bind(this.quadUv);
                renderer.geometry.draw(exports.DRAW_MODES.TRIANGLES);
            }
            else {
                renderer.geometry.bind(this.quad);
                renderer.geometry.draw(exports.DRAW_MODES.TRIANGLE_STRIP);
            }
        };
        FilterSystem.prototype.calculateSpriteMatrix = function calculateSpriteMatrix(outputMatrix, sprite) {
            var ref = this.activeState;
            var sourceFrame = ref.sourceFrame;
            var destinationFrame = ref.destinationFrame;
            var ref$1 = sprite._texture;
            var orig = ref$1.orig;
            var mappedMatrix = outputMatrix.set(destinationFrame.width, 0, 0, destinationFrame.height, sourceFrame.x, sourceFrame.y);
            var worldTransform = sprite.worldTransform.copyTo(Matrix.TEMP_MATRIX);
            worldTransform.invert();
            mappedMatrix.prepend(worldTransform);
            mappedMatrix.scale(1.0 / orig.width, 1.0 / orig.height);
            mappedMatrix.translate(sprite.anchor.x, sprite.anchor.y);
            return mappedMatrix;
        };
        FilterSystem.prototype.destroy = function destroy() {
            this.texturePool.clear(false);
        };
        FilterSystem.prototype.getOptimalFilterTexture = function getOptimalFilterTexture(minWidth, minHeight, resolution) {
            if (resolution === void 0) {
                resolution = 1;
            }
            return this.texturePool.getOptimalTexture(minWidth, minHeight, resolution);
        };
        FilterSystem.prototype.getFilterTexture = function getFilterTexture(input, resolution) {
            if (typeof input === 'number') {
                var swap = input;
                input = resolution;
                resolution = swap;
            }
            input = input || this.activeState.renderTexture;
            var filterTexture = this.texturePool.getOptimalTexture(input.width, input.height, resolution || input.resolution);
            filterTexture.filterFrame = input.filterFrame;
            return filterTexture;
        };
        FilterSystem.prototype.returnFilterTexture = function returnFilterTexture(renderTexture) {
            this.texturePool.returnTexture(renderTexture);
        };
        FilterSystem.prototype.emptyPool = function emptyPool() {
            this.texturePool.clear(true);
        };
        FilterSystem.prototype.resize = function resize() {
            this.texturePool.setScreenSize(this.renderer.view);
        };
        return FilterSystem;
    }(System));
    var ObjectRenderer = function ObjectRenderer(renderer) {
        this.renderer = renderer;
    };
    ObjectRenderer.prototype.flush = function flush() {
    };
    ObjectRenderer.prototype.destroy = function destroy() {
        this.renderer = null;
    };
    ObjectRenderer.prototype.start = function start() {
    };
    ObjectRenderer.prototype.stop = function stop() {
        this.flush();
    };
    ObjectRenderer.prototype.render = function render(object) {
    };
    var BatchSystem = (function (System) {
        function BatchSystem(renderer) {
            System.call(this, renderer);
            this.emptyRenderer = new ObjectRenderer(renderer);
            this.currentRenderer = this.emptyRenderer;
        }
        if (System) {
            BatchSystem.__proto__ = System;
        }
        BatchSystem.prototype = Object.create(System && System.prototype);
        BatchSystem.prototype.constructor = BatchSystem;
        BatchSystem.prototype.setObjectRenderer = function setObjectRenderer(objectRenderer) {
            if (this.currentRenderer === objectRenderer) {
                return;
            }
            this.currentRenderer.stop();
            this.currentRenderer = objectRenderer;
            this.currentRenderer.start();
        };
        BatchSystem.prototype.flush = function flush() {
            this.setObjectRenderer(this.emptyRenderer);
        };
        BatchSystem.prototype.reset = function reset() {
            this.setObjectRenderer(this.emptyRenderer);
        };
        BatchSystem.prototype.copyBoundTextures = function copyBoundTextures(arr, maxTextures) {
            var ref = this.renderer.texture;
            var boundTextures = ref.boundTextures;
            for (var i = maxTextures - 1; i >= 0; --i) {
                arr[i] = boundTextures[i] || null;
                if (arr[i]) {
                    arr[i]._batchLocation = i;
                }
            }
        };
        BatchSystem.prototype.boundArray = function boundArray(texArray, boundTextures, batchId, maxTextures) {
            var elements = texArray.elements;
            var ids = texArray.ids;
            var count = texArray.count;
            var j = 0;
            for (var i = 0; i < count; i++) {
                var tex = elements[i];
                var loc = tex._batchLocation;
                if (loc >= 0 && loc < maxTextures
                    && boundTextures[loc] === tex) {
                    ids[i] = loc;
                    continue;
                }
                while (j < maxTextures) {
                    var bound = boundTextures[j];
                    if (bound && bound._batchEnabled === batchId
                        && bound._batchLocation === j) {
                        j++;
                        continue;
                    }
                    ids[i] = j;
                    tex._batchLocation = j;
                    boundTextures[j] = tex;
                    break;
                }
            }
        };
        return BatchSystem;
    }(System));
    settings.PREFER_ENV = isMobile$1.any ? exports.ENV.WEBGL : exports.ENV.WEBGL2;
    settings.STRICT_TEXTURE_CACHE = false;
    var CONTEXT_UID = 0;
    var ContextSystem = (function (System) {
        function ContextSystem(renderer) {
            System.call(this, renderer);
            this.webGLVersion = 1;
            this.extensions = {};
            this.handleContextLost = this.handleContextLost.bind(this);
            this.handleContextRestored = this.handleContextRestored.bind(this);
            renderer.view.addEventListener('webglcontextlost', this.handleContextLost, false);
            renderer.view.addEventListener('webglcontextrestored', this.handleContextRestored, false);
        }
        if (System) {
            ContextSystem.__proto__ = System;
        }
        ContextSystem.prototype = Object.create(System && System.prototype);
        ContextSystem.prototype.constructor = ContextSystem;
        var prototypeAccessors = { isLost: { configurable: true } };
        prototypeAccessors.isLost.get = function () {
            return (!this.gl || this.gl.isContextLost());
        };
        ContextSystem.prototype.contextChange = function contextChange(gl) {
            this.gl = gl;
            this.renderer.gl = gl;
            this.renderer.CONTEXT_UID = CONTEXT_UID++;
            if (gl.isContextLost() && gl.getExtension('WEBGL_lose_context')) {
                gl.getExtension('WEBGL_lose_context').restoreContext();
            }
        };
        ContextSystem.prototype.initFromContext = function initFromContext(gl) {
            this.gl = gl;
            this.validateContext(gl);
            this.renderer.gl = gl;
            this.renderer.CONTEXT_UID = CONTEXT_UID++;
            this.renderer.runners.contextChange.run(gl);
        };
        ContextSystem.prototype.initFromOptions = function initFromOptions(options) {
            var gl = this.createContext(this.renderer.view, options);
            this.initFromContext(gl);
        };
        ContextSystem.prototype.createContext = function createContext(canvas, options) {
            var gl;
            if (settings.PREFER_ENV >= exports.ENV.WEBGL2) {
                gl = canvas.getContext('webgl2', options);
            }
            if (gl) {
                this.webGLVersion = 2;
            }
            else {
                this.webGLVersion = 1;
                gl = canvas.getContext('webgl', options)
                    || canvas.getContext('experimental-webgl', options);
                if (!gl) {
                    throw new Error('This browser does not support WebGL. Try using the canvas renderer');
                }
            }
            this.gl = gl;
            this.getExtensions();
            return gl;
        };
        ContextSystem.prototype.getExtensions = function getExtensions() {
            var ref = this;
            var gl = ref.gl;
            if (this.webGLVersion === 1) {
                Object.assign(this.extensions, {
                    drawBuffers: gl.getExtension('WEBGL_draw_buffers'),
                    depthTexture: gl.getExtension('WEBKIT_WEBGL_depth_texture'),
                    loseContext: gl.getExtension('WEBGL_lose_context'),
                    vertexArrayObject: gl.getExtension('OES_vertex_array_object')
                        || gl.getExtension('MOZ_OES_vertex_array_object')
                        || gl.getExtension('WEBKIT_OES_vertex_array_object'),
                    anisotropicFiltering: gl.getExtension('EXT_texture_filter_anisotropic'),
                    uint32ElementIndex: gl.getExtension('OES_element_index_uint'),
                    floatTexture: gl.getExtension('OES_texture_float'),
                    floatTextureLinear: gl.getExtension('OES_texture_float_linear'),
                    textureHalfFloat: gl.getExtension('OES_texture_half_float'),
                    textureHalfFloatLinear: gl.getExtension('OES_texture_half_float_linear'),
                });
            }
            else if (this.webGLVersion === 2) {
                Object.assign(this.extensions, {
                    anisotropicFiltering: gl.getExtension('EXT_texture_filter_anisotropic'),
                    colorBufferFloat: gl.getExtension('EXT_color_buffer_float'),
                    floatTextureLinear: gl.getExtension('OES_texture_float_linear'),
                });
            }
        };
        ContextSystem.prototype.handleContextLost = function handleContextLost(event) {
            event.preventDefault();
        };
        ContextSystem.prototype.handleContextRestored = function handleContextRestored() {
            this.renderer.runners.contextChange.run(this.gl);
        };
        ContextSystem.prototype.destroy = function destroy() {
            var view = this.renderer.view;
            view.removeEventListener('webglcontextlost', this.handleContextLost);
            view.removeEventListener('webglcontextrestored', this.handleContextRestored);
            this.gl.useProgram(null);
            if (this.extensions.loseContext) {
                this.extensions.loseContext.loseContext();
            }
        };
        ContextSystem.prototype.postrender = function postrender() {
            if (this.renderer.renderingToScreen) {
                this.gl.flush();
            }
        };
        ContextSystem.prototype.validateContext = function validateContext(gl) {
            var attributes = gl.getContextAttributes();
            if (!attributes.stencil) {
                console.warn('Provided WebGL context does not have a stencil buffer, masks may not render correctly');
            }
        };
        Object.defineProperties(ContextSystem.prototype, prototypeAccessors);
        return ContextSystem;
    }(System));
    var FramebufferSystem = (function (System) {
        function FramebufferSystem(renderer) {
            System.call(this, renderer);
            this.managedFramebuffers = [];
            this.unknownFramebuffer = new Framebuffer(10, 10);
        }
        if (System) {
            FramebufferSystem.__proto__ = System;
        }
        FramebufferSystem.prototype = Object.create(System && System.prototype);
        FramebufferSystem.prototype.constructor = FramebufferSystem;
        var prototypeAccessors = { size: { configurable: true } };
        FramebufferSystem.prototype.contextChange = function contextChange() {
            var gl = this.gl = this.renderer.gl;
            this.CONTEXT_UID = this.renderer.CONTEXT_UID;
            this.current = this.unknownFramebuffer;
            this.viewport = new Rectangle();
            this.hasMRT = true;
            this.writeDepthTexture = true;
            this.disposeAll(true);
            if (this.renderer.context.webGLVersion === 1) {
                var nativeDrawBuffersExtension = this.renderer.context.extensions.drawBuffers;
                var nativeDepthTextureExtension = this.renderer.context.extensions.depthTexture;
                if (settings.PREFER_ENV === exports.ENV.WEBGL_LEGACY) {
                    nativeDrawBuffersExtension = null;
                    nativeDepthTextureExtension = null;
                }
                if (nativeDrawBuffersExtension) {
                    gl.drawBuffers = function (activeTextures) { return nativeDrawBuffersExtension.drawBuffersWEBGL(activeTextures); };
                }
                else {
                    this.hasMRT = false;
                    gl.drawBuffers = function () {
                    };
                }
                if (!nativeDepthTextureExtension) {
                    this.writeDepthTexture = false;
                }
            }
        };
        FramebufferSystem.prototype.bind = function bind(framebuffer, frame) {
            var ref = this;
            var gl = ref.gl;
            if (framebuffer) {
                var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID] || this.initFramebuffer(framebuffer);
                if (this.current !== framebuffer) {
                    this.current = framebuffer;
                    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.framebuffer);
                }
                if (fbo.dirtyId !== framebuffer.dirtyId) {
                    fbo.dirtyId = framebuffer.dirtyId;
                    if (fbo.dirtyFormat !== framebuffer.dirtyFormat) {
                        fbo.dirtyFormat = framebuffer.dirtyFormat;
                        this.updateFramebuffer(framebuffer);
                    }
                    else if (fbo.dirtySize !== framebuffer.dirtySize) {
                        fbo.dirtySize = framebuffer.dirtySize;
                        this.resizeFramebuffer(framebuffer);
                    }
                }
                for (var i = 0; i < framebuffer.colorTextures.length; i++) {
                    if (framebuffer.colorTextures[i].texturePart) {
                        this.renderer.texture.unbind(framebuffer.colorTextures[i].texture);
                    }
                    else {
                        this.renderer.texture.unbind(framebuffer.colorTextures[i]);
                    }
                }
                if (framebuffer.depthTexture) {
                    this.renderer.texture.unbind(framebuffer.depthTexture);
                }
                if (frame) {
                    this.setViewport(frame.x, frame.y, frame.width, frame.height);
                }
                else {
                    this.setViewport(0, 0, framebuffer.width, framebuffer.height);
                }
            }
            else {
                if (this.current) {
                    this.current = null;
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                }
                if (frame) {
                    this.setViewport(frame.x, frame.y, frame.width, frame.height);
                }
                else {
                    this.setViewport(0, 0, this.renderer.width, this.renderer.height);
                }
            }
        };
        FramebufferSystem.prototype.setViewport = function setViewport(x, y, width, height) {
            var v = this.viewport;
            if (v.width !== width || v.height !== height || v.x !== x || v.y !== y) {
                v.x = x;
                v.y = y;
                v.width = width;
                v.height = height;
                this.gl.viewport(x, y, width, height);
            }
        };
        prototypeAccessors.size.get = function () {
            if (this.current) {
                return { x: 0, y: 0, width: this.current.width, height: this.current.height };
            }
            return { x: 0, y: 0, width: this.renderer.width, height: this.renderer.height };
        };
        FramebufferSystem.prototype.clear = function clear(r, g, b, a) {
            var ref = this;
            var gl = ref.gl;
            gl.clearColor(r, g, b, a);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        };
        FramebufferSystem.prototype.initFramebuffer = function initFramebuffer(framebuffer) {
            var ref = this;
            var gl = ref.gl;
            var fbo = {
                framebuffer: gl.createFramebuffer(),
                stencil: null,
                dirtyId: 0,
                dirtyFormat: 0,
                dirtySize: 0,
            };
            framebuffer.glFramebuffers[this.CONTEXT_UID] = fbo;
            this.managedFramebuffers.push(framebuffer);
            framebuffer.disposeRunner.add(this);
            return fbo;
        };
        FramebufferSystem.prototype.resizeFramebuffer = function resizeFramebuffer(framebuffer) {
            var ref = this;
            var gl = ref.gl;
            var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];
            if (fbo.stencil) {
                gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.stencil);
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, framebuffer.width, framebuffer.height);
            }
            var colorTextures = framebuffer.colorTextures;
            for (var i = 0; i < colorTextures.length; i++) {
                this.renderer.texture.bind(colorTextures[i], 0);
            }
            if (framebuffer.depthTexture) {
                this.renderer.texture.bind(framebuffer.depthTexture, 0);
            }
        };
        FramebufferSystem.prototype.updateFramebuffer = function updateFramebuffer(framebuffer) {
            var ref = this;
            var gl = ref.gl;
            var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];
            var colorTextures = framebuffer.colorTextures;
            var count = colorTextures.length;
            if (!gl.drawBuffers) {
                count = Math.min(count, 1);
            }
            var activeTextures = [];
            for (var i = 0; i < count; i++) {
                var texture = framebuffer.colorTextures[i];
                if (texture.texturePart) {
                    this.renderer.texture.bind(texture.texture, 0);
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_CUBE_MAP_NEGATIVE_X + texture.side, texture.texture._glTextures[this.CONTEXT_UID].texture, 0);
                }
                else {
                    this.renderer.texture.bind(texture, 0);
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, texture._glTextures[this.CONTEXT_UID].texture, 0);
                }
                activeTextures.push(gl.COLOR_ATTACHMENT0 + i);
            }
            if (activeTextures.length > 1) {
                gl.drawBuffers(activeTextures);
            }
            if (framebuffer.depthTexture) {
                var writeDepthTexture = this.writeDepthTexture;
                if (writeDepthTexture) {
                    var depthTexture = framebuffer.depthTexture;
                    this.renderer.texture.bind(depthTexture, 0);
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture._glTextures[this.CONTEXT_UID].texture, 0);
                }
            }
            if (!fbo.stencil && (framebuffer.stencil || framebuffer.depth)) {
                fbo.stencil = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.stencil);
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, framebuffer.width, framebuffer.height);
                if (!framebuffer.depthTexture) {
                    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, fbo.stencil);
                }
            }
        };
        FramebufferSystem.prototype.disposeFramebuffer = function disposeFramebuffer(framebuffer, contextLost) {
            var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];
            var gl = this.gl;
            if (!fbo) {
                return;
            }
            delete framebuffer.glFramebuffers[this.CONTEXT_UID];
            var index = this.managedFramebuffers.indexOf(framebuffer);
            if (index >= 0) {
                this.managedFramebuffers.splice(index, 1);
            }
            framebuffer.disposeRunner.remove(this);
            if (!contextLost) {
                gl.deleteFramebuffer(fbo.framebuffer);
                if (fbo.stencil) {
                    gl.deleteRenderbuffer(fbo.stencil);
                }
            }
        };
        FramebufferSystem.prototype.disposeAll = function disposeAll(contextLost) {
            var list = this.managedFramebuffers;
            this.managedFramebuffers = [];
            for (var i = 0; i < list.length; i++) {
                this.disposeFramebuffer(list[i], contextLost);
            }
        };
        FramebufferSystem.prototype.forceStencil = function forceStencil() {
            var framebuffer = this.current;
            if (!framebuffer) {
                return;
            }
            var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];
            if (!fbo || fbo.stencil) {
                return;
            }
            framebuffer.enableStencil();
            var w = framebuffer.width;
            var h = framebuffer.height;
            var gl = this.gl;
            var stencil = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, stencil);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, w, h);
            fbo.stencil = stencil;
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, stencil);
        };
        FramebufferSystem.prototype.reset = function reset() {
            this.current = this.unknownFramebuffer;
            this.viewport = new Rectangle();
        };
        Object.defineProperties(FramebufferSystem.prototype, prototypeAccessors);
        return FramebufferSystem;
    }(System));
    var GLBuffer = function GLBuffer(buffer) {
        this.buffer = buffer;
        this.updateID = -1;
        this.byteLength = -1;
        this.refCount = 0;
    };
    var byteSizeMap$1 = { 5126: 4, 5123: 2, 5121: 1 };
    var GeometrySystem = (function (System) {
        function GeometrySystem(renderer) {
            System.call(this, renderer);
            this._activeGeometry = null;
            this._activeVao = null;
            this.hasVao = true;
            this.hasInstance = true;
            this.canUseUInt32ElementIndex = false;
            this.boundBuffers = {};
            this.managedGeometries = {};
            this.managedBuffers = {};
        }
        if (System) {
            GeometrySystem.__proto__ = System;
        }
        GeometrySystem.prototype = Object.create(System && System.prototype);
        GeometrySystem.prototype.constructor = GeometrySystem;
        GeometrySystem.prototype.contextChange = function contextChange() {
            this.disposeAll(true);
            var gl = this.gl = this.renderer.gl;
            var context = this.renderer.context;
            this.CONTEXT_UID = this.renderer.CONTEXT_UID;
            if (!gl.createVertexArray) {
                var nativeVaoExtension = this.renderer.context.extensions.vertexArrayObject;
                if (settings.PREFER_ENV === exports.ENV.WEBGL_LEGACY) {
                    nativeVaoExtension = null;
                }
                if (nativeVaoExtension) {
                    gl.createVertexArray = function () { return nativeVaoExtension.createVertexArrayOES(); };
                    gl.bindVertexArray = function (vao) { return nativeVaoExtension.bindVertexArrayOES(vao); };
                    gl.deleteVertexArray = function (vao) { return nativeVaoExtension.deleteVertexArrayOES(vao); };
                }
                else {
                    this.hasVao = false;
                    gl.createVertexArray = function () {
                    };
                    gl.bindVertexArray = function () {
                    };
                    gl.deleteVertexArray = function () {
                    };
                }
            }
            if (!gl.vertexAttribDivisor) {
                var instanceExt = gl.getExtension('ANGLE_instanced_arrays');
                if (instanceExt) {
                    gl.vertexAttribDivisor = function (a, b) { return instanceExt.vertexAttribDivisorANGLE(a, b); };
                    gl.drawElementsInstanced = function (a, b, c, d, e) { return instanceExt.drawElementsInstancedANGLE(a, b, c, d, e); };
                    gl.drawArraysInstanced = function (a, b, c, d) { return instanceExt.drawArraysInstancedANGLE(a, b, c, d); };
                }
                else {
                    this.hasInstance = false;
                }
            }
            this.canUseUInt32ElementIndex = context.webGLVersion === 2 || !!context.extensions.uint32ElementIndex;
        };
        GeometrySystem.prototype.bind = function bind(geometry, shader) {
            shader = shader || this.renderer.shader.shader;
            var ref = this;
            var gl = ref.gl;
            var vaos = geometry.glVertexArrayObjects[this.CONTEXT_UID];
            if (!vaos) {
                this.managedGeometries[geometry.id] = geometry;
                geometry.disposeRunner.add(this);
                geometry.glVertexArrayObjects[this.CONTEXT_UID] = vaos = {};
            }
            var vao = vaos[shader.program.id] || this.initGeometryVao(geometry, shader.program);
            this._activeGeometry = geometry;
            if (this._activeVao !== vao) {
                this._activeVao = vao;
                if (this.hasVao) {
                    gl.bindVertexArray(vao);
                }
                else {
                    this.activateVao(geometry, shader.program);
                }
            }
            this.updateBuffers();
        };
        GeometrySystem.prototype.reset = function reset() {
            this.unbind();
        };
        GeometrySystem.prototype.updateBuffers = function updateBuffers() {
            var geometry = this._activeGeometry;
            var ref = this;
            var gl = ref.gl;
            for (var i = 0; i < geometry.buffers.length; i++) {
                var buffer = geometry.buffers[i];
                var glBuffer = buffer._glBuffers[this.CONTEXT_UID];
                if (buffer._updateID !== glBuffer.updateID) {
                    glBuffer.updateID = buffer._updateID;
                    var type = buffer.index ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
                    gl.bindBuffer(type, glBuffer.buffer);
                    this._boundBuffer = glBuffer;
                    if (glBuffer.byteLength >= buffer.data.byteLength) {
                        gl.bufferSubData(type, 0, buffer.data);
                    }
                    else {
                        var drawType = buffer.static ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW;
                        glBuffer.byteLength = buffer.data.byteLength;
                        gl.bufferData(type, buffer.data, drawType);
                    }
                }
            }
        };
        GeometrySystem.prototype.checkCompatibility = function checkCompatibility(geometry, program) {
            var geometryAttributes = geometry.attributes;
            var shaderAttributes = program.attributeData;
            for (var j in shaderAttributes) {
                if (!geometryAttributes[j]) {
                    throw new Error(("shader and geometry incompatible, geometry missing the \"" + j + "\" attribute"));
                }
            }
        };
        GeometrySystem.prototype.getSignature = function getSignature(geometry, program) {
            var attribs = geometry.attributes;
            var shaderAttributes = program.attributeData;
            var strings = ['g', geometry.id];
            for (var i in attribs) {
                if (shaderAttributes[i]) {
                    strings.push(i);
                }
            }
            return strings.join('-');
        };
        GeometrySystem.prototype.initGeometryVao = function initGeometryVao(geometry, program) {
            this.checkCompatibility(geometry, program);
            var gl = this.gl;
            var CONTEXT_UID = this.CONTEXT_UID;
            var signature = this.getSignature(geometry, program);
            var vaoObjectHash = geometry.glVertexArrayObjects[this.CONTEXT_UID];
            var vao = vaoObjectHash[signature];
            if (vao) {
                vaoObjectHash[program.id] = vao;
                return vao;
            }
            var buffers = geometry.buffers;
            var attributes = geometry.attributes;
            var tempStride = {};
            var tempStart = {};
            for (var j in buffers) {
                tempStride[j] = 0;
                tempStart[j] = 0;
            }
            for (var j$1 in attributes) {
                if (!attributes[j$1].size && program.attributeData[j$1]) {
                    attributes[j$1].size = program.attributeData[j$1].size;
                }
                else if (!attributes[j$1].size) {
                    console.warn(("PIXI Geometry attribute '" + j$1 + "' size cannot be determined (likely the bound shader does not have the attribute)"));
                }
                tempStride[attributes[j$1].buffer] += attributes[j$1].size * byteSizeMap$1[attributes[j$1].type];
            }
            for (var j$2 in attributes) {
                var attribute = attributes[j$2];
                var attribSize = attribute.size;
                if (attribute.stride === undefined) {
                    if (tempStride[attribute.buffer] === attribSize * byteSizeMap$1[attribute.type]) {
                        attribute.stride = 0;
                    }
                    else {
                        attribute.stride = tempStride[attribute.buffer];
                    }
                }
                if (attribute.start === undefined) {
                    attribute.start = tempStart[attribute.buffer];
                    tempStart[attribute.buffer] += attribSize * byteSizeMap$1[attribute.type];
                }
            }
            vao = gl.createVertexArray();
            gl.bindVertexArray(vao);
            for (var i = 0; i < buffers.length; i++) {
                var buffer = buffers[i];
                if (!buffer._glBuffers[CONTEXT_UID]) {
                    buffer._glBuffers[CONTEXT_UID] = new GLBuffer(gl.createBuffer());
                    this.managedBuffers[buffer.id] = buffer;
                    buffer.disposeRunner.add(this);
                }
                buffer._glBuffers[CONTEXT_UID].refCount++;
            }
            this.activateVao(geometry, program);
            this._activeVao = vao;
            vaoObjectHash[program.id] = vao;
            vaoObjectHash[signature] = vao;
            return vao;
        };
        GeometrySystem.prototype.disposeBuffer = function disposeBuffer(buffer, contextLost) {
            if (!this.managedBuffers[buffer.id]) {
                return;
            }
            delete this.managedBuffers[buffer.id];
            var glBuffer = buffer._glBuffers[this.CONTEXT_UID];
            var gl = this.gl;
            buffer.disposeRunner.remove(this);
            if (!glBuffer) {
                return;
            }
            if (!contextLost) {
                gl.deleteBuffer(glBuffer.buffer);
            }
            delete buffer._glBuffers[this.CONTEXT_UID];
        };
        GeometrySystem.prototype.disposeGeometry = function disposeGeometry(geometry, contextLost) {
            if (!this.managedGeometries[geometry.id]) {
                return;
            }
            delete this.managedGeometries[geometry.id];
            var vaos = geometry.glVertexArrayObjects[this.CONTEXT_UID];
            var gl = this.gl;
            var buffers = geometry.buffers;
            geometry.disposeRunner.remove(this);
            if (!vaos) {
                return;
            }
            for (var i = 0; i < buffers.length; i++) {
                var buf = buffers[i]._glBuffers[this.CONTEXT_UID];
                buf.refCount--;
                if (buf.refCount === 0 && !contextLost) {
                    this.disposeBuffer(buffers[i], contextLost);
                }
            }
            if (!contextLost) {
                for (var vaoId in vaos) {
                    if (vaoId[0] === 'g') {
                        var vao = vaos[vaoId];
                        if (this._activeVao === vao) {
                            this.unbind();
                        }
                        gl.deleteVertexArray(vao);
                    }
                }
            }
            delete geometry.glVertexArrayObjects[this.CONTEXT_UID];
        };
        GeometrySystem.prototype.disposeAll = function disposeAll(contextLost) {
            var all = Object.keys(this.managedGeometries);
            for (var i = 0; i < all.length; i++) {
                this.disposeGeometry(this.managedGeometries[all[i]], contextLost);
            }
            all = Object.keys(this.managedBuffers);
            for (var i$1 = 0; i$1 < all.length; i$1++) {
                this.disposeBuffer(this.managedBuffers[all[i$1]], contextLost);
            }
        };
        GeometrySystem.prototype.activateVao = function activateVao(geometry, program) {
            var gl = this.gl;
            var CONTEXT_UID = this.CONTEXT_UID;
            var buffers = geometry.buffers;
            var attributes = geometry.attributes;
            if (geometry.indexBuffer) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.indexBuffer._glBuffers[CONTEXT_UID].buffer);
            }
            var lastBuffer = null;
            for (var j in attributes) {
                var attribute = attributes[j];
                var buffer = buffers[attribute.buffer];
                var glBuffer = buffer._glBuffers[CONTEXT_UID];
                if (program.attributeData[j]) {
                    if (lastBuffer !== glBuffer) {
                        gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer.buffer);
                        lastBuffer = glBuffer;
                    }
                    var location = program.attributeData[j].location;
                    gl.enableVertexAttribArray(location);
                    gl.vertexAttribPointer(location, attribute.size, attribute.type || gl.FLOAT, attribute.normalized, attribute.stride, attribute.start);
                    if (attribute.instance) {
                        if (this.hasInstance) {
                            gl.vertexAttribDivisor(location, 1);
                        }
                        else {
                            throw new Error('geometry error, GPU Instancing is not supported on this device');
                        }
                    }
                }
            }
        };
        GeometrySystem.prototype.draw = function draw(type, size, start, instanceCount) {
            var ref = this;
            var gl = ref.gl;
            var geometry = this._activeGeometry;
            if (geometry.indexBuffer) {
                var byteSize = geometry.indexBuffer.data.BYTES_PER_ELEMENT;
                var glType = byteSize === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
                if (byteSize === 2 || (byteSize === 4 && this.canUseUInt32ElementIndex)) {
                    if (geometry.instanced) {
                        gl.drawElementsInstanced(type, size || geometry.indexBuffer.data.length, glType, (start || 0) * byteSize, instanceCount || 1);
                    }
                    else {
                        gl.drawElements(type, size || geometry.indexBuffer.data.length, glType, (start || 0) * byteSize);
                    }
                }
                else {
                    console.warn('unsupported index buffer type: uint32');
                }
            }
            else if (geometry.instanced) {
                gl.drawArraysInstanced(type, start, size || geometry.getSize(), instanceCount || 1);
            }
            else {
                gl.drawArrays(type, start, size || geometry.getSize());
            }
            return this;
        };
        GeometrySystem.prototype.unbind = function unbind() {
            this.gl.bindVertexArray(null);
            this._activeVao = null;
            this._activeGeometry = null;
        };
        return GeometrySystem;
    }(System));
    var MaskData = function MaskData(maskObject) {
        this.type = exports.MASK_TYPES.NONE;
        this.autoDetect = true;
        this.maskObject = maskObject || null;
        this.pooled = false;
        this.isMaskData = true;
        this._stencilCounter = 0;
        this._scissorCounter = 0;
        this._scissorRect = null;
        this._target = null;
    };
    MaskData.prototype.reset = function reset() {
        if (this.pooled) {
            this.maskObject = null;
            this.type = exports.MASK_TYPES.NONE;
            this.autoDetect = true;
        }
        this._target = null;
    };
    MaskData.prototype.copyCountersOrReset = function copyCountersOrReset(maskAbove) {
        if (maskAbove) {
            this._stencilCounter = maskAbove._stencilCounter;
            this._scissorCounter = maskAbove._scissorCounter;
            this._scissorRect = maskAbove._scissorRect;
        }
        else {
            this._stencilCounter = 0;
            this._scissorCounter = 0;
            this._scissorRect = null;
        }
    };
    function compileProgram(gl, vertexSrc, fragmentSrc, attributeLocations) {
        var glVertShader = compileShader(gl, gl.VERTEX_SHADER, vertexSrc);
        var glFragShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
        var program = gl.createProgram();
        gl.attachShader(program, glVertShader);
        gl.attachShader(program, glFragShader);
        if (attributeLocations) {
            for (var i in attributeLocations) {
                gl.bindAttribLocation(program, attributeLocations[i], i);
            }
        }
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            if (!gl.getShaderParameter(glVertShader, gl.COMPILE_STATUS)) {
                console.warn(vertexSrc);
                console.error(gl.getShaderInfoLog(glVertShader));
            }
            if (!gl.getShaderParameter(glFragShader, gl.COMPILE_STATUS)) {
                console.warn(fragmentSrc);
                console.error(gl.getShaderInfoLog(glFragShader));
            }
            console.error('Pixi.js Error: Could not initialize shader.');
            console.error('gl.VALIDATE_STATUS', gl.getProgramParameter(program, gl.VALIDATE_STATUS));
            console.error('gl.getError()', gl.getError());
            if (gl.getProgramInfoLog(program) !== '') {
                console.warn('Pixi.js Warning: gl.getProgramInfoLog()', gl.getProgramInfoLog(program));
            }
            gl.deleteProgram(program);
            program = null;
        }
        gl.deleteShader(glVertShader);
        gl.deleteShader(glFragShader);
        return program;
    }
    function compileShader(gl, type, src) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        return shader;
    }
    function defaultValue(type, size) {
        switch (type) {
            case 'float':
                return 0;
            case 'vec2':
                return new Float32Array(2 * size);
            case 'vec3':
                return new Float32Array(3 * size);
            case 'vec4':
                return new Float32Array(4 * size);
            case 'int':
            case 'sampler2D':
            case 'sampler2DArray':
                return 0;
            case 'ivec2':
                return new Int32Array(2 * size);
            case 'ivec3':
                return new Int32Array(3 * size);
            case 'ivec4':
                return new Int32Array(4 * size);
            case 'bool':
                return false;
            case 'bvec2':
                return booleanArray(2 * size);
            case 'bvec3':
                return booleanArray(3 * size);
            case 'bvec4':
                return booleanArray(4 * size);
            case 'mat2':
                return new Float32Array([1, 0,
                    0, 1]);
            case 'mat3':
                return new Float32Array([1, 0, 0,
                    0, 1, 0,
                    0, 0, 1]);
            case 'mat4':
                return new Float32Array([1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    0, 0, 0, 1]);
        }
        return null;
    }
    function booleanArray(size) {
        var array = new Array(size);
        for (var i = 0; i < array.length; i++) {
            array[i] = false;
        }
        return array;
    }
    var unknownContext = {};
    var context = unknownContext;
    function getTestContext() {
        if (context === unknownContext || (context && context.isContextLost())) {
            var canvas = document.createElement('canvas');
            var gl;
            if (settings.PREFER_ENV >= exports.ENV.WEBGL2) {
                gl = canvas.getContext('webgl2', {});
            }
            if (!gl) {
                gl = canvas.getContext('webgl', {})
                    || canvas.getContext('experimental-webgl', {});
                if (!gl) {
                    gl = null;
                }
                else {
                    gl.getExtension('WEBGL_draw_buffers');
                }
            }
            context = gl;
        }
        return context;
    }
    var maxFragmentPrecision;
    function getMaxFragmentPrecision() {
        if (!maxFragmentPrecision) {
            maxFragmentPrecision = exports.PRECISION.MEDIUM;
            var gl = getTestContext();
            if (gl) {
                if (gl.getShaderPrecisionFormat) {
                    var shaderFragment = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
                    maxFragmentPrecision = shaderFragment.precision ? exports.PRECISION.HIGH : exports.PRECISION.MEDIUM;
                }
            }
        }
        return maxFragmentPrecision;
    }
    function setPrecision(src, requestedPrecision, maxSupportedPrecision) {
        if (src.substring(0, 9) !== 'precision') {
            var precision = requestedPrecision;
            if (requestedPrecision === exports.PRECISION.HIGH && maxSupportedPrecision !== exports.PRECISION.HIGH) {
                precision = exports.PRECISION.MEDIUM;
            }
            return ("precision " + precision + " float;\n" + src);
        }
        else if (maxSupportedPrecision !== exports.PRECISION.HIGH && src.substring(0, 15) === 'precision highp') {
            return src.replace('precision highp', 'precision mediump');
        }
        return src;
    }
    var GLSL_TO_SIZE = {
        float: 1,
        vec2: 2,
        vec3: 3,
        vec4: 4,
        int: 1,
        ivec2: 2,
        ivec3: 3,
        ivec4: 4,
        bool: 1,
        bvec2: 2,
        bvec3: 3,
        bvec4: 4,
        mat2: 4,
        mat3: 9,
        mat4: 16,
        sampler2D: 1,
    };
    function mapSize(type) {
        return GLSL_TO_SIZE[type];
    }
    var GL_TABLE = null;
    var GL_TO_GLSL_TYPES = {
        FLOAT: 'float',
        FLOAT_VEC2: 'vec2',
        FLOAT_VEC3: 'vec3',
        FLOAT_VEC4: 'vec4',
        INT: 'int',
        INT_VEC2: 'ivec2',
        INT_VEC3: 'ivec3',
        INT_VEC4: 'ivec4',
        BOOL: 'bool',
        BOOL_VEC2: 'bvec2',
        BOOL_VEC3: 'bvec3',
        BOOL_VEC4: 'bvec4',
        FLOAT_MAT2: 'mat2',
        FLOAT_MAT3: 'mat3',
        FLOAT_MAT4: 'mat4',
        SAMPLER_2D: 'sampler2D',
        SAMPLER_CUBE: 'samplerCube',
        SAMPLER_2D_ARRAY: 'sampler2DArray',
    };
    function mapType(gl, type) {
        if (!GL_TABLE) {
            var typeNames = Object.keys(GL_TO_GLSL_TYPES);
            GL_TABLE = {};
            for (var i = 0; i < typeNames.length; ++i) {
                var tn = typeNames[i];
                GL_TABLE[gl[tn]] = GL_TO_GLSL_TYPES[tn];
            }
        }
        return GL_TABLE[type];
    }
    var GLSL_TO_SINGLE_SETTERS_CACHED = {
        float: "\n    if(cv !== v)\n    {\n        cv.v = v;\n        gl.uniform1f(location, v)\n    }",
        vec2: "\n    if(cv[0] !== v[0] || cv[1] !== v[1])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        gl.uniform2f(location, v[0], v[1])\n    }",
        vec3: "\n    if(cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        cv[2] = v[2];\n\n        gl.uniform3f(location, v[0], v[1], v[2])\n    }",
        vec4: 'gl.uniform4f(location, v[0], v[1], v[2], v[3])',
        int: 'gl.uniform1i(location, v)',
        ivec2: 'gl.uniform2i(location, v[0], v[1])',
        ivec3: 'gl.uniform3i(location, v[0], v[1], v[2])',
        ivec4: 'gl.uniform4i(location, v[0], v[1], v[2], v[3])',
        bool: 'gl.uniform1i(location, v)',
        bvec2: 'gl.uniform2i(location, v[0], v[1])',
        bvec3: 'gl.uniform3i(location, v[0], v[1], v[2])',
        bvec4: 'gl.uniform4i(location, v[0], v[1], v[2], v[3])',
        mat2: 'gl.uniformMatrix2fv(location, false, v)',
        mat3: 'gl.uniformMatrix3fv(location, false, v)',
        mat4: 'gl.uniformMatrix4fv(location, false, v)',
        sampler2D: 'gl.uniform1i(location, v)',
        samplerCube: 'gl.uniform1i(location, v)',
        sampler2DArray: 'gl.uniform1i(location, v)',
    };
    var GLSL_TO_ARRAY_SETTERS = {
        float: "gl.uniform1fv(location, v)",
        vec2: "gl.uniform2fv(location, v)",
        vec3: "gl.uniform3fv(location, v)",
        vec4: 'gl.uniform4fv(location, v)',
        mat4: 'gl.uniformMatrix4fv(location, false, v)',
        mat3: 'gl.uniformMatrix3fv(location, false, v)',
        mat2: 'gl.uniformMatrix2fv(location, false, v)',
        int: 'gl.uniform1iv(location, v)',
        ivec2: 'gl.uniform2iv(location, v)',
        ivec3: 'gl.uniform3iv(location, v)',
        ivec4: 'gl.uniform4iv(location, v)',
        bool: 'gl.uniform1iv(location, v)',
        bvec2: 'gl.uniform2iv(location, v)',
        bvec3: 'gl.uniform3iv(location, v)',
        bvec4: 'gl.uniform4iv(location, v)',
        sampler2D: 'gl.uniform1iv(location, v)',
        samplerCube: 'gl.uniform1iv(location, v)',
        sampler2DArray: 'gl.uniform1iv(location, v)',
    };
    function generateUniformsSync(group, uniformData) {
        var func = "var v = null;\n    var cv = null\n    var t = 0;\n    var gl = renderer.gl\n    ";
        for (var i in group.uniforms) {
            var data = uniformData[i];
            if (!data) {
                if (group.uniforms[i].group) {
                    func += "\n                    renderer.shader.syncUniformGroup(uv." + i + ", syncData);\n                ";
                }
                continue;
            }
            if (data.type === 'float' && data.size === 1) {
                func += "\n            if(uv." + i + " !== ud." + i + ".value)\n            {\n                ud." + i + ".value = uv." + i + "\n                gl.uniform1f(ud." + i + ".location, uv." + i + ")\n            }\n";
            }
            else if ((data.type === 'sampler2D' || data.type === 'samplerCube' || data.type === 'sampler2DArray') && data.size === 1 && !data.isArray) {
                func += "\n\n            t = syncData.textureCount++;\n\n            renderer.texture.bind(uv." + i + ", t);\n            \n            if(ud." + i + ".value !== t)\n            {\n                ud." + i + ".value = t;\n                gl.uniform1i(ud." + i + ".location, t);\n; // eslint-disable-line max-len\n            }\n";
            }
            else if (data.type === 'mat3' && data.size === 1) {
                if (group.uniforms[i].a !== undefined) {
                    func += "\n                gl.uniformMatrix3fv(ud." + i + ".location, false, uv." + i + ".toArray(true));\n                \n";
                }
                else {
                    func += "\n                gl.uniformMatrix3fv(ud." + i + ".location, false, uv." + i + ");\n                \n";
                }
            }
            else if (data.type === 'vec2' && data.size === 1) {
                if (group.uniforms[i].x !== undefined) {
                    func += "\n                cv = ud." + i + ".value;\n                v = uv." + i + ";\n\n                if(cv[0] !== v.x || cv[1] !== v.y)\n                {\n                    cv[0] = v.x;\n                    cv[1] = v.y;\n                    gl.uniform2f(ud." + i + ".location, v.x, v.y);\n                }\n";
                }
                else {
                    func += "\n                cv = ud." + i + ".value;\n                v = uv." + i + ";\n\n                if(cv[0] !== v[0] || cv[1] !== v[1])\n                {\n                    cv[0] = v[0];\n                    cv[1] = v[1];\n                    gl.uniform2f(ud." + i + ".location, v[0], v[1]);\n                }\n                \n";
                }
            }
            else if (data.type === 'vec4' && data.size === 1) {
                if (group.uniforms[i].width !== undefined) {
                    func += "\n                cv = ud." + i + ".value;\n                v = uv." + i + ";\n\n                if(cv[0] !== v.x || cv[1] !== v.y || cv[2] !== v.width || cv[3] !== v.height)\n                {\n                    cv[0] = v.x;\n                    cv[1] = v.y;\n                    cv[2] = v.width;\n                    cv[3] = v.height;\n                    gl.uniform4f(ud." + i + ".location, v.x, v.y, v.width, v.height)\n                }\n";
                }
                else {
                    func += "\n                cv = ud." + i + ".value;\n                v = uv." + i + ";\n\n                if(cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])\n                {\n                    cv[0] = v[0];\n                    cv[1] = v[1];\n                    cv[2] = v[2];\n                    cv[3] = v[3];\n\n                    gl.uniform4f(ud." + i + ".location, v[0], v[1], v[2], v[3])\n                }\n                \n";
                }
            }
            else {
                var templateType = (data.size === 1) ? GLSL_TO_SINGLE_SETTERS_CACHED : GLSL_TO_ARRAY_SETTERS;
                var template = templateType[data.type].replace('location', ("ud." + i + ".location"));
                func += "\n            cv = ud." + i + ".value;\n            v = uv." + i + ";\n            " + template + ";\n";
            }
        }
        return new Function('ud', 'uv', 'renderer', 'syncData', func);
    }
    var fragTemplate = [
        'precision mediump float;',
        'void main(void){',
        'float test = 0.1;',
        '%forloop%',
        'gl_FragColor = vec4(0.0);',
        '}'
    ].join('\n');
    function checkMaxIfStatementsInShader(maxIfs, gl) {
        if (maxIfs === 0) {
            throw new Error('Invalid value of `0` passed to `checkMaxIfStatementsInShader`');
        }
        var shader = gl.createShader(gl.FRAGMENT_SHADER);
        while (true) {
            var fragmentSrc = fragTemplate.replace(/%forloop%/gi, generateIfTestSrc(maxIfs));
            gl.shaderSource(shader, fragmentSrc);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                maxIfs = (maxIfs / 2) | 0;
            }
            else {
                break;
            }
        }
        return maxIfs;
    }
    function generateIfTestSrc(maxIfs) {
        var src = '';
        for (var i = 0; i < maxIfs; ++i) {
            if (i > 0) {
                src += '\nelse ';
            }
            if (i < maxIfs - 1) {
                src += "if(test == " + i + ".0){}";
            }
        }
        return src;
    }
    var unsafeEval;
    function unsafeEvalSupported() {
        if (typeof unsafeEval === 'boolean') {
            return unsafeEval;
        }
        try {
            var func = new Function('param1', 'param2', 'param3', 'return param1[param2] === param3;');
            unsafeEval = func({ a: 'b' }, 'a', 'b') === true;
        }
        catch (e) {
            unsafeEval = false;
        }
        return unsafeEval;
    }
    var defaultFragment = "varying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\n\nvoid main(void){\n   gl_FragColor *= texture2D(uSampler, vTextureCoord);\n}";
    var defaultVertex = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void){\n   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n   vTextureCoord = aTextureCoord;\n}\n";
    var UID$3 = 0;
    var nameCache = {};
    var Program = function Program(vertexSrc, fragmentSrc, name) {
        if (name === void 0) {
            name = 'pixi-shader';
        }
        this.id = UID$3++;
        this.vertexSrc = vertexSrc || Program.defaultVertexSrc;
        this.fragmentSrc = fragmentSrc || Program.defaultFragmentSrc;
        this.vertexSrc = this.vertexSrc.trim();
        this.fragmentSrc = this.fragmentSrc.trim();
        if (this.vertexSrc.substring(0, 8) !== '#version') {
            name = name.replace(/\s+/g, '-');
            if (nameCache[name]) {
                nameCache[name]++;
                name += "-" + (nameCache[name]);
            }
            else {
                nameCache[name] = 1;
            }
            this.vertexSrc = "#define SHADER_NAME " + name + "\n" + (this.vertexSrc);
            this.fragmentSrc = "#define SHADER_NAME " + name + "\n" + (this.fragmentSrc);
            this.vertexSrc = setPrecision(this.vertexSrc, settings.PRECISION_VERTEX, exports.PRECISION.HIGH);
            this.fragmentSrc = setPrecision(this.fragmentSrc, settings.PRECISION_FRAGMENT, getMaxFragmentPrecision());
        }
        this.extractData(this.vertexSrc, this.fragmentSrc);
        this.glPrograms = {};
        this.syncUniforms = null;
    };
    var staticAccessors = { defaultVertexSrc: { configurable: true }, defaultFragmentSrc: { configurable: true } };
    Program.prototype.extractData = function extractData(vertexSrc, fragmentSrc) {
        var gl = getTestContext();
        if (gl) {
            var program = compileProgram(gl, vertexSrc, fragmentSrc);
            this.attributeData = this.getAttributeData(program, gl);
            this.uniformData = this.getUniformData(program, gl);
            gl.deleteProgram(program);
        }
        else {
            this.uniformData = {};
            this.attributeData = {};
        }
    };
    Program.prototype.getAttributeData = function getAttributeData(program, gl) {
        var attributes = {};
        var attributesArray = [];
        var totalAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (var i = 0; i < totalAttributes; i++) {
            var attribData = gl.getActiveAttrib(program, i);
            var type = mapType(gl, attribData.type);
            var data = {
                type: type,
                name: attribData.name,
                size: mapSize(type),
                location: 0,
            };
            attributes[attribData.name] = data;
            attributesArray.push(data);
        }
        attributesArray.sort(function (a, b) { return (a.name > b.name) ? 1 : -1; });
        for (var i$1 = 0; i$1 < attributesArray.length; i$1++) {
            attributesArray[i$1].location = i$1;
        }
        return attributes;
    };
    Program.prototype.getUniformData = function getUniformData(program, gl) {
        var uniforms = {};
        var totalUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (var i = 0; i < totalUniforms; i++) {
            var uniformData = gl.getActiveUniform(program, i);
            var name = uniformData.name.replace(/\[.*?\]/, '');
            var isArray = uniformData.name.match(/\[.*?\]/, '');
            var type = mapType(gl, uniformData.type);
            uniforms[name] = {
                type: type,
                size: uniformData.size,
                isArray: isArray,
                value: defaultValue(type, uniformData.size),
            };
        }
        return uniforms;
    };
    staticAccessors.defaultVertexSrc.get = function () {
        return defaultVertex;
    };
    staticAccessors.defaultFragmentSrc.get = function () {
        return defaultFragment;
    };
    Program.from = function from(vertexSrc, fragmentSrc, name) {
        var key = vertexSrc + fragmentSrc;
        var program = ProgramCache[key];
        if (!program) {
            ProgramCache[key] = program = new Program(vertexSrc, fragmentSrc, name);
        }
        return program;
    };
    Object.defineProperties(Program, staticAccessors);
    var Shader = function Shader(program, uniforms) {
        this.program = program;
        if (uniforms) {
            if (uniforms instanceof UniformGroup) {
                this.uniformGroup = uniforms;
            }
            else {
                this.uniformGroup = new UniformGroup(uniforms);
            }
        }
        else {
            this.uniformGroup = new UniformGroup({});
        }
        for (var i in program.uniformData) {
            if (this.uniformGroup.uniforms[i] instanceof Array) {
                this.uniformGroup.uniforms[i] = new Float32Array(this.uniformGroup.uniforms[i]);
            }
        }
    };
    var prototypeAccessors$2$1 = { uniforms: { configurable: true } };
    Shader.prototype.checkUniformExists = function checkUniformExists(name, group) {
        if (group.uniforms[name]) {
            return true;
        }
        for (var i in group.uniforms) {
            var uniform = group.uniforms[i];
            if (uniform.group) {
                if (this.checkUniformExists(name, uniform)) {
                    return true;
                }
            }
        }
        return false;
    };
    Shader.prototype.destroy = function destroy() {
        this.uniformGroup = null;
    };
    prototypeAccessors$2$1.uniforms.get = function () {
        return this.uniformGroup.uniforms;
    };
    Shader.from = function from(vertexSrc, fragmentSrc, uniforms) {
        var program = Program.from(vertexSrc, fragmentSrc);
        return new Shader(program, uniforms);
    };
    Object.defineProperties(Shader.prototype, prototypeAccessors$2$1);
    var BLEND = 0;
    var OFFSET = 1;
    var CULLING = 2;
    var DEPTH_TEST = 3;
    var WINDING = 4;
    var State = function State() {
        this.data = 0;
        this.blendMode = exports.BLEND_MODES.NORMAL;
        this.polygonOffset = 0;
        this.blend = true;
    };
    var prototypeAccessors$3 = { blend: { configurable: true }, offsets: { configurable: true }, culling: { configurable: true }, depthTest: { configurable: true }, clockwiseFrontFace: { configurable: true }, blendMode: { configurable: true }, polygonOffset: { configurable: true } };
    prototypeAccessors$3.blend.get = function () {
        return !!(this.data & (1 << BLEND));
    };
    prototypeAccessors$3.blend.set = function (value) {
        if (!!(this.data & (1 << BLEND)) !== value) {
            this.data ^= (1 << BLEND);
        }
    };
    prototypeAccessors$3.offsets.get = function () {
        return !!(this.data & (1 << OFFSET));
    };
    prototypeAccessors$3.offsets.set = function (value) {
        if (!!(this.data & (1 << OFFSET)) !== value) {
            this.data ^= (1 << OFFSET);
        }
    };
    prototypeAccessors$3.culling.get = function () {
        return !!(this.data & (1 << CULLING));
    };
    prototypeAccessors$3.culling.set = function (value) {
        if (!!(this.data & (1 << CULLING)) !== value) {
            this.data ^= (1 << CULLING);
        }
    };
    prototypeAccessors$3.depthTest.get = function () {
        return !!(this.data & (1 << DEPTH_TEST));
    };
    prototypeAccessors$3.depthTest.set = function (value) {
        if (!!(this.data & (1 << DEPTH_TEST)) !== value) {
            this.data ^= (1 << DEPTH_TEST);
        }
    };
    prototypeAccessors$3.clockwiseFrontFace.get = function () {
        return !!(this.data & (1 << WINDING));
    };
    prototypeAccessors$3.clockwiseFrontFace.set = function (value) {
        if (!!(this.data & (1 << WINDING)) !== value) {
            this.data ^= (1 << WINDING);
        }
    };
    prototypeAccessors$3.blendMode.get = function () {
        return this._blendMode;
    };
    prototypeAccessors$3.blendMode.set = function (value) {
        this.blend = (value !== exports.BLEND_MODES.NONE);
        this._blendMode = value;
    };
    prototypeAccessors$3.polygonOffset.get = function () {
        return this._polygonOffset;
    };
    prototypeAccessors$3.polygonOffset.set = function (value) {
        this.offsets = !!value;
        this._polygonOffset = value;
    };
    State.for2d = function for2d() {
        var state = new State();
        state.depthTest = false;
        state.blend = true;
        return state;
    };
    Object.defineProperties(State.prototype, prototypeAccessors$3);
    var defaultVertex$1 = "attribute vec2 aVertexPosition;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nuniform vec4 inputSize;\nuniform vec4 outputFrame;\n\nvec4 filterVertexPosition( void )\n{\n    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;\n\n    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);\n}\n\nvec2 filterTextureCoord( void )\n{\n    return aVertexPosition * (outputFrame.zw * inputSize.zw);\n}\n\nvoid main(void)\n{\n    gl_Position = filterVertexPosition();\n    vTextureCoord = filterTextureCoord();\n}\n";
    var defaultFragment$1 = "varying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\n\nvoid main(void){\n   gl_FragColor = texture2D(uSampler, vTextureCoord);\n}\n";
    var Filter = (function (Shader) {
        function Filter(vertexSrc, fragmentSrc, uniforms) {
            var program = Program.from(vertexSrc || Filter.defaultVertexSrc, fragmentSrc || Filter.defaultFragmentSrc);
            Shader.call(this, program, uniforms);
            this.padding = 0;
            this.resolution = settings.FILTER_RESOLUTION;
            this.enabled = true;
            this.autoFit = true;
            this.legacy = !!this.program.attributeData.aTextureCoord;
            this.state = new State();
        }
        if (Shader) {
            Filter.__proto__ = Shader;
        }
        Filter.prototype = Object.create(Shader && Shader.prototype);
        Filter.prototype.constructor = Filter;
        var prototypeAccessors = { blendMode: { configurable: true } };
        var staticAccessors = { defaultVertexSrc: { configurable: true }, defaultFragmentSrc: { configurable: true } };
        Filter.prototype.apply = function apply(filterManager, input, output, clear, currentState) {
            filterManager.applyFilter(this, input, output, clear, currentState);
        };
        prototypeAccessors.blendMode.get = function () {
            return this.state.blendMode;
        };
        prototypeAccessors.blendMode.set = function (value) {
            this.state.blendMode = value;
        };
        staticAccessors.defaultVertexSrc.get = function () {
            return defaultVertex$1;
        };
        staticAccessors.defaultFragmentSrc.get = function () {
            return defaultFragment$1;
        };
        Object.defineProperties(Filter.prototype, prototypeAccessors);
        Object.defineProperties(Filter, staticAccessors);
        return Filter;
    }(Shader));
    Filter.SOURCE_KEY_MAP = {};
    var vertex = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\nuniform mat3 otherMatrix;\n\nvarying vec2 vMaskCoord;\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n\n    vTextureCoord = aTextureCoord;\n    vMaskCoord = ( otherMatrix * vec3( aTextureCoord, 1.0)  ).xy;\n}\n";
    var fragment = "varying vec2 vMaskCoord;\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform sampler2D mask;\nuniform float alpha;\nuniform float npmAlpha;\nuniform vec4 maskClamp;\n\nvoid main(void)\n{\n    float clip = step(3.5,\n        step(maskClamp.x, vMaskCoord.x) +\n        step(maskClamp.y, vMaskCoord.y) +\n        step(vMaskCoord.x, maskClamp.z) +\n        step(vMaskCoord.y, maskClamp.w));\n\n    vec4 original = texture2D(uSampler, vTextureCoord);\n    vec4 masky = texture2D(mask, vMaskCoord);\n    float alphaMul = 1.0 - npmAlpha * (1.0 - masky.a);\n\n    original *= (alphaMul * masky.r * alpha * clip);\n\n    gl_FragColor = original;\n}\n";
    var tempMat = new Matrix();
    var TextureMatrix = function TextureMatrix(texture, clampMargin) {
        this._texture = texture;
        this.mapCoord = new Matrix();
        this.uClampFrame = new Float32Array(4);
        this.uClampOffset = new Float32Array(2);
        this._updateID = -1;
        this.clampOffset = 0;
        this.clampMargin = (typeof clampMargin === 'undefined') ? 0.5 : clampMargin;
        this.isSimple = false;
    };
    var prototypeAccessors$4 = { texture: { configurable: true } };
    prototypeAccessors$4.texture.get = function () {
        return this._texture;
    };
    prototypeAccessors$4.texture.set = function (value) {
        this._texture = value;
        this._updateID = -1;
    };
    TextureMatrix.prototype.multiplyUvs = function multiplyUvs(uvs, out) {
        if (out === undefined) {
            out = uvs;
        }
        var mat = this.mapCoord;
        for (var i = 0; i < uvs.length; i += 2) {
            var x = uvs[i];
            var y = uvs[i + 1];
            out[i] = (x * mat.a) + (y * mat.c) + mat.tx;
            out[i + 1] = (x * mat.b) + (y * mat.d) + mat.ty;
        }
        return out;
    };
    TextureMatrix.prototype.update = function update(forceUpdate) {
        var tex = this._texture;
        if (!tex || !tex.valid) {
            return false;
        }
        if (!forceUpdate
            && this._updateID === tex._updateID) {
            return false;
        }
        this._updateID = tex._updateID;
        var uvs = tex._uvs;
        this.mapCoord.set(uvs.x1 - uvs.x0, uvs.y1 - uvs.y0, uvs.x3 - uvs.x0, uvs.y3 - uvs.y0, uvs.x0, uvs.y0);
        var orig = tex.orig;
        var trim = tex.trim;
        if (trim) {
            tempMat.set(orig.width / trim.width, 0, 0, orig.height / trim.height, -trim.x / trim.width, -trim.y / trim.height);
            this.mapCoord.append(tempMat);
        }
        var texBase = tex.baseTexture;
        var frame = this.uClampFrame;
        var margin = this.clampMargin / texBase.resolution;
        var offset = this.clampOffset;
        frame[0] = (tex._frame.x + margin + offset) / texBase.width;
        frame[1] = (tex._frame.y + margin + offset) / texBase.height;
        frame[2] = (tex._frame.x + tex._frame.width - margin + offset) / texBase.width;
        frame[3] = (tex._frame.y + tex._frame.height - margin + offset) / texBase.height;
        this.uClampOffset[0] = offset / texBase.realWidth;
        this.uClampOffset[1] = offset / texBase.realHeight;
        this.isSimple = tex._frame.width === texBase.width
            && tex._frame.height === texBase.height
            && tex.rotate === 0;
        return true;
    };
    Object.defineProperties(TextureMatrix.prototype, prototypeAccessors$4);
    var SpriteMaskFilter = (function (Filter) {
        function SpriteMaskFilter(sprite) {
            var maskMatrix = new Matrix();
            Filter.call(this, vertex, fragment);
            sprite.renderable = false;
            this.maskSprite = sprite;
            this.maskMatrix = maskMatrix;
        }
        if (Filter) {
            SpriteMaskFilter.__proto__ = Filter;
        }
        SpriteMaskFilter.prototype = Object.create(Filter && Filter.prototype);
        SpriteMaskFilter.prototype.constructor = SpriteMaskFilter;
        SpriteMaskFilter.prototype.apply = function apply(filterManager, input, output, clear) {
            var maskSprite = this.maskSprite;
            var tex = this.maskSprite.texture;
            if (!tex.valid) {
                return;
            }
            if (!tex.transform) {
                tex.transform = new TextureMatrix(tex, 0.0);
            }
            tex.transform.update();
            this.uniforms.npmAlpha = tex.baseTexture.alphaMode ? 0.0 : 1.0;
            this.uniforms.mask = tex;
            this.uniforms.otherMatrix = filterManager.calculateSpriteMatrix(this.maskMatrix, maskSprite)
                .prepend(tex.transform.mapCoord);
            this.uniforms.alpha = maskSprite.worldAlpha;
            this.uniforms.maskClamp = tex.transform.uClampFrame;
            filterManager.applyFilter(this, input, output, clear);
        };
        return SpriteMaskFilter;
    }(Filter));
    var MaskSystem = (function (System) {
        function MaskSystem(renderer) {
            System.call(this, renderer);
            this.scissorRenderTarget = null;
            this.enableScissor = false;
            this.alphaMaskPool = [];
            this.maskDataPool = [];
            this.maskStack = [];
            this.alphaMaskIndex = 0;
        }
        if (System) {
            MaskSystem.__proto__ = System;
        }
        MaskSystem.prototype = Object.create(System && System.prototype);
        MaskSystem.prototype.constructor = MaskSystem;
        MaskSystem.prototype.setMaskStack = function setMaskStack(maskStack) {
            this.maskStack = maskStack;
            this.renderer.scissor.setMaskStack(maskStack);
            this.renderer.stencil.setMaskStack(maskStack);
        };
        MaskSystem.prototype.push = function push(target, maskData) {
            if (!maskData.isMaskData) {
                var d = this.maskDataPool.pop() || new MaskData();
                d.pooled = true;
                d.maskObject = maskData;
                maskData = d;
            }
            if (maskData.autoDetect) {
                this.detect(maskData);
            }
            maskData.copyCountersOrReset(this.maskStack[this.maskStack.length - 1]);
            maskData._target = target;
            switch (maskData.type) {
                case exports.MASK_TYPES.SCISSOR:
                    this.maskStack.push(maskData);
                    this.renderer.scissor.push(maskData);
                    break;
                case exports.MASK_TYPES.STENCIL:
                    this.maskStack.push(maskData);
                    this.renderer.stencil.push(maskData);
                    break;
                case exports.MASK_TYPES.SPRITE:
                    maskData.copyCountersOrReset(null);
                    this.pushSpriteMask(maskData);
                    this.maskStack.push(maskData);
                    break;
                default:
                    break;
            }
        };
        MaskSystem.prototype.pop = function pop(target) {
            var maskData = this.maskStack.pop();
            if (!maskData || maskData._target !== target) {
                return;
            }
            switch (maskData.type) {
                case exports.MASK_TYPES.SCISSOR:
                    this.renderer.scissor.pop();
                    break;
                case exports.MASK_TYPES.STENCIL:
                    this.renderer.stencil.pop(maskData.maskObject);
                    break;
                case exports.MASK_TYPES.SPRITE:
                    this.popSpriteMask();
                    break;
                default:
                    break;
            }
            maskData.reset();
            if (maskData.pooled) {
                this.maskDataPool.push(maskData);
            }
        };
        MaskSystem.prototype.detect = function detect(maskData) {
            var maskObject = maskData.maskObject;
            if (maskObject.isSprite) {
                maskData.type = exports.MASK_TYPES.SPRITE;
                return;
            }
            maskData.type = exports.MASK_TYPES.STENCIL;
            if (this.enableScissor
                && maskObject.isFastRect
                && maskObject.isFastRect()) {
                var matrix = maskObject.worldTransform;
                var rotX = Math.atan2(matrix.b, matrix.a);
                var rotXY = Math.atan2(matrix.d, matrix.c);
                rotX = Math.round(rotX * (180 / Math.PI) * 100);
                rotXY = Math.round(rotXY * (180 / Math.PI) * 100) - rotX;
                rotX = ((rotX % 9000) + 9000) % 9000;
                rotXY = ((rotXY % 18000) + 18000) % 18000;
                if (rotX === 0 && rotXY === 9000) {
                    maskData.type = exports.MASK_TYPES.SCISSOR;
                }
            }
        };
        MaskSystem.prototype.pushSpriteMask = function pushSpriteMask(maskData) {
            var maskObject = maskData.maskObject;
            var target = maskData._target;
            var alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex];
            if (!alphaMaskFilter) {
                alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex] = [new SpriteMaskFilter(maskObject)];
            }
            alphaMaskFilter[0].resolution = this.renderer.resolution;
            alphaMaskFilter[0].maskSprite = maskObject;
            var stashFilterArea = target.filterArea;
            target.filterArea = maskObject.getBounds(true);
            this.renderer.filter.push(target, alphaMaskFilter);
            target.filterArea = stashFilterArea;
            this.alphaMaskIndex++;
        };
        MaskSystem.prototype.popSpriteMask = function popSpriteMask() {
            this.renderer.filter.pop();
            this.alphaMaskIndex--;
        };
        return MaskSystem;
    }(System));
    var AbstractMaskSystem = (function (System) {
        function AbstractMaskSystem(renderer) {
            System.call(this, renderer);
            this.maskStack = [];
            this.glConst = 0;
        }
        if (System) {
            AbstractMaskSystem.__proto__ = System;
        }
        AbstractMaskSystem.prototype = Object.create(System && System.prototype);
        AbstractMaskSystem.prototype.constructor = AbstractMaskSystem;
        AbstractMaskSystem.prototype.getStackLength = function getStackLength() {
            return this.maskStack.length;
        };
        AbstractMaskSystem.prototype.setMaskStack = function setMaskStack(maskStack) {
            var ref = this.renderer;
            var gl = ref.gl;
            var curStackLen = this.getStackLength();
            this.maskStack = maskStack;
            var newStackLen = this.getStackLength();
            if (newStackLen !== curStackLen) {
                if (newStackLen === 0) {
                    gl.disable(this.glConst);
                }
                else {
                    gl.enable(this.glConst);
                    this._useCurrent();
                }
            }
        };
        AbstractMaskSystem.prototype._useCurrent = function _useCurrent() {
        };
        AbstractMaskSystem.prototype.destroy = function destroy() {
            System.prototype.destroy.call(this, this);
            this.maskStack = null;
        };
        return AbstractMaskSystem;
    }(System));
    var ScissorSystem = (function (AbstractMaskSystem) {
        function ScissorSystem(renderer) {
            AbstractMaskSystem.call(this, renderer);
            this.glConst = WebGLRenderingContext.SCISSOR_TEST;
        }
        if (AbstractMaskSystem) {
            ScissorSystem.__proto__ = AbstractMaskSystem;
        }
        ScissorSystem.prototype = Object.create(AbstractMaskSystem && AbstractMaskSystem.prototype);
        ScissorSystem.prototype.constructor = ScissorSystem;
        ScissorSystem.prototype.getStackLength = function getStackLength() {
            var maskData = this.maskStack[this.maskStack.length - 1];
            if (maskData) {
                return maskData._scissorCounter;
            }
            return 0;
        };
        ScissorSystem.prototype.push = function push(maskData) {
            var maskObject = maskData.maskObject;
            maskObject.renderable = true;
            var prevData = maskData._scissorRect;
            var bounds = maskObject.getBounds(true);
            var ref = this.renderer;
            var gl = ref.gl;
            maskObject.renderable = false;
            if (prevData) {
                bounds.fit(prevData);
            }
            else {
                gl.enable(gl.SCISSOR_TEST);
            }
            maskData._scissorCounter++;
            maskData._scissorRect = bounds;
            this._useCurrent();
        };
        ScissorSystem.prototype.pop = function pop() {
            var ref = this.renderer;
            var gl = ref.gl;
            if (this.getStackLength() > 0) {
                this._useCurrent();
            }
            else {
                gl.disable(gl.SCISSOR_TEST);
            }
        };
        ScissorSystem.prototype._useCurrent = function _useCurrent() {
            var rect = this.maskStack[this.maskStack.length - 1]._scissorRect;
            var rt = this.renderer.renderTexture.current;
            var ref = this.renderer.projection;
            var transform = ref.transform;
            var sourceFrame = ref.sourceFrame;
            var destinationFrame = ref.destinationFrame;
            var resolution = rt ? rt.resolution : this.renderer.resolution;
            var x = ((rect.x - sourceFrame.x) * resolution) + destinationFrame.x;
            var y = ((rect.y - sourceFrame.y) * resolution) + destinationFrame.y;
            var width = rect.width * resolution;
            var height = rect.height * resolution;
            if (transform) {
                x += transform.tx * resolution;
                y += transform.ty * resolution;
            }
            if (!rt) {
                y = this.renderer.height - height - y;
            }
            this.renderer.gl.scissor(x, y, width, height);
        };
        return ScissorSystem;
    }(AbstractMaskSystem));
    var StencilSystem = (function (AbstractMaskSystem) {
        function StencilSystem(renderer) {
            AbstractMaskSystem.call(this, renderer);
            this.glConst = WebGLRenderingContext.STENCIL_TEST;
        }
        if (AbstractMaskSystem) {
            StencilSystem.__proto__ = AbstractMaskSystem;
        }
        StencilSystem.prototype = Object.create(AbstractMaskSystem && AbstractMaskSystem.prototype);
        StencilSystem.prototype.constructor = StencilSystem;
        StencilSystem.prototype.getStackLength = function getStackLength() {
            var maskData = this.maskStack[this.maskStack.length - 1];
            if (maskData) {
                return maskData._stencilCounter;
            }
            return 0;
        };
        StencilSystem.prototype.push = function push(maskData) {
            var maskObject = maskData.maskObject;
            var ref = this.renderer;
            var gl = ref.gl;
            var prevMaskCount = maskData._stencilCounter;
            if (prevMaskCount === 0) {
                this.renderer.framebuffer.forceStencil();
                gl.enable(gl.STENCIL_TEST);
            }
            maskData._stencilCounter++;
            gl.colorMask(false, false, false, false);
            gl.stencilFunc(gl.EQUAL, prevMaskCount, this._getBitwiseMask());
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);
            maskObject.renderable = true;
            maskObject.render(this.renderer);
            this.renderer.batch.flush();
            maskObject.renderable = false;
            this._useCurrent();
        };
        StencilSystem.prototype.pop = function pop(maskObject) {
            var gl = this.renderer.gl;
            if (this.getStackLength() === 0) {
                gl.disable(gl.STENCIL_TEST);
                gl.clear(gl.STENCIL_BUFFER_BIT);
                gl.clearStencil(0);
            }
            else {
                gl.colorMask(false, false, false, false);
                gl.stencilOp(gl.KEEP, gl.KEEP, gl.DECR);
                maskObject.renderable = true;
                maskObject.render(this.renderer);
                this.renderer.batch.flush();
                maskObject.renderable = false;
                this._useCurrent();
            }
        };
        StencilSystem.prototype._useCurrent = function _useCurrent() {
            var gl = this.renderer.gl;
            gl.colorMask(true, true, true, true);
            gl.stencilFunc(gl.EQUAL, this.getStackLength(), this._getBitwiseMask());
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
        };
        StencilSystem.prototype._getBitwiseMask = function _getBitwiseMask() {
            return (1 << this.getStackLength()) - 1;
        };
        return StencilSystem;
    }(AbstractMaskSystem));
    var ProjectionSystem = (function (System) {
        function ProjectionSystem(renderer) {
            System.call(this, renderer);
            this.destinationFrame = null;
            this.sourceFrame = null;
            this.defaultFrame = null;
            this.projectionMatrix = new Matrix();
            this.transform = null;
        }
        if (System) {
            ProjectionSystem.__proto__ = System;
        }
        ProjectionSystem.prototype = Object.create(System && System.prototype);
        ProjectionSystem.prototype.constructor = ProjectionSystem;
        ProjectionSystem.prototype.update = function update(destinationFrame, sourceFrame, resolution, root) {
            this.destinationFrame = destinationFrame || this.destinationFrame || this.defaultFrame;
            this.sourceFrame = sourceFrame || this.sourceFrame || destinationFrame;
            this.calculateProjection(this.destinationFrame, this.sourceFrame, resolution, root);
            if (this.transform) {
                this.projectionMatrix.append(this.transform);
            }
            var renderer = this.renderer;
            renderer.globalUniforms.uniforms.projectionMatrix = this.projectionMatrix;
            renderer.globalUniforms.update();
            if (renderer.shader.shader) {
                renderer.shader.syncUniformGroup(renderer.shader.shader.uniforms.globals);
            }
        };
        ProjectionSystem.prototype.calculateProjection = function calculateProjection(destinationFrame, sourceFrame, resolution, root) {
            var pm = this.projectionMatrix;
            if (!root) {
                pm.a = (1 / destinationFrame.width * 2) * resolution;
                pm.d = (1 / destinationFrame.height * 2) * resolution;
                pm.tx = -1 - (sourceFrame.x * pm.a);
                pm.ty = -1 - (sourceFrame.y * pm.d);
            }
            else {
                pm.a = (1 / destinationFrame.width * 2) * resolution;
                pm.d = (-1 / destinationFrame.height * 2) * resolution;
                pm.tx = -1 - (sourceFrame.x * pm.a);
                pm.ty = 1 - (sourceFrame.y * pm.d);
            }
        };
        ProjectionSystem.prototype.setTransform = function setTransform() {
        };
        return ProjectionSystem;
    }(System));
    var tempRect = new Rectangle();
    var RenderTextureSystem = (function (System) {
        function RenderTextureSystem(renderer) {
            System.call(this, renderer);
            this.clearColor = renderer._backgroundColorRgba;
            this.defaultMaskStack = [];
            this.current = null;
            this.sourceFrame = new Rectangle();
            this.destinationFrame = new Rectangle();
        }
        if (System) {
            RenderTextureSystem.__proto__ = System;
        }
        RenderTextureSystem.prototype = Object.create(System && System.prototype);
        RenderTextureSystem.prototype.constructor = RenderTextureSystem;
        RenderTextureSystem.prototype.bind = function bind(renderTexture, sourceFrame, destinationFrame) {
            if (renderTexture === void 0) {
                renderTexture = null;
            }
            this.current = renderTexture;
            var renderer = this.renderer;
            var resolution;
            if (renderTexture) {
                var baseTexture = renderTexture.baseTexture;
                resolution = baseTexture.resolution;
                if (!destinationFrame) {
                    tempRect.width = baseTexture.realWidth;
                    tempRect.height = baseTexture.realHeight;
                    destinationFrame = tempRect;
                }
                if (!sourceFrame) {
                    sourceFrame = destinationFrame;
                }
                this.renderer.framebuffer.bind(baseTexture.framebuffer, destinationFrame);
                this.renderer.projection.update(destinationFrame, sourceFrame, resolution, false);
                this.renderer.mask.setMaskStack(baseTexture.maskStack);
            }
            else {
                resolution = this.renderer.resolution;
                if (!destinationFrame) {
                    tempRect.width = renderer.width;
                    tempRect.height = renderer.height;
                    destinationFrame = tempRect;
                }
                if (!sourceFrame) {
                    sourceFrame = destinationFrame;
                }
                renderer.framebuffer.bind(null, destinationFrame);
                this.renderer.projection.update(destinationFrame, sourceFrame, resolution, true);
                this.renderer.mask.setMaskStack(this.defaultMaskStack);
            }
            this.sourceFrame.copyFrom(sourceFrame);
            this.destinationFrame.x = destinationFrame.x / resolution;
            this.destinationFrame.y = destinationFrame.y / resolution;
            this.destinationFrame.width = destinationFrame.width / resolution;
            this.destinationFrame.height = destinationFrame.height / resolution;
            if (sourceFrame === destinationFrame) {
                this.sourceFrame.copyFrom(this.destinationFrame);
            }
        };
        RenderTextureSystem.prototype.clear = function clear(clearColor) {
            if (this.current) {
                clearColor = clearColor || this.current.baseTexture.clearColor;
            }
            else {
                clearColor = clearColor || this.clearColor;
            }
            this.renderer.framebuffer.clear(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
        };
        RenderTextureSystem.prototype.resize = function resize() {
            this.bind(null);
        };
        RenderTextureSystem.prototype.reset = function reset() {
            this.bind(null);
        };
        return RenderTextureSystem;
    }(System));
    var GLProgram = function GLProgram(program, uniformData) {
        this.program = program;
        this.uniformData = uniformData;
        this.uniformGroups = {};
    };
    GLProgram.prototype.destroy = function destroy() {
        this.uniformData = null;
        this.uniformGroups = null;
        this.program = null;
    };
    var UID$4 = 0;
    var defaultSyncData = { textureCount: 0 };
    var ShaderSystem = (function (System) {
        function ShaderSystem(renderer) {
            System.call(this, renderer);
            this.systemCheck();
            this.gl = null;
            this.shader = null;
            this.program = null;
            this.cache = {};
            this.id = UID$4++;
        }
        if (System) {
            ShaderSystem.__proto__ = System;
        }
        ShaderSystem.prototype = Object.create(System && System.prototype);
        ShaderSystem.prototype.constructor = ShaderSystem;
        ShaderSystem.prototype.systemCheck = function systemCheck() {
            if (!unsafeEvalSupported()) {
                throw new Error('Current environment does not allow unsafe-eval, '
                    + 'please use @pixi/unsafe-eval module to enable support.');
            }
        };
        ShaderSystem.prototype.contextChange = function contextChange(gl) {
            this.gl = gl;
            this.reset();
        };
        ShaderSystem.prototype.bind = function bind(shader, dontSync) {
            shader.uniforms.globals = this.renderer.globalUniforms;
            var program = shader.program;
            var glProgram = program.glPrograms[this.renderer.CONTEXT_UID] || this.generateShader(shader);
            this.shader = shader;
            if (this.program !== program) {
                this.program = program;
                this.gl.useProgram(glProgram.program);
            }
            if (!dontSync) {
                defaultSyncData.textureCount = 0;
                this.syncUniformGroup(shader.uniformGroup, defaultSyncData);
            }
            return glProgram;
        };
        ShaderSystem.prototype.setUniforms = function setUniforms(uniforms) {
            var shader = this.shader.program;
            var glProgram = shader.glPrograms[this.renderer.CONTEXT_UID];
            shader.syncUniforms(glProgram.uniformData, uniforms, this.renderer);
        };
        ShaderSystem.prototype.syncUniformGroup = function syncUniformGroup(group, syncData) {
            var glProgram = this.getglProgram();
            if (!group.static || group.dirtyId !== glProgram.uniformGroups[group.id]) {
                glProgram.uniformGroups[group.id] = group.dirtyId;
                this.syncUniforms(group, glProgram, syncData);
            }
        };
        ShaderSystem.prototype.syncUniforms = function syncUniforms(group, glProgram, syncData) {
            var syncFunc = group.syncUniforms[this.shader.program.id] || this.createSyncGroups(group);
            syncFunc(glProgram.uniformData, group.uniforms, this.renderer, syncData);
        };
        ShaderSystem.prototype.createSyncGroups = function createSyncGroups(group) {
            var id = this.getSignature(group, this.shader.program.uniformData);
            if (!this.cache[id]) {
                this.cache[id] = generateUniformsSync(group, this.shader.program.uniformData);
            }
            group.syncUniforms[this.shader.program.id] = this.cache[id];
            return group.syncUniforms[this.shader.program.id];
        };
        ShaderSystem.prototype.getSignature = function getSignature(group, uniformData) {
            var uniforms = group.uniforms;
            var strings = [];
            for (var i in uniforms) {
                strings.push(i);
                if (uniformData[i]) {
                    strings.push(uniformData[i].type);
                }
            }
            return strings.join('-');
        };
        ShaderSystem.prototype.getglProgram = function getglProgram() {
            if (this.shader) {
                return this.shader.program.glPrograms[this.renderer.CONTEXT_UID];
            }
            return null;
        };
        ShaderSystem.prototype.generateShader = function generateShader(shader) {
            var gl = this.gl;
            var program = shader.program;
            var attribMap = {};
            for (var i in program.attributeData) {
                attribMap[i] = program.attributeData[i].location;
            }
            var shaderProgram = compileProgram(gl, program.vertexSrc, program.fragmentSrc, attribMap);
            var uniformData = {};
            for (var i$1 in program.uniformData) {
                var data = program.uniformData[i$1];
                uniformData[i$1] = {
                    location: gl.getUniformLocation(shaderProgram, i$1),
                    value: defaultValue(data.type, data.size),
                };
            }
            var glProgram = new GLProgram(shaderProgram, uniformData);
            program.glPrograms[this.renderer.CONTEXT_UID] = glProgram;
            return glProgram;
        };
        ShaderSystem.prototype.reset = function reset() {
            this.program = null;
            this.shader = null;
        };
        ShaderSystem.prototype.destroy = function destroy() {
            this.destroyed = true;
        };
        return ShaderSystem;
    }(System));
    function mapWebGLBlendModesToPixi(gl, array) {
        if (array === void 0) {
            array = [];
        }
        array[exports.BLEND_MODES.NORMAL] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.ADD] = [gl.ONE, gl.ONE];
        array[exports.BLEND_MODES.MULTIPLY] = [gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.SCREEN] = [gl.ONE, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.OVERLAY] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.DARKEN] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.LIGHTEN] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.COLOR_DODGE] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.COLOR_BURN] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.HARD_LIGHT] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.SOFT_LIGHT] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.DIFFERENCE] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.EXCLUSION] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.HUE] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.SATURATION] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.COLOR] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.LUMINOSITY] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.NONE] = [0, 0];
        array[exports.BLEND_MODES.NORMAL_NPM] = [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.ADD_NPM] = [gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE];
        array[exports.BLEND_MODES.SCREEN_NPM] = [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.SRC_IN] = [gl.DST_ALPHA, gl.ZERO];
        array[exports.BLEND_MODES.SRC_OUT] = [gl.ONE_MINUS_DST_ALPHA, gl.ZERO];
        array[exports.BLEND_MODES.SRC_ATOP] = [gl.DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.DST_OVER] = [gl.ONE_MINUS_DST_ALPHA, gl.ONE];
        array[exports.BLEND_MODES.DST_IN] = [gl.ZERO, gl.SRC_ALPHA];
        array[exports.BLEND_MODES.DST_OUT] = [gl.ZERO, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.DST_ATOP] = [gl.ONE_MINUS_DST_ALPHA, gl.SRC_ALPHA];
        array[exports.BLEND_MODES.XOR] = [gl.ONE_MINUS_DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA];
        array[exports.BLEND_MODES.SUBTRACT] = [gl.ONE, gl.ONE, gl.ONE, gl.ONE, gl.FUNC_REVERSE_SUBTRACT, gl.FUNC_ADD];
        return array;
    }
    var BLEND$1 = 0;
    var OFFSET$1 = 1;
    var CULLING$1 = 2;
    var DEPTH_TEST$1 = 3;
    var WINDING$1 = 4;
    var StateSystem = (function (System) {
        function StateSystem(renderer) {
            System.call(this, renderer);
            this.gl = null;
            this.stateId = 0;
            this.polygonOffset = 0;
            this.blendMode = exports.BLEND_MODES.NONE;
            this._blendEq = false;
            this.map = [];
            this.map[BLEND$1] = this.setBlend;
            this.map[OFFSET$1] = this.setOffset;
            this.map[CULLING$1] = this.setCullFace;
            this.map[DEPTH_TEST$1] = this.setDepthTest;
            this.map[WINDING$1] = this.setFrontFace;
            this.checks = [];
            this.defaultState = new State();
            this.defaultState.blend = true;
            this.defaultState.depth = true;
        }
        if (System) {
            StateSystem.__proto__ = System;
        }
        StateSystem.prototype = Object.create(System && System.prototype);
        StateSystem.prototype.constructor = StateSystem;
        StateSystem.prototype.contextChange = function contextChange(gl) {
            this.gl = gl;
            this.blendModes = mapWebGLBlendModesToPixi(gl);
            this.set(this.defaultState);
            this.reset();
        };
        StateSystem.prototype.set = function set(state) {
            state = state || this.defaultState;
            if (this.stateId !== state.data) {
                var diff = this.stateId ^ state.data;
                var i = 0;
                while (diff) {
                    if (diff & 1) {
                        this.map[i].call(this, !!(state.data & (1 << i)));
                    }
                    diff = diff >> 1;
                    i++;
                }
                this.stateId = state.data;
            }
            for (var i$1 = 0; i$1 < this.checks.length; i$1++) {
                this.checks[i$1](this, state);
            }
        };
        StateSystem.prototype.forceState = function forceState(state) {
            state = state || this.defaultState;
            for (var i = 0; i < this.map.length; i++) {
                this.map[i].call(this, !!(state.data & (1 << i)));
            }
            for (var i$1 = 0; i$1 < this.checks.length; i$1++) {
                this.checks[i$1](this, state);
            }
            this.stateId = state.data;
        };
        StateSystem.prototype.setBlend = function setBlend(value) {
            this.updateCheck(StateSystem.checkBlendMode, value);
            this.gl[value ? 'enable' : 'disable'](this.gl.BLEND);
        };
        StateSystem.prototype.setOffset = function setOffset(value) {
            this.updateCheck(StateSystem.checkPolygonOffset, value);
            this.gl[value ? 'enable' : 'disable'](this.gl.POLYGON_OFFSET_FILL);
        };
        StateSystem.prototype.setDepthTest = function setDepthTest(value) {
            this.gl[value ? 'enable' : 'disable'](this.gl.DEPTH_TEST);
        };
        StateSystem.prototype.setCullFace = function setCullFace(value) {
            this.gl[value ? 'enable' : 'disable'](this.gl.CULL_FACE);
        };
        StateSystem.prototype.setFrontFace = function setFrontFace(value) {
            this.gl.frontFace(this.gl[value ? 'CW' : 'CCW']);
        };
        StateSystem.prototype.setBlendMode = function setBlendMode(value) {
            if (value === this.blendMode) {
                return;
            }
            this.blendMode = value;
            var mode = this.blendModes[value];
            var gl = this.gl;
            if (mode.length === 2) {
                gl.blendFunc(mode[0], mode[1]);
            }
            else {
                gl.blendFuncSeparate(mode[0], mode[1], mode[2], mode[3]);
            }
            if (mode.length === 6) {
                this._blendEq = true;
                gl.blendEquationSeparate(mode[4], mode[5]);
            }
            else if (this._blendEq) {
                this._blendEq = false;
                gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
            }
        };
        StateSystem.prototype.setPolygonOffset = function setPolygonOffset(value, scale) {
            this.gl.polygonOffset(value, scale);
        };
        StateSystem.prototype.reset = function reset() {
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
            this.forceState(0);
            this._blendEq = true;
            this.blendMode = -1;
            this.setBlendMode(0);
        };
        StateSystem.prototype.updateCheck = function updateCheck(func, value) {
            var index = this.checks.indexOf(func);
            if (value && index === -1) {
                this.checks.push(func);
            }
            else if (!value && index !== -1) {
                this.checks.splice(index, 1);
            }
        };
        StateSystem.checkBlendMode = function checkBlendMode(system, state) {
            system.setBlendMode(state.blendMode);
        };
        StateSystem.checkPolygonOffset = function checkPolygonOffset(system, state) {
            system.setPolygonOffset(state.polygonOffset, 0);
        };
        return StateSystem;
    }(System));
    var TextureGCSystem = (function (System) {
        function TextureGCSystem(renderer) {
            System.call(this, renderer);
            this.count = 0;
            this.checkCount = 0;
            this.maxIdle = settings.GC_MAX_IDLE;
            this.checkCountMax = settings.GC_MAX_CHECK_COUNT;
            this.mode = settings.GC_MODE;
        }
        if (System) {
            TextureGCSystem.__proto__ = System;
        }
        TextureGCSystem.prototype = Object.create(System && System.prototype);
        TextureGCSystem.prototype.constructor = TextureGCSystem;
        TextureGCSystem.prototype.postrender = function postrender() {
            if (!this.renderer.renderingToScreen) {
                return;
            }
            this.count++;
            if (this.mode === exports.GC_MODES.MANUAL) {
                return;
            }
            this.checkCount++;
            if (this.checkCount > this.checkCountMax) {
                this.checkCount = 0;
                this.run();
            }
        };
        TextureGCSystem.prototype.run = function run() {
            var tm = this.renderer.texture;
            var managedTextures = tm.managedTextures;
            var wasRemoved = false;
            for (var i = 0; i < managedTextures.length; i++) {
                var texture = managedTextures[i];
                if (!texture.framebuffer && this.count - texture.touched > this.maxIdle) {
                    tm.destroyTexture(texture, true);
                    managedTextures[i] = null;
                    wasRemoved = true;
                }
            }
            if (wasRemoved) {
                var j = 0;
                for (var i$1 = 0; i$1 < managedTextures.length; i$1++) {
                    if (managedTextures[i$1] !== null) {
                        managedTextures[j++] = managedTextures[i$1];
                    }
                }
                managedTextures.length = j;
            }
        };
        TextureGCSystem.prototype.unload = function unload(displayObject) {
            var tm = this.renderer.textureSystem;
            if (displayObject._texture && displayObject._texture._glRenderTargets) {
                tm.destroyTexture(displayObject._texture);
            }
            for (var i = displayObject.children.length - 1; i >= 0; i--) {
                this.unload(displayObject.children[i]);
            }
        };
        return TextureGCSystem;
    }(System));
    var GLTexture = function GLTexture(texture) {
        this.texture = texture;
        this.width = -1;
        this.height = -1;
        this.dirtyId = -1;
        this.dirtyStyleId = -1;
        this.mipmap = false;
        this.wrapMode = 33071;
        this.type = 6408;
        this.internalFormat = 5121;
    };
    var TextureSystem = (function (System) {
        function TextureSystem(renderer) {
            System.call(this, renderer);
            this.boundTextures = [];
            this.currentLocation = -1;
            this.managedTextures = [];
            this._unknownBoundTextures = false;
            this.unknownTexture = new BaseTexture();
        }
        if (System) {
            TextureSystem.__proto__ = System;
        }
        TextureSystem.prototype = Object.create(System && System.prototype);
        TextureSystem.prototype.constructor = TextureSystem;
        TextureSystem.prototype.contextChange = function contextChange() {
            var gl = this.gl = this.renderer.gl;
            this.CONTEXT_UID = this.renderer.CONTEXT_UID;
            this.webGLVersion = this.renderer.context.webGLVersion;
            var maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
            this.boundTextures.length = maxTextures;
            for (var i = 0; i < maxTextures; i++) {
                this.boundTextures[i] = null;
            }
            this.emptyTextures = {};
            var emptyTexture2D = new GLTexture(gl.createTexture());
            gl.bindTexture(gl.TEXTURE_2D, emptyTexture2D.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
            this.emptyTextures[gl.TEXTURE_2D] = emptyTexture2D;
            this.emptyTextures[gl.TEXTURE_CUBE_MAP] = new GLTexture(gl.createTexture());
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.emptyTextures[gl.TEXTURE_CUBE_MAP].texture);
            for (var i$1 = 0; i$1 < 6; i$1++) {
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i$1, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            }
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            for (var i$2 = 0; i$2 < this.boundTextures.length; i$2++) {
                this.bind(null, i$2);
            }
        };
        TextureSystem.prototype.bind = function bind(texture, location) {
            if (location === void 0) {
                location = 0;
            }
            var ref = this;
            var gl = ref.gl;
            if (texture) {
                texture = texture.baseTexture || texture;
                if (texture.valid) {
                    texture.touched = this.renderer.textureGC.count;
                    var glTexture = texture._glTextures[this.CONTEXT_UID] || this.initTexture(texture);
                    if (this.boundTextures[location] !== texture) {
                        if (this.currentLocation !== location) {
                            this.currentLocation = location;
                            gl.activeTexture(gl.TEXTURE0 + location);
                        }
                        gl.bindTexture(texture.target, glTexture.texture);
                    }
                    if (glTexture.dirtyId !== texture.dirtyId) {
                        if (this.currentLocation !== location) {
                            this.currentLocation = location;
                            gl.activeTexture(gl.TEXTURE0 + location);
                        }
                        this.updateTexture(texture);
                    }
                    this.boundTextures[location] = texture;
                }
            }
            else {
                if (this.currentLocation !== location) {
                    this.currentLocation = location;
                    gl.activeTexture(gl.TEXTURE0 + location);
                }
                gl.bindTexture(gl.TEXTURE_2D, this.emptyTextures[gl.TEXTURE_2D].texture);
                this.boundTextures[location] = null;
            }
        };
        TextureSystem.prototype.reset = function reset() {
            this._unknownBoundTextures = true;
            this.currentLocation = -1;
            for (var i = 0; i < this.boundTextures.length; i++) {
                this.boundTextures[i] = this.unknownTexture;
            }
        };
        TextureSystem.prototype.unbind = function unbind(texture) {
            var ref = this;
            var gl = ref.gl;
            var boundTextures = ref.boundTextures;
            if (this._unknownBoundTextures) {
                this._unknownBoundTextures = false;
                for (var i = 0; i < boundTextures.length; i++) {
                    if (boundTextures[i] === this.unknownTexture) {
                        this.bind(null, i);
                    }
                }
            }
            for (var i$1 = 0; i$1 < boundTextures.length; i$1++) {
                if (boundTextures[i$1] === texture) {
                    if (this.currentLocation !== i$1) {
                        gl.activeTexture(gl.TEXTURE0 + i$1);
                        this.currentLocation = i$1;
                    }
                    gl.bindTexture(gl.TEXTURE_2D, this.emptyTextures[texture.target].texture);
                    boundTextures[i$1] = null;
                }
            }
        };
        TextureSystem.prototype.initTexture = function initTexture(texture) {
            var glTexture = new GLTexture(this.gl.createTexture());
            glTexture.dirtyId = -1;
            texture._glTextures[this.CONTEXT_UID] = glTexture;
            this.managedTextures.push(texture);
            texture.on('dispose', this.destroyTexture, this);
            return glTexture;
        };
        TextureSystem.prototype.initTextureType = function initTextureType(texture, glTexture) {
            glTexture.internalFormat = texture.format;
            glTexture.type = texture.type;
            if (this.webGLVersion !== 2) {
                return;
            }
            var gl = this.renderer.gl;
            if (texture.type === gl.FLOAT
                && texture.format === gl.RGBA) {
                glTexture.internalFormat = gl.RGBA32F;
            }
            if (texture.type === exports.TYPES.HALF_FLOAT) {
                glTexture.type = gl.HALF_FLOAT;
            }
            if (glTexture.type === gl.HALF_FLOAT
                && texture.format === gl.RGBA) {
                glTexture.internalFormat = gl.RGBA16F;
            }
        };
        TextureSystem.prototype.updateTexture = function updateTexture(texture) {
            var glTexture = texture._glTextures[this.CONTEXT_UID];
            if (!glTexture) {
                return;
            }
            var renderer = this.renderer;
            this.initTextureType(texture, glTexture);
            if (texture.resource && texture.resource.upload(renderer, texture, glTexture)) {
                ;
            }
            else {
                var width = texture.realWidth;
                var height = texture.realHeight;
                var gl = renderer.gl;
                if (glTexture.width !== width
                    || glTexture.height !== height
                    || glTexture.dirtyId < 0) {
                    glTexture.width = width;
                    glTexture.height = height;
                    gl.texImage2D(texture.target, 0, glTexture.internalFormat, width, height, 0, texture.format, glTexture.type, null);
                }
            }
            if (texture.dirtyStyleId !== glTexture.dirtyStyleId) {
                this.updateTextureStyle(texture);
            }
            glTexture.dirtyId = texture.dirtyId;
        };
        TextureSystem.prototype.destroyTexture = function destroyTexture(texture, skipRemove) {
            var ref = this;
            var gl = ref.gl;
            texture = texture.baseTexture || texture;
            if (texture._glTextures[this.CONTEXT_UID]) {
                this.unbind(texture);
                gl.deleteTexture(texture._glTextures[this.CONTEXT_UID].texture);
                texture.off('dispose', this.destroyTexture, this);
                delete texture._glTextures[this.CONTEXT_UID];
                if (!skipRemove) {
                    var i = this.managedTextures.indexOf(texture);
                    if (i !== -1) {
                        removeItems(this.managedTextures, i, 1);
                    }
                }
            }
        };
        TextureSystem.prototype.updateTextureStyle = function updateTextureStyle(texture) {
            var glTexture = texture._glTextures[this.CONTEXT_UID];
            if (!glTexture) {
                return;
            }
            if ((texture.mipmap === exports.MIPMAP_MODES.POW2 || this.webGLVersion !== 2) && !texture.isPowerOfTwo) {
                glTexture.mipmap = 0;
            }
            else {
                glTexture.mipmap = texture.mipmap >= 1;
            }
            if (this.webGLVersion !== 2 && !texture.isPowerOfTwo) {
                glTexture.wrapMode = exports.WRAP_MODES.CLAMP;
            }
            else {
                glTexture.wrapMode = texture.wrapMode;
            }
            if (texture.resource && texture.resource.style(this.renderer, texture, glTexture)) {
                ;
            }
            else {
                this.setStyle(texture, glTexture);
            }
            glTexture.dirtyStyleId = texture.dirtyStyleId;
        };
        TextureSystem.prototype.setStyle = function setStyle(texture, glTexture) {
            var gl = this.gl;
            if (glTexture.mipmap) {
                gl.generateMipmap(texture.target);
            }
            gl.texParameteri(texture.target, gl.TEXTURE_WRAP_S, glTexture.wrapMode);
            gl.texParameteri(texture.target, gl.TEXTURE_WRAP_T, glTexture.wrapMode);
            if (glTexture.mipmap) {
                gl.texParameteri(texture.target, gl.TEXTURE_MIN_FILTER, texture.scaleMode ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST_MIPMAP_NEAREST);
                var anisotropicExt = this.renderer.context.extensions.anisotropicFiltering;
                if (anisotropicExt && texture.anisotropicLevel > 0 && texture.scaleMode === exports.SCALE_MODES.LINEAR) {
                    var level = Math.min(texture.anisotropicLevel, gl.getParameter(anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
                    gl.texParameterf(texture.target, anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, level);
                }
            }
            else {
                gl.texParameteri(texture.target, gl.TEXTURE_MIN_FILTER, texture.scaleMode ? gl.LINEAR : gl.NEAREST);
            }
            gl.texParameteri(texture.target, gl.TEXTURE_MAG_FILTER, texture.scaleMode ? gl.LINEAR : gl.NEAREST);
        };
        return TextureSystem;
    }(System));
    var systems = ({
        FilterSystem: FilterSystem,
        BatchSystem: BatchSystem,
        ContextSystem: ContextSystem,
        FramebufferSystem: FramebufferSystem,
        GeometrySystem: GeometrySystem,
        MaskSystem: MaskSystem,
        ScissorSystem: ScissorSystem,
        StencilSystem: StencilSystem,
        ProjectionSystem: ProjectionSystem,
        RenderTextureSystem: RenderTextureSystem,
        ShaderSystem: ShaderSystem,
        StateSystem: StateSystem,
        TextureGCSystem: TextureGCSystem,
        TextureSystem: TextureSystem
    });
    var tempMatrix = new Matrix();
    var AbstractRenderer = (function (EventEmitter) {
        function AbstractRenderer(system, options) {
            EventEmitter.call(this);
            options = Object.assign({}, settings.RENDER_OPTIONS, options);
            if (options.roundPixels) {
                settings.ROUND_PIXELS = options.roundPixels;
                deprecation('5.0.0', 'Renderer roundPixels option is deprecated, please use PIXI.settings.ROUND_PIXELS', 2);
            }
            this.options = options;
            this.type = exports.RENDERER_TYPE.UNKNOWN;
            this.screen = new Rectangle(0, 0, options.width, options.height);
            this.view = options.view || document.createElement('canvas');
            this.resolution = options.resolution || settings.RESOLUTION;
            this.transparent = options.transparent;
            this.autoDensity = options.autoDensity || options.autoResize || false;
            this.preserveDrawingBuffer = options.preserveDrawingBuffer;
            this.clearBeforeRender = options.clearBeforeRender;
            this._backgroundColor = 0x000000;
            this._backgroundColorRgba = [0, 0, 0, 0];
            this._backgroundColorString = '#000000';
            this.backgroundColor = options.backgroundColor || this._backgroundColor;
            this._tempDisplayObjectParent = new Container();
            this._lastObjectRendered = this._tempDisplayObjectParent;
            this.plugins = {};
        }
        if (EventEmitter) {
            AbstractRenderer.__proto__ = EventEmitter;
        }
        AbstractRenderer.prototype = Object.create(EventEmitter && EventEmitter.prototype);
        AbstractRenderer.prototype.constructor = AbstractRenderer;
        var prototypeAccessors = { width: { configurable: true }, height: { configurable: true }, backgroundColor: { configurable: true } };
        AbstractRenderer.prototype.initPlugins = function initPlugins(staticMap) {
            for (var o in staticMap) {
                this.plugins[o] = new (staticMap[o])(this);
            }
        };
        prototypeAccessors.width.get = function () {
            return this.view.width;
        };
        prototypeAccessors.height.get = function () {
            return this.view.height;
        };
        AbstractRenderer.prototype.resize = function resize(screenWidth, screenHeight) {
            this.screen.width = screenWidth;
            this.screen.height = screenHeight;
            this.view.width = screenWidth * this.resolution;
            this.view.height = screenHeight * this.resolution;
            if (this.autoDensity) {
                this.view.style.width = screenWidth + "px";
                this.view.style.height = screenHeight + "px";
            }
        };
        AbstractRenderer.prototype.generateTexture = function generateTexture(displayObject, scaleMode, resolution, region) {
            region = region || displayObject.getLocalBounds();
            if (region.width === 0) {
                region.width = 1;
            }
            if (region.height === 0) {
                region.height = 1;
            }
            var renderTexture = RenderTexture.create(region.width | 0, region.height | 0, scaleMode, resolution);
            tempMatrix.tx = -region.x;
            tempMatrix.ty = -region.y;
            this.render(displayObject, renderTexture, false, tempMatrix, !!displayObject.parent);
            return renderTexture;
        };
        AbstractRenderer.prototype.destroy = function destroy(removeView) {
            for (var o in this.plugins) {
                this.plugins[o].destroy();
                this.plugins[o] = null;
            }
            if (removeView && this.view.parentNode) {
                this.view.parentNode.removeChild(this.view);
            }
            this.plugins = null;
            this.type = exports.RENDERER_TYPE.UNKNOWN;
            this.view = null;
            this.screen = null;
            this.resolution = 0;
            this.transparent = false;
            this.autoDensity = false;
            this.blendModes = null;
            this.options = null;
            this.preserveDrawingBuffer = false;
            this.clearBeforeRender = false;
            this._backgroundColor = 0;
            this._backgroundColorRgba = null;
            this._backgroundColorString = null;
            this._tempDisplayObjectParent = null;
            this._lastObjectRendered = null;
        };
        prototypeAccessors.backgroundColor.get = function () {
            return this._backgroundColor;
        };
        prototypeAccessors.backgroundColor.set = function (value) {
            this._backgroundColor = value;
            this._backgroundColorString = hex2string(value);
            hex2rgb(value, this._backgroundColorRgba);
        };
        Object.defineProperties(AbstractRenderer.prototype, prototypeAccessors);
        return AbstractRenderer;
    }(eventemitter3));
    var Renderer = (function (AbstractRenderer) {
        function Renderer(options) {
            if (options === void 0) {
                options = {};
            }
            AbstractRenderer.call(this, 'WebGL', options);
            options = this.options;
            this.type = exports.RENDERER_TYPE.WEBGL;
            this.gl = null;
            this.CONTEXT_UID = 0;
            this.runners = {
                destroy: new Runner('destroy'),
                contextChange: new Runner('contextChange', 1),
                reset: new Runner('reset'),
                update: new Runner('update'),
                postrender: new Runner('postrender'),
                prerender: new Runner('prerender'),
                resize: new Runner('resize', 2),
            };
            this.globalUniforms = new UniformGroup({
                projectionMatrix: new Matrix(),
            }, true);
            this.addSystem(MaskSystem, 'mask')
                .addSystem(ContextSystem, 'context')
                .addSystem(StateSystem, 'state')
                .addSystem(ShaderSystem, 'shader')
                .addSystem(TextureSystem, 'texture')
                .addSystem(GeometrySystem, 'geometry')
                .addSystem(FramebufferSystem, 'framebuffer')
                .addSystem(ScissorSystem, 'scissor')
                .addSystem(StencilSystem, 'stencil')
                .addSystem(ProjectionSystem, 'projection')
                .addSystem(TextureGCSystem, 'textureGC')
                .addSystem(FilterSystem, 'filter')
                .addSystem(RenderTextureSystem, 'renderTexture')
                .addSystem(BatchSystem, 'batch');
            this.initPlugins(Renderer.__plugins);
            if (options.context) {
                this.context.initFromContext(options.context);
            }
            else {
                this.context.initFromOptions({
                    alpha: this.transparent,
                    antialias: options.antialias,
                    premultipliedAlpha: this.transparent && this.transparent !== 'notMultiplied',
                    stencil: true,
                    preserveDrawingBuffer: options.preserveDrawingBuffer,
                    powerPreference: this.options.powerPreference,
                });
            }
            this.renderingToScreen = true;
            sayHello(this.context.webGLVersion === 2 ? 'WebGL 2' : 'WebGL 1');
            this.resize(this.options.width, this.options.height);
        }
        if (AbstractRenderer) {
            Renderer.__proto__ = AbstractRenderer;
        }
        Renderer.prototype = Object.create(AbstractRenderer && AbstractRenderer.prototype);
        Renderer.prototype.constructor = Renderer;
        Renderer.create = function create(options) {
            if (isWebGLSupported()) {
                return new Renderer(options);
            }
            throw new Error('WebGL unsupported in this browser, use "pixi.js-legacy" for fallback canvas2d support.');
        };
        Renderer.prototype.addSystem = function addSystem(ClassRef, name) {
            if (!name) {
                name = ClassRef.name;
            }
            var system = new ClassRef(this);
            if (this[name]) {
                throw new Error(("Whoops! The name \"" + name + "\" is already in use"));
            }
            this[name] = system;
            for (var i in this.runners) {
                this.runners[i].add(system);
            }
            return this;
        };
        Renderer.prototype.render = function render(displayObject, renderTexture, clear, transform, skipUpdateTransform) {
            this.renderingToScreen = !renderTexture;
            this.runners.prerender.run();
            this.emit('prerender');
            this.projection.transform = transform;
            if (this.context.isLost) {
                return;
            }
            if (!renderTexture) {
                this._lastObjectRendered = displayObject;
            }
            if (!skipUpdateTransform) {
                var cacheParent = displayObject.parent;
                displayObject.parent = this._tempDisplayObjectParent;
                displayObject.updateTransform();
                displayObject.parent = cacheParent;
            }
            this.renderTexture.bind(renderTexture);
            this.batch.currentRenderer.start();
            if (clear !== undefined ? clear : this.clearBeforeRender) {
                this.renderTexture.clear();
            }
            displayObject.render(this);
            this.batch.currentRenderer.flush();
            if (renderTexture) {
                renderTexture.baseTexture.update();
            }
            this.runners.postrender.run();
            this.projection.transform = null;
            this.emit('postrender');
        };
        Renderer.prototype.resize = function resize(screenWidth, screenHeight) {
            AbstractRenderer.prototype.resize.call(this, screenWidth, screenHeight);
            this.runners.resize.run(screenWidth, screenHeight);
        };
        Renderer.prototype.reset = function reset() {
            this.runners.reset.run();
            return this;
        };
        Renderer.prototype.clear = function clear() {
            this.framebuffer.bind();
            this.framebuffer.clear();
        };
        Renderer.prototype.destroy = function destroy(removeView) {
            this.runners.destroy.run();
            for (var r in this.runners) {
                this.runners[r].destroy();
            }
            AbstractRenderer.prototype.destroy.call(this, removeView);
            this.gl = null;
        };
        Renderer.registerPlugin = function registerPlugin(pluginName, ctor) {
            Renderer.__plugins = Renderer.__plugins || {};
            Renderer.__plugins[pluginName] = ctor;
        };
        return Renderer;
    }(AbstractRenderer));
    function autoDetectRenderer(options) {
        return Renderer.create(options);
    }
    var _default = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n    vTextureCoord = aTextureCoord;\n}";
    var defaultFilter = "attribute vec2 aVertexPosition;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nuniform vec4 inputSize;\nuniform vec4 outputFrame;\n\nvec4 filterVertexPosition( void )\n{\n    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;\n\n    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);\n}\n\nvec2 filterTextureCoord( void )\n{\n    return aVertexPosition * (outputFrame.zw * inputSize.zw);\n}\n\nvoid main(void)\n{\n    gl_Position = filterVertexPosition();\n    vTextureCoord = filterTextureCoord();\n}\n";
    var CubeTexture = (function (BaseTexture) {
        function CubeTexture() {
            BaseTexture.apply(this, arguments);
        }
        if (BaseTexture) {
            CubeTexture.__proto__ = BaseTexture;
        }
        CubeTexture.prototype = Object.create(BaseTexture && BaseTexture.prototype);
        CubeTexture.prototype.constructor = CubeTexture;
        CubeTexture.from = function from(resources, options) {
            return new CubeTexture(new CubeResource(resources, options));
        };
        return CubeTexture;
    }(BaseTexture));
    var BatchDrawCall = function BatchDrawCall() {
        this.texArray = null;
        this.blend = 0;
        this.type = exports.DRAW_MODES.TRIANGLES;
        this.start = 0;
        this.size = 0;
        this.data = null;
    };
    var BatchTextureArray = function BatchTextureArray() {
        this.elements = [];
        this.ids = [];
        this.count = 0;
    };
    BatchTextureArray.prototype.clear = function clear() {
        for (var i = 0; i < this.count; i++) {
            this.elements[i] = null;
        }
        this.count = 0;
    };
    var ViewableBuffer = function ViewableBuffer(size) {
        this.rawBinaryData = new ArrayBuffer(size);
        this.uint32View = new Uint32Array(this.rawBinaryData);
        this.float32View = new Float32Array(this.rawBinaryData);
    };
    var prototypeAccessors$5 = { int8View: { configurable: true }, uint8View: { configurable: true }, int16View: { configurable: true }, uint16View: { configurable: true }, int32View: { configurable: true } };
    prototypeAccessors$5.int8View.get = function () {
        if (!this._int8View) {
            this._int8View = new Int8Array(this.rawBinaryData);
        }
        return this._int8View;
    };
    prototypeAccessors$5.uint8View.get = function () {
        if (!this._uint8View) {
            this._uint8View = new Uint8Array(this.rawBinaryData);
        }
        return this._uint8View;
    };
    prototypeAccessors$5.int16View.get = function () {
        if (!this._int16View) {
            this._int16View = new Int16Array(this.rawBinaryData);
        }
        return this._int16View;
    };
    prototypeAccessors$5.uint16View.get = function () {
        if (!this._uint16View) {
            this._uint16View = new Uint16Array(this.rawBinaryData);
        }
        return this._uint16View;
    };
    prototypeAccessors$5.int32View.get = function () {
        if (!this._int32View) {
            this._int32View = new Int32Array(this.rawBinaryData);
        }
        return this._int32View;
    };
    ViewableBuffer.prototype.view = function view(type) {
        return this[(type + "View")];
    };
    ViewableBuffer.prototype.destroy = function destroy() {
        this.rawBinaryData = null;
        this._int8View = null;
        this._uint8View = null;
        this._int16View = null;
        this._uint16View = null;
        this._int32View = null;
        this.uint32View = null;
        this.float32View = null;
    };
    ViewableBuffer.sizeOf = function sizeOf(type) {
        switch (type) {
            case 'int8':
            case 'uint8':
                return 1;
            case 'int16':
            case 'uint16':
                return 2;
            case 'int32':
            case 'uint32':
            case 'float32':
                return 4;
            default:
                throw new Error((type + " isn't a valid view type"));
        }
    };
    Object.defineProperties(ViewableBuffer.prototype, prototypeAccessors$5);
    var AbstractBatchRenderer = (function (ObjectRenderer) {
        function AbstractBatchRenderer(renderer) {
            ObjectRenderer.call(this, renderer);
            this.shaderGenerator = null;
            this.geometryClass = null;
            this.vertexSize = null;
            this.state = State.for2d();
            this.size = settings.SPRITE_BATCH_SIZE * 4;
            this._vertexCount = 0;
            this._indexCount = 0;
            this._bufferedElements = [];
            this._bufferedTextures = [];
            this._bufferSize = 0;
            this._shader = null;
            this._packedGeometries = [];
            this._packedGeometryPoolSize = 2;
            this._flushId = 0;
            this._aBuffers = {};
            this._iBuffers = {};
            this.MAX_TEXTURES = 1;
            this.renderer.on('prerender', this.onPrerender, this);
            renderer.runners.contextChange.add(this);
            this._dcIndex = 0;
            this._aIndex = 0;
            this._iIndex = 0;
            this._attributeBuffer = null;
            this._indexBuffer = null;
            this._tempBoundTextures = [];
        }
        if (ObjectRenderer) {
            AbstractBatchRenderer.__proto__ = ObjectRenderer;
        }
        AbstractBatchRenderer.prototype = Object.create(ObjectRenderer && ObjectRenderer.prototype);
        AbstractBatchRenderer.prototype.constructor = AbstractBatchRenderer;
        AbstractBatchRenderer.prototype.contextChange = function contextChange() {
            var gl = this.renderer.gl;
            if (settings.PREFER_ENV === exports.ENV.WEBGL_LEGACY) {
                this.MAX_TEXTURES = 1;
            }
            else {
                this.MAX_TEXTURES = Math.min(gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS), settings.SPRITE_MAX_TEXTURES);
                this.MAX_TEXTURES = checkMaxIfStatementsInShader(this.MAX_TEXTURES, gl);
            }
            this._shader = this.shaderGenerator.generateShader(this.MAX_TEXTURES);
            for (var i = 0; i < this._packedGeometryPoolSize; i++) {
                this._packedGeometries[i] = new (this.geometryClass)();
            }
            this.initFlushBuffers();
        };
        AbstractBatchRenderer.prototype.initFlushBuffers = function initFlushBuffers() {
            var _drawCallPool = AbstractBatchRenderer._drawCallPool;
            var _textureArrayPool = AbstractBatchRenderer._textureArrayPool;
            var MAX_SPRITES = this.size / 4;
            var MAX_TA = Math.floor(MAX_SPRITES / this.MAX_TEXTURES) + 1;
            while (_drawCallPool.length < MAX_SPRITES) {
                _drawCallPool.push(new BatchDrawCall());
            }
            while (_textureArrayPool.length < MAX_TA) {
                _textureArrayPool.push(new BatchTextureArray());
            }
            for (var i = 0; i < this.MAX_TEXTURES; i++) {
                this._tempBoundTextures[i] = null;
            }
        };
        AbstractBatchRenderer.prototype.onPrerender = function onPrerender() {
            this._flushId = 0;
        };
        AbstractBatchRenderer.prototype.render = function render(element) {
            if (!element._texture.valid) {
                return;
            }
            if (this._vertexCount + (element.vertexData.length / 2) > this.size) {
                this.flush();
            }
            this._vertexCount += element.vertexData.length / 2;
            this._indexCount += element.indices.length;
            this._bufferedTextures[this._bufferSize] = element._texture.baseTexture;
            this._bufferedElements[this._bufferSize++] = element;
        };
        AbstractBatchRenderer.prototype.buildTexturesAndDrawCalls = function buildTexturesAndDrawCalls() {
            var ref = this;
            var textures = ref._bufferedTextures;
            var MAX_TEXTURES = ref.MAX_TEXTURES;
            var textureArrays = AbstractBatchRenderer._textureArrayPool;
            var batch = this.renderer.batch;
            var boundTextures = this._tempBoundTextures;
            var touch = this.renderer.textureGC.count;
            var TICK = ++BaseTexture._globalBatch;
            var countTexArrays = 0;
            var texArray = textureArrays[0];
            var start = 0;
            batch.copyBoundTextures(boundTextures, MAX_TEXTURES);
            for (var i = 0; i < this._bufferSize; ++i) {
                var tex = textures[i];
                textures[i] = null;
                if (tex._batchEnabled === TICK) {
                    continue;
                }
                if (texArray.count >= MAX_TEXTURES) {
                    batch.boundArray(texArray, boundTextures, TICK, MAX_TEXTURES);
                    this.buildDrawCalls(texArray, start, i);
                    start = i;
                    texArray = textureArrays[++countTexArrays];
                    ++TICK;
                }
                tex._batchEnabled = TICK;
                tex.touched = touch;
                texArray.elements[texArray.count++] = tex;
            }
            if (texArray.count > 0) {
                batch.boundArray(texArray, boundTextures, TICK, MAX_TEXTURES);
                this.buildDrawCalls(texArray, start, this._bufferSize);
                ++countTexArrays;
                ++TICK;
            }
            for (var i$1 = 0; i$1 < boundTextures.length; i$1++) {
                boundTextures[i$1] = null;
            }
            BaseTexture._globalBatch = TICK;
        };
        AbstractBatchRenderer.prototype.buildDrawCalls = function buildDrawCalls(texArray, start, finish) {
            var ref = this;
            var elements = ref._bufferedElements;
            var _attributeBuffer = ref._attributeBuffer;
            var _indexBuffer = ref._indexBuffer;
            var vertexSize = ref.vertexSize;
            var drawCalls = AbstractBatchRenderer._drawCallPool;
            var dcIndex = this._dcIndex;
            var aIndex = this._aIndex;
            var iIndex = this._iIndex;
            var drawCall = drawCalls[dcIndex];
            drawCall.start = this._iIndex;
            drawCall.texArray = texArray;
            for (var i = start; i < finish; ++i) {
                var sprite = elements[i];
                var tex = sprite._texture.baseTexture;
                var spriteBlendMode = premultiplyBlendMode[tex.alphaMode ? 1 : 0][sprite.blendMode];
                elements[i] = null;
                if (start < i && drawCall.blend !== spriteBlendMode) {
                    drawCall.size = iIndex - drawCall.start;
                    start = i;
                    drawCall = drawCalls[++dcIndex];
                    drawCall.texArray = texArray;
                    drawCall.start = iIndex;
                }
                this.packInterleavedGeometry(sprite, _attributeBuffer, _indexBuffer, aIndex, iIndex);
                aIndex += sprite.vertexData.length / 2 * vertexSize;
                iIndex += sprite.indices.length;
                drawCall.blend = spriteBlendMode;
            }
            if (start < finish) {
                drawCall.size = iIndex - drawCall.start;
                ++dcIndex;
            }
            this._dcIndex = dcIndex;
            this._aIndex = aIndex;
            this._iIndex = iIndex;
        };
        AbstractBatchRenderer.prototype.bindAndClearTexArray = function bindAndClearTexArray(texArray) {
            var textureSystem = this.renderer.texture;
            for (var j = 0; j < texArray.count; j++) {
                textureSystem.bind(texArray.elements[j], texArray.ids[j]);
                texArray.elements[j] = null;
            }
            texArray.count = 0;
        };
        AbstractBatchRenderer.prototype.updateGeometry = function updateGeometry() {
            var ref = this;
            var packedGeometries = ref._packedGeometries;
            var attributeBuffer = ref._attributeBuffer;
            var indexBuffer = ref._indexBuffer;
            if (!settings.CAN_UPLOAD_SAME_BUFFER) {
                if (this._packedGeometryPoolSize <= this._flushId) {
                    this._packedGeometryPoolSize++;
                    packedGeometries[this._flushId] = new (this.geometryClass)();
                }
                packedGeometries[this._flushId]._buffer.update(attributeBuffer.rawBinaryData);
                packedGeometries[this._flushId]._indexBuffer.update(indexBuffer);
                this.renderer.geometry.bind(packedGeometries[this._flushId]);
                this.renderer.geometry.updateBuffers();
                this._flushId++;
            }
            else {
                packedGeometries[this._flushId]._buffer.update(attributeBuffer.rawBinaryData);
                packedGeometries[this._flushId]._indexBuffer.update(indexBuffer);
                this.renderer.geometry.updateBuffers();
            }
        };
        AbstractBatchRenderer.prototype.drawBatches = function drawBatches() {
            var dcCount = this._dcIndex;
            var ref = this.renderer;
            var gl = ref.gl;
            var stateSystem = ref.state;
            var drawCalls = AbstractBatchRenderer._drawCallPool;
            var curTexArray = null;
            for (var i = 0; i < dcCount; i++) {
                var ref$1 = drawCalls[i];
                var texArray = ref$1.texArray;
                var type = ref$1.type;
                var size = ref$1.size;
                var start = ref$1.start;
                var blend = ref$1.blend;
                if (curTexArray !== texArray) {
                    curTexArray = texArray;
                    this.bindAndClearTexArray(texArray);
                }
                this.state.blendMode = blend;
                stateSystem.set(this.state);
                gl.drawElements(type, size, gl.UNSIGNED_SHORT, start * 2);
            }
        };
        AbstractBatchRenderer.prototype.flush = function flush() {
            if (this._vertexCount === 0) {
                return;
            }
            this._attributeBuffer = this.getAttributeBuffer(this._vertexCount);
            this._indexBuffer = this.getIndexBuffer(this._indexCount);
            this._aIndex = 0;
            this._iIndex = 0;
            this._dcIndex = 0;
            this.buildTexturesAndDrawCalls();
            this.updateGeometry();
            this.drawBatches();
            this._bufferSize = 0;
            this._vertexCount = 0;
            this._indexCount = 0;
        };
        AbstractBatchRenderer.prototype.start = function start() {
            this.renderer.state.set(this.state);
            this.renderer.shader.bind(this._shader);
            if (settings.CAN_UPLOAD_SAME_BUFFER) {
                this.renderer.geometry.bind(this._packedGeometries[this._flushId]);
            }
        };
        AbstractBatchRenderer.prototype.stop = function stop() {
            this.flush();
        };
        AbstractBatchRenderer.prototype.destroy = function destroy() {
            for (var i = 0; i < this._packedGeometryPoolSize; i++) {
                if (this._packedGeometries[i]) {
                    this._packedGeometries[i].destroy();
                }
            }
            this.renderer.off('prerender', this.onPrerender, this);
            this._aBuffers = null;
            this._iBuffers = null;
            this._packedGeometries = null;
            this._attributeBuffer = null;
            this._indexBuffer = null;
            if (this._shader) {
                this._shader.destroy();
                this._shader = null;
            }
            ObjectRenderer.prototype.destroy.call(this);
        };
        AbstractBatchRenderer.prototype.getAttributeBuffer = function getAttributeBuffer(size) {
            var roundedP2 = nextPow2(Math.ceil(size / 8));
            var roundedSizeIndex = log2(roundedP2);
            var roundedSize = roundedP2 * 8;
            if (this._aBuffers.length <= roundedSizeIndex) {
                this._iBuffers.length = roundedSizeIndex + 1;
            }
            var buffer = this._aBuffers[roundedSize];
            if (!buffer) {
                this._aBuffers[roundedSize] = buffer = new ViewableBuffer(roundedSize * this.vertexSize * 4);
            }
            return buffer;
        };
        AbstractBatchRenderer.prototype.getIndexBuffer = function getIndexBuffer(size) {
            var roundedP2 = nextPow2(Math.ceil(size / 12));
            var roundedSizeIndex = log2(roundedP2);
            var roundedSize = roundedP2 * 12;
            if (this._iBuffers.length <= roundedSizeIndex) {
                this._iBuffers.length = roundedSizeIndex + 1;
            }
            var buffer = this._iBuffers[roundedSizeIndex];
            if (!buffer) {
                this._iBuffers[roundedSizeIndex] = buffer = new Uint16Array(roundedSize);
            }
            return buffer;
        };
        AbstractBatchRenderer.prototype.packInterleavedGeometry = function packInterleavedGeometry(element, attributeBuffer, indexBuffer, aIndex, iIndex) {
            var uint32View = attributeBuffer.uint32View;
            var float32View = attributeBuffer.float32View;
            var packedVertices = aIndex / this.vertexSize;
            var uvs = element.uvs;
            var indicies = element.indices;
            var vertexData = element.vertexData;
            var textureId = element._texture.baseTexture._batchLocation;
            var alpha = Math.min(element.worldAlpha, 1.0);
            var argb = (alpha < 1.0
                && element._texture.baseTexture.alphaMode)
                ? premultiplyTint(element._tintRGB, alpha)
                : element._tintRGB + (alpha * 255 << 24);
            for (var i = 0; i < vertexData.length; i += 2) {
                float32View[aIndex++] = vertexData[i];
                float32View[aIndex++] = vertexData[i + 1];
                float32View[aIndex++] = uvs[i];
                float32View[aIndex++] = uvs[i + 1];
                uint32View[aIndex++] = argb;
                float32View[aIndex++] = textureId;
            }
            for (var i$1 = 0; i$1 < indicies.length; i$1++) {
                indexBuffer[iIndex++] = packedVertices + indicies[i$1];
            }
        };
        return AbstractBatchRenderer;
    }(ObjectRenderer));
    AbstractBatchRenderer._drawCallPool = [];
    AbstractBatchRenderer._textureArrayPool = [];
    var BatchShaderGenerator = function BatchShaderGenerator(vertexSrc, fragTemplate) {
        this.vertexSrc = vertexSrc;
        this.fragTemplate = fragTemplate;
        this.programCache = {};
        this.defaultGroupCache = {};
        if (fragTemplate.indexOf('%count%') < 0) {
            throw new Error('Fragment template must contain "%count%".');
        }
        if (fragTemplate.indexOf('%forloop%') < 0) {
            throw new Error('Fragment template must contain "%forloop%".');
        }
    };
    BatchShaderGenerator.prototype.generateShader = function generateShader(maxTextures) {
        if (!this.programCache[maxTextures]) {
            var sampleValues = new Int32Array(maxTextures);
            for (var i = 0; i < maxTextures; i++) {
                sampleValues[i] = i;
            }
            this.defaultGroupCache[maxTextures] = UniformGroup.from({ uSamplers: sampleValues }, true);
            var fragmentSrc = this.fragTemplate;
            fragmentSrc = fragmentSrc.replace(/%count%/gi, ("" + maxTextures));
            fragmentSrc = fragmentSrc.replace(/%forloop%/gi, this.generateSampleSrc(maxTextures));
            this.programCache[maxTextures] = new Program(this.vertexSrc, fragmentSrc);
        }
        var uniforms = {
            tint: new Float32Array([1, 1, 1, 1]),
            translationMatrix: new Matrix(),
            default: this.defaultGroupCache[maxTextures],
        };
        return new Shader(this.programCache[maxTextures], uniforms);
    };
    BatchShaderGenerator.prototype.generateSampleSrc = function generateSampleSrc(maxTextures) {
        var src = '';
        src += '\n';
        src += '\n';
        for (var i = 0; i < maxTextures; i++) {
            if (i > 0) {
                src += '\nelse ';
            }
            if (i < maxTextures - 1) {
                src += "if(vTextureId < " + i + ".5)";
            }
            src += '\n{';
            src += "\n\tcolor = texture2D(uSamplers[" + i + "], vTextureCoord);";
            src += '\n}';
        }
        src += '\n';
        src += '\n';
        return src;
    };
    var BatchGeometry = (function (Geometry) {
        function BatchGeometry(_static) {
            if (_static === void 0) {
                _static = false;
            }
            Geometry.call(this);
            this._buffer = new Buffer(null, _static, false);
            this._indexBuffer = new Buffer(null, _static, true);
            this.addAttribute('aVertexPosition', this._buffer, 2, false, exports.TYPES.FLOAT)
                .addAttribute('aTextureCoord', this._buffer, 2, false, exports.TYPES.FLOAT)
                .addAttribute('aColor', this._buffer, 4, true, exports.TYPES.UNSIGNED_BYTE)
                .addAttribute('aTextureId', this._buffer, 1, true, exports.TYPES.FLOAT)
                .addIndex(this._indexBuffer);
        }
        if (Geometry) {
            BatchGeometry.__proto__ = Geometry;
        }
        BatchGeometry.prototype = Object.create(Geometry && Geometry.prototype);
        BatchGeometry.prototype.constructor = BatchGeometry;
        return BatchGeometry;
    }(Geometry));
    var defaultVertex$2 = "precision highp float;\nattribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\nattribute vec4 aColor;\nattribute float aTextureId;\n\nuniform mat3 projectionMatrix;\nuniform mat3 translationMatrix;\nuniform vec4 tint;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\nvarying float vTextureId;\n\nvoid main(void){\n    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n\n    vTextureCoord = aTextureCoord;\n    vTextureId = aTextureId;\n    vColor = aColor * tint;\n}\n";
    var defaultFragment$2 = "varying vec2 vTextureCoord;\nvarying vec4 vColor;\nvarying float vTextureId;\nuniform sampler2D uSamplers[%count%];\n\nvoid main(void){\n    vec4 color;\n    %forloop%\n    gl_FragColor = color * vColor;\n}\n";
    var BatchPluginFactory = function BatchPluginFactory() { };
    var staticAccessors$1 = { defaultVertexSrc: { configurable: true }, defaultFragmentTemplate: { configurable: true } };
    BatchPluginFactory.create = function create(options) {
        var ref = Object.assign({
            vertex: defaultVertex$2,
            fragment: defaultFragment$2,
            geometryClass: BatchGeometry,
            vertexSize: 6,
        }, options);
        var vertex = ref.vertex;
        var fragment = ref.fragment;
        var vertexSize = ref.vertexSize;
        var geometryClass = ref.geometryClass;
        return (function (AbstractBatchRenderer) {
            function BatchPlugin(renderer) {
                AbstractBatchRenderer.call(this, renderer);
                this.shaderGenerator = new BatchShaderGenerator(vertex, fragment);
                this.geometryClass = geometryClass;
                this.vertexSize = vertexSize;
            }
            if (AbstractBatchRenderer) {
                BatchPlugin.__proto__ = AbstractBatchRenderer;
            }
            BatchPlugin.prototype = Object.create(AbstractBatchRenderer && AbstractBatchRenderer.prototype);
            BatchPlugin.prototype.constructor = BatchPlugin;
            return BatchPlugin;
        }(AbstractBatchRenderer));
    };
    staticAccessors$1.defaultVertexSrc.get = function () {
        return defaultVertex$2;
    };
    staticAccessors$1.defaultFragmentTemplate.get = function () {
        return defaultFragment$2;
    };
    Object.defineProperties(BatchPluginFactory, staticAccessors$1);
    var BatchRenderer = BatchPluginFactory.create();
    var Application = function Application(options) {
        var this$1 = this;
        options = Object.assign({
            forceCanvas: false,
        }, options);
        this.renderer = autoDetectRenderer(options);
        this.stage = new Container();
        Application._plugins.forEach(function (plugin) {
            plugin.init.call(this$1, options);
        });
    };
    var prototypeAccessors$6 = { view: { configurable: true }, screen: { configurable: true } };
    Application.registerPlugin = function registerPlugin(plugin) {
        Application._plugins.push(plugin);
    };
    Application.prototype.render = function render() {
        this.renderer.render(this.stage);
    };
    prototypeAccessors$6.view.get = function () {
        return this.renderer.view;
    };
    prototypeAccessors$6.screen.get = function () {
        return this.renderer.screen;
    };
    Application.prototype.destroy = function destroy(removeView, stageOptions) {
        var this$1 = this;
        var plugins = Application._plugins.slice(0);
        plugins.reverse();
        plugins.forEach(function (plugin) {
            plugin.destroy.call(this$1);
        });
        this.stage.destroy(stageOptions);
        this.stage = null;
        this.renderer.destroy(removeView);
        this.renderer = null;
        this._options = null;
    };
    Object.defineProperties(Application.prototype, prototypeAccessors$6);
    Application._plugins = [];
    var ResizePlugin = function ResizePlugin() { };
    ResizePlugin.init = function init(options) {
        var this$1 = this;
        Object.defineProperty(this, 'resizeTo', {
            set: function set(dom) {
                window.removeEventListener('resize', this.resize);
                this._resizeTo = dom;
                if (dom) {
                    window.addEventListener('resize', this.resize);
                    this.resize();
                }
            },
            get: function get() {
                return this._resizeTo;
            },
        });
        this.resize = function () {
            if (this$1._resizeTo) {
                if (this$1._resizeTo === window) {
                    this$1.renderer.resize(window.innerWidth, window.innerHeight);
                }
                else {
                    this$1.renderer.resize(this$1._resizeTo.clientWidth, this$1._resizeTo.clientHeight);
                }
            }
        };
        this._resizeTo = null;
        this.resizeTo = options.resizeTo || null;
    };
    ResizePlugin.destroy = function destroy() {
        this.resizeTo = null;
        this.resize = null;
    };
    Application.registerPlugin(ResizePlugin);
    var TEMP_RECT = new Rectangle();
    var BYTES_PER_PIXEL = 4;
    var Extract = function Extract(renderer) {
        this.renderer = renderer;
        renderer.extract = this;
    };
    Extract.prototype.image = function image(target, format, quality) {
        var image = new Image();
        image.src = this.base64(target, format, quality);
        return image;
    };
    Extract.prototype.base64 = function base64(target, format, quality) {
        return this.canvas(target).toDataURL(format, quality);
    };
    Extract.prototype.canvas = function canvas(target) {
        var renderer = this.renderer;
        var resolution;
        var frame;
        var flipY = false;
        var renderTexture;
        var generated = false;
        if (target) {
            if (target instanceof RenderTexture) {
                renderTexture = target;
            }
            else {
                renderTexture = this.renderer.generateTexture(target);
                generated = true;
            }
        }
        if (renderTexture) {
            resolution = renderTexture.baseTexture.resolution;
            frame = renderTexture.frame;
            flipY = false;
            renderer.renderTexture.bind(renderTexture);
        }
        else {
            resolution = this.renderer.resolution;
            flipY = true;
            frame = TEMP_RECT;
            frame.width = this.renderer.width;
            frame.height = this.renderer.height;
            renderer.renderTexture.bind(null);
        }
        var width = Math.floor((frame.width * resolution) + 1e-4);
        var height = Math.floor((frame.height * resolution) + 1e-4);
        var canvasBuffer = new CanvasRenderTarget(width, height, 1);
        var webglPixels = new Uint8Array(BYTES_PER_PIXEL * width * height);
        var gl = renderer.gl;
        gl.readPixels(frame.x * resolution, frame.y * resolution, width, height, gl.RGBA, gl.UNSIGNED_BYTE, webglPixels);
        var canvasData = canvasBuffer.context.getImageData(0, 0, width, height);
        Extract.arrayPostDivide(webglPixels, canvasData.data);
        canvasBuffer.context.putImageData(canvasData, 0, 0);
        if (flipY) {
            canvasBuffer.context.scale(1, -1);
            canvasBuffer.context.drawImage(canvasBuffer.canvas, 0, -height);
        }
        if (generated) {
            renderTexture.destroy(true);
        }
        return canvasBuffer.canvas;
    };
    Extract.prototype.pixels = function pixels(target) {
        var renderer = this.renderer;
        var resolution;
        var frame;
        var renderTexture;
        var generated = false;
        if (target) {
            if (target instanceof RenderTexture) {
                renderTexture = target;
            }
            else {
                renderTexture = this.renderer.generateTexture(target);
                generated = true;
            }
        }
        if (renderTexture) {
            resolution = renderTexture.baseTexture.resolution;
            frame = renderTexture.frame;
            renderer.renderTexture.bind(renderTexture);
        }
        else {
            resolution = renderer.resolution;
            frame = TEMP_RECT;
            frame.width = renderer.width;
            frame.height = renderer.height;
            renderer.renderTexture.bind(null);
        }
        var width = frame.width * resolution;
        var height = frame.height * resolution;
        var webglPixels = new Uint8Array(BYTES_PER_PIXEL * width * height);
        var gl = renderer.gl;
        gl.readPixels(frame.x * resolution, frame.y * resolution, width, height, gl.RGBA, gl.UNSIGNED_BYTE, webglPixels);
        if (generated) {
            renderTexture.destroy(true);
        }
        Extract.arrayPostDivide(webglPixels, webglPixels);
        return webglPixels;
    };
    Extract.prototype.destroy = function destroy() {
        this.renderer.extract = null;
        this.renderer = null;
    };
    Extract.arrayPostDivide = function arrayPostDivide(pixels, out) {
        for (var i = 0; i < pixels.length; i += 4) {
            var alpha = out[i + 3] = pixels[i + 3];
            if (alpha !== 0) {
                out[i] = Math.round(Math.min(pixels[i] * 255.0 / alpha, 255.0));
                out[i + 1] = Math.round(Math.min(pixels[i + 1] * 255.0 / alpha, 255.0));
                out[i + 2] = Math.round(Math.min(pixels[i + 2] * 255.0 / alpha, 255.0));
            }
            else {
                out[i] = pixels[i];
                out[i + 1] = pixels[i + 1];
                out[i + 2] = pixels[i + 2];
            }
        }
    };
    'use strict';
    var parseUri = function parseURI(str, opts) {
        opts = opts || {};
        var o = {
            key: ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'],
            q: {
                name: 'queryKey',
                parser: /(?:^|&)([^&=]*)=?([^&]*)/g
            },
            parser: {
                strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
                loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
            }
        };
        var m = o.parser[opts.strictMode ? 'strict' : 'loose'].exec(str);
        var uri = {};
        var i = 14;
        while (i--) {
            uri[o.key[i]] = m[i] || '';
        }
        uri[o.q.name] = {};
        uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
            if ($1) {
                uri[o.q.name][$1] = $2;
            }
        });
        return uri;
    };
    var miniSignals = createCommonjsModule(function (module, exports) {
        'use strict';
        Object.defineProperty(exports, '__esModule', {
            value: true
        });
        var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ('value' in descriptor) {
                descriptor.writable = true;
            }
            Object.defineProperty(target, descriptor.key, descriptor);
        } } return function (Constructor, protoProps, staticProps) { if (protoProps) {
            defineProperties(Constructor.prototype, protoProps);
        } if (staticProps) {
            defineProperties(Constructor, staticProps);
        } return Constructor; }; })();
        function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) {
            throw new TypeError('Cannot call a class as a function');
        } }
        var MiniSignalBinding = (function () {
            function MiniSignalBinding(fn, once, thisArg) {
                if (once === undefined) {
                    once = false;
                }
                _classCallCheck(this, MiniSignalBinding);
                this._fn = fn;
                this._once = once;
                this._thisArg = thisArg;
                this._next = this._prev = this._owner = null;
            }
            _createClass(MiniSignalBinding, [{
                    key: 'detach',
                    value: function detach() {
                        if (this._owner === null) {
                            return false;
                        }
                        this._owner.detach(this);
                        return true;
                    }
                }]);
            return MiniSignalBinding;
        })();
        function _addMiniSignalBinding(self, node) {
            if (!self._head) {
                self._head = node;
                self._tail = node;
            }
            else {
                self._tail._next = node;
                node._prev = self._tail;
                self._tail = node;
            }
            node._owner = self;
            return node;
        }
        var MiniSignal = (function () {
            function MiniSignal() {
                _classCallCheck(this, MiniSignal);
                this._head = this._tail = undefined;
            }
            _createClass(MiniSignal, [{
                    key: 'handlers',
                    value: function handlers() {
                        var exists = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];
                        var node = this._head;
                        if (exists) {
                            return !!node;
                        }
                        var ee = [];
                        while (node) {
                            ee.push(node);
                            node = node._next;
                        }
                        return ee;
                    }
                }, {
                    key: 'has',
                    value: function has(node) {
                        if (!(node instanceof MiniSignalBinding)) {
                            throw new Error('MiniSignal#has(): First arg must be a MiniSignalBinding object.');
                        }
                        return node._owner === this;
                    }
                }, {
                    key: 'dispatch',
                    value: function dispatch() {
                        var arguments$1 = arguments;
                        var node = this._head;
                        if (!node) {
                            return false;
                        }
                        while (node) {
                            if (node._once) {
                                this.detach(node);
                            }
                            node._fn.apply(node._thisArg, arguments$1);
                            node = node._next;
                        }
                        return true;
                    }
                }, {
                    key: 'add',
                    value: function add(fn) {
                        var thisArg = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
                        if (typeof fn !== 'function') {
                            throw new Error('MiniSignal#add(): First arg must be a Function.');
                        }
                        return _addMiniSignalBinding(this, new MiniSignalBinding(fn, false, thisArg));
                    }
                }, {
                    key: 'once',
                    value: function once(fn) {
                        var thisArg = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
                        if (typeof fn !== 'function') {
                            throw new Error('MiniSignal#once(): First arg must be a Function.');
                        }
                        return _addMiniSignalBinding(this, new MiniSignalBinding(fn, true, thisArg));
                    }
                }, {
                    key: 'detach',
                    value: function detach(node) {
                        if (!(node instanceof MiniSignalBinding)) {
                            throw new Error('MiniSignal#detach(): First arg must be a MiniSignalBinding object.');
                        }
                        if (node._owner !== this) {
                            return this;
                        }
                        if (node._prev) {
                            node._prev._next = node._next;
                        }
                        if (node._next) {
                            node._next._prev = node._prev;
                        }
                        if (node === this._head) {
                            this._head = node._next;
                            if (node._next === null) {
                                this._tail = null;
                            }
                        }
                        else if (node === this._tail) {
                            this._tail = node._prev;
                            this._tail._next = null;
                        }
                        node._owner = null;
                        return this;
                    }
                }, {
                    key: 'detachAll',
                    value: function detachAll() {
                        var node = this._head;
                        if (!node) {
                            return this;
                        }
                        this._head = this._tail = null;
                        while (node) {
                            node._owner = null;
                            node = node._next;
                        }
                        return this;
                    }
                }]);
            return MiniSignal;
        })();
        MiniSignal.MiniSignalBinding = MiniSignalBinding;
        exports['default'] = MiniSignal;
        module.exports = exports['default'];
    });
    var Signal = unwrapExports(miniSignals);
    function _noop() { }
    function eachSeries(array, iterator, callback, deferNext) {
        var i = 0;
        var len = array.length;
        (function next(err) {
            if (err || i === len) {
                if (callback) {
                    callback(err);
                }
                return;
            }
            if (deferNext) {
                setTimeout(function () {
                    iterator(array[i++], next);
                }, 1);
            }
            else {
                iterator(array[i++], next);
            }
        })();
    }
    function onlyOnce(fn) {
        return function onceWrapper() {
            if (fn === null) {
                throw new Error('Callback was already called.');
            }
            var callFn = fn;
            fn = null;
            callFn.apply(this, arguments);
        };
    }
    function queue(worker, concurrency) {
        if (concurrency == null) {
            concurrency = 1;
        }
        else if (concurrency === 0) {
            throw new Error('Concurrency must not be zero');
        }
        var workers = 0;
        var q = {
            _tasks: [],
            concurrency: concurrency,
            saturated: _noop,
            unsaturated: _noop,
            buffer: concurrency / 4,
            empty: _noop,
            drain: _noop,
            error: _noop,
            started: false,
            paused: false,
            push: function push(data, callback) {
                _insert(data, false, callback);
            },
            kill: function kill() {
                workers = 0;
                q.drain = _noop;
                q.started = false;
                q._tasks = [];
            },
            unshift: function unshift(data, callback) {
                _insert(data, true, callback);
            },
            process: function process() {
                while (!q.paused && workers < q.concurrency && q._tasks.length) {
                    var task = q._tasks.shift();
                    if (q._tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    if (workers === q.concurrency) {
                        q.saturated();
                    }
                    worker(task.data, onlyOnce(_next(task)));
                }
            },
            length: function length() {
                return q._tasks.length;
            },
            running: function running() {
                return workers;
            },
            idle: function idle() {
                return q._tasks.length + workers === 0;
            },
            pause: function pause() {
                if (q.paused === true) {
                    return;
                }
                q.paused = true;
            },
            resume: function resume() {
                if (q.paused === false) {
                    return;
                }
                q.paused = false;
                for (var w = 1; w <= q.concurrency; w++) {
                    q.process();
                }
            }
        };
        function _insert(data, insertAtFront, callback) {
            if (callback != null && typeof callback !== 'function') {
                throw new Error('task callback must be a function');
            }
            q.started = true;
            if (data == null && q.idle()) {
                setTimeout(function () {
                    return q.drain();
                }, 1);
                return;
            }
            var item = {
                data: data,
                callback: typeof callback === 'function' ? callback : _noop
            };
            if (insertAtFront) {
                q._tasks.unshift(item);
            }
            else {
                q._tasks.push(item);
            }
            setTimeout(function () {
                return q.process();
            }, 1);
        }
        function _next(task) {
            return function next() {
                workers -= 1;
                task.callback.apply(task, arguments);
                if (arguments[0] != null) {
                    q.error(arguments[0], task.data);
                }
                if (workers <= q.concurrency - q.buffer) {
                    q.unsaturated();
                }
                if (q.idle()) {
                    q.drain();
                }
                q.process();
            };
        }
        return q;
    }
    var async = ({
        eachSeries: eachSeries,
        queue: queue
    });
    var cache = {};
    function caching(resource, next) {
        var _this = this;
        if (cache[resource.url]) {
            resource.data = cache[resource.url];
            resource.complete();
        }
        else {
            resource.onComplete.once(function () {
                return cache[_this.url] = _this.data;
            });
        }
        next();
    }
    function _defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) {
                descriptor.writable = true;
            }
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }
    function _createClass(Constructor, protoProps, staticProps) {
        if (protoProps) {
            _defineProperties(Constructor.prototype, protoProps);
        }
        if (staticProps) {
            _defineProperties(Constructor, staticProps);
        }
        return Constructor;
    }
    var useXdr = !!(window.XDomainRequest && !('withCredentials' in new XMLHttpRequest()));
    var tempAnchor$1 = null;
    var STATUS_NONE = 0;
    var STATUS_OK = 200;
    var STATUS_EMPTY = 204;
    var STATUS_IE_BUG_EMPTY = 1223;
    var STATUS_TYPE_OK = 2;
    function _noop$1() { }
    var Resource$1 = function () {
        Resource.setExtensionLoadType = function setExtensionLoadType(extname, loadType) {
            setExtMap(Resource._loadTypeMap, extname, loadType);
        };
        Resource.setExtensionXhrType = function setExtensionXhrType(extname, xhrType) {
            setExtMap(Resource._xhrTypeMap, extname, xhrType);
        };
        function Resource(name, url, options) {
            if (typeof name !== 'string' || typeof url !== 'string') {
                throw new Error('Both name and url are required for constructing a resource.');
            }
            options = options || {};
            this._flags = 0;
            this._setFlag(Resource.STATUS_FLAGS.DATA_URL, url.indexOf('data:') === 0);
            this.name = name;
            this.url = url;
            this.extension = this._getExtension();
            this.data = null;
            this.crossOrigin = options.crossOrigin === true ? 'anonymous' : options.crossOrigin;
            this.timeout = options.timeout || 0;
            this.loadType = options.loadType || this._determineLoadType();
            this.xhrType = options.xhrType;
            this.metadata = options.metadata || {};
            this.error = null;
            this.xhr = null;
            this.children = [];
            this.type = Resource.TYPE.UNKNOWN;
            this.progressChunk = 0;
            this._dequeue = _noop$1;
            this._onLoadBinding = null;
            this._elementTimer = 0;
            this._boundComplete = this.complete.bind(this);
            this._boundOnError = this._onError.bind(this);
            this._boundOnProgress = this._onProgress.bind(this);
            this._boundOnTimeout = this._onTimeout.bind(this);
            this._boundXhrOnError = this._xhrOnError.bind(this);
            this._boundXhrOnTimeout = this._xhrOnTimeout.bind(this);
            this._boundXhrOnAbort = this._xhrOnAbort.bind(this);
            this._boundXhrOnLoad = this._xhrOnLoad.bind(this);
            this.onStart = new Signal();
            this.onProgress = new Signal();
            this.onComplete = new Signal();
            this.onAfterMiddleware = new Signal();
        }
        var _proto = Resource.prototype;
        _proto.complete = function complete() {
            this._clearEvents();
            this._finish();
        };
        _proto.abort = function abort(message) {
            if (this.error) {
                return;
            }
            this.error = new Error(message);
            this._clearEvents();
            if (this.xhr) {
                this.xhr.abort();
            }
            else if (this.xdr) {
                this.xdr.abort();
            }
            else if (this.data) {
                if (this.data.src) {
                    this.data.src = Resource.EMPTY_GIF;
                }
                else {
                    while (this.data.firstChild) {
                        this.data.removeChild(this.data.firstChild);
                    }
                }
            }
            this._finish();
        };
        _proto.load = function load(cb) {
            var _this = this;
            if (this.isLoading) {
                return;
            }
            if (this.isComplete) {
                if (cb) {
                    setTimeout(function () {
                        return cb(_this);
                    }, 1);
                }
                return;
            }
            else if (cb) {
                this.onComplete.once(cb);
            }
            this._setFlag(Resource.STATUS_FLAGS.LOADING, true);
            this.onStart.dispatch(this);
            if (this.crossOrigin === false || typeof this.crossOrigin !== 'string') {
                this.crossOrigin = this._determineCrossOrigin(this.url);
            }
            switch (this.loadType) {
                case Resource.LOAD_TYPE.IMAGE:
                    this.type = Resource.TYPE.IMAGE;
                    this._loadElement('image');
                    break;
                case Resource.LOAD_TYPE.AUDIO:
                    this.type = Resource.TYPE.AUDIO;
                    this._loadSourceElement('audio');
                    break;
                case Resource.LOAD_TYPE.VIDEO:
                    this.type = Resource.TYPE.VIDEO;
                    this._loadSourceElement('video');
                    break;
                case Resource.LOAD_TYPE.XHR:
                default:
                    if (useXdr && this.crossOrigin) {
                        this._loadXdr();
                    }
                    else {
                        this._loadXhr();
                    }
                    break;
            }
        };
        _proto._hasFlag = function _hasFlag(flag) {
            return (this._flags & flag) !== 0;
        };
        _proto._setFlag = function _setFlag(flag, value) {
            this._flags = value ? this._flags | flag : this._flags & ~flag;
        };
        _proto._clearEvents = function _clearEvents() {
            clearTimeout(this._elementTimer);
            if (this.data && this.data.removeEventListener) {
                this.data.removeEventListener('error', this._boundOnError, false);
                this.data.removeEventListener('load', this._boundComplete, false);
                this.data.removeEventListener('progress', this._boundOnProgress, false);
                this.data.removeEventListener('canplaythrough', this._boundComplete, false);
            }
            if (this.xhr) {
                if (this.xhr.removeEventListener) {
                    this.xhr.removeEventListener('error', this._boundXhrOnError, false);
                    this.xhr.removeEventListener('timeout', this._boundXhrOnTimeout, false);
                    this.xhr.removeEventListener('abort', this._boundXhrOnAbort, false);
                    this.xhr.removeEventListener('progress', this._boundOnProgress, false);
                    this.xhr.removeEventListener('load', this._boundXhrOnLoad, false);
                }
                else {
                    this.xhr.onerror = null;
                    this.xhr.ontimeout = null;
                    this.xhr.onprogress = null;
                    this.xhr.onload = null;
                }
            }
        };
        _proto._finish = function _finish() {
            if (this.isComplete) {
                throw new Error('Complete called again for an already completed resource.');
            }
            this._setFlag(Resource.STATUS_FLAGS.COMPLETE, true);
            this._setFlag(Resource.STATUS_FLAGS.LOADING, false);
            this.onComplete.dispatch(this);
        };
        _proto._loadElement = function _loadElement(type) {
            if (this.metadata.loadElement) {
                this.data = this.metadata.loadElement;
            }
            else if (type === 'image' && typeof window.Image !== 'undefined') {
                this.data = new Image();
            }
            else {
                this.data = document.createElement(type);
            }
            if (this.crossOrigin) {
                this.data.crossOrigin = this.crossOrigin;
            }
            if (!this.metadata.skipSource) {
                this.data.src = this.url;
            }
            this.data.addEventListener('error', this._boundOnError, false);
            this.data.addEventListener('load', this._boundComplete, false);
            this.data.addEventListener('progress', this._boundOnProgress, false);
            if (this.timeout) {
                this._elementTimer = setTimeout(this._boundOnTimeout, this.timeout);
            }
        };
        _proto._loadSourceElement = function _loadSourceElement(type) {
            if (this.metadata.loadElement) {
                this.data = this.metadata.loadElement;
            }
            else if (type === 'audio' && typeof window.Audio !== 'undefined') {
                this.data = new Audio();
            }
            else {
                this.data = document.createElement(type);
            }
            if (this.data === null) {
                this.abort("Unsupported element: " + type);
                return;
            }
            if (this.crossOrigin) {
                this.data.crossOrigin = this.crossOrigin;
            }
            if (!this.metadata.skipSource) {
                if (navigator.isCocoonJS) {
                    this.data.src = Array.isArray(this.url) ? this.url[0] : this.url;
                }
                else if (Array.isArray(this.url)) {
                    var mimeTypes = this.metadata.mimeType;
                    for (var i = 0; i < this.url.length; ++i) {
                        this.data.appendChild(this._createSource(type, this.url[i], Array.isArray(mimeTypes) ? mimeTypes[i] : mimeTypes));
                    }
                }
                else {
                    var _mimeTypes = this.metadata.mimeType;
                    this.data.appendChild(this._createSource(type, this.url, Array.isArray(_mimeTypes) ? _mimeTypes[0] : _mimeTypes));
                }
            }
            this.data.addEventListener('error', this._boundOnError, false);
            this.data.addEventListener('load', this._boundComplete, false);
            this.data.addEventListener('progress', this._boundOnProgress, false);
            this.data.addEventListener('canplaythrough', this._boundComplete, false);
            this.data.load();
            if (this.timeout) {
                this._elementTimer = setTimeout(this._boundOnTimeout, this.timeout);
            }
        };
        _proto._loadXhr = function _loadXhr() {
            if (typeof this.xhrType !== 'string') {
                this.xhrType = this._determineXhrType();
            }
            var xhr = this.xhr = new XMLHttpRequest();
            xhr.open('GET', this.url, true);
            xhr.timeout = this.timeout;
            if (this.xhrType === Resource.XHR_RESPONSE_TYPE.JSON || this.xhrType === Resource.XHR_RESPONSE_TYPE.DOCUMENT) {
                xhr.responseType = Resource.XHR_RESPONSE_TYPE.TEXT;
            }
            else {
                xhr.responseType = this.xhrType;
            }
            xhr.addEventListener('error', this._boundXhrOnError, false);
            xhr.addEventListener('timeout', this._boundXhrOnTimeout, false);
            xhr.addEventListener('abort', this._boundXhrOnAbort, false);
            xhr.addEventListener('progress', this._boundOnProgress, false);
            xhr.addEventListener('load', this._boundXhrOnLoad, false);
            xhr.send();
        };
        _proto._loadXdr = function _loadXdr() {
            if (typeof this.xhrType !== 'string') {
                this.xhrType = this._determineXhrType();
            }
            var xdr = this.xhr = new XDomainRequest();
            xdr.timeout = this.timeout || 5000;
            xdr.onerror = this._boundXhrOnError;
            xdr.ontimeout = this._boundXhrOnTimeout;
            xdr.onprogress = this._boundOnProgress;
            xdr.onload = this._boundXhrOnLoad;
            xdr.open('GET', this.url, true);
            setTimeout(function () {
                return xdr.send();
            }, 1);
        };
        _proto._createSource = function _createSource(type, url, mime) {
            if (!mime) {
                mime = type + "/" + this._getExtension(url);
            }
            var source = document.createElement('source');
            source.src = url;
            source.type = mime;
            return source;
        };
        _proto._onError = function _onError(event) {
            this.abort("Failed to load element using: " + event.target.nodeName);
        };
        _proto._onProgress = function _onProgress(event) {
            if (event && event.lengthComputable) {
                this.onProgress.dispatch(this, event.loaded / event.total);
            }
        };
        _proto._onTimeout = function _onTimeout() {
            this.abort("Load timed out.");
        };
        _proto._xhrOnError = function _xhrOnError() {
            var xhr = this.xhr;
            this.abort(reqType(xhr) + " Request failed. Status: " + xhr.status + ", text: \"" + xhr.statusText + "\"");
        };
        _proto._xhrOnTimeout = function _xhrOnTimeout() {
            var xhr = this.xhr;
            this.abort(reqType(xhr) + " Request timed out.");
        };
        _proto._xhrOnAbort = function _xhrOnAbort() {
            var xhr = this.xhr;
            this.abort(reqType(xhr) + " Request was aborted by the user.");
        };
        _proto._xhrOnLoad = function _xhrOnLoad() {
            var xhr = this.xhr;
            var text = '';
            var status = typeof xhr.status === 'undefined' ? STATUS_OK : xhr.status;
            if (xhr.responseType === '' || xhr.responseType === 'text' || typeof xhr.responseType === 'undefined') {
                text = xhr.responseText;
            }
            if (status === STATUS_NONE && (text.length > 0 || xhr.responseType === Resource.XHR_RESPONSE_TYPE.BUFFER)) {
                status = STATUS_OK;
            }
            else if (status === STATUS_IE_BUG_EMPTY) {
                status = STATUS_EMPTY;
            }
            var statusType = status / 100 | 0;
            if (statusType === STATUS_TYPE_OK) {
                if (this.xhrType === Resource.XHR_RESPONSE_TYPE.TEXT) {
                    this.data = text;
                    this.type = Resource.TYPE.TEXT;
                }
                else if (this.xhrType === Resource.XHR_RESPONSE_TYPE.JSON) {
                    try {
                        this.data = JSON.parse(text);
                        this.type = Resource.TYPE.JSON;
                    }
                    catch (e) {
                        this.abort("Error trying to parse loaded json: " + e);
                        return;
                    }
                }
                else if (this.xhrType === Resource.XHR_RESPONSE_TYPE.DOCUMENT) {
                    try {
                        if (window.DOMParser) {
                            var domparser = new DOMParser();
                            this.data = domparser.parseFromString(text, 'text/xml');
                        }
                        else {
                            var div = document.createElement('div');
                            div.innerHTML = text;
                            this.data = div;
                        }
                        this.type = Resource.TYPE.XML;
                    }
                    catch (e) {
                        this.abort("Error trying to parse loaded xml: " + e);
                        return;
                    }
                }
                else {
                    this.data = xhr.response || text;
                }
            }
            else {
                this.abort("[" + xhr.status + "] " + xhr.statusText + ": " + xhr.responseURL);
                return;
            }
            this.complete();
        };
        _proto._determineCrossOrigin = function _determineCrossOrigin(url, loc) {
            if (url.indexOf('data:') === 0) {
                return '';
            }
            if (window.origin !== window.location.origin) {
                return 'anonymous';
            }
            loc = loc || window.location;
            if (!tempAnchor$1) {
                tempAnchor$1 = document.createElement('a');
            }
            tempAnchor$1.href = url;
            url = parseUri(tempAnchor$1.href, {
                strictMode: true
            });
            var samePort = !url.port && loc.port === '' || url.port === loc.port;
            var protocol = url.protocol ? url.protocol + ":" : '';
            if (url.host !== loc.hostname || !samePort || protocol !== loc.protocol) {
                return 'anonymous';
            }
            return '';
        };
        _proto._determineXhrType = function _determineXhrType() {
            return Resource._xhrTypeMap[this.extension] || Resource.XHR_RESPONSE_TYPE.TEXT;
        };
        _proto._determineLoadType = function _determineLoadType() {
            return Resource._loadTypeMap[this.extension] || Resource.LOAD_TYPE.XHR;
        };
        _proto._getExtension = function _getExtension() {
            var url = this.url;
            var ext = '';
            if (this.isDataUrl) {
                var slashIndex = url.indexOf('/');
                ext = url.substring(slashIndex + 1, url.indexOf(';', slashIndex));
            }
            else {
                var queryStart = url.indexOf('?');
                var hashStart = url.indexOf('#');
                var index = Math.min(queryStart > -1 ? queryStart : url.length, hashStart > -1 ? hashStart : url.length);
                url = url.substring(0, index);
                ext = url.substring(url.lastIndexOf('.') + 1);
            }
            return ext.toLowerCase();
        };
        _proto._getMimeFromXhrType = function _getMimeFromXhrType(type) {
            switch (type) {
                case Resource.XHR_RESPONSE_TYPE.BUFFER:
                    return 'application/octet-binary';
                case Resource.XHR_RESPONSE_TYPE.BLOB:
                    return 'application/blob';
                case Resource.XHR_RESPONSE_TYPE.DOCUMENT:
                    return 'application/xml';
                case Resource.XHR_RESPONSE_TYPE.JSON:
                    return 'application/json';
                case Resource.XHR_RESPONSE_TYPE.DEFAULT:
                case Resource.XHR_RESPONSE_TYPE.TEXT:
                default:
                    return 'text/plain';
            }
        };
        _createClass(Resource, [{
                key: "isDataUrl",
                get: function get() {
                    return this._hasFlag(Resource.STATUS_FLAGS.DATA_URL);
                }
            }, {
                key: "isComplete",
                get: function get() {
                    return this._hasFlag(Resource.STATUS_FLAGS.COMPLETE);
                }
            }, {
                key: "isLoading",
                get: function get() {
                    return this._hasFlag(Resource.STATUS_FLAGS.LOADING);
                }
            }]);
        return Resource;
    }();
    Resource$1.STATUS_FLAGS = {
        NONE: 0,
        DATA_URL: 1 << 0,
        COMPLETE: 1 << 1,
        LOADING: 1 << 2
    };
    Resource$1.TYPE = {
        UNKNOWN: 0,
        JSON: 1,
        XML: 2,
        IMAGE: 3,
        AUDIO: 4,
        VIDEO: 5,
        TEXT: 6
    };
    Resource$1.LOAD_TYPE = {
        XHR: 1,
        IMAGE: 2,
        AUDIO: 3,
        VIDEO: 4
    };
    Resource$1.XHR_RESPONSE_TYPE = {
        DEFAULT: 'text',
        BUFFER: 'arraybuffer',
        BLOB: 'blob',
        DOCUMENT: 'document',
        JSON: 'json',
        TEXT: 'text'
    };
    Resource$1._loadTypeMap = {
        gif: Resource$1.LOAD_TYPE.IMAGE,
        png: Resource$1.LOAD_TYPE.IMAGE,
        bmp: Resource$1.LOAD_TYPE.IMAGE,
        jpg: Resource$1.LOAD_TYPE.IMAGE,
        jpeg: Resource$1.LOAD_TYPE.IMAGE,
        tif: Resource$1.LOAD_TYPE.IMAGE,
        tiff: Resource$1.LOAD_TYPE.IMAGE,
        webp: Resource$1.LOAD_TYPE.IMAGE,
        tga: Resource$1.LOAD_TYPE.IMAGE,
        svg: Resource$1.LOAD_TYPE.IMAGE,
        'svg+xml': Resource$1.LOAD_TYPE.IMAGE,
        mp3: Resource$1.LOAD_TYPE.AUDIO,
        ogg: Resource$1.LOAD_TYPE.AUDIO,
        wav: Resource$1.LOAD_TYPE.AUDIO,
        mp4: Resource$1.LOAD_TYPE.VIDEO,
        webm: Resource$1.LOAD_TYPE.VIDEO
    };
    Resource$1._xhrTypeMap = {
        xhtml: Resource$1.XHR_RESPONSE_TYPE.DOCUMENT,
        html: Resource$1.XHR_RESPONSE_TYPE.DOCUMENT,
        htm: Resource$1.XHR_RESPONSE_TYPE.DOCUMENT,
        xml: Resource$1.XHR_RESPONSE_TYPE.DOCUMENT,
        tmx: Resource$1.XHR_RESPONSE_TYPE.DOCUMENT,
        svg: Resource$1.XHR_RESPONSE_TYPE.DOCUMENT,
        tsx: Resource$1.XHR_RESPONSE_TYPE.DOCUMENT,
        gif: Resource$1.XHR_RESPONSE_TYPE.BLOB,
        png: Resource$1.XHR_RESPONSE_TYPE.BLOB,
        bmp: Resource$1.XHR_RESPONSE_TYPE.BLOB,
        jpg: Resource$1.XHR_RESPONSE_TYPE.BLOB,
        jpeg: Resource$1.XHR_RESPONSE_TYPE.BLOB,
        tif: Resource$1.XHR_RESPONSE_TYPE.BLOB,
        tiff: Resource$1.XHR_RESPONSE_TYPE.BLOB,
        webp: Resource$1.XHR_RESPONSE_TYPE.BLOB,
        tga: Resource$1.XHR_RESPONSE_TYPE.BLOB,
        json: Resource$1.XHR_RESPONSE_TYPE.JSON,
        text: Resource$1.XHR_RESPONSE_TYPE.TEXT,
        txt: Resource$1.XHR_RESPONSE_TYPE.TEXT,
        ttf: Resource$1.XHR_RESPONSE_TYPE.BUFFER,
        otf: Resource$1.XHR_RESPONSE_TYPE.BUFFER
    };
    Resource$1.EMPTY_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
    function setExtMap(map, extname, val) {
        if (extname && extname.indexOf('.') === 0) {
            extname = extname.substring(1);
        }
        if (!extname) {
            return;
        }
        map[extname] = val;
    }
    function reqType(xhr) {
        return xhr.toString().replace('object ', '');
    }
    var _keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    function encodeBinary(input) {
        var output = '';
        var inx = 0;
        while (inx < input.length) {
            var bytebuffer = [0, 0, 0];
            var encodedCharIndexes = [0, 0, 0, 0];
            for (var jnx = 0; jnx < bytebuffer.length; ++jnx) {
                if (inx < input.length) {
                    bytebuffer[jnx] = input.charCodeAt(inx++) & 0xff;
                }
                else {
                    bytebuffer[jnx] = 0;
                }
            }
            encodedCharIndexes[0] = bytebuffer[0] >> 2;
            encodedCharIndexes[1] = (bytebuffer[0] & 0x3) << 4 | bytebuffer[1] >> 4;
            encodedCharIndexes[2] = (bytebuffer[1] & 0x0f) << 2 | bytebuffer[2] >> 6;
            encodedCharIndexes[3] = bytebuffer[2] & 0x3f;
            var paddingBytes = inx - (input.length - 1);
            switch (paddingBytes) {
                case 2:
                    encodedCharIndexes[3] = 64;
                    encodedCharIndexes[2] = 64;
                    break;
                case 1:
                    encodedCharIndexes[3] = 64;
                    break;
                default:
                    break;
            }
            for (var _jnx = 0; _jnx < encodedCharIndexes.length; ++_jnx) {
                output += _keyStr.charAt(encodedCharIndexes[_jnx]);
            }
        }
        return output;
    }
    var Url$1 = window.URL || window.webkitURL;
    function parsing(resource, next) {
        if (!resource.data) {
            next();
            return;
        }
        if (resource.xhr && resource.xhrType === Resource$1.XHR_RESPONSE_TYPE.BLOB) {
            if (!window.Blob || typeof resource.data === 'string') {
                var type = resource.xhr.getResponseHeader('content-type');
                if (type && type.indexOf('image') === 0) {
                    resource.data = new Image();
                    resource.data.src = "data:" + type + ";base64," + encodeBinary(resource.xhr.responseText);
                    resource.type = Resource$1.TYPE.IMAGE;
                    resource.data.onload = function () {
                        resource.data.onload = null;
                        next();
                    };
                    return;
                }
            }
            else if (resource.data.type.indexOf('image') === 0) {
                var src = Url$1.createObjectURL(resource.data);
                resource.blob = resource.data;
                resource.data = new Image();
                resource.data.src = src;
                resource.type = Resource$1.TYPE.IMAGE;
                resource.data.onload = function () {
                    Url$1.revokeObjectURL(src);
                    resource.data.onload = null;
                    next();
                };
                return;
            }
        }
        next();
    }
    var index$1 = ({
        caching: caching,
        parsing: parsing
    });
    var MAX_PROGRESS = 100;
    var rgxExtractUrlHash = /(#[\w-]+)?$/;
    var Loader = function () {
        function Loader(baseUrl, concurrency) {
            var _this = this;
            if (baseUrl === void 0) {
                baseUrl = '';
            }
            if (concurrency === void 0) {
                concurrency = 10;
            }
            this.baseUrl = baseUrl;
            this.progress = 0;
            this.loading = false;
            this.defaultQueryString = '';
            this._beforeMiddleware = [];
            this._afterMiddleware = [];
            this._resourcesParsing = [];
            this._boundLoadResource = function (r, d) {
                return _this._loadResource(r, d);
            };
            this._queue = queue(this._boundLoadResource, concurrency);
            this._queue.pause();
            this.resources = {};
            this.onProgress = new Signal();
            this.onError = new Signal();
            this.onLoad = new Signal();
            this.onStart = new Signal();
            this.onComplete = new Signal();
            for (var i = 0; i < Loader._defaultBeforeMiddleware.length; ++i) {
                this.pre(Loader._defaultBeforeMiddleware[i]);
            }
            for (var _i = 0; _i < Loader._defaultAfterMiddleware.length; ++_i) {
                this.use(Loader._defaultAfterMiddleware[_i]);
            }
        }
        var _proto = Loader.prototype;
        _proto.add = function add(name, url, options, cb) {
            if (Array.isArray(name)) {
                for (var i = 0; i < name.length; ++i) {
                    this.add(name[i]);
                }
                return this;
            }
            if (typeof name === 'object') {
                cb = url || name.callback || name.onComplete;
                options = name;
                url = name.url;
                name = name.name || name.key || name.url;
            }
            if (typeof url !== 'string') {
                cb = options;
                options = url;
                url = name;
            }
            if (typeof url !== 'string') {
                throw new Error('No url passed to add resource to loader.');
            }
            if (typeof options === 'function') {
                cb = options;
                options = null;
            }
            if (this.loading && (!options || !options.parentResource)) {
                throw new Error('Cannot add resources while the loader is running.');
            }
            if (this.resources[name]) {
                throw new Error("Resource named \"" + name + "\" already exists.");
            }
            url = this._prepareUrl(url);
            this.resources[name] = new Resource$1(name, url, options);
            if (typeof cb === 'function') {
                this.resources[name].onAfterMiddleware.once(cb);
            }
            if (this.loading) {
                var parent = options.parentResource;
                var incompleteChildren = [];
                for (var _i2 = 0; _i2 < parent.children.length; ++_i2) {
                    if (!parent.children[_i2].isComplete) {
                        incompleteChildren.push(parent.children[_i2]);
                    }
                }
                var fullChunk = parent.progressChunk * (incompleteChildren.length + 1);
                var eachChunk = fullChunk / (incompleteChildren.length + 2);
                parent.children.push(this.resources[name]);
                parent.progressChunk = eachChunk;
                for (var _i3 = 0; _i3 < incompleteChildren.length; ++_i3) {
                    incompleteChildren[_i3].progressChunk = eachChunk;
                }
                this.resources[name].progressChunk = eachChunk;
            }
            this._queue.push(this.resources[name]);
            return this;
        };
        _proto.pre = function pre(fn) {
            this._beforeMiddleware.push(fn);
            return this;
        };
        _proto.use = function use(fn) {
            this._afterMiddleware.push(fn);
            return this;
        };
        _proto.reset = function reset() {
            this.progress = 0;
            this.loading = false;
            this._queue.kill();
            this._queue.pause();
            for (var k in this.resources) {
                var res = this.resources[k];
                if (res._onLoadBinding) {
                    res._onLoadBinding.detach();
                }
                if (res.isLoading) {
                    res.abort();
                }
            }
            this.resources = {};
            return this;
        };
        _proto.load = function load(cb) {
            if (typeof cb === 'function') {
                this.onComplete.once(cb);
            }
            if (this.loading) {
                return this;
            }
            if (this._queue.idle()) {
                this._onStart();
                this._onComplete();
            }
            else {
                var numTasks = this._queue._tasks.length;
                var chunk = MAX_PROGRESS / numTasks;
                for (var i = 0; i < this._queue._tasks.length; ++i) {
                    this._queue._tasks[i].data.progressChunk = chunk;
                }
                this._onStart();
                this._queue.resume();
            }
            return this;
        };
        _proto._prepareUrl = function _prepareUrl(url) {
            var parsedUrl = parseUri(url, {
                strictMode: true
            });
            var result;
            if (parsedUrl.protocol || !parsedUrl.path || url.indexOf('//') === 0) {
                result = url;
            }
            else if (this.baseUrl.length && this.baseUrl.lastIndexOf('/') !== this.baseUrl.length - 1 && url.charAt(0) !== '/') {
                result = this.baseUrl + "/" + url;
            }
            else {
                result = this.baseUrl + url;
            }
            if (this.defaultQueryString) {
                var hash = rgxExtractUrlHash.exec(result)[0];
                result = result.substr(0, result.length - hash.length);
                if (result.indexOf('?') !== -1) {
                    result += "&" + this.defaultQueryString;
                }
                else {
                    result += "?" + this.defaultQueryString;
                }
                result += hash;
            }
            return result;
        };
        _proto._loadResource = function _loadResource(resource, dequeue) {
            var _this2 = this;
            resource._dequeue = dequeue;
            eachSeries(this._beforeMiddleware, function (fn, next) {
                fn.call(_this2, resource, function () {
                    next(resource.isComplete ? {} : null);
                });
            }, function () {
                if (resource.isComplete) {
                    _this2._onLoad(resource);
                }
                else {
                    resource._onLoadBinding = resource.onComplete.once(_this2._onLoad, _this2);
                    resource.load();
                }
            }, true);
        };
        _proto._onStart = function _onStart() {
            this.progress = 0;
            this.loading = true;
            this.onStart.dispatch(this);
        };
        _proto._onComplete = function _onComplete() {
            this.progress = MAX_PROGRESS;
            this.loading = false;
            this.onComplete.dispatch(this, this.resources);
        };
        _proto._onLoad = function _onLoad(resource) {
            var _this3 = this;
            resource._onLoadBinding = null;
            this._resourcesParsing.push(resource);
            resource._dequeue();
            eachSeries(this._afterMiddleware, function (fn, next) {
                fn.call(_this3, resource, next);
            }, function () {
                resource.onAfterMiddleware.dispatch(resource);
                _this3.progress = Math.min(MAX_PROGRESS, _this3.progress + resource.progressChunk);
                _this3.onProgress.dispatch(_this3, resource);
                if (resource.error) {
                    _this3.onError.dispatch(resource.error, _this3, resource);
                }
                else {
                    _this3.onLoad.dispatch(_this3, resource);
                }
                _this3._resourcesParsing.splice(_this3._resourcesParsing.indexOf(resource), 1);
                if (_this3._queue.idle() && _this3._resourcesParsing.length === 0) {
                    _this3._onComplete();
                }
            }, true);
        };
        _createClass(Loader, [{
                key: "concurrency",
                get: function get() {
                    return this._queue.concurrency;
                },
                set: function set(concurrency) {
                    this._queue.concurrency = concurrency;
                }
            }]);
        return Loader;
    }();
    Loader._defaultBeforeMiddleware = [];
    Loader._defaultAfterMiddleware = [];
    Loader.pre = function LoaderPreStatic(fn) {
        Loader._defaultBeforeMiddleware.push(fn);
        return Loader;
    };
    Loader.use = function LoaderUseStatic(fn) {
        Loader._defaultAfterMiddleware.push(fn);
        return Loader;
    };
    var TextureLoader = function TextureLoader() { };
    TextureLoader.use = function use(resource, next) {
        if (resource.data && resource.type === Resource$1.TYPE.IMAGE) {
            resource.texture = Texture.fromLoader(resource.data, resource.url, resource.name);
        }
        next();
    };
    var Loader$1 = (function (ResourceLoader) {
        function Loader(baseUrl, concurrency) {
            var this$1 = this;
            ResourceLoader.call(this, baseUrl, concurrency);
            eventemitter3.call(this);
            for (var i = 0; i < Loader._plugins.length; ++i) {
                var plugin = Loader._plugins[i];
                var pre = plugin.pre;
                var use = plugin.use;
                if (pre) {
                    this.pre(pre);
                }
                if (use) {
                    this.use(use);
                }
            }
            this.onStart.add(function (l) { return this$1.emit('start', l); });
            this.onProgress.add(function (l, r) { return this$1.emit('progress', l, r); });
            this.onError.add(function (e, l, r) { return this$1.emit('error', e, l, r); });
            this.onLoad.add(function (l, r) { return this$1.emit('load', l, r); });
            this.onComplete.add(function (l, r) { return this$1.emit('complete', l, r); });
            this._protected = false;
        }
        if (ResourceLoader) {
            Loader.__proto__ = ResourceLoader;
        }
        Loader.prototype = Object.create(ResourceLoader && ResourceLoader.prototype);
        Loader.prototype.constructor = Loader;
        var staticAccessors = { shared: { configurable: true } };
        Loader.prototype.destroy = function destroy() {
            if (!this._protected) {
                this.removeAllListeners();
                this.reset();
            }
        };
        staticAccessors.shared.get = function () {
            var shared = Loader._shared;
            if (!shared) {
                shared = new Loader();
                shared._protected = true;
                Loader._shared = shared;
            }
            return shared;
        };
        Object.defineProperties(Loader, staticAccessors);
        return Loader;
    }(Loader));
    Object.assign(Loader$1.prototype, eventemitter3.prototype);
    Loader$1._plugins = [];
    Loader$1.registerPlugin = function registerPlugin(plugin) {
        Loader$1._plugins.push(plugin);
        if (plugin.add) {
            plugin.add();
        }
        return Loader$1;
    };
    Loader$1.registerPlugin({ use: index$1.parsing });
    Loader$1.registerPlugin(TextureLoader);
    var AppLoaderPlugin = function AppLoaderPlugin() { };
    AppLoaderPlugin.init = function init(options) {
        options = Object.assign({
            sharedLoader: false,
        }, options);
        this.loader = options.sharedLoader ? Loader$1.shared : new Loader$1();
    };
    AppLoaderPlugin.destroy = function destroy() {
        if (this.loader) {
            this.loader.destroy();
            this.loader = null;
        }
    };
    var LoaderResource = Resource$1;
    var ParticleContainer = (function (Container) {
        function ParticleContainer(maxSize, properties, batchSize, autoResize) {
            if (maxSize === void 0) {
                maxSize = 1500;
            }
            if (batchSize === void 0) {
                batchSize = 16384;
            }
            if (autoResize === void 0) {
                autoResize = false;
            }
            Container.call(this);
            var maxBatchSize = 16384;
            if (batchSize > maxBatchSize) {
                batchSize = maxBatchSize;
            }
            this._properties = [false, true, false, false, false];
            this._maxSize = maxSize;
            this._batchSize = batchSize;
            this._buffers = null;
            this._bufferUpdateIDs = [];
            this._updateID = 0;
            this.interactiveChildren = false;
            this.blendMode = exports.BLEND_MODES.NORMAL;
            this.autoResize = autoResize;
            this.roundPixels = true;
            this.baseTexture = null;
            this.setProperties(properties);
            this._tint = 0;
            this.tintRgb = new Float32Array(4);
            this.tint = 0xFFFFFF;
        }
        if (Container) {
            ParticleContainer.__proto__ = Container;
        }
        ParticleContainer.prototype = Object.create(Container && Container.prototype);
        ParticleContainer.prototype.constructor = ParticleContainer;
        var prototypeAccessors = { tint: { configurable: true } };
        ParticleContainer.prototype.setProperties = function setProperties(properties) {
            if (properties) {
                this._properties[0] = 'vertices' in properties || 'scale' in properties
                    ? !!properties.vertices || !!properties.scale : this._properties[0];
                this._properties[1] = 'position' in properties ? !!properties.position : this._properties[1];
                this._properties[2] = 'rotation' in properties ? !!properties.rotation : this._properties[2];
                this._properties[3] = 'uvs' in properties ? !!properties.uvs : this._properties[3];
                this._properties[4] = 'tint' in properties || 'alpha' in properties
                    ? !!properties.tint || !!properties.alpha : this._properties[4];
            }
        };
        ParticleContainer.prototype.updateTransform = function updateTransform() {
            this.displayObjectUpdateTransform();
        };
        prototypeAccessors.tint.get = function () {
            return this._tint;
        };
        prototypeAccessors.tint.set = function (value) {
            this._tint = value;
            hex2rgb(value, this.tintRgb);
        };
        ParticleContainer.prototype.render = function render(renderer) {
            var this$1 = this;
            if (!this.visible || this.worldAlpha <= 0 || !this.children.length || !this.renderable) {
                return;
            }
            if (!this.baseTexture) {
                this.baseTexture = this.children[0]._texture.baseTexture;
                if (!this.baseTexture.valid) {
                    this.baseTexture.once('update', function () { return this$1.onChildrenChange(0); });
                }
            }
            renderer.batch.setObjectRenderer(renderer.plugins.particle);
            renderer.plugins.particle.render(this);
        };
        ParticleContainer.prototype.onChildrenChange = function onChildrenChange(smallestChildIndex) {
            var bufferIndex = Math.floor(smallestChildIndex / this._batchSize);
            while (this._bufferUpdateIDs.length < bufferIndex) {
                this._bufferUpdateIDs.push(0);
            }
            this._bufferUpdateIDs[bufferIndex] = ++this._updateID;
        };
        ParticleContainer.prototype.dispose = function dispose() {
            if (this._buffers) {
                for (var i = 0; i < this._buffers.length; ++i) {
                    this._buffers[i].destroy();
                }
                this._buffers = null;
            }
        };
        ParticleContainer.prototype.destroy = function destroy(options) {
            Container.prototype.destroy.call(this, options);
            this.dispose();
            this._properties = null;
            this._buffers = null;
            this._bufferUpdateIDs = null;
        };
        Object.defineProperties(ParticleContainer.prototype, prototypeAccessors);
        return ParticleContainer;
    }(Container));
    var ParticleBuffer = function ParticleBuffer(properties, dynamicPropertyFlags, size) {
        this.geometry = new Geometry();
        this.indexBuffer = null;
        this.size = size;
        this.dynamicProperties = [];
        this.staticProperties = [];
        for (var i = 0; i < properties.length; ++i) {
            var property = properties[i];
            property = {
                attributeName: property.attributeName,
                size: property.size,
                uploadFunction: property.uploadFunction,
                type: property.type || exports.TYPES.FLOAT,
                offset: property.offset,
            };
            if (dynamicPropertyFlags[i]) {
                this.dynamicProperties.push(property);
            }
            else {
                this.staticProperties.push(property);
            }
        }
        this.staticStride = 0;
        this.staticBuffer = null;
        this.staticData = null;
        this.staticDataUint32 = null;
        this.dynamicStride = 0;
        this.dynamicBuffer = null;
        this.dynamicData = null;
        this.dynamicDataUint32 = null;
        this._updateID = 0;
        this.initBuffers();
    };
    ParticleBuffer.prototype.initBuffers = function initBuffers() {
        var geometry = this.geometry;
        var dynamicOffset = 0;
        this.indexBuffer = new Buffer(createIndicesForQuads(this.size), true, true);
        geometry.addIndex(this.indexBuffer);
        this.dynamicStride = 0;
        for (var i = 0; i < this.dynamicProperties.length; ++i) {
            var property = this.dynamicProperties[i];
            property.offset = dynamicOffset;
            dynamicOffset += property.size;
            this.dynamicStride += property.size;
        }
        var dynBuffer = new ArrayBuffer(this.size * this.dynamicStride * 4 * 4);
        this.dynamicData = new Float32Array(dynBuffer);
        this.dynamicDataUint32 = new Uint32Array(dynBuffer);
        this.dynamicBuffer = new Buffer(this.dynamicData, false, false);
        var staticOffset = 0;
        this.staticStride = 0;
        for (var i$1 = 0; i$1 < this.staticProperties.length; ++i$1) {
            var property$1 = this.staticProperties[i$1];
            property$1.offset = staticOffset;
            staticOffset += property$1.size;
            this.staticStride += property$1.size;
        }
        var statBuffer = new ArrayBuffer(this.size * this.staticStride * 4 * 4);
        this.staticData = new Float32Array(statBuffer);
        this.staticDataUint32 = new Uint32Array(statBuffer);
        this.staticBuffer = new Buffer(this.staticData, true, false);
        for (var i$2 = 0; i$2 < this.dynamicProperties.length; ++i$2) {
            var property$2 = this.dynamicProperties[i$2];
            geometry.addAttribute(property$2.attributeName, this.dynamicBuffer, 0, property$2.type === exports.TYPES.UNSIGNED_BYTE, property$2.type, this.dynamicStride * 4, property$2.offset * 4);
        }
        for (var i$3 = 0; i$3 < this.staticProperties.length; ++i$3) {
            var property$3 = this.staticProperties[i$3];
            geometry.addAttribute(property$3.attributeName, this.staticBuffer, 0, property$3.type === exports.TYPES.UNSIGNED_BYTE, property$3.type, this.staticStride * 4, property$3.offset * 4);
        }
    };
    ParticleBuffer.prototype.uploadDynamic = function uploadDynamic(children, startIndex, amount) {
        for (var i = 0; i < this.dynamicProperties.length; i++) {
            var property = this.dynamicProperties[i];
            property.uploadFunction(children, startIndex, amount, property.type === exports.TYPES.UNSIGNED_BYTE ? this.dynamicDataUint32 : this.dynamicData, this.dynamicStride, property.offset);
        }
        this.dynamicBuffer._updateID++;
    };
    ParticleBuffer.prototype.uploadStatic = function uploadStatic(children, startIndex, amount) {
        for (var i = 0; i < this.staticProperties.length; i++) {
            var property = this.staticProperties[i];
            property.uploadFunction(children, startIndex, amount, property.type === exports.TYPES.UNSIGNED_BYTE ? this.staticDataUint32 : this.staticData, this.staticStride, property.offset);
        }
        this.staticBuffer._updateID++;
    };
    ParticleBuffer.prototype.destroy = function destroy() {
        this.indexBuffer = null;
        this.dynamicProperties = null;
        this.dynamicBuffer = null;
        this.dynamicData = null;
        this.dynamicDataUint32 = null;
        this.staticProperties = null;
        this.staticBuffer = null;
        this.staticData = null;
        this.staticDataUint32 = null;
        this.geometry.destroy();
    };
    var vertex$1 = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\nattribute vec4 aColor;\n\nattribute vec2 aPositionCoord;\nattribute float aRotation;\n\nuniform mat3 translationMatrix;\nuniform vec4 uColor;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\n\nvoid main(void){\n    float x = (aVertexPosition.x) * cos(aRotation) - (aVertexPosition.y) * sin(aRotation);\n    float y = (aVertexPosition.x) * sin(aRotation) + (aVertexPosition.y) * cos(aRotation);\n\n    vec2 v = vec2(x, y);\n    v = v + aPositionCoord;\n\n    gl_Position = vec4((translationMatrix * vec3(v, 1.0)).xy, 0.0, 1.0);\n\n    vTextureCoord = aTextureCoord;\n    vColor = aColor * uColor;\n}\n";
    var fragment$1 = "varying vec2 vTextureCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler;\n\nvoid main(void){\n    vec4 color = texture2D(uSampler, vTextureCoord) * vColor;\n    gl_FragColor = color;\n}";
    var ParticleRenderer = (function (ObjectRenderer) {
        function ParticleRenderer(renderer) {
            ObjectRenderer.call(this, renderer);
            this.shader = null;
            this.properties = null;
            this.tempMatrix = new Matrix();
            this.properties = [
                {
                    attributeName: 'aVertexPosition',
                    size: 2,
                    uploadFunction: this.uploadVertices,
                    offset: 0,
                },
                {
                    attributeName: 'aPositionCoord',
                    size: 2,
                    uploadFunction: this.uploadPosition,
                    offset: 0,
                },
                {
                    attributeName: 'aRotation',
                    size: 1,
                    uploadFunction: this.uploadRotation,
                    offset: 0,
                },
                {
                    attributeName: 'aTextureCoord',
                    size: 2,
                    uploadFunction: this.uploadUvs,
                    offset: 0,
                },
                {
                    attributeName: 'aColor',
                    size: 1,
                    type: exports.TYPES.UNSIGNED_BYTE,
                    uploadFunction: this.uploadTint,
                    offset: 0,
                }
            ];
            this.shader = Shader.from(vertex$1, fragment$1, {});
            this.state = State.for2d();
        }
        if (ObjectRenderer) {
            ParticleRenderer.__proto__ = ObjectRenderer;
        }
        ParticleRenderer.prototype = Object.create(ObjectRenderer && ObjectRenderer.prototype);
        ParticleRenderer.prototype.constructor = ParticleRenderer;
        ParticleRenderer.prototype.render = function render(container) {
            var children = container.children;
            var maxSize = container._maxSize;
            var batchSize = container._batchSize;
            var renderer = this.renderer;
            var totalChildren = children.length;
            if (totalChildren === 0) {
                return;
            }
            else if (totalChildren > maxSize && !container.autoResize) {
                totalChildren = maxSize;
            }
            var buffers = container._buffers;
            if (!buffers) {
                buffers = container._buffers = this.generateBuffers(container);
            }
            var baseTexture = children[0]._texture.baseTexture;
            this.state.blendMode = correctBlendMode(container.blendMode, baseTexture.alphaMode);
            renderer.state.set(this.state);
            var gl = renderer.gl;
            var m = container.worldTransform.copyTo(this.tempMatrix);
            m.prepend(renderer.globalUniforms.uniforms.projectionMatrix);
            this.shader.uniforms.translationMatrix = m.toArray(true);
            this.shader.uniforms.uColor = premultiplyRgba(container.tintRgb, container.worldAlpha, this.shader.uniforms.uColor, baseTexture.alphaMode);
            this.shader.uniforms.uSampler = baseTexture;
            this.renderer.shader.bind(this.shader);
            var updateStatic = false;
            for (var i = 0, j = 0; i < totalChildren; i += batchSize, j += 1) {
                var amount = (totalChildren - i);
                if (amount > batchSize) {
                    amount = batchSize;
                }
                if (j >= buffers.length) {
                    buffers.push(this._generateOneMoreBuffer(container));
                }
                var buffer = buffers[j];
                buffer.uploadDynamic(children, i, amount);
                var bid = container._bufferUpdateIDs[j] || 0;
                updateStatic = updateStatic || (buffer._updateID < bid);
                if (updateStatic) {
                    buffer._updateID = container._updateID;
                    buffer.uploadStatic(children, i, amount);
                }
                renderer.geometry.bind(buffer.geometry);
                gl.drawElements(gl.TRIANGLES, amount * 6, gl.UNSIGNED_SHORT, 0);
            }
        };
        ParticleRenderer.prototype.generateBuffers = function generateBuffers(container) {
            var buffers = [];
            var size = container._maxSize;
            var batchSize = container._batchSize;
            var dynamicPropertyFlags = container._properties;
            for (var i = 0; i < size; i += batchSize) {
                buffers.push(new ParticleBuffer(this.properties, dynamicPropertyFlags, batchSize));
            }
            return buffers;
        };
        ParticleRenderer.prototype._generateOneMoreBuffer = function _generateOneMoreBuffer(container) {
            var batchSize = container._batchSize;
            var dynamicPropertyFlags = container._properties;
            return new ParticleBuffer(this.properties, dynamicPropertyFlags, batchSize);
        };
        ParticleRenderer.prototype.uploadVertices = function uploadVertices(children, startIndex, amount, array, stride, offset) {
            var w0 = 0;
            var w1 = 0;
            var h0 = 0;
            var h1 = 0;
            for (var i = 0; i < amount; ++i) {
                var sprite = children[startIndex + i];
                var texture = sprite._texture;
                var sx = sprite.scale.x;
                var sy = sprite.scale.y;
                var trim = texture.trim;
                var orig = texture.orig;
                if (trim) {
                    w1 = trim.x - (sprite.anchor.x * orig.width);
                    w0 = w1 + trim.width;
                    h1 = trim.y - (sprite.anchor.y * orig.height);
                    h0 = h1 + trim.height;
                }
                else {
                    w0 = (orig.width) * (1 - sprite.anchor.x);
                    w1 = (orig.width) * -sprite.anchor.x;
                    h0 = orig.height * (1 - sprite.anchor.y);
                    h1 = orig.height * -sprite.anchor.y;
                }
                array[offset] = w1 * sx;
                array[offset + 1] = h1 * sy;
                array[offset + stride] = w0 * sx;
                array[offset + stride + 1] = h1 * sy;
                array[offset + (stride * 2)] = w0 * sx;
                array[offset + (stride * 2) + 1] = h0 * sy;
                array[offset + (stride * 3)] = w1 * sx;
                array[offset + (stride * 3) + 1] = h0 * sy;
                offset += stride * 4;
            }
        };
        ParticleRenderer.prototype.uploadPosition = function uploadPosition(children, startIndex, amount, array, stride, offset) {
            for (var i = 0; i < amount; i++) {
                var spritePosition = children[startIndex + i].position;
                array[offset] = spritePosition.x;
                array[offset + 1] = spritePosition.y;
                array[offset + stride] = spritePosition.x;
                array[offset + stride + 1] = spritePosition.y;
                array[offset + (stride * 2)] = spritePosition.x;
                array[offset + (stride * 2) + 1] = spritePosition.y;
                array[offset + (stride * 3)] = spritePosition.x;
                array[offset + (stride * 3) + 1] = spritePosition.y;
                offset += stride * 4;
            }
        };
        ParticleRenderer.prototype.uploadRotation = function uploadRotation(children, startIndex, amount, array, stride, offset) {
            for (var i = 0; i < amount; i++) {
                var spriteRotation = children[startIndex + i].rotation;
                array[offset] = spriteRotation;
                array[offset + stride] = spriteRotation;
                array[offset + (stride * 2)] = spriteRotation;
                array[offset + (stride * 3)] = spriteRotation;
                offset += stride * 4;
            }
        };
        ParticleRenderer.prototype.uploadUvs = function uploadUvs(children, startIndex, amount, array, stride, offset) {
            for (var i = 0; i < amount; ++i) {
                var textureUvs = children[startIndex + i]._texture._uvs;
                if (textureUvs) {
                    array[offset] = textureUvs.x0;
                    array[offset + 1] = textureUvs.y0;
                    array[offset + stride] = textureUvs.x1;
                    array[offset + stride + 1] = textureUvs.y1;
                    array[offset + (stride * 2)] = textureUvs.x2;
                    array[offset + (stride * 2) + 1] = textureUvs.y2;
                    array[offset + (stride * 3)] = textureUvs.x3;
                    array[offset + (stride * 3) + 1] = textureUvs.y3;
                    offset += stride * 4;
                }
                else {
                    array[offset] = 0;
                    array[offset + 1] = 0;
                    array[offset + stride] = 0;
                    array[offset + stride + 1] = 0;
                    array[offset + (stride * 2)] = 0;
                    array[offset + (stride * 2) + 1] = 0;
                    array[offset + (stride * 3)] = 0;
                    array[offset + (stride * 3) + 1] = 0;
                    offset += stride * 4;
                }
            }
        };
        ParticleRenderer.prototype.uploadTint = function uploadTint(children, startIndex, amount, array, stride, offset) {
            for (var i = 0; i < amount; ++i) {
                var sprite = children[startIndex + i];
                var premultiplied = sprite._texture.baseTexture.alphaMode > 0;
                var alpha = sprite.alpha;
                var argb = alpha < 1.0 && premultiplied ? premultiplyTint(sprite._tintRGB, alpha)
                    : sprite._tintRGB + (alpha * 255 << 24);
                array[offset] = argb;
                array[offset + stride] = argb;
                array[offset + (stride * 2)] = argb;
                array[offset + (stride * 3)] = argb;
                offset += stride * 4;
            }
        };
        ParticleRenderer.prototype.destroy = function destroy() {
            ObjectRenderer.prototype.destroy.call(this);
            if (this.shader) {
                this.shader.destroy();
                this.shader = null;
            }
            this.tempMatrix = null;
        };
        return ParticleRenderer;
    }(ObjectRenderer));
    var GRAPHICS_CURVES = {
        adaptive: true,
        maxLength: 10,
        minSegments: 8,
        maxSegments: 2048,
        _segmentsCount: function _segmentsCount(length, defaultSegments) {
            if (defaultSegments === void 0) {
                defaultSegments = 20;
            }
            if (!this.adaptive || !length || Number.isNaN(length)) {
                return defaultSegments;
            }
            var result = Math.ceil(length / this.maxLength);
            if (result < this.minSegments) {
                result = this.minSegments;
            }
            else if (result > this.maxSegments) {
                result = this.maxSegments;
            }
            return result;
        },
    };
    var FillStyle = function FillStyle() {
        this.reset();
    };
    FillStyle.prototype.clone = function clone() {
        var obj = new FillStyle();
        obj.color = this.color;
        obj.alpha = this.alpha;
        obj.texture = this.texture;
        obj.matrix = this.matrix;
        obj.visible = this.visible;
        return obj;
    };
    FillStyle.prototype.reset = function reset() {
        this.color = 0xFFFFFF;
        this.alpha = 1;
        this.texture = Texture.WHITE;
        this.matrix = null;
        this.visible = false;
    };
    FillStyle.prototype.destroy = function destroy() {
        this.texture = null;
        this.matrix = null;
    };
    var buildPoly = {
        build: function build(graphicsData) {
            graphicsData.points = graphicsData.shape.points.slice();
        },
        triangulate: function triangulate(graphicsData, graphicsGeometry) {
            var points = graphicsData.points;
            var holes = graphicsData.holes;
            var verts = graphicsGeometry.points;
            var indices = graphicsGeometry.indices;
            if (points.length >= 6) {
                var holeArray = [];
                for (var i = 0; i < holes.length; i++) {
                    var hole = holes[i];
                    holeArray.push(points.length / 2);
                    points = points.concat(hole.points);
                }
                var triangles = earcut_1(points, holeArray, 2);
                if (!triangles) {
                    return;
                }
                var vertPos = verts.length / 2;
                for (var i$1 = 0; i$1 < triangles.length; i$1 += 3) {
                    indices.push(triangles[i$1] + vertPos);
                    indices.push(triangles[i$1 + 1] + vertPos);
                    indices.push(triangles[i$1 + 2] + vertPos);
                }
                for (var i$2 = 0; i$2 < points.length; i$2++) {
                    verts.push(points[i$2]);
                }
            }
        },
    };
    var buildCircle = {
        build: function build(graphicsData) {
            var circleData = graphicsData.shape;
            var points = graphicsData.points;
            var x = circleData.x;
            var y = circleData.y;
            var width;
            var height;
            points.length = 0;
            if (graphicsData.type === exports.SHAPES.CIRC) {
                width = circleData.radius;
                height = circleData.radius;
            }
            else {
                width = circleData.width;
                height = circleData.height;
            }
            if (width === 0 || height === 0) {
                return;
            }
            var totalSegs = Math.floor(30 * Math.sqrt(circleData.radius))
                || Math.floor(15 * Math.sqrt(circleData.width + circleData.height));
            totalSegs /= 2.3;
            var seg = (Math.PI * 2) / totalSegs;
            for (var i = 0; i < totalSegs - 0.5; i++) {
                points.push(x + (Math.sin(-seg * i) * width), y + (Math.cos(-seg * i) * height));
            }
            points.push(points[0], points[1]);
        },
        triangulate: function triangulate(graphicsData, graphicsGeometry) {
            var points = graphicsData.points;
            var verts = graphicsGeometry.points;
            var indices = graphicsGeometry.indices;
            var vertPos = verts.length / 2;
            var center = vertPos;
            verts.push(graphicsData.shape.x, graphicsData.shape.y);
            for (var i = 0; i < points.length; i += 2) {
                verts.push(points[i], points[i + 1]);
                indices.push(vertPos++, center, vertPos);
            }
        },
    };
    var buildRectangle = {
        build: function build(graphicsData) {
            var rectData = graphicsData.shape;
            var x = rectData.x;
            var y = rectData.y;
            var width = rectData.width;
            var height = rectData.height;
            var points = graphicsData.points;
            points.length = 0;
            points.push(x, y, x + width, y, x + width, y + height, x, y + height);
        },
        triangulate: function triangulate(graphicsData, graphicsGeometry) {
            var points = graphicsData.points;
            var verts = graphicsGeometry.points;
            var vertPos = verts.length / 2;
            verts.push(points[0], points[1], points[2], points[3], points[6], points[7], points[4], points[5]);
            graphicsGeometry.indices.push(vertPos, vertPos + 1, vertPos + 2, vertPos + 1, vertPos + 2, vertPos + 3);
        },
    };
    var buildRoundedRectangle = {
        build: function build(graphicsData) {
            var rrectData = graphicsData.shape;
            var points = graphicsData.points;
            var x = rrectData.x;
            var y = rrectData.y;
            var width = rrectData.width;
            var height = rrectData.height;
            var radius = rrectData.radius;
            points.length = 0;
            quadraticBezierCurve(x, y + radius, x, y, x + radius, y, points);
            quadraticBezierCurve(x + width - radius, y, x + width, y, x + width, y + radius, points);
            quadraticBezierCurve(x + width, y + height - radius, x + width, y + height, x + width - radius, y + height, points);
            quadraticBezierCurve(x + radius, y + height, x, y + height, x, y + height - radius, points);
        },
        triangulate: function triangulate(graphicsData, graphicsGeometry) {
            var points = graphicsData.points;
            var verts = graphicsGeometry.points;
            var indices = graphicsGeometry.indices;
            var vecPos = verts.length / 2;
            var triangles = earcut_1(points, null, 2);
            for (var i = 0, j = triangles.length; i < j; i += 3) {
                indices.push(triangles[i] + vecPos);
                indices.push(triangles[i + 1] + vecPos);
                indices.push(triangles[i + 2] + vecPos);
            }
            for (var i$1 = 0, j$1 = points.length; i$1 < j$1; i$1++) {
                verts.push(points[i$1], points[++i$1]);
            }
        },
    };
    function getPt(n1, n2, perc) {
        var diff = n2 - n1;
        return n1 + (diff * perc);
    }
    function quadraticBezierCurve(fromX, fromY, cpX, cpY, toX, toY, out) {
        if (out === void 0) {
            out = [];
        }
        var n = 20;
        var points = out;
        var xa = 0;
        var ya = 0;
        var xb = 0;
        var yb = 0;
        var x = 0;
        var y = 0;
        for (var i = 0, j = 0; i <= n; ++i) {
            j = i / n;
            xa = getPt(fromX, cpX, j);
            ya = getPt(fromY, cpY, j);
            xb = getPt(cpX, toX, j);
            yb = getPt(cpY, toY, j);
            x = getPt(xa, xb, j);
            y = getPt(ya, yb, j);
            points.push(x, y);
        }
        return points;
    }
    function buildLine(graphicsData, graphicsGeometry) {
        if (graphicsData.lineStyle.native) {
            buildNativeLine(graphicsData, graphicsGeometry);
        }
        else {
            buildNonNativeLine(graphicsData, graphicsGeometry);
        }
    }
    function buildNonNativeLine(graphicsData, graphicsGeometry) {
        var shape = graphicsData.shape;
        var points = graphicsData.points || shape.points.slice();
        var eps = graphicsGeometry.closePointEps;
        if (points.length === 0) {
            return;
        }
        var style = graphicsData.lineStyle;
        var firstPoint = new Point(points[0], points[1]);
        var lastPoint = new Point(points[points.length - 2], points[points.length - 1]);
        var closedShape = shape.type !== exports.SHAPES.POLY || shape.closeStroke;
        var closedPath = Math.abs(firstPoint.x - lastPoint.x) < eps
            && Math.abs(firstPoint.y - lastPoint.y) < eps;
        if (closedShape) {
            points = points.slice();
            if (closedPath) {
                points.pop();
                points.pop();
                lastPoint.set(points[points.length - 2], points[points.length - 1]);
            }
            var midPointX = lastPoint.x + ((firstPoint.x - lastPoint.x) * 0.5);
            var midPointY = lastPoint.y + ((firstPoint.y - lastPoint.y) * 0.5);
            points.unshift(midPointX, midPointY);
            points.push(midPointX, midPointY);
        }
        var verts = graphicsGeometry.points;
        var length = points.length / 2;
        var indexCount = points.length;
        var indexStart = verts.length / 2;
        var width = style.width / 2;
        var p1x = points[0];
        var p1y = points[1];
        var p2x = points[2];
        var p2y = points[3];
        var p3x = 0;
        var p3y = 0;
        var perpx = -(p1y - p2y);
        var perpy = p1x - p2x;
        var perp2x = 0;
        var perp2y = 0;
        var perp3x = 0;
        var perp3y = 0;
        var dist = Math.sqrt((perpx * perpx) + (perpy * perpy));
        perpx /= dist;
        perpy /= dist;
        perpx *= width;
        perpy *= width;
        var ratio = style.alignment;
        var r1 = (1 - ratio) * 2;
        var r2 = ratio * 2;
        verts.push(p1x - (perpx * r1), p1y - (perpy * r1));
        verts.push(p1x + (perpx * r2), p1y + (perpy * r2));
        for (var i = 1; i < length - 1; ++i) {
            p1x = points[(i - 1) * 2];
            p1y = points[((i - 1) * 2) + 1];
            p2x = points[i * 2];
            p2y = points[(i * 2) + 1];
            p3x = points[(i + 1) * 2];
            p3y = points[((i + 1) * 2) + 1];
            perpx = -(p1y - p2y);
            perpy = p1x - p2x;
            dist = Math.sqrt((perpx * perpx) + (perpy * perpy));
            perpx /= dist;
            perpy /= dist;
            perpx *= width;
            perpy *= width;
            perp2x = -(p2y - p3y);
            perp2y = p2x - p3x;
            dist = Math.sqrt((perp2x * perp2x) + (perp2y * perp2y));
            perp2x /= dist;
            perp2y /= dist;
            perp2x *= width;
            perp2y *= width;
            var a1 = (-perpy + p1y) - (-perpy + p2y);
            var b1 = (-perpx + p2x) - (-perpx + p1x);
            var c1 = ((-perpx + p1x) * (-perpy + p2y)) - ((-perpx + p2x) * (-perpy + p1y));
            var a2 = (-perp2y + p3y) - (-perp2y + p2y);
            var b2 = (-perp2x + p2x) - (-perp2x + p3x);
            var c2 = ((-perp2x + p3x) * (-perp2y + p2y)) - ((-perp2x + p2x) * (-perp2y + p3y));
            var denom = (a1 * b2) - (a2 * b1);
            if (Math.abs(denom) < 0.1) {
                denom += 10.1;
                verts.push(p2x - (perpx * r1), p2y - (perpy * r1));
                verts.push(p2x + (perpx * r2), p2y + (perpy * r2));
                continue;
            }
            var px = ((b1 * c2) - (b2 * c1)) / denom;
            var py = ((a2 * c1) - (a1 * c2)) / denom;
            var pdist = ((px - p2x) * (px - p2x)) + ((py - p2y) * (py - p2y));
            if (pdist > (196 * width * width)) {
                perp3x = perpx - perp2x;
                perp3y = perpy - perp2y;
                dist = Math.sqrt((perp3x * perp3x) + (perp3y * perp3y));
                perp3x /= dist;
                perp3y /= dist;
                perp3x *= width;
                perp3y *= width;
                verts.push(p2x - (perp3x * r1), p2y - (perp3y * r1));
                verts.push(p2x + (perp3x * r2), p2y + (perp3y * r2));
                verts.push(p2x - (perp3x * r2 * r1), p2y - (perp3y * r1));
                indexCount++;
            }
            else {
                verts.push(p2x + ((px - p2x) * r1), p2y + ((py - p2y) * r1));
                verts.push(p2x - ((px - p2x) * r2), p2y - ((py - p2y) * r2));
            }
        }
        p1x = points[(length - 2) * 2];
        p1y = points[((length - 2) * 2) + 1];
        p2x = points[(length - 1) * 2];
        p2y = points[((length - 1) * 2) + 1];
        perpx = -(p1y - p2y);
        perpy = p1x - p2x;
        dist = Math.sqrt((perpx * perpx) + (perpy * perpy));
        perpx /= dist;
        perpy /= dist;
        perpx *= width;
        perpy *= width;
        verts.push(p2x - (perpx * r1), p2y - (perpy * r1));
        verts.push(p2x + (perpx * r2), p2y + (perpy * r2));
        var indices = graphicsGeometry.indices;
        for (var i$1 = 0; i$1 < indexCount - 2; ++i$1) {
            indices.push(indexStart, indexStart + 1, indexStart + 2);
            indexStart++;
        }
    }
    function buildNativeLine(graphicsData, graphicsGeometry) {
        var i = 0;
        var shape = graphicsData.shape;
        var points = graphicsData.points || shape.points;
        var closedShape = shape.type !== exports.SHAPES.POLY || shape.closeStroke;
        if (points.length === 0) {
            return;
        }
        var verts = graphicsGeometry.points;
        var indices = graphicsGeometry.indices;
        var length = points.length / 2;
        var startIndex = verts.length / 2;
        var currentIndex = startIndex;
        verts.push(points[0], points[1]);
        for (i = 1; i < length; i++) {
            verts.push(points[i * 2], points[(i * 2) + 1]);
            indices.push(currentIndex, currentIndex + 1);
            currentIndex++;
        }
        if (closedShape) {
            indices.push(currentIndex, startIndex);
        }
    }
    function buildComplexPoly(graphicsData, webGLData) {
        var points = graphicsData.points.slice();
        if (points.length < 6) {
            return;
        }
        var indices = webGLData.indices;
        webGLData.points = points;
        webGLData.alpha = graphicsData.fillAlpha;
        webGLData.color = hex2rgb(graphicsData.fillColor);
        var minX = Infinity;
        var maxX = -Infinity;
        var minY = Infinity;
        var maxY = -Infinity;
        var x = 0;
        var y = 0;
        for (var i = 0; i < points.length; i += 2) {
            x = points[i];
            y = points[i + 1];
            minX = x < minX ? x : minX;
            maxX = x > maxX ? x : maxX;
            minY = y < minY ? y : minY;
            maxY = y > maxY ? y : maxY;
        }
        points.push(minX, minY, maxX, minY, maxX, maxY, minX, maxY);
        var length = points.length / 2;
        for (var i$1 = 0; i$1 < length; i$1++) {
            indices.push(i$1);
        }
    }
    function bezierCurveTo(fromX, fromY, cpX, cpY, cpX2, cpY2, toX, toY, n, path) {
        if (path === void 0) {
            path = [];
        }
        var dt = 0;
        var dt2 = 0;
        var dt3 = 0;
        var t2 = 0;
        var t3 = 0;
        path.push(fromX, fromY);
        for (var i = 1, j = 0; i <= n; ++i) {
            j = i / n;
            dt = (1 - j);
            dt2 = dt * dt;
            dt3 = dt2 * dt;
            t2 = j * j;
            t3 = t2 * j;
            path.push((dt3 * fromX) + (3 * dt2 * j * cpX) + (3 * dt * t2 * cpX2) + (t3 * toX), (dt3 * fromY) + (3 * dt2 * j * cpY) + (3 * dt * t2 * cpY2) + (t3 * toY));
        }
        return path;
    }
    var Star = (function (Polygon) {
        function Star(x, y, points, radius, innerRadius, rotation) {
            innerRadius = innerRadius || radius / 2;
            var startAngle = (-1 * Math.PI / 2) + rotation;
            var len = points * 2;
            var delta = PI_2 / len;
            var polygon = [];
            for (var i = 0; i < len; i++) {
                var r = i % 2 ? innerRadius : radius;
                var angle = (i * delta) + startAngle;
                polygon.push(x + (r * Math.cos(angle)), y + (r * Math.sin(angle)));
            }
            Polygon.call(this, polygon);
        }
        if (Polygon) {
            Star.__proto__ = Polygon;
        }
        Star.prototype = Object.create(Polygon && Polygon.prototype);
        Star.prototype.constructor = Star;
        return Star;
    }(Polygon));
    var ArcUtils = function ArcUtils() { };
    ArcUtils.curveTo = function curveTo(x1, y1, x2, y2, radius, points) {
        var fromX = points[points.length - 2];
        var fromY = points[points.length - 1];
        var a1 = fromY - y1;
        var b1 = fromX - x1;
        var a2 = y2 - y1;
        var b2 = x2 - x1;
        var mm = Math.abs((a1 * b2) - (b1 * a2));
        if (mm < 1.0e-8 || radius === 0) {
            if (points[points.length - 2] !== x1 || points[points.length - 1] !== y1) {
                points.push(x1, y1);
            }
            return null;
        }
        var dd = (a1 * a1) + (b1 * b1);
        var cc = (a2 * a2) + (b2 * b2);
        var tt = (a1 * a2) + (b1 * b2);
        var k1 = radius * Math.sqrt(dd) / mm;
        var k2 = radius * Math.sqrt(cc) / mm;
        var j1 = k1 * tt / dd;
        var j2 = k2 * tt / cc;
        var cx = (k1 * b2) + (k2 * b1);
        var cy = (k1 * a2) + (k2 * a1);
        var px = b1 * (k2 + j1);
        var py = a1 * (k2 + j1);
        var qx = b2 * (k1 + j2);
        var qy = a2 * (k1 + j2);
        var startAngle = Math.atan2(py - cy, px - cx);
        var endAngle = Math.atan2(qy - cy, qx - cx);
        return {
            cx: (cx + x1),
            cy: (cy + y1),
            radius: radius,
            startAngle: startAngle,
            endAngle: endAngle,
            anticlockwise: (b1 * a2 > b2 * a1),
        };
    };
    ArcUtils.arc = function arc(startX, startY, cx, cy, radius, startAngle, endAngle, anticlockwise, points) {
        var sweep = endAngle - startAngle;
        var n = GRAPHICS_CURVES._segmentsCount(Math.abs(sweep) * radius, Math.ceil(Math.abs(sweep) / PI_2) * 40);
        var theta = (sweep) / (n * 2);
        var theta2 = theta * 2;
        var cTheta = Math.cos(theta);
        var sTheta = Math.sin(theta);
        var segMinus = n - 1;
        var remainder = (segMinus % 1) / segMinus;
        for (var i = 0; i <= segMinus; ++i) {
            var real = i + (remainder * i);
            var angle = ((theta) + startAngle + (theta2 * real));
            var c = Math.cos(angle);
            var s = -Math.sin(angle);
            points.push((((cTheta * c) + (sTheta * s)) * radius) + cx, (((cTheta * -s) + (sTheta * c)) * radius) + cy);
        }
    };
    var BezierUtils = function BezierUtils() { };
    BezierUtils.curveLength = function curveLength(fromX, fromY, cpX, cpY, cpX2, cpY2, toX, toY) {
        var n = 10;
        var result = 0.0;
        var t = 0.0;
        var t2 = 0.0;
        var t3 = 0.0;
        var nt = 0.0;
        var nt2 = 0.0;
        var nt3 = 0.0;
        var x = 0.0;
        var y = 0.0;
        var dx = 0.0;
        var dy = 0.0;
        var prevX = fromX;
        var prevY = fromY;
        for (var i = 1; i <= n; ++i) {
            t = i / n;
            t2 = t * t;
            t3 = t2 * t;
            nt = (1.0 - t);
            nt2 = nt * nt;
            nt3 = nt2 * nt;
            x = (nt3 * fromX) + (3.0 * nt2 * t * cpX) + (3.0 * nt * t2 * cpX2) + (t3 * toX);
            y = (nt3 * fromY) + (3.0 * nt2 * t * cpY) + (3 * nt * t2 * cpY2) + (t3 * toY);
            dx = prevX - x;
            dy = prevY - y;
            prevX = x;
            prevY = y;
            result += Math.sqrt((dx * dx) + (dy * dy));
        }
        return result;
    };
    BezierUtils.curveTo = function curveTo(cpX, cpY, cpX2, cpY2, toX, toY, points) {
        var fromX = points[points.length - 2];
        var fromY = points[points.length - 1];
        points.length -= 2;
        var n = GRAPHICS_CURVES._segmentsCount(BezierUtils.curveLength(fromX, fromY, cpX, cpY, cpX2, cpY2, toX, toY));
        var dt = 0;
        var dt2 = 0;
        var dt3 = 0;
        var t2 = 0;
        var t3 = 0;
        points.push(fromX, fromY);
        for (var i = 1, j = 0; i <= n; ++i) {
            j = i / n;
            dt = (1 - j);
            dt2 = dt * dt;
            dt3 = dt2 * dt;
            t2 = j * j;
            t3 = t2 * j;
            points.push((dt3 * fromX) + (3 * dt2 * j * cpX) + (3 * dt * t2 * cpX2) + (t3 * toX), (dt3 * fromY) + (3 * dt2 * j * cpY) + (3 * dt * t2 * cpY2) + (t3 * toY));
        }
    };
    var QuadraticUtils = function QuadraticUtils() { };
    QuadraticUtils.curveLength = function curveLength(fromX, fromY, cpX, cpY, toX, toY) {
        var ax = fromX - (2.0 * cpX) + toX;
        var ay = fromY - (2.0 * cpY) + toY;
        var bx = (2.0 * cpX) - (2.0 * fromX);
        var by = (2.0 * cpY) - (2.0 * fromY);
        var a = 4.0 * ((ax * ax) + (ay * ay));
        var b = 4.0 * ((ax * bx) + (ay * by));
        var c = (bx * bx) + (by * by);
        var s = 2.0 * Math.sqrt(a + b + c);
        var a2 = Math.sqrt(a);
        var a32 = 2.0 * a * a2;
        var c2 = 2.0 * Math.sqrt(c);
        var ba = b / a2;
        return ((a32 * s)
            + (a2 * b * (s - c2))
            + (((4.0 * c * a) - (b * b))
                * Math.log(((2.0 * a2) + ba + s) / (ba + c2)))) / (4.0 * a32);
    };
    QuadraticUtils.curveTo = function curveTo(cpX, cpY, toX, toY, points) {
        var fromX = points[points.length - 2];
        var fromY = points[points.length - 1];
        var n = GRAPHICS_CURVES._segmentsCount(QuadraticUtils.curveLength(fromX, fromY, cpX, cpY, toX, toY));
        var xa = 0;
        var ya = 0;
        for (var i = 1; i <= n; ++i) {
            var j = i / n;
            xa = fromX + ((cpX - fromX) * j);
            ya = fromY + ((cpY - fromY) * j);
            points.push(xa + (((cpX + ((toX - cpX) * j)) - xa) * j), ya + (((cpY + ((toY - cpY) * j)) - ya) * j));
        }
    };
    var BatchPart = function BatchPart() {
        this.reset();
    };
    BatchPart.prototype.begin = function begin(style, startIndex, attribStart) {
        this.reset();
        this.style = style;
        this.start = startIndex;
        this.attribStart = attribStart;
    };
    BatchPart.prototype.end = function end(endIndex, endAttrib) {
        this.attribSize = endAttrib - this.attribStart;
        this.size = endIndex - this.start;
    };
    BatchPart.prototype.reset = function reset() {
        this.style = null;
        this.size = 0;
        this.start = 0;
        this.attribStart = 0;
        this.attribSize = 0;
    };
    var FILL_COMMANDS = {};
    FILL_COMMANDS[exports.SHAPES.POLY] = buildPoly;
    FILL_COMMANDS[exports.SHAPES.CIRC] = buildCircle;
    FILL_COMMANDS[exports.SHAPES.ELIP] = buildCircle;
    FILL_COMMANDS[exports.SHAPES.RECT] = buildRectangle;
    FILL_COMMANDS[exports.SHAPES.RREC] = buildRoundedRectangle;
    var BATCH_POOL = [];
    var DRAW_CALL_POOL = [];
    var index$2 = ({
        buildPoly: buildPoly,
        buildCircle: buildCircle,
        buildRectangle: buildRectangle,
        buildRoundedRectangle: buildRoundedRectangle,
        FILL_COMMANDS: FILL_COMMANDS,
        BATCH_POOL: BATCH_POOL,
        DRAW_CALL_POOL: DRAW_CALL_POOL,
        buildLine: buildLine,
        buildComplexPoly: buildComplexPoly,
        bezierCurveTo: bezierCurveTo,
        Star: Star,
        ArcUtils: ArcUtils,
        BezierUtils: BezierUtils,
        QuadraticUtils: QuadraticUtils,
        BatchPart: BatchPart
    });
    var GraphicsData = function GraphicsData(shape, fillStyle, lineStyle, matrix) {
        if (fillStyle === void 0) {
            fillStyle = null;
        }
        if (lineStyle === void 0) {
            lineStyle = null;
        }
        if (matrix === void 0) {
            matrix = null;
        }
        this.shape = shape;
        this.lineStyle = lineStyle;
        this.fillStyle = fillStyle;
        this.matrix = matrix;
        this.type = shape.type;
        this.points = [];
        this.holes = [];
    };
    GraphicsData.prototype.clone = function clone() {
        return new GraphicsData(this.shape, this.fillStyle, this.lineStyle, this.matrix);
    };
    GraphicsData.prototype.destroy = function destroy() {
        this.shape = null;
        this.holes.length = 0;
        this.holes = null;
        this.points.length = 0;
        this.points = null;
        this.lineStyle = null;
        this.fillStyle = null;
    };
    var tmpPoint = new Point();
    var tmpBounds = new Bounds();
    var GraphicsGeometry = (function (BatchGeometry) {
        function GraphicsGeometry() {
            BatchGeometry.call(this);
            this.points = [];
            this.colors = [];
            this.uvs = [];
            this.indices = [];
            this.textureIds = [];
            this.graphicsData = [];
            this.dirty = 0;
            this.batchDirty = -1;
            this.cacheDirty = -1;
            this.clearDirty = 0;
            this.drawCalls = [];
            this.batches = [];
            this.shapeIndex = 0;
            this._bounds = new Bounds();
            this.boundsDirty = -1;
            this.boundsPadding = 0;
            this.batchable = false;
            this.indicesUint16 = null;
            this.uvsFloat32 = null;
            this.closePointEps = 1e-4;
        }
        if (BatchGeometry) {
            GraphicsGeometry.__proto__ = BatchGeometry;
        }
        GraphicsGeometry.prototype = Object.create(BatchGeometry && BatchGeometry.prototype);
        GraphicsGeometry.prototype.constructor = GraphicsGeometry;
        var prototypeAccessors = { bounds: { configurable: true } };
        prototypeAccessors.bounds.get = function () {
            if (this.boundsDirty !== this.dirty) {
                this.boundsDirty = this.dirty;
                this.calculateBounds();
            }
            return this._bounds;
        };
        GraphicsGeometry.prototype.invalidate = function invalidate() {
            this.boundsDirty = -1;
            this.dirty++;
            this.batchDirty++;
            this.shapeIndex = 0;
            this.points.length = 0;
            this.colors.length = 0;
            this.uvs.length = 0;
            this.indices.length = 0;
            this.textureIds.length = 0;
            for (var i = 0; i < this.drawCalls.length; i++) {
                this.drawCalls[i].textures.length = 0;
                DRAW_CALL_POOL.push(this.drawCalls[i]);
            }
            this.drawCalls.length = 0;
            for (var i$1 = 0; i$1 < this.batches.length; i$1++) {
                var batchPart = this.batches[i$1];
                batchPart.reset();
                BATCH_POOL.push(batchPart);
            }
            this.batches.length = 0;
        };
        GraphicsGeometry.prototype.clear = function clear() {
            if (this.graphicsData.length > 0) {
                this.invalidate();
                this.clearDirty++;
                this.graphicsData.length = 0;
            }
            return this;
        };
        GraphicsGeometry.prototype.drawShape = function drawShape(shape, fillStyle, lineStyle, matrix) {
            var data = new GraphicsData(shape, fillStyle, lineStyle, matrix);
            this.graphicsData.push(data);
            this.dirty++;
            return this;
        };
        GraphicsGeometry.prototype.drawHole = function drawHole(shape, matrix) {
            if (!this.graphicsData.length) {
                return null;
            }
            var data = new GraphicsData(shape, null, null, matrix);
            var lastShape = this.graphicsData[this.graphicsData.length - 1];
            data.lineStyle = lastShape.lineStyle;
            lastShape.holes.push(data);
            this.dirty++;
            return this;
        };
        GraphicsGeometry.prototype.destroy = function destroy(options) {
            BatchGeometry.prototype.destroy.call(this, options);
            for (var i = 0; i < this.graphicsData.length; ++i) {
                this.graphicsData[i].destroy();
            }
            this.points.length = 0;
            this.points = null;
            this.colors.length = 0;
            this.colors = null;
            this.uvs.length = 0;
            this.uvs = null;
            this.indices.length = 0;
            this.indices = null;
            this.indexBuffer.destroy();
            this.indexBuffer = null;
            this.graphicsData.length = 0;
            this.graphicsData = null;
            this.drawCalls.length = 0;
            this.drawCalls = null;
            this.batches.length = 0;
            this.batches = null;
            this._bounds = null;
        };
        GraphicsGeometry.prototype.containsPoint = function containsPoint(point) {
            var graphicsData = this.graphicsData;
            for (var i = 0; i < graphicsData.length; ++i) {
                var data = graphicsData[i];
                if (!data.fillStyle.visible) {
                    continue;
                }
                if (data.shape) {
                    if (data.matrix) {
                        data.matrix.applyInverse(point, tmpPoint);
                    }
                    else {
                        tmpPoint.copyFrom(point);
                    }
                    if (data.shape.contains(tmpPoint.x, tmpPoint.y)) {
                        var hitHole = false;
                        if (data.holes) {
                            for (var i$1 = 0; i$1 < data.holes.length; i$1++) {
                                var hole = data.holes[i$1];
                                if (hole.shape.contains(tmpPoint.x, tmpPoint.y)) {
                                    hitHole = true;
                                    break;
                                }
                            }
                        }
                        if (!hitHole) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };
        GraphicsGeometry.prototype.updateBatches = function updateBatches() {
            if (!this.graphicsData.length) {
                this.batchable = true;
                return;
            }
            if (!this.validateBatching()) {
                return;
            }
            this.cacheDirty = this.dirty;
            var uvs = this.uvs;
            var graphicsData = this.graphicsData;
            var batchPart = null;
            var currentStyle = null;
            if (this.batches.length > 0) {
                batchPart = this.batches[this.batches.length - 1];
                currentStyle = batchPart.style;
            }
            for (var i = this.shapeIndex; i < graphicsData.length; i++) {
                this.shapeIndex++;
                var data = graphicsData[i];
                var fillStyle = data.fillStyle;
                var lineStyle = data.lineStyle;
                var command = FILL_COMMANDS[data.type];
                command.build(data);
                if (data.matrix) {
                    this.transformPoints(data.points, data.matrix);
                }
                for (var j = 0; j < 2; j++) {
                    var style = (j === 0) ? fillStyle : lineStyle;
                    if (!style.visible) {
                        continue;
                    }
                    var nextTexture = style.texture.baseTexture;
                    var index = this.indices.length;
                    var attribIndex = this.points.length / 2;
                    nextTexture.wrapMode = exports.WRAP_MODES.REPEAT;
                    if (j === 0) {
                        this.processFill(data);
                    }
                    else {
                        this.processLine(data);
                    }
                    var size = (this.points.length / 2) - attribIndex;
                    if (size === 0) {
                        continue;
                    }
                    if (batchPart && !this._compareStyles(currentStyle, style)) {
                        batchPart.end(index, attribIndex);
                        batchPart = null;
                    }
                    if (!batchPart) {
                        batchPart = BATCH_POOL.pop() || new BatchPart();
                        batchPart.begin(style, index, attribIndex);
                        this.batches.push(batchPart);
                        currentStyle = style;
                    }
                    this.addUvs(this.points, uvs, style.texture, attribIndex, size, style.matrix);
                }
            }
            if (batchPart) {
                var index$1 = this.indices.length;
                var attrib = this.points.length / 2;
                batchPart.end(index$1, attrib);
            }
            if (this.batches.length === 0) {
                this.batchable = true;
                return;
            }
            this.indicesUint16 = new Uint16Array(this.indices);
            this.batchable = this.isBatchable();
            if (this.batchable) {
                this.packBatches();
            }
            else {
                this.buildDrawCalls();
            }
        };
        GraphicsGeometry.prototype._compareStyles = function _compareStyles(styleA, styleB) {
            if (!styleA || !styleB) {
                return false;
            }
            if (styleA.texture.baseTexture !== styleB.texture.baseTexture) {
                return false;
            }
            if (styleA.color + styleA.alpha !== styleB.color + styleB.alpha) {
                return false;
            }
            if (!!styleA.native !== !!styleB.native) {
                return false;
            }
            return true;
        };
        GraphicsGeometry.prototype.validateBatching = function validateBatching() {
            if (this.dirty === this.cacheDirty || !this.graphicsData.length) {
                return false;
            }
            for (var i = 0, l = this.graphicsData.length; i < l; i++) {
                var data = this.graphicsData[i];
                var fill = data.fillStyle;
                var line = data.lineStyle;
                if (fill && !fill.texture.baseTexture.valid) {
                    return false;
                }
                if (line && !line.texture.baseTexture.valid) {
                    return false;
                }
            }
            return true;
        };
        GraphicsGeometry.prototype.packBatches = function packBatches() {
            this.batchDirty++;
            this.uvsFloat32 = new Float32Array(this.uvs);
            var batches = this.batches;
            for (var i = 0, l = batches.length; i < l; i++) {
                var batch = batches[i];
                for (var j = 0; j < batch.size; j++) {
                    var index = batch.start + j;
                    this.indicesUint16[index] = this.indicesUint16[index] - batch.attribStart;
                }
            }
        };
        GraphicsGeometry.prototype.isBatchable = function isBatchable() {
            var batches = this.batches;
            for (var i = 0; i < batches.length; i++) {
                if (batches[i].style.native) {
                    return false;
                }
            }
            return (this.points.length < GraphicsGeometry.BATCHABLE_SIZE * 2);
        };
        GraphicsGeometry.prototype.buildDrawCalls = function buildDrawCalls() {
            var TICK = ++BaseTexture._globalBatch;
            for (var i = 0; i < this.drawCalls.length; i++) {
                this.drawCalls[i].textures.length = 0;
                DRAW_CALL_POOL.push(this.drawCalls[i]);
            }
            this.drawCalls.length = 0;
            var colors = this.colors;
            var textureIds = this.textureIds;
            var currentGroup = DRAW_CALL_POOL.pop();
            if (!currentGroup) {
                currentGroup = new BatchDrawCall();
                currentGroup.textures = new BatchTextureArray();
            }
            currentGroup.textures.count = 0;
            currentGroup.start = 0;
            currentGroup.size = 0;
            currentGroup.type = exports.DRAW_MODES.TRIANGLES;
            var textureCount = 0;
            var currentTexture = null;
            var textureId = 0;
            var native = false;
            var drawMode = exports.DRAW_MODES.TRIANGLES;
            var index = 0;
            this.drawCalls.push(currentGroup);
            for (var i$1 = 0; i$1 < this.batches.length; i$1++) {
                var data = this.batches[i$1];
                var MAX_TEXTURES = 8;
                var style = data.style;
                var nextTexture = style.texture.baseTexture;
                if (native !== !!style.native) {
                    native = !!style.native;
                    drawMode = native ? exports.DRAW_MODES.LINES : exports.DRAW_MODES.TRIANGLES;
                    currentTexture = null;
                    textureCount = MAX_TEXTURES;
                    TICK++;
                }
                if (currentTexture !== nextTexture) {
                    currentTexture = nextTexture;
                    if (nextTexture._batchEnabled !== TICK) {
                        if (textureCount === MAX_TEXTURES) {
                            TICK++;
                            textureCount = 0;
                            if (currentGroup.size > 0) {
                                currentGroup = DRAW_CALL_POOL.pop();
                                if (!currentGroup) {
                                    currentGroup = new BatchDrawCall();
                                    currentGroup.textures = new BatchTextureArray();
                                }
                                this.drawCalls.push(currentGroup);
                            }
                            currentGroup.start = index;
                            currentGroup.size = 0;
                            currentGroup.textures.count = 0;
                            currentGroup.type = drawMode;
                        }
                        nextTexture.touched = 1;
                        nextTexture._batchEnabled = TICK;
                        nextTexture._batchLocation = textureCount;
                        nextTexture.wrapMode = 10497;
                        currentGroup.textures.elements[currentGroup.textures.count++] = nextTexture;
                        textureCount++;
                    }
                }
                currentGroup.size += data.size;
                index += data.size;
                textureId = nextTexture._batchLocation;
                this.addColors(colors, style.color, style.alpha, data.attribSize);
                this.addTextureIds(textureIds, textureId, data.attribSize);
            }
            BaseTexture._globalBatch = TICK;
            this.packAttributes();
        };
        GraphicsGeometry.prototype.packAttributes = function packAttributes() {
            var verts = this.points;
            var uvs = this.uvs;
            var colors = this.colors;
            var textureIds = this.textureIds;
            var glPoints = new ArrayBuffer(verts.length * 3 * 4);
            var f32 = new Float32Array(glPoints);
            var u32 = new Uint32Array(glPoints);
            var p = 0;
            for (var i = 0; i < verts.length / 2; i++) {
                f32[p++] = verts[i * 2];
                f32[p++] = verts[(i * 2) + 1];
                f32[p++] = uvs[i * 2];
                f32[p++] = uvs[(i * 2) + 1];
                u32[p++] = colors[i];
                f32[p++] = textureIds[i];
            }
            this._buffer.update(glPoints);
            this._indexBuffer.update(this.indicesUint16);
        };
        GraphicsGeometry.prototype.processFill = function processFill(data) {
            if (data.holes.length) {
                this.processHoles(data.holes);
                buildPoly.triangulate(data, this);
            }
            else {
                var command = FILL_COMMANDS[data.type];
                command.triangulate(data, this);
            }
        };
        GraphicsGeometry.prototype.processLine = function processLine(data) {
            buildLine(data, this);
            for (var i = 0; i < data.holes.length; i++) {
                buildLine(data.holes[i], this);
            }
        };
        GraphicsGeometry.prototype.processHoles = function processHoles(holes) {
            for (var i = 0; i < holes.length; i++) {
                var hole = holes[i];
                var command = FILL_COMMANDS[hole.type];
                command.build(hole);
                if (hole.matrix) {
                    this.transformPoints(hole.points, hole.matrix);
                }
            }
        };
        GraphicsGeometry.prototype.calculateBounds = function calculateBounds() {
            var bounds = this._bounds;
            var sequenceBounds = tmpBounds;
            var curMatrix = Matrix.IDENTITY;
            this._bounds.clear();
            sequenceBounds.clear();
            for (var i = 0; i < this.graphicsData.length; i++) {
                var data = this.graphicsData[i];
                var shape = data.shape;
                var type = data.type;
                var lineStyle = data.lineStyle;
                var nextMatrix = data.matrix || Matrix.IDENTITY;
                var lineWidth = 0.0;
                if (lineStyle && lineStyle.visible) {
                    var alignment = lineStyle.alignment;
                    lineWidth = lineStyle.width;
                    if (type === exports.SHAPES.POLY) {
                        lineWidth = lineWidth * (0.5 + Math.abs(0.5 - alignment));
                    }
                    else {
                        lineWidth = lineWidth * Math.max(0, alignment);
                    }
                }
                if (curMatrix !== nextMatrix) {
                    if (!sequenceBounds.isEmpty()) {
                        bounds.addBoundsMatrix(sequenceBounds, curMatrix);
                        sequenceBounds.clear();
                    }
                    curMatrix = nextMatrix;
                }
                if (type === exports.SHAPES.RECT || type === exports.SHAPES.RREC) {
                    sequenceBounds.addFramePad(shape.x, shape.y, shape.x + shape.width, shape.y + shape.height, lineWidth, lineWidth);
                }
                else if (type === exports.SHAPES.CIRC) {
                    sequenceBounds.addFramePad(shape.x, shape.y, shape.x, shape.y, shape.radius + lineWidth, shape.radius + lineWidth);
                }
                else if (type === exports.SHAPES.ELIP) {
                    sequenceBounds.addFramePad(shape.x, shape.y, shape.x, shape.y, shape.width + lineWidth, shape.height + lineWidth);
                }
                else {
                    bounds.addVerticesMatrix(curMatrix, shape.points, 0, shape.points.length, lineWidth, lineWidth);
                }
            }
            if (!sequenceBounds.isEmpty()) {
                bounds.addBoundsMatrix(sequenceBounds, curMatrix);
            }
            bounds.pad(this.boundsPadding, this.boundsPadding);
        };
        GraphicsGeometry.prototype.transformPoints = function transformPoints(points, matrix) {
            for (var i = 0; i < points.length / 2; i++) {
                var x = points[(i * 2)];
                var y = points[(i * 2) + 1];
                points[(i * 2)] = (matrix.a * x) + (matrix.c * y) + matrix.tx;
                points[(i * 2) + 1] = (matrix.b * x) + (matrix.d * y) + matrix.ty;
            }
        };
        GraphicsGeometry.prototype.addColors = function addColors(colors, color, alpha, size) {
            var rgb = (color >> 16) + (color & 0xff00) + ((color & 0xff) << 16);
            var rgba = premultiplyTint(rgb, alpha);
            while (size-- > 0) {
                colors.push(rgba);
            }
        };
        GraphicsGeometry.prototype.addTextureIds = function addTextureIds(textureIds, id, size) {
            while (size-- > 0) {
                textureIds.push(id);
            }
        };
        GraphicsGeometry.prototype.addUvs = function addUvs(verts, uvs, texture, start, size, matrix) {
            var index = 0;
            var uvsStart = uvs.length;
            var frame = texture.frame;
            while (index < size) {
                var x = verts[(start + index) * 2];
                var y = verts[((start + index) * 2) + 1];
                if (matrix) {
                    var nx = (matrix.a * x) + (matrix.c * y) + matrix.tx;
                    y = (matrix.b * x) + (matrix.d * y) + matrix.ty;
                    x = nx;
                }
                index++;
                uvs.push(x / frame.width, y / frame.height);
            }
            var baseTexture = texture.baseTexture;
            if (frame.width < baseTexture.width
                || frame.height < baseTexture.height) {
                this.adjustUvs(uvs, texture, uvsStart, size);
            }
        };
        GraphicsGeometry.prototype.adjustUvs = function adjustUvs(uvs, texture, start, size) {
            var baseTexture = texture.baseTexture;
            var eps = 1e-6;
            var finish = start + (size * 2);
            var frame = texture.frame;
            var scaleX = frame.width / baseTexture.width;
            var scaleY = frame.height / baseTexture.height;
            var offsetX = frame.x / frame.width;
            var offsetY = frame.y / frame.height;
            var minX = Math.floor(uvs[start] + eps);
            var minY = Math.floor(uvs[start + 1] + eps);
            for (var i = start + 2; i < finish; i += 2) {
                minX = Math.min(minX, Math.floor(uvs[i] + eps));
                minY = Math.min(minY, Math.floor(uvs[i + 1] + eps));
            }
            offsetX -= minX;
            offsetY -= minY;
            for (var i$1 = start; i$1 < finish; i$1 += 2) {
                uvs[i$1] = (uvs[i$1] + offsetX) * scaleX;
                uvs[i$1 + 1] = (uvs[i$1 + 1] + offsetY) * scaleY;
            }
        };
        Object.defineProperties(GraphicsGeometry.prototype, prototypeAccessors);
        return GraphicsGeometry;
    }(BatchGeometry));
    GraphicsGeometry.BATCHABLE_SIZE = 100;
    var LineStyle = (function (FillStyle) {
        function LineStyle() {
            FillStyle.apply(this, arguments);
        }
        if (FillStyle) {
            LineStyle.__proto__ = FillStyle;
        }
        LineStyle.prototype = Object.create(FillStyle && FillStyle.prototype);
        LineStyle.prototype.constructor = LineStyle;
        LineStyle.prototype.clone = function clone() {
            var obj = new LineStyle();
            obj.color = this.color;
            obj.alpha = this.alpha;
            obj.texture = this.texture;
            obj.matrix = this.matrix;
            obj.visible = this.visible;
            obj.width = this.width;
            obj.alignment = this.alignment;
            obj.native = this.native;
            return obj;
        };
        LineStyle.prototype.reset = function reset() {
            FillStyle.prototype.reset.call(this);
            this.color = 0x0;
            this.width = 0;
            this.alignment = 0.5;
            this.native = false;
        };
        return LineStyle;
    }(FillStyle));
    var temp = new Float32Array(3);
    var DEFAULT_SHADERS = {};
    var Graphics = (function (Container) {
        function Graphics(geometry) {
            if (geometry === void 0) {
                geometry = null;
            }
            Container.call(this);
            this.geometry = geometry || new GraphicsGeometry();
            this.geometry.refCount++;
            this.shader = null;
            this.state = State.for2d();
            this._fillStyle = new FillStyle();
            this._lineStyle = new LineStyle();
            this._matrix = null;
            this._holeMode = false;
            this.currentPath = null;
            this.batches = [];
            this.batchTint = -1;
            this.vertexData = null;
            this._transformID = -1;
            this.batchDirty = -1;
            this.pluginName = 'batch';
            this.tint = 0xFFFFFF;
            this.blendMode = exports.BLEND_MODES.NORMAL;
        }
        if (Container) {
            Graphics.__proto__ = Container;
        }
        Graphics.prototype = Object.create(Container && Container.prototype);
        Graphics.prototype.constructor = Graphics;
        var prototypeAccessors = { blendMode: { configurable: true }, tint: { configurable: true }, fill: { configurable: true }, line: { configurable: true } };
        Graphics.prototype.clone = function clone() {
            this.finishPoly();
            return new Graphics(this.geometry);
        };
        prototypeAccessors.blendMode.set = function (value) {
            this.state.blendMode = value;
        };
        prototypeAccessors.blendMode.get = function () {
            return this.state.blendMode;
        };
        prototypeAccessors.tint.get = function () {
            return this._tint;
        };
        prototypeAccessors.tint.set = function (value) {
            this._tint = value;
        };
        prototypeAccessors.fill.get = function () {
            return this._fillStyle;
        };
        prototypeAccessors.line.get = function () {
            return this._lineStyle;
        };
        Graphics.prototype.lineStyle = function lineStyle(options) {
            if (typeof options === 'number') {
                var args = arguments;
                options = {
                    width: args[0] || 0,
                    color: args[1] || 0x0,
                    alpha: args[2] !== undefined ? args[2] : 1,
                    alignment: args[3] !== undefined ? args[3] : 0.5,
                    native: !!args[4],
                };
            }
            return this.lineTextureStyle(options);
        };
        Graphics.prototype.lineTextureStyle = function lineTextureStyle(options) {
            if (typeof options === 'number') {
                deprecation('v5.2.0', 'Please use object-based options for Graphics#lineTextureStyle');
                var width = arguments[0];
                var texture = arguments[1];
                var color = arguments[2];
                var alpha = arguments[3];
                var matrix = arguments[4];
                var alignment = arguments[5];
                var native = arguments[6];
                options = { width: width, texture: texture, color: color, alpha: alpha, matrix: matrix, alignment: alignment, native: native };
                Object.keys(options).forEach(function (key) { return options[key] === undefined && delete options[key]; });
            }
            options = Object.assign({
                width: 0,
                texture: Texture.WHITE,
                color: (options && options.texture) ? 0xFFFFFF : 0x0,
                alpha: 1,
                matrix: null,
                alignment: 0.5,
                native: false,
            }, options);
            if (this.currentPath) {
                this.startPoly();
            }
            var visible = options.width > 0 && options.alpha > 0;
            if (!visible) {
                this._lineStyle.reset();
            }
            else {
                if (options.matrix) {
                    options.matrix = options.matrix.clone();
                    options.matrix.invert();
                }
                Object.assign(this._lineStyle, { visible: visible }, options);
            }
            return this;
        };
        Graphics.prototype.startPoly = function startPoly() {
            if (this.currentPath) {
                var points = this.currentPath.points;
                var len = this.currentPath.points.length;
                if (len > 2) {
                    this.drawShape(this.currentPath);
                    this.currentPath = new Polygon();
                    this.currentPath.closeStroke = false;
                    this.currentPath.points.push(points[len - 2], points[len - 1]);
                }
            }
            else {
                this.currentPath = new Polygon();
                this.currentPath.closeStroke = false;
            }
        };
        Graphics.prototype.finishPoly = function finishPoly() {
            if (this.currentPath) {
                if (this.currentPath.points.length > 2) {
                    this.drawShape(this.currentPath);
                    this.currentPath = null;
                }
                else {
                    this.currentPath.points.length = 0;
                }
            }
        };
        Graphics.prototype.moveTo = function moveTo(x, y) {
            this.startPoly();
            this.currentPath.points[0] = x;
            this.currentPath.points[1] = y;
            return this;
        };
        Graphics.prototype.lineTo = function lineTo(x, y) {
            if (!this.currentPath) {
                this.moveTo(0, 0);
            }
            var points = this.currentPath.points;
            var fromX = points[points.length - 2];
            var fromY = points[points.length - 1];
            if (fromX !== x || fromY !== y) {
                points.push(x, y);
            }
            return this;
        };
        Graphics.prototype._initCurve = function _initCurve(x, y) {
            if (x === void 0) {
                x = 0;
            }
            if (y === void 0) {
                y = 0;
            }
            if (this.currentPath) {
                if (this.currentPath.points.length === 0) {
                    this.currentPath.points = [x, y];
                }
            }
            else {
                this.moveTo(x, y);
            }
        };
        Graphics.prototype.quadraticCurveTo = function quadraticCurveTo(cpX, cpY, toX, toY) {
            this._initCurve();
            var points = this.currentPath.points;
            if (points.length === 0) {
                this.moveTo(0, 0);
            }
            QuadraticUtils.curveTo(cpX, cpY, toX, toY, points);
            return this;
        };
        Graphics.prototype.bezierCurveTo = function bezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY) {
            this._initCurve();
            BezierUtils.curveTo(cpX, cpY, cpX2, cpY2, toX, toY, this.currentPath.points);
            return this;
        };
        Graphics.prototype.arcTo = function arcTo(x1, y1, x2, y2, radius) {
            this._initCurve(x1, y1);
            var points = this.currentPath.points;
            var result = ArcUtils.curveTo(x1, y1, x2, y2, radius, points);
            if (result) {
                var cx = result.cx;
                var cy = result.cy;
                var radius$1 = result.radius;
                var startAngle = result.startAngle;
                var endAngle = result.endAngle;
                var anticlockwise = result.anticlockwise;
                this.arc(cx, cy, radius$1, startAngle, endAngle, anticlockwise);
            }
            return this;
        };
        Graphics.prototype.arc = function arc(cx, cy, radius, startAngle, endAngle, anticlockwise) {
            if (anticlockwise === void 0) {
                anticlockwise = false;
            }
            if (startAngle === endAngle) {
                return this;
            }
            if (!anticlockwise && endAngle <= startAngle) {
                endAngle += PI_2;
            }
            else if (anticlockwise && startAngle <= endAngle) {
                startAngle += PI_2;
            }
            var sweep = endAngle - startAngle;
            if (sweep === 0) {
                return this;
            }
            var startX = cx + (Math.cos(startAngle) * radius);
            var startY = cy + (Math.sin(startAngle) * radius);
            var eps = this.geometry.closePointEps;
            var points = this.currentPath ? this.currentPath.points : null;
            if (points) {
                var xDiff = Math.abs(points[points.length - 2] - startX);
                var yDiff = Math.abs(points[points.length - 1] - startY);
                if (xDiff < eps && yDiff < eps) {
                    ;
                }
                else {
                    points.push(startX, startY);
                }
            }
            else {
                this.moveTo(startX, startY);
                points = this.currentPath.points;
            }
            ArcUtils.arc(startX, startY, cx, cy, radius, startAngle, endAngle, anticlockwise, points);
            return this;
        };
        Graphics.prototype.beginFill = function beginFill(color, alpha) {
            if (color === void 0) {
                color = 0;
            }
            if (alpha === void 0) {
                alpha = 1;
            }
            return this.beginTextureFill({ texture: Texture.WHITE, color: color, alpha: alpha });
        };
        Graphics.prototype.beginTextureFill = function beginTextureFill(options) {
            if (options instanceof Texture) {
                deprecation('v5.2.0', 'Please use object-based options for Graphics#beginTextureFill');
                var texture = arguments[0];
                var color = arguments[1];
                var alpha = arguments[2];
                var matrix = arguments[3];
                options = { texture: texture, color: color, alpha: alpha, matrix: matrix };
                Object.keys(options).forEach(function (key) { return options[key] === undefined && delete options[key]; });
            }
            options = Object.assign({
                texture: Texture.WHITE,
                color: 0xFFFFFF,
                alpha: 1,
                matrix: null,
            }, options);
            if (this.currentPath) {
                this.startPoly();
            }
            var visible = options.alpha > 0;
            if (!visible) {
                this._fillStyle.reset();
            }
            else {
                if (options.matrix) {
                    options.matrix = options.matrix.clone();
                    options.matrix.invert();
                }
                Object.assign(this._fillStyle, { visible: visible }, options);
            }
            return this;
        };
        Graphics.prototype.endFill = function endFill() {
            this.finishPoly();
            this._fillStyle.reset();
            return this;
        };
        Graphics.prototype.drawRect = function drawRect(x, y, width, height) {
            return this.drawShape(new Rectangle(x, y, width, height));
        };
        Graphics.prototype.drawRoundedRect = function drawRoundedRect(x, y, width, height, radius) {
            return this.drawShape(new RoundedRectangle(x, y, width, height, radius));
        };
        Graphics.prototype.drawCircle = function drawCircle(x, y, radius) {
            return this.drawShape(new Circle(x, y, radius));
        };
        Graphics.prototype.drawEllipse = function drawEllipse(x, y, width, height) {
            return this.drawShape(new Ellipse(x, y, width, height));
        };
        Graphics.prototype.drawPolygon = function drawPolygon(path) {
            var arguments$1 = arguments;
            var points = path;
            var closeStroke = true;
            if (points.points) {
                closeStroke = points.closeStroke;
                points = points.points;
            }
            if (!Array.isArray(points)) {
                points = new Array(arguments.length);
                for (var i = 0; i < points.length; ++i) {
                    points[i] = arguments$1[i];
                }
            }
            var shape = new Polygon(points);
            shape.closeStroke = closeStroke;
            this.drawShape(shape);
            return this;
        };
        Graphics.prototype.drawShape = function drawShape(shape) {
            if (!this._holeMode) {
                this.geometry.drawShape(shape, this._fillStyle.clone(), this._lineStyle.clone(), this._matrix);
            }
            else {
                this.geometry.drawHole(shape, this._matrix);
            }
            return this;
        };
        Graphics.prototype.drawStar = function drawStar(x, y, points, radius, innerRadius, rotation) {
            if (rotation === void 0) {
                rotation = 0;
            }
            return this.drawPolygon(new Star(x, y, points, radius, innerRadius, rotation));
        };
        Graphics.prototype.clear = function clear() {
            this.geometry.clear();
            this._lineStyle.reset();
            this._fillStyle.reset();
            this._matrix = null;
            this._holeMode = false;
            this.currentPath = null;
            return this;
        };
        Graphics.prototype.isFastRect = function isFastRect() {
            return this.geometry.graphicsData.length === 1
                && this.geometry.graphicsData[0].shape.type === exports.SHAPES.RECT
                && !this.geometry.graphicsData[0].lineWidth;
        };
        Graphics.prototype._render = function _render(renderer) {
            this.finishPoly();
            var geometry = this.geometry;
            geometry.updateBatches();
            if (geometry.batchable) {
                if (this.batchDirty !== geometry.batchDirty) {
                    this._populateBatches();
                }
                this._renderBatched(renderer);
            }
            else {
                renderer.batch.flush();
                this._renderDirect(renderer);
            }
        };
        Graphics.prototype._populateBatches = function _populateBatches() {
            var geometry = this.geometry;
            var blendMode = this.blendMode;
            this.batches = [];
            this.batchTint = -1;
            this._transformID = -1;
            this.batchDirty = geometry.batchDirty;
            this.vertexData = new Float32Array(geometry.points);
            for (var i = 0, l = geometry.batches.length; i < l; i++) {
                var gI = geometry.batches[i];
                var color = gI.style.color;
                var vertexData = new Float32Array(this.vertexData.buffer, gI.attribStart * 4 * 2, gI.attribSize * 2);
                var uvs = new Float32Array(geometry.uvsFloat32.buffer, gI.attribStart * 4 * 2, gI.attribSize * 2);
                var indices = new Uint16Array(geometry.indicesUint16.buffer, gI.start * 2, gI.size);
                var batch = {
                    vertexData: vertexData,
                    blendMode: blendMode,
                    indices: indices,
                    uvs: uvs,
                    _batchRGB: hex2rgb(color),
                    _tintRGB: color,
                    _texture: gI.style.texture,
                    alpha: gI.style.alpha,
                    worldAlpha: 1
                };
                this.batches[i] = batch;
            }
        };
        Graphics.prototype._renderBatched = function _renderBatched(renderer) {
            if (!this.batches.length) {
                return;
            }
            renderer.batch.setObjectRenderer(renderer.plugins[this.pluginName]);
            this.calculateVertices();
            this.calculateTints();
            for (var i = 0, l = this.batches.length; i < l; i++) {
                var batch = this.batches[i];
                batch.worldAlpha = this.worldAlpha * batch.alpha;
                renderer.plugins[this.pluginName].render(batch);
            }
        };
        Graphics.prototype._renderDirect = function _renderDirect(renderer) {
            var shader = this._resolveDirectShader(renderer);
            var geometry = this.geometry;
            var tint = this.tint;
            var worldAlpha = this.worldAlpha;
            var uniforms = shader.uniforms;
            var drawCalls = geometry.drawCalls;
            uniforms.translationMatrix = this.transform.worldTransform;
            uniforms.tint[0] = (((tint >> 16) & 0xFF) / 255) * worldAlpha;
            uniforms.tint[1] = (((tint >> 8) & 0xFF) / 255) * worldAlpha;
            uniforms.tint[2] = ((tint & 0xFF) / 255) * worldAlpha;
            uniforms.tint[3] = worldAlpha;
            renderer.shader.bind(shader);
            renderer.geometry.bind(geometry, shader);
            renderer.state.set(this.state);
            for (var i = 0, l = drawCalls.length; i < l; i++) {
                this._renderDrawCallDirect(renderer, geometry.drawCalls[i]);
            }
        };
        Graphics.prototype._renderDrawCallDirect = function _renderDrawCallDirect(renderer, drawCall) {
            var textures = drawCall.textures;
            var type = drawCall.type;
            var size = drawCall.size;
            var start = drawCall.start;
            var groupTextureCount = textures.count;
            for (var j = 0; j < groupTextureCount; j++) {
                renderer.texture.bind(textures.elements[j], j);
            }
            renderer.geometry.draw(type, size, start);
        };
        Graphics.prototype._resolveDirectShader = function _resolveDirectShader(renderer) {
            var shader = this.shader;
            var pluginName = this.pluginName;
            if (!shader) {
                if (!DEFAULT_SHADERS[pluginName]) {
                    var sampleValues = new Int32Array(16);
                    for (var i = 0; i < 16; i++) {
                        sampleValues[i] = i;
                    }
                    var uniforms = {
                        tint: new Float32Array([1, 1, 1, 1]),
                        translationMatrix: new Matrix(),
                        default: UniformGroup.from({ uSamplers: sampleValues }, true),
                    };
                    var program = renderer.plugins[pluginName]._shader.program;
                    DEFAULT_SHADERS[pluginName] = new Shader(program, uniforms);
                }
                shader = DEFAULT_SHADERS[pluginName];
            }
            return shader;
        };
        Graphics.prototype._calculateBounds = function _calculateBounds() {
            this.finishPoly();
            var geometry = this.geometry;
            if (!geometry.graphicsData.length) {
                return;
            }
            var ref = geometry.bounds;
            var minX = ref.minX;
            var minY = ref.minY;
            var maxX = ref.maxX;
            var maxY = ref.maxY;
            this._bounds.addFrame(this.transform, minX, minY, maxX, maxY);
        };
        Graphics.prototype.containsPoint = function containsPoint(point) {
            this.worldTransform.applyInverse(point, Graphics._TEMP_POINT);
            return this.geometry.containsPoint(Graphics._TEMP_POINT);
        };
        Graphics.prototype.calculateTints = function calculateTints() {
            if (this.batchTint !== this.tint) {
                this.batchTint = this.tint;
                var tintRGB = hex2rgb(this.tint, temp);
                for (var i = 0; i < this.batches.length; i++) {
                    var batch = this.batches[i];
                    var batchTint = batch._batchRGB;
                    var r = (tintRGB[0] * batchTint[0]) * 255;
                    var g = (tintRGB[1] * batchTint[1]) * 255;
                    var b = (tintRGB[2] * batchTint[2]) * 255;
                    var color = (r << 16) + (g << 8) + (b | 0);
                    batch._tintRGB = (color >> 16)
                        + (color & 0xff00)
                        + ((color & 0xff) << 16);
                }
            }
        };
        Graphics.prototype.calculateVertices = function calculateVertices() {
            if (this._transformID === this.transform._worldID) {
                return;
            }
            this._transformID = this.transform._worldID;
            var wt = this.transform.worldTransform;
            var a = wt.a;
            var b = wt.b;
            var c = wt.c;
            var d = wt.d;
            var tx = wt.tx;
            var ty = wt.ty;
            var data = this.geometry.points;
            var vertexData = this.vertexData;
            var count = 0;
            for (var i = 0; i < data.length; i += 2) {
                var x = data[i];
                var y = data[i + 1];
                vertexData[count++] = (a * x) + (c * y) + tx;
                vertexData[count++] = (d * y) + (b * x) + ty;
            }
        };
        Graphics.prototype.closePath = function closePath() {
            var currentPath = this.currentPath;
            if (currentPath) {
                currentPath.closeStroke = true;
            }
            return this;
        };
        Graphics.prototype.setMatrix = function setMatrix(matrix) {
            this._matrix = matrix;
            return this;
        };
        Graphics.prototype.beginHole = function beginHole() {
            this.finishPoly();
            this._holeMode = true;
            return this;
        };
        Graphics.prototype.endHole = function endHole() {
            this.finishPoly();
            this._holeMode = false;
            return this;
        };
        Graphics.prototype.destroy = function destroy(options) {
            Container.prototype.destroy.call(this, options);
            this.geometry.refCount--;
            if (this.geometry.refCount === 0) {
                this.geometry.dispose();
            }
            this._matrix = null;
            this.currentPath = null;
            this._lineStyle.destroy();
            this._lineStyle = null;
            this._fillStyle.destroy();
            this._fillStyle = null;
            this.geometry = null;
            this.shader = null;
            this.vertexData = null;
            this.batches.length = 0;
            this.batches = null;
            Container.prototype.destroy.call(this, options);
        };
        Object.defineProperties(Graphics.prototype, prototypeAccessors);
        return Graphics;
    }(Container));
    Graphics._TEMP_POINT = new Point();
    var tempPoint = new Point();
    var indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    var Sprite = (function (Container) {
        function Sprite(texture) {
            Container.call(this);
            this._anchor = new ObservablePoint(this._onAnchorUpdate, this, (texture ? texture.defaultAnchor.x : 0), (texture ? texture.defaultAnchor.y : 0));
            this._texture = null;
            this._width = 0;
            this._height = 0;
            this._tint = null;
            this._tintRGB = null;
            this.tint = 0xFFFFFF;
            this.blendMode = exports.BLEND_MODES.NORMAL;
            this.shader = null;
            this._cachedTint = 0xFFFFFF;
            this.uvs = null;
            this.texture = texture || Texture.EMPTY;
            this.vertexData = new Float32Array(8);
            this.vertexTrimmedData = null;
            this._transformID = -1;
            this._textureID = -1;
            this._transformTrimmedID = -1;
            this._textureTrimmedID = -1;
            this.indices = indices;
            this.size = 4;
            this.start = 0;
            this.pluginName = 'batch';
            this.isSprite = true;
            this._roundPixels = settings.ROUND_PIXELS;
        }
        if (Container) {
            Sprite.__proto__ = Container;
        }
        Sprite.prototype = Object.create(Container && Container.prototype);
        Sprite.prototype.constructor = Sprite;
        var prototypeAccessors = { roundPixels: { configurable: true }, width: { configurable: true }, height: { configurable: true }, anchor: { configurable: true }, tint: { configurable: true }, texture: { configurable: true } };
        Sprite.prototype._onTextureUpdate = function _onTextureUpdate() {
            this._textureID = -1;
            this._textureTrimmedID = -1;
            this._cachedTint = 0xFFFFFF;
            if (this._width) {
                this.scale.x = sign$1(this.scale.x) * this._width / this._texture.orig.width;
            }
            if (this._height) {
                this.scale.y = sign$1(this.scale.y) * this._height / this._texture.orig.height;
            }
        };
        Sprite.prototype._onAnchorUpdate = function _onAnchorUpdate() {
            this._transformID = -1;
            this._transformTrimmedID = -1;
        };
        Sprite.prototype.calculateVertices = function calculateVertices() {
            var texture = this._texture;
            if (this._transformID === this.transform._worldID && this._textureID === texture._updateID) {
                return;
            }
            if (this._textureID !== texture._updateID) {
                this.uvs = this._texture._uvs.uvsFloat32;
            }
            this._transformID = this.transform._worldID;
            this._textureID = texture._updateID;
            var wt = this.transform.worldTransform;
            var a = wt.a;
            var b = wt.b;
            var c = wt.c;
            var d = wt.d;
            var tx = wt.tx;
            var ty = wt.ty;
            var vertexData = this.vertexData;
            var trim = texture.trim;
            var orig = texture.orig;
            var anchor = this._anchor;
            var w0 = 0;
            var w1 = 0;
            var h0 = 0;
            var h1 = 0;
            if (trim) {
                w1 = trim.x - (anchor._x * orig.width);
                w0 = w1 + trim.width;
                h1 = trim.y - (anchor._y * orig.height);
                h0 = h1 + trim.height;
            }
            else {
                w1 = -anchor._x * orig.width;
                w0 = w1 + orig.width;
                h1 = -anchor._y * orig.height;
                h0 = h1 + orig.height;
            }
            vertexData[0] = (a * w1) + (c * h1) + tx;
            vertexData[1] = (d * h1) + (b * w1) + ty;
            vertexData[2] = (a * w0) + (c * h1) + tx;
            vertexData[3] = (d * h1) + (b * w0) + ty;
            vertexData[4] = (a * w0) + (c * h0) + tx;
            vertexData[5] = (d * h0) + (b * w0) + ty;
            vertexData[6] = (a * w1) + (c * h0) + tx;
            vertexData[7] = (d * h0) + (b * w1) + ty;
            if (this._roundPixels) {
                var resolution = settings.RESOLUTION;
                for (var i = 0; i < vertexData.length; ++i) {
                    vertexData[i] = Math.round((vertexData[i] * resolution | 0) / resolution);
                }
            }
        };
        Sprite.prototype.calculateTrimmedVertices = function calculateTrimmedVertices() {
            if (!this.vertexTrimmedData) {
                this.vertexTrimmedData = new Float32Array(8);
            }
            else if (this._transformTrimmedID === this.transform._worldID && this._textureTrimmedID === this._texture._updateID) {
                return;
            }
            this._transformTrimmedID = this.transform._worldID;
            this._textureTrimmedID = this._texture._updateID;
            var texture = this._texture;
            var vertexData = this.vertexTrimmedData;
            var orig = texture.orig;
            var anchor = this._anchor;
            var wt = this.transform.worldTransform;
            var a = wt.a;
            var b = wt.b;
            var c = wt.c;
            var d = wt.d;
            var tx = wt.tx;
            var ty = wt.ty;
            var w1 = -anchor._x * orig.width;
            var w0 = w1 + orig.width;
            var h1 = -anchor._y * orig.height;
            var h0 = h1 + orig.height;
            vertexData[0] = (a * w1) + (c * h1) + tx;
            vertexData[1] = (d * h1) + (b * w1) + ty;
            vertexData[2] = (a * w0) + (c * h1) + tx;
            vertexData[3] = (d * h1) + (b * w0) + ty;
            vertexData[4] = (a * w0) + (c * h0) + tx;
            vertexData[5] = (d * h0) + (b * w0) + ty;
            vertexData[6] = (a * w1) + (c * h0) + tx;
            vertexData[7] = (d * h0) + (b * w1) + ty;
        };
        Sprite.prototype._render = function _render(renderer) {
            this.calculateVertices();
            renderer.batch.setObjectRenderer(renderer.plugins[this.pluginName]);
            renderer.plugins[this.pluginName].render(this);
        };
        Sprite.prototype._calculateBounds = function _calculateBounds() {
            var trim = this._texture.trim;
            var orig = this._texture.orig;
            if (!trim || (trim.width === orig.width && trim.height === orig.height)) {
                this.calculateVertices();
                this._bounds.addQuad(this.vertexData);
            }
            else {
                this.calculateTrimmedVertices();
                this._bounds.addQuad(this.vertexTrimmedData);
            }
        };
        Sprite.prototype.getLocalBounds = function getLocalBounds(rect) {
            if (this.children.length === 0) {
                this._bounds.minX = this._texture.orig.width * -this._anchor._x;
                this._bounds.minY = this._texture.orig.height * -this._anchor._y;
                this._bounds.maxX = this._texture.orig.width * (1 - this._anchor._x);
                this._bounds.maxY = this._texture.orig.height * (1 - this._anchor._y);
                if (!rect) {
                    if (!this._localBoundsRect) {
                        this._localBoundsRect = new Rectangle();
                    }
                    rect = this._localBoundsRect;
                }
                return this._bounds.getRectangle(rect);
            }
            return Container.prototype.getLocalBounds.call(this, rect);
        };
        Sprite.prototype.containsPoint = function containsPoint(point) {
            this.worldTransform.applyInverse(point, tempPoint);
            var width = this._texture.orig.width;
            var height = this._texture.orig.height;
            var x1 = -width * this.anchor.x;
            var y1 = 0;
            if (tempPoint.x >= x1 && tempPoint.x < x1 + width) {
                y1 = -height * this.anchor.y;
                if (tempPoint.y >= y1 && tempPoint.y < y1 + height) {
                    return true;
                }
            }
            return false;
        };
        Sprite.prototype.destroy = function destroy(options) {
            Container.prototype.destroy.call(this, options);
            this._texture.off('update', this._onTextureUpdate, this);
            this._anchor = null;
            var destroyTexture = typeof options === 'boolean' ? options : options && options.texture;
            if (destroyTexture) {
                var destroyBaseTexture = typeof options === 'boolean' ? options : options && options.baseTexture;
                this._texture.destroy(!!destroyBaseTexture);
            }
            this._texture = null;
            this.shader = null;
        };
        Sprite.from = function from(source, options) {
            var texture = (source instanceof Texture)
                ? source
                : Texture.from(source, options);
            return new Sprite(texture);
        };
        prototypeAccessors.roundPixels.set = function (value) {
            if (this._roundPixels !== value) {
                this._transformID = -1;
            }
            this._roundPixels = value;
        };
        prototypeAccessors.roundPixels.get = function () {
            return this._roundPixels;
        };
        prototypeAccessors.width.get = function () {
            return Math.abs(this.scale.x) * this._texture.orig.width;
        };
        prototypeAccessors.width.set = function (value) {
            var s = sign$1(this.scale.x) || 1;
            this.scale.x = s * value / this._texture.orig.width;
            this._width = value;
        };
        prototypeAccessors.height.get = function () {
            return Math.abs(this.scale.y) * this._texture.orig.height;
        };
        prototypeAccessors.height.set = function (value) {
            var s = sign$1(this.scale.y) || 1;
            this.scale.y = s * value / this._texture.orig.height;
            this._height = value;
        };
        prototypeAccessors.anchor.get = function () {
            return this._anchor;
        };
        prototypeAccessors.anchor.set = function (value) {
            this._anchor.copyFrom(value);
        };
        prototypeAccessors.tint.get = function () {
            return this._tint;
        };
        prototypeAccessors.tint.set = function (value) {
            this._tint = value;
            this._tintRGB = (value >> 16) + (value & 0xff00) + ((value & 0xff) << 16);
        };
        prototypeAccessors.texture.get = function () {
            return this._texture;
        };
        prototypeAccessors.texture.set = function (value) {
            if (this._texture === value) {
                return;
            }
            if (this._texture) {
                this._texture.off('update', this._onTextureUpdate, this);
            }
            this._texture = value || Texture.EMPTY;
            this._cachedTint = 0xFFFFFF;
            this._textureID = -1;
            this._textureTrimmedID = -1;
            if (value) {
                if (value.baseTexture.valid) {
                    this._onTextureUpdate();
                }
                else {
                    value.once('update', this._onTextureUpdate, this);
                }
            }
        };
        Object.defineProperties(Sprite.prototype, prototypeAccessors);
        return Sprite;
    }(Container));
    var TEXT_GRADIENT = {
        LINEAR_VERTICAL: 0,
        LINEAR_HORIZONTAL: 1,
    };
    var defaultStyle = {
        align: 'left',
        breakWords: false,
        dropShadow: false,
        dropShadowAlpha: 1,
        dropShadowAngle: Math.PI / 6,
        dropShadowBlur: 0,
        dropShadowColor: 'black',
        dropShadowDistance: 5,
        fill: 'black',
        fillGradientType: TEXT_GRADIENT.LINEAR_VERTICAL,
        fillGradientStops: [],
        fontFamily: 'Arial',
        fontSize: 26,
        fontStyle: 'normal',
        fontVariant: 'normal',
        fontWeight: 'normal',
        letterSpacing: 0,
        lineHeight: 0,
        lineJoin: 'miter',
        miterLimit: 10,
        padding: 0,
        stroke: 'black',
        strokeThickness: 0,
        textBaseline: 'alphabetic',
        trim: false,
        whiteSpace: 'pre',
        wordWrap: false,
        wordWrapWidth: 100,
        leading: 0,
    };
    var genericFontFamilies = [
        'serif',
        'sans-serif',
        'monospace',
        'cursive',
        'fantasy',
        'system-ui'
    ];
    var TextStyle = function TextStyle(style) {
        this.styleID = 0;
        this.reset();
        deepCopyProperties(this, style, style);
    };
    var prototypeAccessors$7 = { align: { configurable: true }, breakWords: { configurable: true }, dropShadow: { configurable: true }, dropShadowAlpha: { configurable: true }, dropShadowAngle: { configurable: true }, dropShadowBlur: { configurable: true }, dropShadowColor: { configurable: true }, dropShadowDistance: { configurable: true }, fill: { configurable: true }, fillGradientType: { configurable: true }, fillGradientStops: { configurable: true }, fontFamily: { configurable: true }, fontSize: { configurable: true }, fontStyle: { configurable: true }, fontVariant: { configurable: true }, fontWeight: { configurable: true }, letterSpacing: { configurable: true }, lineHeight: { configurable: true }, leading: { configurable: true }, lineJoin: { configurable: true }, miterLimit: { configurable: true }, padding: { configurable: true }, stroke: { configurable: true }, strokeThickness: { configurable: true }, textBaseline: { configurable: true }, trim: { configurable: true }, whiteSpace: { configurable: true }, wordWrap: { configurable: true }, wordWrapWidth: { configurable: true } };
    TextStyle.prototype.clone = function clone() {
        var clonedProperties = {};
        deepCopyProperties(clonedProperties, this, defaultStyle);
        return new TextStyle(clonedProperties);
    };
    TextStyle.prototype.reset = function reset() {
        deepCopyProperties(this, defaultStyle, defaultStyle);
    };
    prototypeAccessors$7.align.get = function () {
        return this._align;
    };
    prototypeAccessors$7.align.set = function (align) {
        if (this._align !== align) {
            this._align = align;
            this.styleID++;
        }
    };
    prototypeAccessors$7.breakWords.get = function () {
        return this._breakWords;
    };
    prototypeAccessors$7.breakWords.set = function (breakWords) {
        if (this._breakWords !== breakWords) {
            this._breakWords = breakWords;
            this.styleID++;
        }
    };
    prototypeAccessors$7.dropShadow.get = function () {
        return this._dropShadow;
    };
    prototypeAccessors$7.dropShadow.set = function (dropShadow) {
        if (this._dropShadow !== dropShadow) {
            this._dropShadow = dropShadow;
            this.styleID++;
        }
    };
    prototypeAccessors$7.dropShadowAlpha.get = function () {
        return this._dropShadowAlpha;
    };
    prototypeAccessors$7.dropShadowAlpha.set = function (dropShadowAlpha) {
        if (this._dropShadowAlpha !== dropShadowAlpha) {
            this._dropShadowAlpha = dropShadowAlpha;
            this.styleID++;
        }
    };
    prototypeAccessors$7.dropShadowAngle.get = function () {
        return this._dropShadowAngle;
    };
    prototypeAccessors$7.dropShadowAngle.set = function (dropShadowAngle) {
        if (this._dropShadowAngle !== dropShadowAngle) {
            this._dropShadowAngle = dropShadowAngle;
            this.styleID++;
        }
    };
    prototypeAccessors$7.dropShadowBlur.get = function () {
        return this._dropShadowBlur;
    };
    prototypeAccessors$7.dropShadowBlur.set = function (dropShadowBlur) {
        if (this._dropShadowBlur !== dropShadowBlur) {
            this._dropShadowBlur = dropShadowBlur;
            this.styleID++;
        }
    };
    prototypeAccessors$7.dropShadowColor.get = function () {
        return this._dropShadowColor;
    };
    prototypeAccessors$7.dropShadowColor.set = function (dropShadowColor) {
        var outputColor = getColor(dropShadowColor);
        if (this._dropShadowColor !== outputColor) {
            this._dropShadowColor = outputColor;
            this.styleID++;
        }
    };
    prototypeAccessors$7.dropShadowDistance.get = function () {
        return this._dropShadowDistance;
    };
    prototypeAccessors$7.dropShadowDistance.set = function (dropShadowDistance) {
        if (this._dropShadowDistance !== dropShadowDistance) {
            this._dropShadowDistance = dropShadowDistance;
            this.styleID++;
        }
    };
    prototypeAccessors$7.fill.get = function () {
        return this._fill;
    };
    prototypeAccessors$7.fill.set = function (fill) {
        var outputColor = getColor(fill);
        if (this._fill !== outputColor) {
            this._fill = outputColor;
            this.styleID++;
        }
    };
    prototypeAccessors$7.fillGradientType.get = function () {
        return this._fillGradientType;
    };
    prototypeAccessors$7.fillGradientType.set = function (fillGradientType) {
        if (this._fillGradientType !== fillGradientType) {
            this._fillGradientType = fillGradientType;
            this.styleID++;
        }
    };
    prototypeAccessors$7.fillGradientStops.get = function () {
        return this._fillGradientStops;
    };
    prototypeAccessors$7.fillGradientStops.set = function (fillGradientStops) {
        if (!areArraysEqual(this._fillGradientStops, fillGradientStops)) {
            this._fillGradientStops = fillGradientStops;
            this.styleID++;
        }
    };
    prototypeAccessors$7.fontFamily.get = function () {
        return this._fontFamily;
    };
    prototypeAccessors$7.fontFamily.set = function (fontFamily) {
        if (this.fontFamily !== fontFamily) {
            this._fontFamily = fontFamily;
            this.styleID++;
        }
    };
    prototypeAccessors$7.fontSize.get = function () {
        return this._fontSize;
    };
    prototypeAccessors$7.fontSize.set = function (fontSize) {
        if (this._fontSize !== fontSize) {
            this._fontSize = fontSize;
            this.styleID++;
        }
    };
    prototypeAccessors$7.fontStyle.get = function () {
        return this._fontStyle;
    };
    prototypeAccessors$7.fontStyle.set = function (fontStyle) {
        if (this._fontStyle !== fontStyle) {
            this._fontStyle = fontStyle;
            this.styleID++;
        }
    };
    prototypeAccessors$7.fontVariant.get = function () {
        return this._fontVariant;
    };
    prototypeAccessors$7.fontVariant.set = function (fontVariant) {
        if (this._fontVariant !== fontVariant) {
            this._fontVariant = fontVariant;
            this.styleID++;
        }
    };
    prototypeAccessors$7.fontWeight.get = function () {
        return this._fontWeight;
    };
    prototypeAccessors$7.fontWeight.set = function (fontWeight) {
        if (this._fontWeight !== fontWeight) {
            this._fontWeight = fontWeight;
            this.styleID++;
        }
    };
    prototypeAccessors$7.letterSpacing.get = function () {
        return this._letterSpacing;
    };
    prototypeAccessors$7.letterSpacing.set = function (letterSpacing) {
        if (this._letterSpacing !== letterSpacing) {
            this._letterSpacing = letterSpacing;
            this.styleID++;
        }
    };
    prototypeAccessors$7.lineHeight.get = function () {
        return this._lineHeight;
    };
    prototypeAccessors$7.lineHeight.set = function (lineHeight) {
        if (this._lineHeight !== lineHeight) {
            this._lineHeight = lineHeight;
            this.styleID++;
        }
    };
    prototypeAccessors$7.leading.get = function () {
        return this._leading;
    };
    prototypeAccessors$7.leading.set = function (leading) {
        if (this._leading !== leading) {
            this._leading = leading;
            this.styleID++;
        }
    };
    prototypeAccessors$7.lineJoin.get = function () {
        return this._lineJoin;
    };
    prototypeAccessors$7.lineJoin.set = function (lineJoin) {
        if (this._lineJoin !== lineJoin) {
            this._lineJoin = lineJoin;
            this.styleID++;
        }
    };
    prototypeAccessors$7.miterLimit.get = function () {
        return this._miterLimit;
    };
    prototypeAccessors$7.miterLimit.set = function (miterLimit) {
        if (this._miterLimit !== miterLimit) {
            this._miterLimit = miterLimit;
            this.styleID++;
        }
    };
    prototypeAccessors$7.padding.get = function () {
        return this._padding;
    };
    prototypeAccessors$7.padding.set = function (padding) {
        if (this._padding !== padding) {
            this._padding = padding;
            this.styleID++;
        }
    };
    prototypeAccessors$7.stroke.get = function () {
        return this._stroke;
    };
    prototypeAccessors$7.stroke.set = function (stroke) {
        var outputColor = getColor(stroke);
        if (this._stroke !== outputColor) {
            this._stroke = outputColor;
            this.styleID++;
        }
    };
    prototypeAccessors$7.strokeThickness.get = function () {
        return this._strokeThickness;
    };
    prototypeAccessors$7.strokeThickness.set = function (strokeThickness) {
        if (this._strokeThickness !== strokeThickness) {
            this._strokeThickness = strokeThickness;
            this.styleID++;
        }
    };
    prototypeAccessors$7.textBaseline.get = function () {
        return this._textBaseline;
    };
    prototypeAccessors$7.textBaseline.set = function (textBaseline) {
        if (this._textBaseline !== textBaseline) {
            this._textBaseline = textBaseline;
            this.styleID++;
        }
    };
    prototypeAccessors$7.trim.get = function () {
        return this._trim;
    };
    prototypeAccessors$7.trim.set = function (trim) {
        if (this._trim !== trim) {
            this._trim = trim;
            this.styleID++;
        }
    };
    prototypeAccessors$7.whiteSpace.get = function () {
        return this._whiteSpace;
    };
    prototypeAccessors$7.whiteSpace.set = function (whiteSpace) {
        if (this._whiteSpace !== whiteSpace) {
            this._whiteSpace = whiteSpace;
            this.styleID++;
        }
    };
    prototypeAccessors$7.wordWrap.get = function () {
        return this._wordWrap;
    };
    prototypeAccessors$7.wordWrap.set = function (wordWrap) {
        if (this._wordWrap !== wordWrap) {
            this._wordWrap = wordWrap;
            this.styleID++;
        }
    };
    prototypeAccessors$7.wordWrapWidth.get = function () {
        return this._wordWrapWidth;
    };
    prototypeAccessors$7.wordWrapWidth.set = function (wordWrapWidth) {
        if (this._wordWrapWidth !== wordWrapWidth) {
            this._wordWrapWidth = wordWrapWidth;
            this.styleID++;
        }
    };
    TextStyle.prototype.toFontString = function toFontString() {
        var fontSizeString = (typeof this.fontSize === 'number') ? ((this.fontSize) + "px") : this.fontSize;
        var fontFamilies = this.fontFamily;
        if (!Array.isArray(this.fontFamily)) {
            fontFamilies = this.fontFamily.split(',');
        }
        for (var i = fontFamilies.length - 1; i >= 0; i--) {
            var fontFamily = fontFamilies[i].trim();
            if (!(/([\"\'])[^\'\"]+\1/).test(fontFamily) && genericFontFamilies.indexOf(fontFamily) < 0) {
                fontFamily = "\"" + fontFamily + "\"";
            }
            fontFamilies[i] = fontFamily;
        }
        return ((this.fontStyle) + " " + (this.fontVariant) + " " + (this.fontWeight) + " " + fontSizeString + " " + (fontFamilies.join(',')));
    };
    Object.defineProperties(TextStyle.prototype, prototypeAccessors$7);
    function getSingleColor(color) {
        if (typeof color === 'number') {
            return hex2string(color);
        }
        else if (typeof color === 'string') {
            if (color.indexOf('0x') === 0) {
                color = color.replace('0x', '#');
            }
        }
        return color;
    }
    function getColor(color) {
        if (!Array.isArray(color)) {
            return getSingleColor(color);
        }
        else {
            for (var i = 0; i < color.length; ++i) {
                color[i] = getSingleColor(color[i]);
            }
            return color;
        }
    }
    function areArraysEqual(array1, array2) {
        if (!Array.isArray(array1) || !Array.isArray(array2)) {
            return false;
        }
        if (array1.length !== array2.length) {
            return false;
        }
        for (var i = 0; i < array1.length; ++i) {
            if (array1[i] !== array2[i]) {
                return false;
            }
        }
        return true;
    }
    function deepCopyProperties(target, source, propertyObj) {
        for (var prop in propertyObj) {
            if (Array.isArray(source[prop])) {
                target[prop] = source[prop].slice();
            }
            else {
                target[prop] = source[prop];
            }
        }
    }
    var TextMetrics = function TextMetrics(text, style, width, height, lines, lineWidths, lineHeight, maxLineWidth, fontProperties) {
        this.text = text;
        this.style = style;
        this.width = width;
        this.height = height;
        this.lines = lines;
        this.lineWidths = lineWidths;
        this.lineHeight = lineHeight;
        this.maxLineWidth = maxLineWidth;
        this.fontProperties = fontProperties;
    };
    TextMetrics.measureText = function measureText(text, style, wordWrap, canvas) {
        if (canvas === void 0) {
            canvas = TextMetrics._canvas;
        }
        wordWrap = (wordWrap === undefined || wordWrap === null) ? style.wordWrap : wordWrap;
        var font = style.toFontString();
        var fontProperties = TextMetrics.measureFont(font);
        if (fontProperties.fontSize === 0) {
            fontProperties.fontSize = style.fontSize;
            fontProperties.ascent = style.fontSize;
        }
        var context = canvas.getContext('2d');
        context.font = font;
        var outputText = wordWrap ? TextMetrics.wordWrap(text, style, canvas) : text;
        var lines = outputText.split(/(?:\r\n|\r|\n)/);
        var lineWidths = new Array(lines.length);
        var maxLineWidth = 0;
        for (var i = 0; i < lines.length; i++) {
            var lineWidth = context.measureText(lines[i]).width + ((lines[i].length - 1) * style.letterSpacing);
            lineWidths[i] = lineWidth;
            maxLineWidth = Math.max(maxLineWidth, lineWidth);
        }
        var width = maxLineWidth + style.strokeThickness;
        if (style.dropShadow) {
            width += style.dropShadowDistance;
        }
        var lineHeight = style.lineHeight || fontProperties.fontSize + style.strokeThickness;
        var height = Math.max(lineHeight, fontProperties.fontSize + style.strokeThickness)
            + ((lines.length - 1) * (lineHeight + style.leading));
        if (style.dropShadow) {
            height += style.dropShadowDistance;
        }
        return new TextMetrics(text, style, width, height, lines, lineWidths, lineHeight + style.leading, maxLineWidth, fontProperties);
    };
    TextMetrics.wordWrap = function wordWrap(text, style, canvas) {
        if (canvas === void 0) {
            canvas = TextMetrics._canvas;
        }
        var context = canvas.getContext('2d');
        var width = 0;
        var line = '';
        var lines = '';
        var cache = {};
        var letterSpacing = style.letterSpacing;
        var whiteSpace = style.whiteSpace;
        var collapseSpaces = TextMetrics.collapseSpaces(whiteSpace);
        var collapseNewlines = TextMetrics.collapseNewlines(whiteSpace);
        var canPrependSpaces = !collapseSpaces;
        var wordWrapWidth = style.wordWrapWidth + letterSpacing;
        var tokens = TextMetrics.tokenize(text);
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (TextMetrics.isNewline(token)) {
                if (!collapseNewlines) {
                    lines += TextMetrics.addLine(line);
                    canPrependSpaces = !collapseSpaces;
                    line = '';
                    width = 0;
                    continue;
                }
                token = ' ';
            }
            if (collapseSpaces) {
                var currIsBreakingSpace = TextMetrics.isBreakingSpace(token);
                var lastIsBreakingSpace = TextMetrics.isBreakingSpace(line[line.length - 1]);
                if (currIsBreakingSpace && lastIsBreakingSpace) {
                    continue;
                }
            }
            var tokenWidth = TextMetrics.getFromCache(token, letterSpacing, cache, context);
            if (tokenWidth > wordWrapWidth) {
                if (line !== '') {
                    lines += TextMetrics.addLine(line);
                    line = '';
                    width = 0;
                }
                if (TextMetrics.canBreakWords(token, style.breakWords)) {
                    var characters = TextMetrics.wordWrapSplit(token);
                    for (var j = 0; j < characters.length; j++) {
                        var char = characters[j];
                        var k = 1;
                        while (characters[j + k]) {
                            var nextChar = characters[j + k];
                            var lastChar = char[char.length - 1];
                            if (!TextMetrics.canBreakChars(lastChar, nextChar, token, j, style.breakWords)) {
                                char += nextChar;
                            }
                            else {
                                break;
                            }
                            k++;
                        }
                        j += char.length - 1;
                        var characterWidth = TextMetrics.getFromCache(char, letterSpacing, cache, context);
                        if (characterWidth + width > wordWrapWidth) {
                            lines += TextMetrics.addLine(line);
                            canPrependSpaces = false;
                            line = '';
                            width = 0;
                        }
                        line += char;
                        width += characterWidth;
                    }
                }
                else {
                    if (line.length > 0) {
                        lines += TextMetrics.addLine(line);
                        line = '';
                        width = 0;
                    }
                    var isLastToken = i === tokens.length - 1;
                    lines += TextMetrics.addLine(token, !isLastToken);
                    canPrependSpaces = false;
                    line = '';
                    width = 0;
                }
            }
            else {
                if (tokenWidth + width > wordWrapWidth) {
                    canPrependSpaces = false;
                    lines += TextMetrics.addLine(line);
                    line = '';
                    width = 0;
                }
                if (line.length > 0 || !TextMetrics.isBreakingSpace(token) || canPrependSpaces) {
                    line += token;
                    width += tokenWidth;
                }
            }
        }
        lines += TextMetrics.addLine(line, false);
        return lines;
    };
    TextMetrics.addLine = function addLine(line, newLine) {
        if (newLine === void 0) {
            newLine = true;
        }
        line = TextMetrics.trimRight(line);
        line = (newLine) ? (line + "\n") : line;
        return line;
    };
    TextMetrics.getFromCache = function getFromCache(key, letterSpacing, cache, context) {
        var width = cache[key];
        if (width === undefined) {
            var spacing = ((key.length) * letterSpacing);
            width = context.measureText(key).width + spacing;
            cache[key] = width;
        }
        return width;
    };
    TextMetrics.collapseSpaces = function collapseSpaces(whiteSpace) {
        return (whiteSpace === 'normal' || whiteSpace === 'pre-line');
    };
    TextMetrics.collapseNewlines = function collapseNewlines(whiteSpace) {
        return (whiteSpace === 'normal');
    };
    TextMetrics.trimRight = function trimRight(text) {
        if (typeof text !== 'string') {
            return '';
        }
        for (var i = text.length - 1; i >= 0; i--) {
            var char = text[i];
            if (!TextMetrics.isBreakingSpace(char)) {
                break;
            }
            text = text.slice(0, -1);
        }
        return text;
    };
    TextMetrics.isNewline = function isNewline(char) {
        if (typeof char !== 'string') {
            return false;
        }
        return (TextMetrics._newlines.indexOf(char.charCodeAt(0)) >= 0);
    };
    TextMetrics.isBreakingSpace = function isBreakingSpace(char) {
        if (typeof char !== 'string') {
            return false;
        }
        return (TextMetrics._breakingSpaces.indexOf(char.charCodeAt(0)) >= 0);
    };
    TextMetrics.tokenize = function tokenize(text) {
        var tokens = [];
        var token = '';
        if (typeof text !== 'string') {
            return tokens;
        }
        for (var i = 0; i < text.length; i++) {
            var char = text[i];
            if (TextMetrics.isBreakingSpace(char) || TextMetrics.isNewline(char)) {
                if (token !== '') {
                    tokens.push(token);
                    token = '';
                }
                tokens.push(char);
                continue;
            }
            token += char;
        }
        if (token !== '') {
            tokens.push(token);
        }
        return tokens;
    };
    TextMetrics.canBreakWords = function canBreakWords(token, breakWords) {
        return breakWords;
    };
    TextMetrics.canBreakChars = function canBreakChars(char, nextChar, token, index, breakWords) {
        return true;
    };
    TextMetrics.wordWrapSplit = function wordWrapSplit(token) {
        return token.split('');
    };
    TextMetrics.measureFont = function measureFont(font) {
        if (TextMetrics._fonts[font]) {
            return TextMetrics._fonts[font];
        }
        var properties = {};
        var canvas = TextMetrics._canvas;
        var context = TextMetrics._context;
        context.font = font;
        var metricsString = TextMetrics.METRICS_STRING + TextMetrics.BASELINE_SYMBOL;
        var width = Math.ceil(context.measureText(metricsString).width);
        var baseline = Math.ceil(context.measureText(TextMetrics.BASELINE_SYMBOL).width);
        var height = 2 * baseline;
        baseline = baseline * TextMetrics.BASELINE_MULTIPLIER | 0;
        canvas.width = width;
        canvas.height = height;
        context.fillStyle = '#f00';
        context.fillRect(0, 0, width, height);
        context.font = font;
        context.textBaseline = 'alphabetic';
        context.fillStyle = '#000';
        context.fillText(metricsString, 0, baseline);
        var imagedata = context.getImageData(0, 0, width, height).data;
        var pixels = imagedata.length;
        var line = width * 4;
        var i = 0;
        var idx = 0;
        var stop = false;
        for (i = 0; i < baseline; ++i) {
            for (var j = 0; j < line; j += 4) {
                if (imagedata[idx + j] !== 255) {
                    stop = true;
                    break;
                }
            }
            if (!stop) {
                idx += line;
            }
            else {
                break;
            }
        }
        properties.ascent = baseline - i;
        idx = pixels - line;
        stop = false;
        for (i = height; i > baseline; --i) {
            for (var j$1 = 0; j$1 < line; j$1 += 4) {
                if (imagedata[idx + j$1] !== 255) {
                    stop = true;
                    break;
                }
            }
            if (!stop) {
                idx -= line;
            }
            else {
                break;
            }
        }
        properties.descent = i - baseline;
        properties.fontSize = properties.ascent + properties.descent;
        TextMetrics._fonts[font] = properties;
        return properties;
    };
    TextMetrics.clearMetrics = function clearMetrics(font) {
        if (font === void 0) {
            font = '';
        }
        if (font) {
            delete TextMetrics._fonts[font];
        }
        else {
            TextMetrics._fonts = {};
        }
    };
    var canvas = (function () {
        try {
            var c = new OffscreenCanvas(0, 0);
            var context = c.getContext('2d');
            if (context && context.measureText) {
                return c;
            }
            return document.createElement('canvas');
        }
        catch (ex) {
            return document.createElement('canvas');
        }
    })();
    canvas.width = canvas.height = 10;
    TextMetrics._canvas = canvas;
    TextMetrics._context = canvas.getContext('2d');
    TextMetrics._fonts = {};
    TextMetrics.METRICS_STRING = '|ÉqÅ';
    TextMetrics.BASELINE_SYMBOL = 'M';
    TextMetrics.BASELINE_MULTIPLIER = 1.4;
    TextMetrics._newlines = [
        0x000A,
        0x000D
    ];
    TextMetrics._breakingSpaces = [
        0x0009,
        0x0020,
        0x2000,
        0x2001,
        0x2002,
        0x2003,
        0x2004,
        0x2005,
        0x2006,
        0x2008,
        0x2009,
        0x200A,
        0x205F,
        0x3000
    ];
    var defaultDestroyOptions = {
        texture: true,
        children: false,
        baseTexture: true,
    };
    var Text = (function (Sprite) {
        function Text(text, style, canvas) {
            canvas = canvas || document.createElement('canvas');
            canvas.width = 3;
            canvas.height = 3;
            var texture = Texture.from(canvas);
            texture.orig = new Rectangle();
            texture.trim = new Rectangle();
            Sprite.call(this, texture);
            this.canvas = canvas;
            this.context = this.canvas.getContext('2d');
            this._resolution = settings.RESOLUTION;
            this._autoResolution = true;
            this._text = null;
            this._style = null;
            this._styleListener = null;
            this._font = '';
            this.text = text;
            this.style = style;
            this.localStyleID = -1;
        }
        if (Sprite) {
            Text.__proto__ = Sprite;
        }
        Text.prototype = Object.create(Sprite && Sprite.prototype);
        Text.prototype.constructor = Text;
        var prototypeAccessors = { width: { configurable: true }, height: { configurable: true }, style: { configurable: true }, text: { configurable: true }, resolution: { configurable: true } };
        Text.prototype.updateText = function updateText(respectDirty) {
            var style = this._style;
            if (this.localStyleID !== style.styleID) {
                this.dirty = true;
                this.localStyleID = style.styleID;
            }
            if (!this.dirty && respectDirty) {
                return;
            }
            this._font = this._style.toFontString();
            var context = this.context;
            var measured = TextMetrics.measureText(this._text || ' ', this._style, this._style.wordWrap, this.canvas);
            var width = measured.width;
            var height = measured.height;
            var lines = measured.lines;
            var lineHeight = measured.lineHeight;
            var lineWidths = measured.lineWidths;
            var maxLineWidth = measured.maxLineWidth;
            var fontProperties = measured.fontProperties;
            this.canvas.width = Math.ceil((Math.max(1, width) + (style.padding * 2)) * this._resolution);
            this.canvas.height = Math.ceil((Math.max(1, height) + (style.padding * 2)) * this._resolution);
            context.scale(this._resolution, this._resolution);
            context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            context.font = this._font;
            context.lineWidth = style.strokeThickness;
            context.textBaseline = style.textBaseline;
            context.lineJoin = style.lineJoin;
            context.miterLimit = style.miterLimit;
            var linePositionX;
            var linePositionY;
            var passesCount = style.dropShadow ? 2 : 1;
            for (var i = 0; i < passesCount; ++i) {
                var isShadowPass = style.dropShadow && i === 0;
                var dsOffsetText = isShadowPass ? height * 2 : 0;
                var dsOffsetShadow = dsOffsetText * this.resolution;
                if (isShadowPass) {
                    context.fillStyle = 'black';
                    context.strokeStyle = 'black';
                    var dropShadowColor = style.dropShadowColor;
                    var rgb = hex2rgb(typeof dropShadowColor === 'number' ? dropShadowColor : string2hex(dropShadowColor));
                    context.shadowColor = "rgba(" + (rgb[0] * 255) + "," + (rgb[1] * 255) + "," + (rgb[2] * 255) + "," + (style.dropShadowAlpha) + ")";
                    context.shadowBlur = style.dropShadowBlur;
                    context.shadowOffsetX = Math.cos(style.dropShadowAngle) * style.dropShadowDistance;
                    context.shadowOffsetY = (Math.sin(style.dropShadowAngle) * style.dropShadowDistance) + dsOffsetShadow;
                }
                else {
                    context.fillStyle = this._generateFillStyle(style, lines);
                    context.strokeStyle = style.stroke;
                    context.shadowColor = 0;
                    context.shadowBlur = 0;
                    context.shadowOffsetX = 0;
                    context.shadowOffsetY = 0;
                }
                for (var i$1 = 0; i$1 < lines.length; i$1++) {
                    linePositionX = style.strokeThickness / 2;
                    linePositionY = ((style.strokeThickness / 2) + (i$1 * lineHeight)) + fontProperties.ascent;
                    if (style.align === 'right') {
                        linePositionX += maxLineWidth - lineWidths[i$1];
                    }
                    else if (style.align === 'center') {
                        linePositionX += (maxLineWidth - lineWidths[i$1]) / 2;
                    }
                    if (style.stroke && style.strokeThickness) {
                        this.drawLetterSpacing(lines[i$1], linePositionX + style.padding, linePositionY + style.padding - dsOffsetText, true);
                    }
                    if (style.fill) {
                        this.drawLetterSpacing(lines[i$1], linePositionX + style.padding, linePositionY + style.padding - dsOffsetText);
                    }
                }
            }
            this.updateTexture();
        };
        Text.prototype.drawLetterSpacing = function drawLetterSpacing(text, x, y, isStroke) {
            if (isStroke === void 0) {
                isStroke = false;
            }
            var style = this._style;
            var letterSpacing = style.letterSpacing;
            if (letterSpacing === 0) {
                if (isStroke) {
                    this.context.strokeText(text, x, y);
                }
                else {
                    this.context.fillText(text, x, y);
                }
                return;
            }
            var currentPosition = x;
            var stringArray = Array.from ? Array.from(text) : text.split('');
            var previousWidth = this.context.measureText(text).width;
            var currentWidth = 0;
            for (var i = 0; i < stringArray.length; ++i) {
                var currentChar = stringArray[i];
                if (isStroke) {
                    this.context.strokeText(currentChar, currentPosition, y);
                }
                else {
                    this.context.fillText(currentChar, currentPosition, y);
                }
                currentWidth = this.context.measureText(text.substring(i + 1)).width;
                currentPosition += previousWidth - currentWidth + letterSpacing;
                previousWidth = currentWidth;
            }
        };
        Text.prototype.updateTexture = function updateTexture() {
            var canvas = this.canvas;
            if (this._style.trim) {
                var trimmed = trimCanvas(canvas);
                if (trimmed.data) {
                    canvas.width = trimmed.width;
                    canvas.height = trimmed.height;
                    this.context.putImageData(trimmed.data, 0, 0);
                }
            }
            var texture = this._texture;
            var style = this._style;
            var padding = style.trim ? 0 : style.padding;
            var baseTexture = texture.baseTexture;
            texture.trim.width = texture._frame.width = Math.ceil(canvas.width / this._resolution);
            texture.trim.height = texture._frame.height = Math.ceil(canvas.height / this._resolution);
            texture.trim.x = -padding;
            texture.trim.y = -padding;
            texture.orig.width = texture._frame.width - (padding * 2);
            texture.orig.height = texture._frame.height - (padding * 2);
            this._onTextureUpdate();
            baseTexture.setRealSize(canvas.width, canvas.height, this._resolution);
            this.dirty = false;
        };
        Text.prototype._render = function _render(renderer) {
            if (this._autoResolution && this._resolution !== renderer.resolution) {
                this._resolution = renderer.resolution;
                this.dirty = true;
            }
            this.updateText(true);
            Sprite.prototype._render.call(this, renderer);
        };
        Text.prototype.getLocalBounds = function getLocalBounds(rect) {
            this.updateText(true);
            return Sprite.prototype.getLocalBounds.call(this, rect);
        };
        Text.prototype._calculateBounds = function _calculateBounds() {
            this.updateText(true);
            this.calculateVertices();
            this._bounds.addQuad(this.vertexData);
        };
        Text.prototype._onStyleChange = function _onStyleChange() {
            this.dirty = true;
        };
        Text.prototype._generateFillStyle = function _generateFillStyle(style, lines) {
            if (!Array.isArray(style.fill)) {
                return style.fill;
            }
            else if (style.fill.length === 1) {
                return style.fill[0];
            }
            var gradient;
            var totalIterations;
            var currentIteration;
            var stop;
            var dropShadowCorrection = (style.dropShadow) ? style.dropShadowDistance : 0;
            var width = Math.ceil(this.canvas.width / this._resolution) - dropShadowCorrection;
            var height = Math.ceil(this.canvas.height / this._resolution) - dropShadowCorrection;
            var fill = style.fill.slice();
            var fillGradientStops = style.fillGradientStops.slice();
            if (!fillGradientStops.length) {
                var lengthPlus1 = fill.length + 1;
                for (var i = 1; i < lengthPlus1; ++i) {
                    fillGradientStops.push(i / lengthPlus1);
                }
            }
            fill.unshift(style.fill[0]);
            fillGradientStops.unshift(0);
            fill.push(style.fill[style.fill.length - 1]);
            fillGradientStops.push(1);
            if (style.fillGradientType === TEXT_GRADIENT.LINEAR_VERTICAL) {
                gradient = this.context.createLinearGradient(width / 2, 0, width / 2, height);
                totalIterations = (fill.length + 1) * lines.length;
                currentIteration = 0;
                for (var i$1 = 0; i$1 < lines.length; i$1++) {
                    currentIteration += 1;
                    for (var j = 0; j < fill.length; j++) {
                        if (typeof fillGradientStops[j] === 'number') {
                            stop = (fillGradientStops[j] / lines.length) + (i$1 / lines.length);
                        }
                        else {
                            stop = currentIteration / totalIterations;
                        }
                        gradient.addColorStop(stop, fill[j]);
                        currentIteration++;
                    }
                }
            }
            else {
                gradient = this.context.createLinearGradient(0, height / 2, width, height / 2);
                totalIterations = fill.length + 1;
                currentIteration = 1;
                for (var i$2 = 0; i$2 < fill.length; i$2++) {
                    if (typeof fillGradientStops[i$2] === 'number') {
                        stop = fillGradientStops[i$2];
                    }
                    else {
                        stop = currentIteration / totalIterations;
                    }
                    gradient.addColorStop(stop, fill[i$2]);
                    currentIteration++;
                }
            }
            return gradient;
        };
        Text.prototype.destroy = function destroy(options) {
            if (typeof options === 'boolean') {
                options = { children: options };
            }
            options = Object.assign({}, defaultDestroyOptions, options);
            Sprite.prototype.destroy.call(this, options);
            this.context = null;
            this.canvas = null;
            this._style = null;
        };
        prototypeAccessors.width.get = function () {
            this.updateText(true);
            return Math.abs(this.scale.x) * this._texture.orig.width;
        };
        prototypeAccessors.width.set = function (value) {
            this.updateText(true);
            var s = sign$1(this.scale.x) || 1;
            this.scale.x = s * value / this._texture.orig.width;
            this._width = value;
        };
        prototypeAccessors.height.get = function () {
            this.updateText(true);
            return Math.abs(this.scale.y) * this._texture.orig.height;
        };
        prototypeAccessors.height.set = function (value) {
            this.updateText(true);
            var s = sign$1(this.scale.y) || 1;
            this.scale.y = s * value / this._texture.orig.height;
            this._height = value;
        };
        prototypeAccessors.style.get = function () {
            return this._style;
        };
        prototypeAccessors.style.set = function (style) {
            style = style || {};
            if (style instanceof TextStyle) {
                this._style = style;
            }
            else {
                this._style = new TextStyle(style);
            }
            this.localStyleID = -1;
            this.dirty = true;
        };
        prototypeAccessors.text.get = function () {
            return this._text;
        };
        prototypeAccessors.text.set = function (text) {
            text = String(text === null || text === undefined ? '' : text);
            if (this._text === text) {
                return;
            }
            this._text = text;
            this.dirty = true;
        };
        prototypeAccessors.resolution.get = function () {
            return this._resolution;
        };
        prototypeAccessors.resolution.set = function (value) {
            this._autoResolution = false;
            if (this._resolution === value) {
                return;
            }
            this._resolution = value;
            this.dirty = true;
        };
        Object.defineProperties(Text.prototype, prototypeAccessors);
        return Text;
    }(Sprite));
    settings.UPLOADS_PER_FRAME = 4;
    var CountLimiter = function CountLimiter(maxItemsPerFrame) {
        this.maxItemsPerFrame = maxItemsPerFrame;
        this.itemsLeft = 0;
    };
    CountLimiter.prototype.beginFrame = function beginFrame() {
        this.itemsLeft = this.maxItemsPerFrame;
    };
    CountLimiter.prototype.allowedToUpload = function allowedToUpload() {
        return this.itemsLeft-- > 0;
    };
    var BasePrepare = function BasePrepare(renderer) {
        var this$1 = this;
        this.limiter = new CountLimiter(settings.UPLOADS_PER_FRAME);
        this.renderer = renderer;
        this.uploadHookHelper = null;
        this.queue = [];
        this.addHooks = [];
        this.uploadHooks = [];
        this.completes = [];
        this.ticking = false;
        this.delayedTick = function () {
            if (!this$1.queue) {
                return;
            }
            this$1.prepareItems();
        };
        this.registerFindHook(findText);
        this.registerFindHook(findTextStyle);
        this.registerFindHook(findMultipleBaseTextures);
        this.registerFindHook(findBaseTexture);
        this.registerFindHook(findTexture);
        this.registerUploadHook(drawText);
        this.registerUploadHook(calculateTextStyle);
    };
    BasePrepare.prototype.upload = function upload(item, done) {
        if (typeof item === 'function') {
            done = item;
            item = null;
        }
        if (item) {
            this.add(item);
        }
        if (this.queue.length) {
            if (done) {
                this.completes.push(done);
            }
            if (!this.ticking) {
                this.ticking = true;
                Ticker.system.addOnce(this.tick, this, exports.UPDATE_PRIORITY.UTILITY);
            }
        }
        else if (done) {
            done();
        }
    };
    BasePrepare.prototype.tick = function tick() {
        setTimeout(this.delayedTick, 0);
    };
    BasePrepare.prototype.prepareItems = function prepareItems() {
        this.limiter.beginFrame();
        while (this.queue.length && this.limiter.allowedToUpload()) {
            var item = this.queue[0];
            var uploaded = false;
            if (item && !item._destroyed) {
                for (var i = 0, len = this.uploadHooks.length; i < len; i++) {
                    if (this.uploadHooks[i](this.uploadHookHelper, item)) {
                        this.queue.shift();
                        uploaded = true;
                        break;
                    }
                }
            }
            if (!uploaded) {
                this.queue.shift();
            }
        }
        if (!this.queue.length) {
            this.ticking = false;
            var completes = this.completes.slice(0);
            this.completes.length = 0;
            for (var i$1 = 0, len$1 = completes.length; i$1 < len$1; i$1++) {
                completes[i$1]();
            }
        }
        else {
            Ticker.system.addOnce(this.tick, this, exports.UPDATE_PRIORITY.UTILITY);
        }
    };
    BasePrepare.prototype.registerFindHook = function registerFindHook(addHook) {
        if (addHook) {
            this.addHooks.push(addHook);
        }
        return this;
    };
    BasePrepare.prototype.registerUploadHook = function registerUploadHook(uploadHook) {
        if (uploadHook) {
            this.uploadHooks.push(uploadHook);
        }
        return this;
    };
    BasePrepare.prototype.add = function add(item) {
        for (var i = 0, len = this.addHooks.length; i < len; i++) {
            if (this.addHooks[i](item, this.queue)) {
                break;
            }
        }
        if (item instanceof Container) {
            for (var i$1 = item.children.length - 1; i$1 >= 0; i$1--) {
                this.add(item.children[i$1]);
            }
        }
        return this;
    };
    BasePrepare.prototype.destroy = function destroy() {
        if (this.ticking) {
            Ticker.system.remove(this.tick, this);
        }
        this.ticking = false;
        this.addHooks = null;
        this.uploadHooks = null;
        this.renderer = null;
        this.completes = null;
        this.queue = null;
        this.limiter = null;
        this.uploadHookHelper = null;
    };
    function findMultipleBaseTextures(item, queue) {
        var result = false;
        if (item && item._textures && item._textures.length) {
            for (var i = 0; i < item._textures.length; i++) {
                if (item._textures[i] instanceof Texture) {
                    var baseTexture = item._textures[i].baseTexture;
                    if (queue.indexOf(baseTexture) === -1) {
                        queue.push(baseTexture);
                        result = true;
                    }
                }
            }
        }
        return result;
    }
    function findBaseTexture(item, queue) {
        if (item.baseTexture instanceof BaseTexture) {
            var texture = item.baseTexture;
            if (queue.indexOf(texture) === -1) {
                queue.push(texture);
            }
            return true;
        }
        return false;
    }
    function findTexture(item, queue) {
        if (item._texture && item._texture instanceof Texture) {
            var texture = item._texture.baseTexture;
            if (queue.indexOf(texture) === -1) {
                queue.push(texture);
            }
            return true;
        }
        return false;
    }
    function drawText(helper, item) {
        if (item instanceof Text) {
            item.updateText(true);
            return true;
        }
        return false;
    }
    function calculateTextStyle(helper, item) {
        if (item instanceof TextStyle) {
            var font = item.toFontString();
            TextMetrics.measureFont(font);
            return true;
        }
        return false;
    }
    function findText(item, queue) {
        if (item instanceof Text) {
            if (queue.indexOf(item.style) === -1) {
                queue.push(item.style);
            }
            if (queue.indexOf(item) === -1) {
                queue.push(item);
            }
            var texture = item._texture.baseTexture;
            if (queue.indexOf(texture) === -1) {
                queue.push(texture);
            }
            return true;
        }
        return false;
    }
    function findTextStyle(item, queue) {
        if (item instanceof TextStyle) {
            if (queue.indexOf(item) === -1) {
                queue.push(item);
            }
            return true;
        }
        return false;
    }
    var Prepare = (function (BasePrepare) {
        function Prepare(renderer) {
            BasePrepare.call(this, renderer);
            this.uploadHookHelper = this.renderer;
            this.registerFindHook(findGraphics);
            this.registerUploadHook(uploadBaseTextures);
            this.registerUploadHook(uploadGraphics);
        }
        if (BasePrepare) {
            Prepare.__proto__ = BasePrepare;
        }
        Prepare.prototype = Object.create(BasePrepare && BasePrepare.prototype);
        Prepare.prototype.constructor = Prepare;
        return Prepare;
    }(BasePrepare));
    function uploadBaseTextures(renderer, item) {
        if (item instanceof BaseTexture) {
            if (!item._glTextures[renderer.CONTEXT_UID]) {
                renderer.texture.bind(item);
            }
            return true;
        }
        return false;
    }
    function uploadGraphics(renderer, item) {
        if (!(item instanceof Graphics)) {
            return false;
        }
        var geometry = item.geometry;
        item.finishPoly();
        geometry.updateBatches();
        var batches = geometry.batches;
        for (var i = 0; i < batches.length; i++) {
            var ref = batches[i].style;
            var texture = ref.texture;
            if (texture) {
                uploadBaseTextures(renderer, texture.baseTexture);
            }
        }
        if (!geometry.batchable) {
            renderer.geometry.bind(geometry, item._resolveDirectShader());
        }
        return true;
    }
    function findGraphics(item, queue) {
        if (item instanceof Graphics) {
            queue.push(item);
            return true;
        }
        return false;
    }
    var TimeLimiter = function TimeLimiter(maxMilliseconds) {
        this.maxMilliseconds = maxMilliseconds;
        this.frameStart = 0;
    };
    TimeLimiter.prototype.beginFrame = function beginFrame() {
        this.frameStart = Date.now();
    };
    TimeLimiter.prototype.allowedToUpload = function allowedToUpload() {
        return Date.now() - this.frameStart < this.maxMilliseconds;
    };
    var Spritesheet = function Spritesheet(baseTexture, data, resolutionFilename) {
        if (resolutionFilename === void 0) {
            resolutionFilename = null;
        }
        this.baseTexture = baseTexture;
        this.textures = {};
        this.animations = {};
        this.data = data;
        this.resolution = this._updateResolution(resolutionFilename
            || (this.baseTexture.resource ? this.baseTexture.resource.url : null));
        this._frames = this.data.frames;
        this._frameKeys = Object.keys(this._frames);
        this._batchIndex = 0;
        this._callback = null;
    };
    var staticAccessors$2 = { BATCH_SIZE: { configurable: true } };
    staticAccessors$2.BATCH_SIZE.get = function () {
        return 1000;
    };
    Spritesheet.prototype._updateResolution = function _updateResolution(resolutionFilename) {
        var scale = this.data.meta.scale;
        var resolution = getResolutionOfUrl(resolutionFilename, null);
        if (resolution === null) {
            resolution = scale !== undefined ? parseFloat(scale) : 1;
        }
        if (resolution !== 1) {
            this.baseTexture.setResolution(resolution);
        }
        return resolution;
    };
    Spritesheet.prototype.parse = function parse(callback) {
        this._batchIndex = 0;
        this._callback = callback;
        if (this._frameKeys.length <= Spritesheet.BATCH_SIZE) {
            this._processFrames(0);
            this._processAnimations();
            this._parseComplete();
        }
        else {
            this._nextBatch();
        }
    };
    Spritesheet.prototype._processFrames = function _processFrames(initialFrameIndex) {
        var frameIndex = initialFrameIndex;
        var maxFrames = Spritesheet.BATCH_SIZE;
        while (frameIndex - initialFrameIndex < maxFrames && frameIndex < this._frameKeys.length) {
            var i = this._frameKeys[frameIndex];
            var data = this._frames[i];
            var rect = data.frame;
            if (rect) {
                var frame = null;
                var trim = null;
                var sourceSize = data.trimmed !== false && data.sourceSize
                    ? data.sourceSize : data.frame;
                var orig = new Rectangle(0, 0, Math.floor(sourceSize.w) / this.resolution, Math.floor(sourceSize.h) / this.resolution);
                if (data.rotated) {
                    frame = new Rectangle(Math.floor(rect.x) / this.resolution, Math.floor(rect.y) / this.resolution, Math.floor(rect.h) / this.resolution, Math.floor(rect.w) / this.resolution);
                }
                else {
                    frame = new Rectangle(Math.floor(rect.x) / this.resolution, Math.floor(rect.y) / this.resolution, Math.floor(rect.w) / this.resolution, Math.floor(rect.h) / this.resolution);
                }
                if (data.trimmed !== false && data.spriteSourceSize) {
                    trim = new Rectangle(Math.floor(data.spriteSourceSize.x) / this.resolution, Math.floor(data.spriteSourceSize.y) / this.resolution, Math.floor(rect.w) / this.resolution, Math.floor(rect.h) / this.resolution);
                }
                this.textures[i] = new Texture(this.baseTexture, frame, orig, trim, data.rotated ? 2 : 0, data.anchor);
                Texture.addToCache(this.textures[i], i);
            }
            frameIndex++;
        }
    };
    Spritesheet.prototype._processAnimations = function _processAnimations() {
        var animations = this.data.animations || {};
        for (var animName in animations) {
            this.animations[animName] = [];
            for (var i = 0; i < animations[animName].length; i++) {
                var frameName = animations[animName][i];
                this.animations[animName].push(this.textures[frameName]);
            }
        }
    };
    Spritesheet.prototype._parseComplete = function _parseComplete() {
        var callback = this._callback;
        this._callback = null;
        this._batchIndex = 0;
        callback.call(this, this.textures);
    };
    Spritesheet.prototype._nextBatch = function _nextBatch() {
        var this$1 = this;
        this._processFrames(this._batchIndex * Spritesheet.BATCH_SIZE);
        this._batchIndex++;
        setTimeout(function () {
            if (this$1._batchIndex * Spritesheet.BATCH_SIZE < this$1._frameKeys.length) {
                this$1._nextBatch();
            }
            else {
                this$1._processAnimations();
                this$1._parseComplete();
            }
        }, 0);
    };
    Spritesheet.prototype.destroy = function destroy(destroyBase) {
        if (destroyBase === void 0) {
            destroyBase = false;
        }
        for (var i in this.textures) {
            this.textures[i].destroy();
        }
        this._frames = null;
        this._frameKeys = null;
        this.data = null;
        this.textures = null;
        if (destroyBase) {
            this.baseTexture.destroy();
        }
        this.baseTexture = null;
    };
    Object.defineProperties(Spritesheet, staticAccessors$2);
    var SpritesheetLoader = function SpritesheetLoader() { };
    SpritesheetLoader.use = function use(resource, next) {
        var imageResourceName = (resource.name) + "_image";
        if (!resource.data
            || resource.type !== LoaderResource.TYPE.JSON
            || !resource.data.frames
            || this.resources[imageResourceName]) {
            next();
            return;
        }
        var loadOptions = {
            crossOrigin: resource.crossOrigin,
            metadata: resource.metadata.imageMetadata,
            parentResource: resource,
        };
        var resourcePath = SpritesheetLoader.getResourcePath(resource, this.baseUrl);
        this.add(imageResourceName, resourcePath, loadOptions, function onImageLoad(res) {
            if (res.error) {
                next(res.error);
                return;
            }
            var spritesheet = new Spritesheet(res.texture.baseTexture, resource.data, resource.url);
            spritesheet.parse(function () {
                resource.spritesheet = spritesheet;
                resource.textures = spritesheet.textures;
                next();
            });
        });
    };
    SpritesheetLoader.getResourcePath = function getResourcePath(resource, baseUrl) {
        if (resource.isDataUrl) {
            return resource.data.meta.image;
        }
        return url.resolve(resource.url.replace(baseUrl, ''), resource.data.meta.image);
    };
    var tempPoint$1 = new Point();
    var TilingSprite = (function (Sprite) {
        function TilingSprite(texture, width, height) {
            if (width === void 0) {
                width = 100;
            }
            if (height === void 0) {
                height = 100;
            }
            Sprite.call(this, texture);
            this.tileTransform = new Transform();
            this._width = width;
            this._height = height;
            this._canvasPattern = null;
            this.uvMatrix = texture.uvMatrix || new TextureMatrix(texture);
            this.pluginName = 'tilingSprite';
            this.uvRespectAnchor = false;
        }
        if (Sprite) {
            TilingSprite.__proto__ = Sprite;
        }
        TilingSprite.prototype = Object.create(Sprite && Sprite.prototype);
        TilingSprite.prototype.constructor = TilingSprite;
        var prototypeAccessors = { clampMargin: { configurable: true }, tileScale: { configurable: true }, tilePosition: { configurable: true }, width: { configurable: true }, height: { configurable: true } };
        prototypeAccessors.clampMargin.get = function () {
            return this.uvMatrix.clampMargin;
        };
        prototypeAccessors.clampMargin.set = function (value) {
            this.uvMatrix.clampMargin = value;
            this.uvMatrix.update(true);
        };
        prototypeAccessors.tileScale.get = function () {
            return this.tileTransform.scale;
        };
        prototypeAccessors.tileScale.set = function (value) {
            this.tileTransform.scale.copyFrom(value);
        };
        prototypeAccessors.tilePosition.get = function () {
            return this.tileTransform.position;
        };
        prototypeAccessors.tilePosition.set = function (value) {
            this.tileTransform.position.copyFrom(value);
        };
        TilingSprite.prototype._onTextureUpdate = function _onTextureUpdate() {
            if (this.uvMatrix) {
                this.uvMatrix.texture = this._texture;
            }
            this._cachedTint = 0xFFFFFF;
        };
        TilingSprite.prototype._render = function _render(renderer) {
            var texture = this._texture;
            if (!texture || !texture.valid) {
                return;
            }
            this.tileTransform.updateLocalTransform();
            this.uvMatrix.update();
            renderer.batch.setObjectRenderer(renderer.plugins[this.pluginName]);
            renderer.plugins[this.pluginName].render(this);
        };
        TilingSprite.prototype._calculateBounds = function _calculateBounds() {
            var minX = this._width * -this._anchor._x;
            var minY = this._height * -this._anchor._y;
            var maxX = this._width * (1 - this._anchor._x);
            var maxY = this._height * (1 - this._anchor._y);
            this._bounds.addFrame(this.transform, minX, minY, maxX, maxY);
        };
        TilingSprite.prototype.getLocalBounds = function getLocalBounds(rect) {
            if (this.children.length === 0) {
                this._bounds.minX = this._width * -this._anchor._x;
                this._bounds.minY = this._height * -this._anchor._y;
                this._bounds.maxX = this._width * (1 - this._anchor._x);
                this._bounds.maxY = this._height * (1 - this._anchor._y);
                if (!rect) {
                    if (!this._localBoundsRect) {
                        this._localBoundsRect = new Rectangle();
                    }
                    rect = this._localBoundsRect;
                }
                return this._bounds.getRectangle(rect);
            }
            return Sprite.prototype.getLocalBounds.call(this, rect);
        };
        TilingSprite.prototype.containsPoint = function containsPoint(point) {
            this.worldTransform.applyInverse(point, tempPoint$1);
            var width = this._width;
            var height = this._height;
            var x1 = -width * this.anchor._x;
            if (tempPoint$1.x >= x1 && tempPoint$1.x < x1 + width) {
                var y1 = -height * this.anchor._y;
                if (tempPoint$1.y >= y1 && tempPoint$1.y < y1 + height) {
                    return true;
                }
            }
            return false;
        };
        TilingSprite.prototype.destroy = function destroy(options) {
            Sprite.prototype.destroy.call(this, options);
            this.tileTransform = null;
            this.uvMatrix = null;
        };
        TilingSprite.from = function from(source, width, height) {
            return new TilingSprite(Texture.from(source), width, height);
        };
        TilingSprite.fromFrame = function fromFrame(frameId, width, height) {
            var texture = TextureCache[frameId];
            if (!texture) {
                throw new Error(("The frameId \"" + frameId + "\" does not exist in the texture cache " + (this)));
            }
            return new TilingSprite(texture, width, height);
        };
        TilingSprite.fromImage = function fromImage(imageId, width, height, options) {
            if (options && typeof options !== 'object') {
                options = {
                    scaleMode: arguments[4],
                    resourceOptions: {
                        crossorigin: arguments[3],
                    },
                };
            }
            return new TilingSprite(Texture.from(imageId, options), width, height);
        };
        prototypeAccessors.width.get = function () {
            return this._width;
        };
        prototypeAccessors.width.set = function (value) {
            this._width = value;
        };
        prototypeAccessors.height.get = function () {
            return this._height;
        };
        prototypeAccessors.height.set = function (value) {
            this._height = value;
        };
        Object.defineProperties(TilingSprite.prototype, prototypeAccessors);
        return TilingSprite;
    }(Sprite));
    var vertex$2 = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\nuniform mat3 translationMatrix;\nuniform mat3 uTransform;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n\n    vTextureCoord = (uTransform * vec3(aTextureCoord, 1.0)).xy;\n}\n";
    var fragment$2 = "varying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform vec4 uColor;\nuniform mat3 uMapCoord;\nuniform vec4 uClampFrame;\nuniform vec2 uClampOffset;\n\nvoid main(void)\n{\n    vec2 coord = vTextureCoord - floor(vTextureCoord - uClampOffset);\n    coord = (uMapCoord * vec3(coord, 1.0)).xy;\n    coord = clamp(coord, uClampFrame.xy, uClampFrame.zw);\n\n    vec4 texSample = texture2D(uSampler, coord);\n    gl_FragColor = texSample * uColor;\n}\n";
    var fragmentSimple = "varying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform vec4 uColor;\n\nvoid main(void)\n{\n    vec4 sample = texture2D(uSampler, vTextureCoord);\n    gl_FragColor = sample * uColor;\n}\n";
    var tempMat$1 = new Matrix();
    var TilingSpriteRenderer = (function (ObjectRenderer) {
        function TilingSpriteRenderer(renderer) {
            ObjectRenderer.call(this, renderer);
            var uniforms = { globals: this.renderer.globalUniforms };
            this.shader = Shader.from(vertex$2, fragment$2, uniforms);
            this.simpleShader = Shader.from(vertex$2, fragmentSimple, uniforms);
            this.quad = new QuadUv();
            this.state = State.for2d();
        }
        if (ObjectRenderer) {
            TilingSpriteRenderer.__proto__ = ObjectRenderer;
        }
        TilingSpriteRenderer.prototype = Object.create(ObjectRenderer && ObjectRenderer.prototype);
        TilingSpriteRenderer.prototype.constructor = TilingSpriteRenderer;
        TilingSpriteRenderer.prototype.render = function render(ts) {
            var renderer = this.renderer;
            var quad = this.quad;
            var vertices = quad.vertices;
            vertices[0] = vertices[6] = (ts._width) * -ts.anchor.x;
            vertices[1] = vertices[3] = ts._height * -ts.anchor.y;
            vertices[2] = vertices[4] = (ts._width) * (1.0 - ts.anchor.x);
            vertices[5] = vertices[7] = ts._height * (1.0 - ts.anchor.y);
            if (ts.uvRespectAnchor) {
                vertices = quad.uvs;
                vertices[0] = vertices[6] = -ts.anchor.x;
                vertices[1] = vertices[3] = -ts.anchor.y;
                vertices[2] = vertices[4] = 1.0 - ts.anchor.x;
                vertices[5] = vertices[7] = 1.0 - ts.anchor.y;
            }
            quad.invalidate();
            var tex = ts._texture;
            var baseTex = tex.baseTexture;
            var lt = ts.tileTransform.localTransform;
            var uv = ts.uvMatrix;
            var isSimple = baseTex.isPowerOfTwo
                && tex.frame.width === baseTex.width && tex.frame.height === baseTex.height;
            if (isSimple) {
                if (!baseTex._glTextures[renderer.CONTEXT_UID]) {
                    if (baseTex.wrapMode === exports.WRAP_MODES.CLAMP) {
                        baseTex.wrapMode = exports.WRAP_MODES.REPEAT;
                    }
                }
                else {
                    isSimple = baseTex.wrapMode !== exports.WRAP_MODES.CLAMP;
                }
            }
            var shader = isSimple ? this.simpleShader : this.shader;
            var w = tex.width;
            var h = tex.height;
            var W = ts._width;
            var H = ts._height;
            tempMat$1.set(lt.a * w / W, lt.b * w / H, lt.c * h / W, lt.d * h / H, lt.tx / W, lt.ty / H);
            tempMat$1.invert();
            if (isSimple) {
                tempMat$1.prepend(uv.mapCoord);
            }
            else {
                shader.uniforms.uMapCoord = uv.mapCoord.toArray(true);
                shader.uniforms.uClampFrame = uv.uClampFrame;
                shader.uniforms.uClampOffset = uv.uClampOffset;
            }
            shader.uniforms.uTransform = tempMat$1.toArray(true);
            shader.uniforms.uColor = premultiplyTintToRgba(ts.tint, ts.worldAlpha, shader.uniforms.uColor, baseTex.alphaMode);
            shader.uniforms.translationMatrix = ts.transform.worldTransform.toArray(true);
            shader.uniforms.uSampler = tex;
            renderer.shader.bind(shader);
            renderer.geometry.bind(quad);
            this.state.blendMode = correctBlendMode(ts.blendMode, baseTex.alphaMode);
            renderer.state.set(this.state);
            renderer.geometry.draw(this.renderer.gl.TRIANGLES, 6, 0);
        };
        return TilingSpriteRenderer;
    }(ObjectRenderer));
    var BitmapText = (function (Container) {
        function BitmapText(text, style) {
            var this$1 = this;
            if (style === void 0) {
                style = {};
            }
            Container.call(this);
            this._textWidth = 0;
            this._textHeight = 0;
            this._glyphs = [];
            this._font = {
                tint: style.tint !== undefined ? style.tint : 0xFFFFFF,
                align: style.align || 'left',
                name: null,
                size: 0,
            };
            this.font = style.font;
            this._text = text;
            this._maxWidth = 0;
            this._maxLineHeight = 0;
            this._letterSpacing = 0;
            this._anchor = new ObservablePoint(function () { this$1.dirty = true; }, this, 0, 0);
            this.dirty = false;
            this.roundPixels = settings.ROUND_PIXELS;
            this.updateText();
        }
        if (Container) {
            BitmapText.__proto__ = Container;
        }
        BitmapText.prototype = Object.create(Container && Container.prototype);
        BitmapText.prototype.constructor = BitmapText;
        var prototypeAccessors = { tint: { configurable: true }, align: { configurable: true }, anchor: { configurable: true }, font: { configurable: true }, text: { configurable: true }, maxWidth: { configurable: true }, maxLineHeight: { configurable: true }, textWidth: { configurable: true }, letterSpacing: { configurable: true }, textHeight: { configurable: true } };
        BitmapText.prototype.updateText = function updateText() {
            var data = BitmapText.fonts[this._font.name];
            var scale = this._font.size / data.size;
            var pos = new Point();
            var chars = [];
            var lineWidths = [];
            var text = this._text.replace(/(?:\r\n|\r)/g, '\n') || ' ';
            var textLength = text.length;
            var maxWidth = this._maxWidth * data.size / this._font.size;
            var prevCharCode = null;
            var lastLineWidth = 0;
            var maxLineWidth = 0;
            var line = 0;
            var lastBreakPos = -1;
            var lastBreakWidth = 0;
            var spacesRemoved = 0;
            var maxLineHeight = 0;
            for (var i = 0; i < textLength; i++) {
                var charCode = text.charCodeAt(i);
                var char = text.charAt(i);
                if ((/(?:\s)/).test(char)) {
                    lastBreakPos = i;
                    lastBreakWidth = lastLineWidth;
                }
                if (char === '\r' || char === '\n') {
                    lineWidths.push(lastLineWidth);
                    maxLineWidth = Math.max(maxLineWidth, lastLineWidth);
                    ++line;
                    ++spacesRemoved;
                    pos.x = 0;
                    pos.y += data.lineHeight;
                    prevCharCode = null;
                    continue;
                }
                var charData = data.chars[charCode];
                if (!charData) {
                    continue;
                }
                if (prevCharCode && charData.kerning[prevCharCode]) {
                    pos.x += charData.kerning[prevCharCode];
                }
                chars.push({
                    texture: charData.texture,
                    line: line,
                    charCode: charCode,
                    position: new Point(pos.x + charData.xOffset + (this._letterSpacing / 2), pos.y + charData.yOffset),
                });
                pos.x += charData.xAdvance + this._letterSpacing;
                lastLineWidth = pos.x;
                maxLineHeight = Math.max(maxLineHeight, (charData.yOffset + charData.texture.height));
                prevCharCode = charCode;
                if (lastBreakPos !== -1 && maxWidth > 0 && pos.x > maxWidth) {
                    ++spacesRemoved;
                    removeItems(chars, 1 + lastBreakPos - spacesRemoved, 1 + i - lastBreakPos);
                    i = lastBreakPos;
                    lastBreakPos = -1;
                    lineWidths.push(lastBreakWidth);
                    maxLineWidth = Math.max(maxLineWidth, lastBreakWidth);
                    line++;
                    pos.x = 0;
                    pos.y += data.lineHeight;
                    prevCharCode = null;
                }
            }
            var lastChar = text.charAt(text.length - 1);
            if (lastChar !== '\r' && lastChar !== '\n') {
                if ((/(?:\s)/).test(lastChar)) {
                    lastLineWidth = lastBreakWidth;
                }
                lineWidths.push(lastLineWidth);
                maxLineWidth = Math.max(maxLineWidth, lastLineWidth);
            }
            var lineAlignOffsets = [];
            for (var i$1 = 0; i$1 <= line; i$1++) {
                var alignOffset = 0;
                if (this._font.align === 'right') {
                    alignOffset = maxLineWidth - lineWidths[i$1];
                }
                else if (this._font.align === 'center') {
                    alignOffset = (maxLineWidth - lineWidths[i$1]) / 2;
                }
                lineAlignOffsets.push(alignOffset);
            }
            var lenChars = chars.length;
            var tint = this.tint;
            for (var i$2 = 0; i$2 < lenChars; i$2++) {
                var c = this._glyphs[i$2];
                if (c) {
                    c.texture = chars[i$2].texture;
                }
                else {
                    c = new Sprite(chars[i$2].texture);
                    c.roundPixels = this.roundPixels;
                    this._glyphs.push(c);
                }
                c.position.x = (chars[i$2].position.x + lineAlignOffsets[chars[i$2].line]) * scale;
                c.position.y = chars[i$2].position.y * scale;
                c.scale.x = c.scale.y = scale;
                c.tint = tint;
                if (!c.parent) {
                    this.addChild(c);
                }
            }
            for (var i$3 = lenChars; i$3 < this._glyphs.length; ++i$3) {
                this.removeChild(this._glyphs[i$3]);
            }
            this._textWidth = maxLineWidth * scale;
            this._textHeight = (pos.y + data.lineHeight) * scale;
            if (this.anchor.x !== 0 || this.anchor.y !== 0) {
                for (var i$4 = 0; i$4 < lenChars; i$4++) {
                    this._glyphs[i$4].x -= this._textWidth * this.anchor.x;
                    this._glyphs[i$4].y -= this._textHeight * this.anchor.y;
                }
            }
            this._maxLineHeight = maxLineHeight * scale;
        };
        BitmapText.prototype.updateTransform = function updateTransform() {
            this.validate();
            this.containerUpdateTransform();
        };
        BitmapText.prototype.getLocalBounds = function getLocalBounds() {
            this.validate();
            return Container.prototype.getLocalBounds.call(this);
        };
        BitmapText.prototype.validate = function validate() {
            if (this.dirty) {
                this.updateText();
                this.dirty = false;
            }
        };
        prototypeAccessors.tint.get = function () {
            return this._font.tint;
        };
        prototypeAccessors.tint.set = function (value) {
            this._font.tint = (typeof value === 'number' && value >= 0) ? value : 0xFFFFFF;
            this.dirty = true;
        };
        prototypeAccessors.align.get = function () {
            return this._font.align;
        };
        prototypeAccessors.align.set = function (value) {
            this._font.align = value || 'left';
            this.dirty = true;
        };
        prototypeAccessors.anchor.get = function () {
            return this._anchor;
        };
        prototypeAccessors.anchor.set = function (value) {
            if (typeof value === 'number') {
                this._anchor.set(value);
            }
            else {
                this._anchor.copyFrom(value);
            }
        };
        prototypeAccessors.font.get = function () {
            return this._font;
        };
        prototypeAccessors.font.set = function (value) {
            if (!value) {
                return;
            }
            if (typeof value === 'string') {
                value = value.split(' ');
                this._font.name = value.length === 1 ? value[0] : value.slice(1).join(' ');
                this._font.size = value.length >= 2 ? parseInt(value[0], 10) : BitmapText.fonts[this._font.name].size;
            }
            else {
                this._font.name = value.name;
                this._font.size = typeof value.size === 'number' ? value.size : parseInt(value.size, 10);
            }
            this.dirty = true;
        };
        prototypeAccessors.text.get = function () {
            return this._text;
        };
        prototypeAccessors.text.set = function (text) {
            text = String(text === null || text === undefined ? '' : text);
            if (this._text === text) {
                return;
            }
            this._text = text;
            this.dirty = true;
        };
        prototypeAccessors.maxWidth.get = function () {
            return this._maxWidth;
        };
        prototypeAccessors.maxWidth.set = function (value) {
            if (this._maxWidth === value) {
                return;
            }
            this._maxWidth = value;
            this.dirty = true;
        };
        prototypeAccessors.maxLineHeight.get = function () {
            this.validate();
            return this._maxLineHeight;
        };
        prototypeAccessors.textWidth.get = function () {
            this.validate();
            return this._textWidth;
        };
        prototypeAccessors.letterSpacing.get = function () {
            return this._letterSpacing;
        };
        prototypeAccessors.letterSpacing.set = function (value) {
            if (this._letterSpacing !== value) {
                this._letterSpacing = value;
                this.dirty = true;
            }
        };
        prototypeAccessors.textHeight.get = function () {
            this.validate();
            return this._textHeight;
        };
        BitmapText.registerFont = function registerFont(xml, textures) {
            var data = {};
            var info = xml.getElementsByTagName('info')[0];
            var common = xml.getElementsByTagName('common')[0];
            var pages = xml.getElementsByTagName('page');
            var res = getResolutionOfUrl(pages[0].getAttribute('file'), settings.RESOLUTION);
            var pagesTextures = {};
            data.font = info.getAttribute('face');
            data.size = parseInt(info.getAttribute('size'), 10);
            data.lineHeight = parseInt(common.getAttribute('lineHeight'), 10) / res;
            data.chars = {};
            if (textures instanceof Texture) {
                textures = [textures];
            }
            for (var i = 0; i < pages.length; i++) {
                var id = pages[i].getAttribute('id');
                var file = pages[i].getAttribute('file');
                pagesTextures[id] = textures instanceof Array ? textures[i] : textures[file];
            }
            var letters = xml.getElementsByTagName('char');
            for (var i$1 = 0; i$1 < letters.length; i$1++) {
                var letter = letters[i$1];
                var charCode = parseInt(letter.getAttribute('id'), 10);
                var page = letter.getAttribute('page') || 0;
                var textureRect = new Rectangle((parseInt(letter.getAttribute('x'), 10) / res) + (pagesTextures[page].frame.x / res), (parseInt(letter.getAttribute('y'), 10) / res) + (pagesTextures[page].frame.y / res), parseInt(letter.getAttribute('width'), 10) / res, parseInt(letter.getAttribute('height'), 10) / res);
                data.chars[charCode] = {
                    xOffset: parseInt(letter.getAttribute('xoffset'), 10) / res,
                    yOffset: parseInt(letter.getAttribute('yoffset'), 10) / res,
                    xAdvance: parseInt(letter.getAttribute('xadvance'), 10) / res,
                    kerning: {},
                    texture: new Texture(pagesTextures[page].baseTexture, textureRect),
                    page: page,
                };
            }
            var kernings = xml.getElementsByTagName('kerning');
            for (var i$2 = 0; i$2 < kernings.length; i$2++) {
                var kerning = kernings[i$2];
                var first = parseInt(kerning.getAttribute('first'), 10) / res;
                var second = parseInt(kerning.getAttribute('second'), 10) / res;
                var amount = parseInt(kerning.getAttribute('amount'), 10) / res;
                if (data.chars[second]) {
                    data.chars[second].kerning[first] = amount;
                }
            }
            BitmapText.fonts[data.font] = data;
            return data;
        };
        Object.defineProperties(BitmapText.prototype, prototypeAccessors);
        return BitmapText;
    }(Container));
    BitmapText.fonts = {};
    var BitmapFontLoader = function BitmapFontLoader() { };
    BitmapFontLoader.parse = function parse(resource, texture) {
        resource.bitmapFont = BitmapText.registerFont(resource.data, texture);
    };
    BitmapFontLoader.add = function add() {
        LoaderResource.setExtensionXhrType('fnt', LoaderResource.XHR_RESPONSE_TYPE.DOCUMENT);
    };
    BitmapFontLoader.dirname = function dirname(url) {
        var dir = url
            .replace(/\\/g, '/')
            .replace(/\/$/, '')
            .replace(/\/[^\/]*$/, '');
        if (dir === url) {
            return '.';
        }
        else if (dir === '') {
            return '/';
        }
        return dir;
    };
    BitmapFontLoader.use = function use(resource, next) {
        if (!resource.data || resource.type !== LoaderResource.TYPE.XML) {
            next();
            return;
        }
        if (resource.data.getElementsByTagName('page').length === 0
            || resource.data.getElementsByTagName('info').length === 0
            || resource.data.getElementsByTagName('info')[0].getAttribute('face') === null) {
            next();
            return;
        }
        var xmlUrl = !resource.isDataUrl ? BitmapFontLoader.dirname(resource.url) : '';
        if (resource.isDataUrl) {
            if (xmlUrl === '.') {
                xmlUrl = '';
            }
            if (this.baseUrl && xmlUrl) {
                if (this.baseUrl.charAt(this.baseUrl.length - 1) === '/') {
                    xmlUrl += '/';
                }
            }
        }
        xmlUrl = xmlUrl.replace(this.baseUrl, '');
        if (xmlUrl && xmlUrl.charAt(xmlUrl.length - 1) !== '/') {
            xmlUrl += '/';
        }
        var pages = resource.data.getElementsByTagName('page');
        var textures = {};
        var completed = function (page) {
            textures[page.metadata.pageFile] = page.texture;
            if (Object.keys(textures).length === pages.length) {
                BitmapFontLoader.parse(resource, textures);
                next();
            }
        };
        for (var i = 0; i < pages.length; ++i) {
            var pageFile = pages[i].getAttribute('file');
            var url = xmlUrl + pageFile;
            var exists = false;
            for (var name in this.resources) {
                var bitmapResource = this.resources[name];
                if (bitmapResource.url === url) {
                    bitmapResource.metadata.pageFile = pageFile;
                    if (bitmapResource.texture) {
                        completed(bitmapResource);
                    }
                    else {
                        bitmapResource.onAfterMiddleware.add(completed);
                    }
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                var options = {
                    crossOrigin: resource.crossOrigin,
                    loadType: LoaderResource.LOAD_TYPE.IMAGE,
                    metadata: Object.assign({ pageFile: pageFile }, resource.metadata.imageMetadata),
                    parentResource: resource,
                };
                this.add(url, options, completed);
            }
        }
    };
    var fragment$3 = "varying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform float uAlpha;\n\nvoid main(void)\n{\n   gl_FragColor = texture2D(uSampler, vTextureCoord) * uAlpha;\n}\n";
    var AlphaFilter = (function (Filter) {
        function AlphaFilter(alpha) {
            if (alpha === void 0) {
                alpha = 1.0;
            }
            Filter.call(this, _default, fragment$3, { uAlpha: 1 });
            this.alpha = alpha;
        }
        if (Filter) {
            AlphaFilter.__proto__ = Filter;
        }
        AlphaFilter.prototype = Object.create(Filter && Filter.prototype);
        AlphaFilter.prototype.constructor = AlphaFilter;
        var prototypeAccessors = { alpha: { configurable: true } };
        prototypeAccessors.alpha.get = function () {
            return this.uniforms.uAlpha;
        };
        prototypeAccessors.alpha.set = function (value) {
            this.uniforms.uAlpha = value;
        };
        Object.defineProperties(AlphaFilter.prototype, prototypeAccessors);
        return AlphaFilter;
    }(Filter));
    var vertTemplate = "\n    attribute vec2 aVertexPosition;\n\n    uniform mat3 projectionMatrix;\n\n    uniform float strength;\n\n    varying vec2 vBlurTexCoords[%size%];\n\n    uniform vec4 inputSize;\n    uniform vec4 outputFrame;\n\n    vec4 filterVertexPosition( void )\n    {\n        vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;\n\n        return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);\n    }\n\n    vec2 filterTextureCoord( void )\n    {\n        return aVertexPosition * (outputFrame.zw * inputSize.zw);\n    }\n\n    void main(void)\n    {\n        gl_Position = filterVertexPosition();\n\n        vec2 textureCoord = filterTextureCoord();\n        %blur%\n    }";
    function generateBlurVertSource(kernelSize, x) {
        var halfLength = Math.ceil(kernelSize / 2);
        var vertSource = vertTemplate;
        var blurLoop = '';
        var template;
        if (x) {
            template = 'vBlurTexCoords[%index%] =  textureCoord + vec2(%sampleIndex% * strength, 0.0);';
        }
        else {
            template = 'vBlurTexCoords[%index%] =  textureCoord + vec2(0.0, %sampleIndex% * strength);';
        }
        for (var i = 0; i < kernelSize; i++) {
            var blur = template.replace('%index%', i);
            blur = blur.replace('%sampleIndex%', ((i - (halfLength - 1)) + ".0"));
            blurLoop += blur;
            blurLoop += '\n';
        }
        vertSource = vertSource.replace('%blur%', blurLoop);
        vertSource = vertSource.replace('%size%', kernelSize);
        return vertSource;
    }
    var GAUSSIAN_VALUES = {
        5: [0.153388, 0.221461, 0.250301],
        7: [0.071303, 0.131514, 0.189879, 0.214607],
        9: [0.028532, 0.067234, 0.124009, 0.179044, 0.20236],
        11: [0.0093, 0.028002, 0.065984, 0.121703, 0.175713, 0.198596],
        13: [0.002406, 0.009255, 0.027867, 0.065666, 0.121117, 0.174868, 0.197641],
        15: [0.000489, 0.002403, 0.009246, 0.02784, 0.065602, 0.120999, 0.174697, 0.197448],
    };
    var fragTemplate$1 = [
        'varying vec2 vBlurTexCoords[%size%];',
        'uniform sampler2D uSampler;',
        'void main(void)',
        '{',
        '    gl_FragColor = vec4(0.0);',
        '    %blur%',
        '}'
    ].join('\n');
    function generateBlurFragSource(kernelSize) {
        var kernel = GAUSSIAN_VALUES[kernelSize];
        var halfLength = kernel.length;
        var fragSource = fragTemplate$1;
        var blurLoop = '';
        var template = 'gl_FragColor += texture2D(uSampler, vBlurTexCoords[%index%]) * %value%;';
        var value;
        for (var i = 0; i < kernelSize; i++) {
            var blur = template.replace('%index%', i);
            value = i;
            if (i >= halfLength) {
                value = kernelSize - i - 1;
            }
            blur = blur.replace('%value%', kernel[value]);
            blurLoop += blur;
            blurLoop += '\n';
        }
        fragSource = fragSource.replace('%blur%', blurLoop);
        fragSource = fragSource.replace('%size%', kernelSize);
        return fragSource;
    }
    var BlurFilterPass = (function (Filter) {
        function BlurFilterPass(horizontal, strength, quality, resolution, kernelSize) {
            kernelSize = kernelSize || 5;
            var vertSrc = generateBlurVertSource(kernelSize, horizontal);
            var fragSrc = generateBlurFragSource(kernelSize);
            Filter.call(this, vertSrc, fragSrc);
            this.horizontal = horizontal;
            this.resolution = resolution || settings.RESOLUTION;
            this._quality = 0;
            this.quality = quality || 4;
            this.blur = strength || 8;
        }
        if (Filter) {
            BlurFilterPass.__proto__ = Filter;
        }
        BlurFilterPass.prototype = Object.create(Filter && Filter.prototype);
        BlurFilterPass.prototype.constructor = BlurFilterPass;
        var prototypeAccessors = { blur: { configurable: true }, quality: { configurable: true } };
        BlurFilterPass.prototype.apply = function apply(filterManager, input, output, clear) {
            if (output) {
                if (this.horizontal) {
                    this.uniforms.strength = (1 / output.width) * (output.width / input.width);
                }
                else {
                    this.uniforms.strength = (1 / output.height) * (output.height / input.height);
                }
            }
            else {
                if (this.horizontal) {
                    this.uniforms.strength = (1 / filterManager.renderer.width) * (filterManager.renderer.width / input.width);
                }
                else {
                    this.uniforms.strength = (1 / filterManager.renderer.height) * (filterManager.renderer.height / input.height);
                }
            }
            this.uniforms.strength *= this.strength;
            this.uniforms.strength /= this.passes;
            if (this.passes === 1) {
                filterManager.applyFilter(this, input, output, clear);
            }
            else {
                var renderTarget = filterManager.getFilterTexture();
                var renderer = filterManager.renderer;
                var flip = input;
                var flop = renderTarget;
                this.state.blend = false;
                filterManager.applyFilter(this, flip, flop, true);
                for (var i = 1; i < this.passes - 1; i++) {
                    renderer.renderTexture.bind(flip, flip.filterFrame);
                    this.uniforms.uSampler = flop;
                    var temp = flop;
                    flop = flip;
                    flip = temp;
                    renderer.shader.bind(this);
                    renderer.geometry.draw(5);
                }
                this.state.blend = true;
                filterManager.applyFilter(this, flop, output, clear);
                filterManager.returnFilterTexture(renderTarget);
            }
        };
        prototypeAccessors.blur.get = function () {
            return this.strength;
        };
        prototypeAccessors.blur.set = function (value) {
            this.padding = 1 + (Math.abs(value) * 2);
            this.strength = value;
        };
        prototypeAccessors.quality.get = function () {
            return this._quality;
        };
        prototypeAccessors.quality.set = function (value) {
            this._quality = value;
            this.passes = value;
        };
        Object.defineProperties(BlurFilterPass.prototype, prototypeAccessors);
        return BlurFilterPass;
    }(Filter));
    var BlurFilter = (function (Filter) {
        function BlurFilter(strength, quality, resolution, kernelSize) {
            Filter.call(this);
            this.blurXFilter = new BlurFilterPass(true, strength, quality, resolution, kernelSize);
            this.blurYFilter = new BlurFilterPass(false, strength, quality, resolution, kernelSize);
            this.resolution = resolution || settings.RESOLUTION;
            this.quality = quality || 4;
            this.blur = strength || 8;
            this.repeatEdgePixels = false;
        }
        if (Filter) {
            BlurFilter.__proto__ = Filter;
        }
        BlurFilter.prototype = Object.create(Filter && Filter.prototype);
        BlurFilter.prototype.constructor = BlurFilter;
        var prototypeAccessors = { blur: { configurable: true }, quality: { configurable: true }, blurX: { configurable: true }, blurY: { configurable: true }, blendMode: { configurable: true }, repeatEdgePixels: { configurable: true } };
        BlurFilter.prototype.apply = function apply(filterManager, input, output, clear) {
            var xStrength = Math.abs(this.blurXFilter.strength);
            var yStrength = Math.abs(this.blurYFilter.strength);
            if (xStrength && yStrength) {
                var renderTarget = filterManager.getFilterTexture();
                this.blurXFilter.apply(filterManager, input, renderTarget, true);
                this.blurYFilter.apply(filterManager, renderTarget, output, clear);
                filterManager.returnFilterTexture(renderTarget);
            }
            else if (yStrength) {
                this.blurYFilter.apply(filterManager, input, output, clear);
            }
            else {
                this.blurXFilter.apply(filterManager, input, output, clear);
            }
        };
        BlurFilter.prototype.updatePadding = function updatePadding() {
            if (this._repeatEdgePixels) {
                this.padding = 0;
            }
            else {
                this.padding = Math.max(Math.abs(this.blurXFilter.strength), Math.abs(this.blurYFilter.strength)) * 2;
            }
        };
        prototypeAccessors.blur.get = function () {
            return this.blurXFilter.blur;
        };
        prototypeAccessors.blur.set = function (value) {
            this.blurXFilter.blur = this.blurYFilter.blur = value;
            this.updatePadding();
        };
        prototypeAccessors.quality.get = function () {
            return this.blurXFilter.quality;
        };
        prototypeAccessors.quality.set = function (value) {
            this.blurXFilter.quality = this.blurYFilter.quality = value;
        };
        prototypeAccessors.blurX.get = function () {
            return this.blurXFilter.blur;
        };
        prototypeAccessors.blurX.set = function (value) {
            this.blurXFilter.blur = value;
            this.updatePadding();
        };
        prototypeAccessors.blurY.get = function () {
            return this.blurYFilter.blur;
        };
        prototypeAccessors.blurY.set = function (value) {
            this.blurYFilter.blur = value;
            this.updatePadding();
        };
        prototypeAccessors.blendMode.get = function () {
            return this.blurYFilter.blendMode;
        };
        prototypeAccessors.blendMode.set = function (value) {
            this.blurYFilter.blendMode = value;
        };
        prototypeAccessors.repeatEdgePixels.get = function () {
            return this._repeatEdgePixels;
        };
        prototypeAccessors.repeatEdgePixels.set = function (value) {
            this._repeatEdgePixels = value;
            this.updatePadding();
        };
        Object.defineProperties(BlurFilter.prototype, prototypeAccessors);
        return BlurFilter;
    }(Filter));
    var fragment$4 = "varying vec2 vTextureCoord;\nuniform sampler2D uSampler;\nuniform float m[20];\nuniform float uAlpha;\n\nvoid main(void)\n{\n    vec4 c = texture2D(uSampler, vTextureCoord);\n\n    if (uAlpha == 0.0) {\n        gl_FragColor = c;\n        return;\n    }\n\n    // Un-premultiply alpha before applying the color matrix. See issue #3539.\n    if (c.a > 0.0) {\n      c.rgb /= c.a;\n    }\n\n    vec4 result;\n\n    result.r = (m[0] * c.r);\n        result.r += (m[1] * c.g);\n        result.r += (m[2] * c.b);\n        result.r += (m[3] * c.a);\n        result.r += m[4];\n\n    result.g = (m[5] * c.r);\n        result.g += (m[6] * c.g);\n        result.g += (m[7] * c.b);\n        result.g += (m[8] * c.a);\n        result.g += m[9];\n\n    result.b = (m[10] * c.r);\n       result.b += (m[11] * c.g);\n       result.b += (m[12] * c.b);\n       result.b += (m[13] * c.a);\n       result.b += m[14];\n\n    result.a = (m[15] * c.r);\n       result.a += (m[16] * c.g);\n       result.a += (m[17] * c.b);\n       result.a += (m[18] * c.a);\n       result.a += m[19];\n\n    vec3 rgb = mix(c.rgb, result.rgb, uAlpha);\n\n    // Premultiply alpha again.\n    rgb *= result.a;\n\n    gl_FragColor = vec4(rgb, result.a);\n}\n";
    var ColorMatrixFilter = (function (Filter) {
        function ColorMatrixFilter() {
            var uniforms = {
                m: new Float32Array([1, 0, 0, 0, 0,
                    0, 1, 0, 0, 0,
                    0, 0, 1, 0, 0,
                    0, 0, 0, 1, 0]),
                uAlpha: 1,
            };
            Filter.call(this, defaultFilter, fragment$4, uniforms);
            this.alpha = 1;
        }
        if (Filter) {
            ColorMatrixFilter.__proto__ = Filter;
        }
        ColorMatrixFilter.prototype = Object.create(Filter && Filter.prototype);
        ColorMatrixFilter.prototype.constructor = ColorMatrixFilter;
        var prototypeAccessors = { matrix: { configurable: true }, alpha: { configurable: true } };
        ColorMatrixFilter.prototype._loadMatrix = function _loadMatrix(matrix, multiply) {
            if (multiply === void 0) {
                multiply = false;
            }
            var newMatrix = matrix;
            if (multiply) {
                this._multiply(newMatrix, this.uniforms.m, matrix);
                newMatrix = this._colorMatrix(newMatrix);
            }
            this.uniforms.m = newMatrix;
        };
        ColorMatrixFilter.prototype._multiply = function _multiply(out, a, b) {
            out[0] = (a[0] * b[0]) + (a[1] * b[5]) + (a[2] * b[10]) + (a[3] * b[15]);
            out[1] = (a[0] * b[1]) + (a[1] * b[6]) + (a[2] * b[11]) + (a[3] * b[16]);
            out[2] = (a[0] * b[2]) + (a[1] * b[7]) + (a[2] * b[12]) + (a[3] * b[17]);
            out[3] = (a[0] * b[3]) + (a[1] * b[8]) + (a[2] * b[13]) + (a[3] * b[18]);
            out[4] = (a[0] * b[4]) + (a[1] * b[9]) + (a[2] * b[14]) + (a[3] * b[19]) + a[4];
            out[5] = (a[5] * b[0]) + (a[6] * b[5]) + (a[7] * b[10]) + (a[8] * b[15]);
            out[6] = (a[5] * b[1]) + (a[6] * b[6]) + (a[7] * b[11]) + (a[8] * b[16]);
            out[7] = (a[5] * b[2]) + (a[6] * b[7]) + (a[7] * b[12]) + (a[8] * b[17]);
            out[8] = (a[5] * b[3]) + (a[6] * b[8]) + (a[7] * b[13]) + (a[8] * b[18]);
            out[9] = (a[5] * b[4]) + (a[6] * b[9]) + (a[7] * b[14]) + (a[8] * b[19]) + a[9];
            out[10] = (a[10] * b[0]) + (a[11] * b[5]) + (a[12] * b[10]) + (a[13] * b[15]);
            out[11] = (a[10] * b[1]) + (a[11] * b[6]) + (a[12] * b[11]) + (a[13] * b[16]);
            out[12] = (a[10] * b[2]) + (a[11] * b[7]) + (a[12] * b[12]) + (a[13] * b[17]);
            out[13] = (a[10] * b[3]) + (a[11] * b[8]) + (a[12] * b[13]) + (a[13] * b[18]);
            out[14] = (a[10] * b[4]) + (a[11] * b[9]) + (a[12] * b[14]) + (a[13] * b[19]) + a[14];
            out[15] = (a[15] * b[0]) + (a[16] * b[5]) + (a[17] * b[10]) + (a[18] * b[15]);
            out[16] = (a[15] * b[1]) + (a[16] * b[6]) + (a[17] * b[11]) + (a[18] * b[16]);
            out[17] = (a[15] * b[2]) + (a[16] * b[7]) + (a[17] * b[12]) + (a[18] * b[17]);
            out[18] = (a[15] * b[3]) + (a[16] * b[8]) + (a[17] * b[13]) + (a[18] * b[18]);
            out[19] = (a[15] * b[4]) + (a[16] * b[9]) + (a[17] * b[14]) + (a[18] * b[19]) + a[19];
            return out;
        };
        ColorMatrixFilter.prototype._colorMatrix = function _colorMatrix(matrix) {
            var m = new Float32Array(matrix);
            m[4] /= 255;
            m[9] /= 255;
            m[14] /= 255;
            m[19] /= 255;
            return m;
        };
        ColorMatrixFilter.prototype.brightness = function brightness(b, multiply) {
            var matrix = [
                b, 0, 0, 0, 0,
                0, b, 0, 0, 0,
                0, 0, b, 0, 0,
                0, 0, 0, 1, 0
            ];
            this._loadMatrix(matrix, multiply);
        };
        ColorMatrixFilter.prototype.greyscale = function greyscale(scale, multiply) {
            var matrix = [
                scale, scale, scale, 0, 0,
                scale, scale, scale, 0, 0,
                scale, scale, scale, 0, 0,
                0, 0, 0, 1, 0
            ];
            this._loadMatrix(matrix, multiply);
        };
        ColorMatrixFilter.prototype.blackAndWhite = function blackAndWhite(multiply) {
            var matrix = [
                0.3, 0.6, 0.1, 0, 0,
                0.3, 0.6, 0.1, 0, 0,
                0.3, 0.6, 0.1, 0, 0,
                0, 0, 0, 1, 0
            ];
            this._loadMatrix(matrix, multiply);
        };
        ColorMatrixFilter.prototype.hue = function hue(rotation, multiply) {
            rotation = (rotation || 0) / 180 * Math.PI;
            var cosR = Math.cos(rotation);
            var sinR = Math.sin(rotation);
            var sqrt = Math.sqrt;
            var w = 1 / 3;
            var sqrW = sqrt(w);
            var a00 = cosR + ((1.0 - cosR) * w);
            var a01 = (w * (1.0 - cosR)) - (sqrW * sinR);
            var a02 = (w * (1.0 - cosR)) + (sqrW * sinR);
            var a10 = (w * (1.0 - cosR)) + (sqrW * sinR);
            var a11 = cosR + (w * (1.0 - cosR));
            var a12 = (w * (1.0 - cosR)) - (sqrW * sinR);
            var a20 = (w * (1.0 - cosR)) - (sqrW * sinR);
            var a21 = (w * (1.0 - cosR)) + (sqrW * sinR);
            var a22 = cosR + (w * (1.0 - cosR));
            var matrix = [
                a00, a01, a02, 0, 0,
                a10, a11, a12, 0, 0,
                a20, a21, a22, 0, 0,
                0, 0, 0, 1, 0
            ];
            this._loadMatrix(matrix, multiply);
        };
        ColorMatrixFilter.prototype.contrast = function contrast(amount, multiply) {
            var v = (amount || 0) + 1;
            var o = -0.5 * (v - 1);
            var matrix = [
                v, 0, 0, 0, o,
                0, v, 0, 0, o,
                0, 0, v, 0, o,
                0, 0, 0, 1, 0
            ];
            this._loadMatrix(matrix, multiply);
        };
        ColorMatrixFilter.prototype.saturate = function saturate(amount, multiply) {
            if (amount === void 0) {
                amount = 0;
            }
            var x = (amount * 2 / 3) + 1;
            var y = ((x - 1) * -0.5);
            var matrix = [
                x, y, y, 0, 0,
                y, x, y, 0, 0,
                y, y, x, 0, 0,
                0, 0, 0, 1, 0
            ];
            this._loadMatrix(matrix, multiply);
        };
        ColorMatrixFilter.prototype.desaturate = function desaturate() {
            this.saturate(-1);
        };
        ColorMatrixFilter.prototype.negative = function negative(multiply) {
            var matrix = [
                -1, 0, 0, 1, 0,
                0, -1, 0, 1, 0,
                0, 0, -1, 1, 0,
                0, 0, 0, 1, 0
            ];
            this._loadMatrix(matrix, multiply);
        };
        ColorMatrixFilter.prototype.sepia = function sepia(multiply) {
            var matrix = [
                0.393, 0.7689999, 0.18899999, 0, 0,
                0.349, 0.6859999, 0.16799999, 0, 0,
                0.272, 0.5339999, 0.13099999, 0, 0,
                0, 0, 0, 1, 0
            ];
            this._loadMatrix(matrix, multiply);
        };
        ColorMatrixFilter.prototype.technicolor = function technicolor(multiply) {
            var matrix = [
                1.9125277891456083, -0.8545344976951645, -0.09155508482755585, 0, 11.793603434377337,
                -0.3087833385928097, 1.7658908555458428, -0.10601743074722245, 0, -70.35205161461398,
                -0.231103377548616, -0.7501899197440212, 1.847597816108189, 0, 30.950940869491138,
                0, 0, 0, 1, 0
            ];
            this._loadMatrix(matrix, multiply);
        };
        ColorMatrixFilter.prototype.polaroid = function polaroid(multiply) {
            var matrix = [
                1.438, -0.062, -0.062, 0, 0,
                -0.122, 1.378, -0.122, 0, 0,
                -0.016, -0.016, 1.483, 0, 0,
                0, 0, 0, 1, 0
            ];
            this._loadMatrix(matrix, multiply);
        };
        ColorMatrixFilter.prototype.toBGR = function toBGR(multiply) {
            var matrix = [
                0, 0, 1, 0, 0,
                0, 1, 0, 0, 0,
                1, 0, 0, 0, 0,
                0, 0, 0, 1, 0
            ];
            this._loadMatrix(matrix, multiply);
        };
        ColorMatrixFilter.prototype.kodachrome = function kodachrome(multiply) {
            var matrix = [
                1.1285582396593525, -0.3967382283601348, -0.03992559172921793, 0, 63.72958762196502,
                -0.16404339962244616, 1.0835251566291304, -0.05498805115633132, 0, 24.732407896706203,
                -0.16786010706155763, -0.5603416277695248, 1.6014850761964943, 0, 35.62982807460946,
                0, 0, 0, 1, 0
            ];
            this._loadMatrix(matrix, multiply);
        };
        ColorMatrixFilter.prototype.browni = function browni(multiply) {
            var matrix = [
                0.5997023498159715, 0.34553243048391263, -0.2708298674538042, 0, 47.43192855600873,
                -0.037703249837783157, 0.8609577587992641, 0.15059552388459913, 0, -36.96841498319127,
                0.24113635128153335, -0.07441037908422492, 0.44972182064877153, 0, -7.562075277591283,
                0, 0, 0, 1, 0
            ];
            this._loadMatrix(matrix, multiply);
        };
        ColorMatrixFilter.prototype.vintage = function vintage(multiply) {
            var matrix = [
                0.6279345635605994, 0.3202183420819367, -0.03965408211312453, 0, 9.651285835294123,
                0.02578397704808868, 0.6441188644374771, 0.03259127616149294, 0, 7.462829176470591,
                0.0466055556782719, -0.0851232987247891, 0.5241648018700465, 0, 5.159190588235296,
                0, 0, 0, 1, 0
            ];
            this._loadMatrix(matrix, multiply);
        };
        ColorMatrixFilter.prototype.colorTone = function colorTone(desaturation, toned, lightColor, darkColor, multiply) {
            desaturation = desaturation || 0.2;
            toned = toned || 0.15;
            lightColor = lightColor || 0xFFE580;
            darkColor = darkColor || 0x338000;
            var lR = ((lightColor >> 16) & 0xFF) / 255;
            var lG = ((lightColor >> 8) & 0xFF) / 255;
            var lB = (lightColor & 0xFF) / 255;
            var dR = ((darkColor >> 16) & 0xFF) / 255;
            var dG = ((darkColor >> 8) & 0xFF) / 255;
            var dB = (darkColor & 0xFF) / 255;
            var matrix = [
                0.3, 0.59, 0.11, 0, 0,
                lR, lG, lB, desaturation, 0,
                dR, dG, dB, toned, 0,
                lR - dR, lG - dG, lB - dB, 0, 0
            ];
            this._loadMatrix(matrix, multiply);
        };
        ColorMatrixFilter.prototype.night = function night(intensity, multiply) {
            intensity = intensity || 0.1;
            var matrix = [
                intensity * (-2.0), -intensity, 0, 0, 0,
                -intensity, 0, intensity, 0, 0,
                0, intensity, intensity * 2.0, 0, 0,
                0, 0, 0, 1, 0
            ];
            this._loadMatrix(matrix, multiply);
        };
        ColorMatrixFilter.prototype.predator = function predator(amount, multiply) {
            var matrix = [
                11.224130630493164 * amount,
                -4.794486999511719 * amount,
                -2.8746118545532227 * amount,
                0 * amount,
                0.40342438220977783 * amount,
                -3.6330697536468506 * amount,
                9.193157196044922 * amount,
                -2.951810836791992 * amount,
                0 * amount,
                -1.316135048866272 * amount,
                -3.2184197902679443 * amount,
                -4.2375030517578125 * amount,
                7.476448059082031 * amount,
                0 * amount,
                0.8044459223747253 * amount,
                0, 0, 0, 1, 0
            ];
            this._loadMatrix(matrix, multiply);
        };
        ColorMatrixFilter.prototype.lsd = function lsd(multiply) {
            var matrix = [
                2, -0.4, 0.5, 0, 0,
                -0.5, 2, -0.4, 0, 0,
                -0.4, -0.5, 3, 0, 0,
                0, 0, 0, 1, 0
            ];
            this._loadMatrix(matrix, multiply);
        };
        ColorMatrixFilter.prototype.reset = function reset() {
            var matrix = [
                1, 0, 0, 0, 0,
                0, 1, 0, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 0, 1, 0
            ];
            this._loadMatrix(matrix, false);
        };
        prototypeAccessors.matrix.get = function () {
            return this.uniforms.m;
        };
        prototypeAccessors.matrix.set = function (value) {
            this.uniforms.m = value;
        };
        prototypeAccessors.alpha.get = function () {
            return this.uniforms.uAlpha;
        };
        prototypeAccessors.alpha.set = function (value) {
            this.uniforms.uAlpha = value;
        };
        Object.defineProperties(ColorMatrixFilter.prototype, prototypeAccessors);
        return ColorMatrixFilter;
    }(Filter));
    ColorMatrixFilter.prototype.grayscale = ColorMatrixFilter.prototype.greyscale;
    var vertex$3 = "attribute vec2 aVertexPosition;\n\nuniform mat3 projectionMatrix;\nuniform mat3 filterMatrix;\n\nvarying vec2 vTextureCoord;\nvarying vec2 vFilterCoord;\n\nuniform vec4 inputSize;\nuniform vec4 outputFrame;\n\nvec4 filterVertexPosition( void )\n{\n    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;\n\n    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);\n}\n\nvec2 filterTextureCoord( void )\n{\n    return aVertexPosition * (outputFrame.zw * inputSize.zw);\n}\n\nvoid main(void)\n{\n\tgl_Position = filterVertexPosition();\n\tvTextureCoord = filterTextureCoord();\n\tvFilterCoord = ( filterMatrix * vec3( vTextureCoord, 1.0)  ).xy;\n}\n";
    var fragment$5 = "varying vec2 vFilterCoord;\nvarying vec2 vTextureCoord;\n\nuniform vec2 scale;\nuniform mat2 rotation;\nuniform sampler2D uSampler;\nuniform sampler2D mapSampler;\n\nuniform highp vec4 inputSize;\nuniform vec4 inputClamp;\n\nvoid main(void)\n{\n  vec4 map =  texture2D(mapSampler, vFilterCoord);\n\n  map -= 0.5;\n  map.xy = scale * inputSize.zw * (rotation * map.xy);\n\n  gl_FragColor = texture2D(uSampler, clamp(vec2(vTextureCoord.x + map.x, vTextureCoord.y + map.y), inputClamp.xy, inputClamp.zw));\n}\n";
    var DisplacementFilter = (function (Filter) {
        function DisplacementFilter(sprite, scale) {
            var maskMatrix = new Matrix();
            sprite.renderable = false;
            Filter.call(this, vertex$3, fragment$5, {
                mapSampler: sprite._texture,
                filterMatrix: maskMatrix,
                scale: { x: 1, y: 1 },
                rotation: new Float32Array([1, 0, 0, 1]),
            });
            this.maskSprite = sprite;
            this.maskMatrix = maskMatrix;
            if (scale === null || scale === undefined) {
                scale = 20;
            }
            this.scale = new Point(scale, scale);
        }
        if (Filter) {
            DisplacementFilter.__proto__ = Filter;
        }
        DisplacementFilter.prototype = Object.create(Filter && Filter.prototype);
        DisplacementFilter.prototype.constructor = DisplacementFilter;
        var prototypeAccessors = { map: { configurable: true } };
        DisplacementFilter.prototype.apply = function apply(filterManager, input, output, clear) {
            this.uniforms.filterMatrix = filterManager.calculateSpriteMatrix(this.maskMatrix, this.maskSprite);
            this.uniforms.scale.x = this.scale.x;
            this.uniforms.scale.y = this.scale.y;
            var wt = this.maskSprite.transform.worldTransform;
            var lenX = Math.sqrt((wt.a * wt.a) + (wt.b * wt.b));
            var lenY = Math.sqrt((wt.c * wt.c) + (wt.d * wt.d));
            if (lenX !== 0 && lenY !== 0) {
                this.uniforms.rotation[0] = wt.a / lenX;
                this.uniforms.rotation[1] = wt.b / lenX;
                this.uniforms.rotation[2] = wt.c / lenY;
                this.uniforms.rotation[3] = wt.d / lenY;
            }
            filterManager.applyFilter(this, input, output, clear);
        };
        prototypeAccessors.map.get = function () {
            return this.uniforms.mapSampler;
        };
        prototypeAccessors.map.set = function (value) {
            this.uniforms.mapSampler = value;
        };
        Object.defineProperties(DisplacementFilter.prototype, prototypeAccessors);
        return DisplacementFilter;
    }(Filter));
    var vertex$4 = "\nattribute vec2 aVertexPosition;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 v_rgbNW;\nvarying vec2 v_rgbNE;\nvarying vec2 v_rgbSW;\nvarying vec2 v_rgbSE;\nvarying vec2 v_rgbM;\n\nvarying vec2 vFragCoord;\n\nuniform vec4 inputPixel;\nuniform vec4 outputFrame;\n\nvec4 filterVertexPosition( void )\n{\n    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;\n\n    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);\n}\n\nvoid texcoords(vec2 fragCoord, vec2 inverseVP,\n               out vec2 v_rgbNW, out vec2 v_rgbNE,\n               out vec2 v_rgbSW, out vec2 v_rgbSE,\n               out vec2 v_rgbM) {\n    v_rgbNW = (fragCoord + vec2(-1.0, -1.0)) * inverseVP;\n    v_rgbNE = (fragCoord + vec2(1.0, -1.0)) * inverseVP;\n    v_rgbSW = (fragCoord + vec2(-1.0, 1.0)) * inverseVP;\n    v_rgbSE = (fragCoord + vec2(1.0, 1.0)) * inverseVP;\n    v_rgbM = vec2(fragCoord * inverseVP);\n}\n\nvoid main(void) {\n\n   gl_Position = filterVertexPosition();\n\n   vFragCoord = aVertexPosition * outputFrame.zw;\n\n   texcoords(vFragCoord, inputPixel.zw, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);\n}\n";
    var fragment$6 = "varying vec2 v_rgbNW;\nvarying vec2 v_rgbNE;\nvarying vec2 v_rgbSW;\nvarying vec2 v_rgbSE;\nvarying vec2 v_rgbM;\n\nvarying vec2 vFragCoord;\nuniform sampler2D uSampler;\nuniform highp vec4 inputPixel;\n\n\n/**\n Basic FXAA implementation based on the code on geeks3d.com with the\n modification that the texture2DLod stuff was removed since it's\n unsupported by WebGL.\n\n --\n\n From:\n https://github.com/mitsuhiko/webgl-meincraft\n\n Copyright (c) 2011 by Armin Ronacher.\n\n Some rights reserved.\n\n Redistribution and use in source and binary forms, with or without\n modification, are permitted provided that the following conditions are\n met:\n\n * Redistributions of source code must retain the above copyright\n notice, this list of conditions and the following disclaimer.\n\n * Redistributions in binary form must reproduce the above\n copyright notice, this list of conditions and the following\n disclaimer in the documentation and/or other materials provided\n with the distribution.\n\n * The names of the contributors may not be used to endorse or\n promote products derived from this software without specific\n prior written permission.\n\n THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS\n \"AS IS\" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT\n LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR\n A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT\n OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,\n SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT\n LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,\n DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY\n THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE\n OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n */\n\n#ifndef FXAA_REDUCE_MIN\n#define FXAA_REDUCE_MIN   (1.0/ 128.0)\n#endif\n#ifndef FXAA_REDUCE_MUL\n#define FXAA_REDUCE_MUL   (1.0 / 8.0)\n#endif\n#ifndef FXAA_SPAN_MAX\n#define FXAA_SPAN_MAX     8.0\n#endif\n\n//optimized version for mobile, where dependent\n//texture reads can be a bottleneck\nvec4 fxaa(sampler2D tex, vec2 fragCoord, vec2 inverseVP,\n          vec2 v_rgbNW, vec2 v_rgbNE,\n          vec2 v_rgbSW, vec2 v_rgbSE,\n          vec2 v_rgbM) {\n    vec4 color;\n    vec3 rgbNW = texture2D(tex, v_rgbNW).xyz;\n    vec3 rgbNE = texture2D(tex, v_rgbNE).xyz;\n    vec3 rgbSW = texture2D(tex, v_rgbSW).xyz;\n    vec3 rgbSE = texture2D(tex, v_rgbSE).xyz;\n    vec4 texColor = texture2D(tex, v_rgbM);\n    vec3 rgbM  = texColor.xyz;\n    vec3 luma = vec3(0.299, 0.587, 0.114);\n    float lumaNW = dot(rgbNW, luma);\n    float lumaNE = dot(rgbNE, luma);\n    float lumaSW = dot(rgbSW, luma);\n    float lumaSE = dot(rgbSE, luma);\n    float lumaM  = dot(rgbM,  luma);\n    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));\n    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));\n\n    mediump vec2 dir;\n    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));\n    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));\n\n    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *\n                          (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);\n\n    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);\n    dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),\n              max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),\n                  dir * rcpDirMin)) * inverseVP;\n\n    vec3 rgbA = 0.5 * (\n                       texture2D(tex, fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)).xyz +\n                       texture2D(tex, fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)).xyz);\n    vec3 rgbB = rgbA * 0.5 + 0.25 * (\n                                     texture2D(tex, fragCoord * inverseVP + dir * -0.5).xyz +\n                                     texture2D(tex, fragCoord * inverseVP + dir * 0.5).xyz);\n\n    float lumaB = dot(rgbB, luma);\n    if ((lumaB < lumaMin) || (lumaB > lumaMax))\n        color = vec4(rgbA, texColor.a);\n    else\n        color = vec4(rgbB, texColor.a);\n    return color;\n}\n\nvoid main() {\n\n      vec4 color;\n\n      color = fxaa(uSampler, vFragCoord, inputPixel.zw, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);\n\n      gl_FragColor = color;\n}\n";
    var FXAAFilter = (function (Filter) {
        function FXAAFilter() {
            Filter.call(this, vertex$4, fragment$6);
        }
        if (Filter) {
            FXAAFilter.__proto__ = Filter;
        }
        FXAAFilter.prototype = Object.create(Filter && Filter.prototype);
        FXAAFilter.prototype.constructor = FXAAFilter;
        return FXAAFilter;
    }(Filter));
    var fragment$7 = "precision highp float;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\n\nuniform float uNoise;\nuniform float uSeed;\nuniform sampler2D uSampler;\n\nfloat rand(vec2 co)\n{\n    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);\n}\n\nvoid main()\n{\n    vec4 color = texture2D(uSampler, vTextureCoord);\n    float randomValue = rand(gl_FragCoord.xy * uSeed);\n    float diff = (randomValue - 0.5) * uNoise;\n\n    // Un-premultiply alpha before applying the color matrix. See issue #3539.\n    if (color.a > 0.0) {\n        color.rgb /= color.a;\n    }\n\n    color.r += diff;\n    color.g += diff;\n    color.b += diff;\n\n    // Premultiply alpha again.\n    color.rgb *= color.a;\n\n    gl_FragColor = color;\n}\n";
    var NoiseFilter = (function (Filter) {
        function NoiseFilter(noise, seed) {
            if (noise === void 0) {
                noise = 0.5;
            }
            if (seed === void 0) {
                seed = Math.random();
            }
            Filter.call(this, defaultFilter, fragment$7, {
                uNoise: 0,
                uSeed: 0,
            });
            this.noise = noise;
            this.seed = seed;
        }
        if (Filter) {
            NoiseFilter.__proto__ = Filter;
        }
        NoiseFilter.prototype = Object.create(Filter && Filter.prototype);
        NoiseFilter.prototype.constructor = NoiseFilter;
        var prototypeAccessors = { noise: { configurable: true }, seed: { configurable: true } };
        prototypeAccessors.noise.get = function () {
            return this.uniforms.uNoise;
        };
        prototypeAccessors.noise.set = function (value) {
            this.uniforms.uNoise = value;
        };
        prototypeAccessors.seed.get = function () {
            return this.uniforms.uSeed;
        };
        prototypeAccessors.seed.set = function (value) {
            this.uniforms.uSeed = value;
        };
        Object.defineProperties(NoiseFilter.prototype, prototypeAccessors);
        return NoiseFilter;
    }(Filter));
    var _tempMatrix = new Matrix();
    DisplayObject.prototype._cacheAsBitmap = false;
    DisplayObject.prototype._cacheData = false;
    var CacheData = function CacheData() {
        this.textureCacheId = null;
        this.originalRender = null;
        this.originalRenderCanvas = null;
        this.originalCalculateBounds = null;
        this.originalGetLocalBounds = null;
        this.originalUpdateTransform = null;
        this.originalHitTest = null;
        this.originalDestroy = null;
        this.originalMask = null;
        this.originalFilterArea = null;
        this.sprite = null;
    };
    Object.defineProperties(DisplayObject.prototype, {
        cacheAsBitmap: {
            get: function get() {
                return this._cacheAsBitmap;
            },
            set: function set(value) {
                if (this._cacheAsBitmap === value) {
                    return;
                }
                this._cacheAsBitmap = value;
                var data;
                if (value) {
                    if (!this._cacheData) {
                        this._cacheData = new CacheData();
                    }
                    data = this._cacheData;
                    data.originalRender = this.render;
                    data.originalRenderCanvas = this.renderCanvas;
                    data.originalUpdateTransform = this.updateTransform;
                    data.originalCalculateBounds = this.calculateBounds;
                    data.originalGetLocalBounds = this.getLocalBounds;
                    data.originalDestroy = this.destroy;
                    data.originalContainsPoint = this.containsPoint;
                    data.originalMask = this._mask;
                    data.originalFilterArea = this.filterArea;
                    this.render = this._renderCached;
                    this.renderCanvas = this._renderCachedCanvas;
                    this.destroy = this._cacheAsBitmapDestroy;
                }
                else {
                    data = this._cacheData;
                    if (data.sprite) {
                        this._destroyCachedDisplayObject();
                    }
                    this.render = data.originalRender;
                    this.renderCanvas = data.originalRenderCanvas;
                    this.calculateBounds = data.originalCalculateBounds;
                    this.getLocalBounds = data.originalGetLocalBounds;
                    this.destroy = data.originalDestroy;
                    this.updateTransform = data.originalUpdateTransform;
                    this.containsPoint = data.originalContainsPoint;
                    this._mask = data.originalMask;
                    this.filterArea = data.originalFilterArea;
                }
            },
        },
    });
    DisplayObject.prototype._renderCached = function _renderCached(renderer) {
        if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
            return;
        }
        this._initCachedDisplayObject(renderer);
        this._cacheData.sprite.transform._worldID = this.transform._worldID;
        this._cacheData.sprite.worldAlpha = this.worldAlpha;
        this._cacheData.sprite._render(renderer);
    };
    DisplayObject.prototype._initCachedDisplayObject = function _initCachedDisplayObject(renderer) {
        if (this._cacheData && this._cacheData.sprite) {
            return;
        }
        var cacheAlpha = this.alpha;
        this.alpha = 1;
        renderer.batch.flush();
        var bounds = this.getLocalBounds().clone();
        if (this.filters) {
            var padding = this.filters[0].padding;
            bounds.pad(padding);
        }
        bounds.ceil(settings.RESOLUTION);
        var cachedRenderTexture = renderer.renderTexture.current;
        var cachedSourceFrame = renderer.renderTexture.sourceFrame;
        var cachedProjectionTransform = renderer.projection.transform;
        var renderTexture = RenderTexture.create(bounds.width, bounds.height);
        var textureCacheId = "cacheAsBitmap_" + (uid());
        this._cacheData.textureCacheId = textureCacheId;
        BaseTexture.addToCache(renderTexture.baseTexture, textureCacheId);
        Texture.addToCache(renderTexture, textureCacheId);
        var m = _tempMatrix;
        m.tx = -bounds.x;
        m.ty = -bounds.y;
        this.transform.worldTransform.identity();
        this.render = this._cacheData.originalRender;
        renderer.render(this, renderTexture, true, m, true);
        renderer.projection.transform = cachedProjectionTransform;
        renderer.renderTexture.bind(cachedRenderTexture, cachedSourceFrame);
        this.render = this._renderCached;
        this.updateTransform = this.displayObjectUpdateTransform;
        this.calculateBounds = this._calculateCachedBounds;
        this.getLocalBounds = this._getCachedLocalBounds;
        this._mask = null;
        this.filterArea = null;
        var cachedSprite = new Sprite(renderTexture);
        cachedSprite.transform.worldTransform = this.transform.worldTransform;
        cachedSprite.anchor.x = -(bounds.x / bounds.width);
        cachedSprite.anchor.y = -(bounds.y / bounds.height);
        cachedSprite.alpha = cacheAlpha;
        cachedSprite._bounds = this._bounds;
        this._cacheData.sprite = cachedSprite;
        this.transform._parentID = -1;
        if (!this.parent) {
            this.parent = renderer._tempDisplayObjectParent;
            this.updateTransform();
            this.parent = null;
        }
        else {
            this.updateTransform();
        }
        this.containsPoint = cachedSprite.containsPoint.bind(cachedSprite);
    };
    DisplayObject.prototype._renderCachedCanvas = function _renderCachedCanvas(renderer) {
        if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
            return;
        }
        this._initCachedDisplayObjectCanvas(renderer);
        this._cacheData.sprite.worldAlpha = this.worldAlpha;
        this._cacheData.sprite._renderCanvas(renderer);
    };
    DisplayObject.prototype._initCachedDisplayObjectCanvas = function _initCachedDisplayObjectCanvas(renderer) {
        if (this._cacheData && this._cacheData.sprite) {
            return;
        }
        var bounds = this.getLocalBounds();
        var cacheAlpha = this.alpha;
        this.alpha = 1;
        var cachedRenderTarget = renderer.context;
        bounds.ceil(settings.RESOLUTION);
        var renderTexture = RenderTexture.create(bounds.width, bounds.height);
        var textureCacheId = "cacheAsBitmap_" + (uid());
        this._cacheData.textureCacheId = textureCacheId;
        BaseTexture.addToCache(renderTexture.baseTexture, textureCacheId);
        Texture.addToCache(renderTexture, textureCacheId);
        var m = _tempMatrix;
        this.transform.localTransform.copyTo(m);
        m.invert();
        m.tx -= bounds.x;
        m.ty -= bounds.y;
        this.renderCanvas = this._cacheData.originalRenderCanvas;
        renderer.render(this, renderTexture, true, m, false);
        renderer.context = cachedRenderTarget;
        this.renderCanvas = this._renderCachedCanvas;
        this.updateTransform = this.displayObjectUpdateTransform;
        this.calculateBounds = this._calculateCachedBounds;
        this.getLocalBounds = this._getCachedLocalBounds;
        this._mask = null;
        this.filterArea = null;
        var cachedSprite = new Sprite(renderTexture);
        cachedSprite.transform.worldTransform = this.transform.worldTransform;
        cachedSprite.anchor.x = -(bounds.x / bounds.width);
        cachedSprite.anchor.y = -(bounds.y / bounds.height);
        cachedSprite.alpha = cacheAlpha;
        cachedSprite._bounds = this._bounds;
        this._cacheData.sprite = cachedSprite;
        this.transform._parentID = -1;
        if (!this.parent) {
            this.parent = renderer._tempDisplayObjectParent;
            this.updateTransform();
            this.parent = null;
        }
        else {
            this.updateTransform();
        }
        this.containsPoint = cachedSprite.containsPoint.bind(cachedSprite);
    };
    DisplayObject.prototype._calculateCachedBounds = function _calculateCachedBounds() {
        this._bounds.clear();
        this._cacheData.sprite.transform._worldID = this.transform._worldID;
        this._cacheData.sprite._calculateBounds();
        this._lastBoundsID = this._boundsID;
    };
    DisplayObject.prototype._getCachedLocalBounds = function _getCachedLocalBounds() {
        return this._cacheData.sprite.getLocalBounds();
    };
    DisplayObject.prototype._destroyCachedDisplayObject = function _destroyCachedDisplayObject() {
        this._cacheData.sprite._texture.destroy(true);
        this._cacheData.sprite = null;
        BaseTexture.removeFromCache(this._cacheData.textureCacheId);
        Texture.removeFromCache(this._cacheData.textureCacheId);
        this._cacheData.textureCacheId = null;
    };
    DisplayObject.prototype._cacheAsBitmapDestroy = function _cacheAsBitmapDestroy(options) {
        this.cacheAsBitmap = false;
        this.destroy(options);
    };
    DisplayObject.prototype.name = null;
    Container.prototype.getChildByName = function getChildByName(name) {
        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i].name === name) {
                return this.children[i];
            }
        }
        return null;
    };
    DisplayObject.prototype.getGlobalPosition = function getGlobalPosition(point, skipUpdate) {
        if (point === void 0) {
            point = new Point();
        }
        if (skipUpdate === void 0) {
            skipUpdate = false;
        }
        if (this.parent) {
            this.parent.toGlobal(this.position, point, skipUpdate);
        }
        else {
            point.x = this.position.x;
            point.y = this.position.y;
        }
        return point;
    };
    var v5 = '5.0.0';
    function useDeprecated() {
        var PIXI = this;
        Object.defineProperties(PIXI, {
            SVG_SIZE: {
                get: function get() {
                    deprecation(v5, 'PIXI.utils.SVG_SIZE property has moved to PIXI.resources.SVGResource.SVG_SIZE');
                    return PIXI.SVGResource.SVG_SIZE;
                },
            },
            TransformStatic: {
                get: function get() {
                    deprecation(v5, 'PIXI.TransformStatic class has been removed, use PIXI.Transform');
                    return PIXI.Transform;
                },
            },
            TransformBase: {
                get: function get() {
                    deprecation(v5, 'PIXI.TransformBase class has been removed, use PIXI.Transform');
                    return PIXI.Transform;
                },
            },
            TRANSFORM_MODE: {
                get: function get() {
                    deprecation(v5, 'PIXI.TRANSFORM_MODE property has been removed');
                    return { STATIC: 0, DYNAMIC: 1 };
                },
            },
            WebGLRenderer: {
                get: function get() {
                    deprecation(v5, 'PIXI.WebGLRenderer class has moved to PIXI.Renderer');
                    return PIXI.Renderer;
                },
            },
            CanvasRenderTarget: {
                get: function get() {
                    deprecation(v5, 'PIXI.CanvasRenderTarget class has moved to PIXI.utils.CanvasRenderTarget');
                    return PIXI.utils.CanvasRenderTarget;
                },
            },
            loader: {
                get: function get() {
                    deprecation(v5, 'PIXI.loader instance has moved to PIXI.Loader.shared');
                    return PIXI.Loader.shared;
                },
            },
            FilterManager: {
                get: function get() {
                    deprecation(v5, 'PIXI.FilterManager class has moved to PIXI.systems.FilterSystem');
                    return PIXI.systems.FilterSystem;
                },
            },
            CanvasTinter: {
                get: function get() {
                    deprecation('5.2.0', 'PIXI.CanvasTinter namespace has moved to PIXI.canvasUtils');
                    return PIXI.canvasUtils;
                },
            },
            GroupD8: {
                get: function get() {
                    deprecation('5.2.0', 'PIXI.GroupD8 namespace has moved to PIXI.groupD8');
                    return PIXI.groupD8;
                },
            },
        });
        PIXI.prepare = {};
        Object.defineProperties(PIXI.prepare, {
            BasePrepare: {
                get: function get() {
                    deprecation('5.2.1', 'PIXI.prepare.BasePrepare moved to PIXI.BasePrepare');
                    return PIXI.BasePrepare;
                },
            },
            Prepare: {
                get: function get() {
                    deprecation('5.2.1', 'PIXI.prepare.Prepare moved to PIXI.Prepare');
                    return PIXI.Prepare;
                },
            },
            CanvasPrepare: {
                get: function get() {
                    deprecation('5.2.1', 'PIXI.prepare.CanvasPrepare moved to PIXI.CanvasPrepare');
                    return PIXI.CanvasPrepare;
                },
            },
        });
        PIXI.extract = {};
        Object.defineProperties(PIXI.extract, {
            Extract: {
                get: function get() {
                    deprecation('5.2.1', 'PIXI.extract.Extract moved to PIXI.Extract');
                    return PIXI.Extract;
                },
            },
            CanvasExtract: {
                get: function get() {
                    deprecation('5.2.1', 'PIXI.extract.CanvasExtract moved to PIXI.CanvasExtract');
                    return PIXI.CanvasExtract;
                },
            },
        });
        PIXI.extras = {};
        Object.defineProperties(PIXI.extras, {
            TilingSprite: {
                get: function get() {
                    deprecation(v5, 'PIXI.extras.TilingSprite class has moved to PIXI.TilingSprite');
                    return PIXI.TilingSprite;
                },
            },
            TilingSpriteRenderer: {
                get: function get() {
                    deprecation(v5, 'PIXI.extras.TilingSpriteRenderer class has moved to PIXI.TilingSpriteRenderer');
                    return PIXI.TilingSpriteRenderer;
                },
            },
            AnimatedSprite: {
                get: function get() {
                    deprecation(v5, 'PIXI.extras.AnimatedSprite class has moved to PIXI.AnimatedSprite');
                    return PIXI.AnimatedSprite;
                },
            },
            BitmapText: {
                get: function get() {
                    deprecation(v5, 'PIXI.extras.BitmapText class has moved to PIXI.BitmapText');
                    return PIXI.BitmapText;
                },
            },
        });
        Object.defineProperties(PIXI.utils, {
            getSvgSize: {
                get: function get() {
                    deprecation(v5, 'PIXI.utils.getSvgSize function has moved to PIXI.resources.SVGResource.getSize');
                    return PIXI.SVGResource.getSize;
                },
            },
        });
        PIXI.mesh = {};
        Object.defineProperties(PIXI.mesh, {
            Mesh: {
                get: function get() {
                    deprecation(v5, 'PIXI.mesh.Mesh class has moved to PIXI.SimpleMesh');
                    return PIXI.SimpleMesh;
                },
            },
            NineSlicePlane: {
                get: function get() {
                    deprecation(v5, 'PIXI.mesh.NineSlicePlane class has moved to PIXI.NineSlicePlane');
                    return PIXI.NineSlicePlane;
                },
            },
            Plane: {
                get: function get() {
                    deprecation(v5, 'PIXI.mesh.Plane class has moved to PIXI.SimplePlane');
                    return PIXI.SimplePlane;
                },
            },
            Rope: {
                get: function get() {
                    deprecation(v5, 'PIXI.mesh.Rope class has moved to PIXI.SimpleRope');
                    return PIXI.SimpleRope;
                },
            },
            RawMesh: {
                get: function get() {
                    deprecation(v5, 'PIXI.mesh.RawMesh class has moved to PIXI.Mesh');
                    return PIXI.Mesh;
                },
            },
            CanvasMeshRenderer: {
                get: function get() {
                    deprecation(v5, 'PIXI.mesh.CanvasMeshRenderer class has moved to PIXI.CanvasMeshRenderer');
                    return PIXI.CanvasMeshRenderer;
                },
            },
            MeshRenderer: {
                get: function get() {
                    deprecation(v5, 'PIXI.mesh.MeshRenderer class has moved to PIXI.MeshRenderer');
                    return PIXI.MeshRenderer;
                },
            },
        });
        PIXI.particles = {};
        Object.defineProperties(PIXI.particles, {
            ParticleContainer: {
                get: function get() {
                    deprecation(v5, 'PIXI.particles.ParticleContainer class has moved to PIXI.ParticleContainer');
                    return PIXI.ParticleContainer;
                },
            },
            ParticleRenderer: {
                get: function get() {
                    deprecation(v5, 'PIXI.particles.ParticleRenderer class has moved to PIXI.ParticleRenderer');
                    return PIXI.ParticleRenderer;
                },
            },
        });
        PIXI.ticker = {};
        Object.defineProperties(PIXI.ticker, {
            Ticker: {
                get: function get() {
                    deprecation(v5, 'PIXI.ticker.Ticker class has moved to PIXI.Ticker');
                    return PIXI.Ticker;
                },
            },
            shared: {
                get: function get() {
                    deprecation(v5, 'PIXI.ticker.shared instance has moved to PIXI.Ticker.shared');
                    return PIXI.Ticker.shared;
                },
            },
        });
        PIXI.loaders = {};
        Object.defineProperties(PIXI.loaders, {
            Loader: {
                get: function get() {
                    deprecation(v5, 'PIXI.loaders.Loader class has moved to PIXI.Loader');
                    return PIXI.Loader;
                },
            },
            Resource: {
                get: function get() {
                    deprecation(v5, 'PIXI.loaders.Resource class has moved to PIXI.LoaderResource');
                    return PIXI.LoaderResource;
                },
            },
            bitmapFontParser: {
                get: function get() {
                    deprecation(v5, 'PIXI.loaders.bitmapFontParser function has moved to PIXI.BitmapFontLoader.use');
                    return PIXI.BitmapFontLoader.use;
                },
            },
            parseBitmapFontData: {
                get: function get() {
                    deprecation(v5, 'PIXI.loaders.parseBitmapFontData function has moved to PIXI.BitmapFontLoader.parse');
                    return PIXI.BitmapFontLoader.parse;
                },
            },
            spritesheetParser: {
                get: function get() {
                    deprecation(v5, 'PIXI.loaders.spritesheetParser function has moved to PIXI.SpritesheetLoader.use');
                    return PIXI.SpritesheetLoader.use;
                },
            },
            getResourcePath: {
                get: function get() {
                    deprecation(v5, 'PIXI.loaders.getResourcePath property has moved to PIXI.SpritesheetLoader.getResourcePath');
                    return PIXI.SpritesheetLoader.getResourcePath;
                },
            },
        });
        PIXI.Loader.addPixiMiddleware = function addPixiMiddleware(middleware) {
            deprecation(v5, 'PIXI.loaders.Loader.addPixiMiddleware function is deprecated, use PIXI.loaders.Loader.registerPlugin');
            return PIXI.loaders.Loader.registerPlugin({ use: middleware() });
        };
        Object.defineProperty(PIXI.extract, 'WebGLExtract', {
            get: function get() {
                deprecation(v5, 'PIXI.extract.WebGLExtract method has moved to PIXI.Extract');
                return PIXI.Extract;
            },
        });
        Object.defineProperty(PIXI.prepare, 'WebGLPrepare', {
            get: function get() {
                deprecation(v5, 'PIXI.prepare.WebGLPrepare class has moved to PIXI.Prepare');
                return PIXI.Prepare;
            },
        });
        PIXI.Container.prototype._renderWebGL = function _renderWebGL(renderer) {
            deprecation(v5, 'PIXI.Container._renderWebGL method has moved to PIXI.Container._render');
            this._render(renderer);
        };
        PIXI.Container.prototype.renderWebGL = function renderWebGL(renderer) {
            deprecation(v5, 'PIXI.Container.renderWebGL method has moved to PIXI.Container.render');
            this.render(renderer);
        };
        PIXI.DisplayObject.prototype.renderWebGL = function renderWebGL(renderer) {
            deprecation(v5, 'PIXI.DisplayObject.renderWebGL method has moved to PIXI.DisplayObject.render');
            this.render(renderer);
        };
        PIXI.Container.prototype.renderAdvancedWebGL = function renderAdvancedWebGL(renderer) {
            deprecation(v5, 'PIXI.Container.renderAdvancedWebGL method has moved to PIXI.Container.renderAdvanced');
            this.renderAdvanced(renderer);
        };
        Object.defineProperties(PIXI.settings, {
            TRANSFORM_MODE: {
                get: function get() {
                    deprecation(v5, 'PIXI.settings.TRANSFORM_MODE property has been removed');
                    return 0;
                },
                set: function set() {
                    deprecation(v5, 'PIXI.settings.TRANSFORM_MODE property has been removed');
                },
            },
        });
        var BaseTexture = PIXI.BaseTexture;
        BaseTexture.prototype.loadSource = function loadSource(image) {
            deprecation(v5, 'PIXI.BaseTexture.loadSource method has been deprecated');
            var resource = PIXI.resources.autoDetectResource(image);
            resource.internal = true;
            this.setResource(resource);
            this.update();
        };
        var baseTextureIdDeprecation = false;
        Object.defineProperties(BaseTexture.prototype, {
            hasLoaded: {
                get: function get() {
                    deprecation(v5, 'PIXI.BaseTexture.hasLoaded property has been removed, use PIXI.BaseTexture.valid');
                    return this.valid;
                },
            },
            imageUrl: {
                get: function get() {
                    deprecation(v5, 'PIXI.BaseTexture.imageUrl property has been removed, use PIXI.BaseTexture.resource.url');
                    return this.resource && this.resource.url;
                },
                set: function set(imageUrl) {
                    deprecation(v5, 'PIXI.BaseTexture.imageUrl property has been removed, use PIXI.BaseTexture.resource.url');
                    if (this.resource) {
                        this.resource.url = imageUrl;
                    }
                },
            },
            source: {
                get: function get() {
                    deprecation(v5, 'PIXI.BaseTexture.source property has been moved, use `PIXI.BaseTexture.resource.source`');
                    return this.resource && this.resource.source;
                },
                set: function set(source) {
                    deprecation(v5, 'PIXI.BaseTexture.source property has been moved, use `PIXI.BaseTexture.resource.source` '
                        + 'if you want to set HTMLCanvasElement. Otherwise, create new BaseTexture.');
                    if (this.resource) {
                        this.resource.source = source;
                    }
                },
            },
            premultiplyAlpha: {
                get: function get() {
                    deprecation('5.2.0', 'PIXI.BaseTexture.premultiplyAlpha property has been changed to `alphaMode`'
                        + ', see `PIXI.ALPHA_MODES`');
                    return this.alphaMode !== 0;
                },
                set: function set(value) {
                    deprecation('5.2.0', 'PIXI.BaseTexture.premultiplyAlpha property has been changed to `alphaMode`'
                        + ', see `PIXI.ALPHA_MODES`');
                    this.alphaMode = Number(value);
                },
            },
            _id: {
                get: function get() {
                    if (!baseTextureIdDeprecation) {
                        deprecation('5.2.0', 'PIXI.BaseTexture._id batch local field has been changed to `_batchLocation`');
                        baseTextureIdDeprecation = true;
                    }
                    return this._batchLocation;
                },
                set: function set(value) {
                    this._batchLocation = value;
                },
            },
        });
        BaseTexture.fromImage = function fromImage(canvas, crossorigin, scaleMode, scale) {
            deprecation(v5, 'PIXI.BaseTexture.fromImage method has been replaced with PIXI.BaseTexture.from');
            var resourceOptions = { scale: scale, crossorigin: crossorigin };
            return BaseTexture.from(canvas, { scaleMode: scaleMode, resourceOptions: resourceOptions });
        };
        BaseTexture.fromCanvas = function fromCanvas(canvas, scaleMode) {
            deprecation(v5, 'PIXI.BaseTexture.fromCanvas method has been replaced with PIXI.BaseTexture.from');
            return BaseTexture.from(canvas, { scaleMode: scaleMode });
        };
        BaseTexture.fromSVG = function fromSVG(canvas, crossorigin, scaleMode, scale) {
            deprecation(v5, 'PIXI.BaseTexture.fromSVG method has been replaced with PIXI.BaseTexture.from');
            var resourceOptions = { scale: scale, crossorigin: crossorigin };
            return BaseTexture.from(canvas, { scaleMode: scaleMode, resourceOptions: resourceOptions });
        };
        Object.defineProperties(PIXI.resources.ImageResource.prototype, {
            premultiplyAlpha: {
                get: function get() {
                    deprecation('5.2.0', 'PIXI.resources.ImageResource.premultiplyAlpha property '
                        + 'has been changed to `alphaMode`, see `PIXI.ALPHA_MODES`');
                    return this.alphaMode !== 0;
                },
                set: function set(value) {
                    deprecation('5.2.0', 'PIXI.resources.ImageResource.premultiplyAlpha property '
                        + 'has been changed to `alphaMode`, see `PIXI.ALPHA_MODES`');
                    this.alphaMode = Number(value);
                },
            },
        });
        PIXI.Point.prototype.copy = function copy(p) {
            deprecation(v5, 'PIXI.Point.copy method has been replaced with PIXI.Point.copyFrom');
            return this.copyFrom(p);
        };
        PIXI.ObservablePoint.prototype.copy = function copy(p) {
            deprecation(v5, 'PIXI.ObservablePoint.copy method has been replaced with PIXI.ObservablePoint.copyFrom');
            return this.copyFrom(p);
        };
        PIXI.Rectangle.prototype.copy = function copy(p) {
            deprecation(v5, 'PIXI.Rectangle.copy method has been replaced with PIXI.Rectangle.copyFrom');
            return this.copyFrom(p);
        };
        PIXI.Matrix.prototype.copy = function copy(p) {
            deprecation(v5, 'PIXI.Matrix.copy method has been replaced with PIXI.Matrix.copyTo');
            return this.copyTo(p);
        };
        PIXI.systems.StateSystem.prototype.setState = function setState(s) {
            deprecation('v5.1.0', 'StateSystem.setState has been renamed to StateSystem.set');
            return this.set(s);
        };
        Object.assign(PIXI.systems.FilterSystem.prototype, {
            getRenderTarget: function getRenderTarget(clear, resolution) {
                deprecation(v5, 'PIXI.FilterManager.getRenderTarget method has been replaced with PIXI.systems.FilterSystem#getFilterTexture');
                return this.getFilterTexture(resolution);
            },
            returnRenderTarget: function returnRenderTarget(renderTexture) {
                deprecation(v5, 'PIXI.FilterManager.returnRenderTarget method has been replaced with '
                    + 'PIXI.systems.FilterSystem.returnFilterTexture');
                this.returnFilterTexture(renderTexture);
            },
            calculateScreenSpaceMatrix: function calculateScreenSpaceMatrix(outputMatrix) {
                deprecation(v5, 'PIXI.systems.FilterSystem.calculateScreenSpaceMatrix method is removed, '
                    + 'use `(vTextureCoord * inputSize.xy) + outputFrame.xy` instead');
                var mappedMatrix = outputMatrix.identity();
                var ref = this.activeState;
                var sourceFrame = ref.sourceFrame;
                var destinationFrame = ref.destinationFrame;
                mappedMatrix.translate(sourceFrame.x / destinationFrame.width, sourceFrame.y / destinationFrame.height);
                mappedMatrix.scale(destinationFrame.width, destinationFrame.height);
                return mappedMatrix;
            },
            calculateNormalizedScreenSpaceMatrix: function calculateNormalizedScreenSpaceMatrix(outputMatrix) {
                deprecation(v5, 'PIXI.systems.FilterManager.calculateNormalizedScreenSpaceMatrix method is removed, '
                    + 'use `((vTextureCoord * inputSize.xy) + outputFrame.xy) / outputFrame.zw` instead.');
                var ref = this.activeState;
                var sourceFrame = ref.sourceFrame;
                var destinationFrame = ref.destinationFrame;
                var mappedMatrix = outputMatrix.identity();
                mappedMatrix.translate(sourceFrame.x / destinationFrame.width, sourceFrame.y / destinationFrame.height);
                var translateScaleX = (destinationFrame.width / sourceFrame.width);
                var translateScaleY = (destinationFrame.height / sourceFrame.height);
                mappedMatrix.scale(translateScaleX, translateScaleY);
                return mappedMatrix;
            },
        });
        Object.defineProperties(PIXI.RenderTexture.prototype, {
            sourceFrame: {
                get: function get() {
                    deprecation(v5, 'PIXI.RenderTexture.sourceFrame property has been removed');
                    return this.filterFrame;
                },
            },
            size: {
                get: function get() {
                    deprecation(v5, 'PIXI.RenderTexture.size property has been removed');
                    return this._frame;
                },
            },
        });
        var BlurXFilter = (function (superclass) {
            function BlurXFilter(strength, quality, resolution, kernelSize) {
                deprecation(v5, 'PIXI.filters.BlurXFilter class is deprecated, use PIXI.filters.BlurFilterPass');
                superclass.call(this, true, strength, quality, resolution, kernelSize);
            }
            if (superclass)
                BlurXFilter.__proto__ = superclass;
            BlurXFilter.prototype = Object.create(superclass && superclass.prototype);
            BlurXFilter.prototype.constructor = BlurXFilter;
            return BlurXFilter;
        }(PIXI.filters.BlurFilterPass));
        var BlurYFilter = (function (superclass) {
            function BlurYFilter(strength, quality, resolution, kernelSize) {
                deprecation(v5, 'PIXI.filters.BlurYFilter class is deprecated, use PIXI.filters.BlurFilterPass');
                superclass.call(this, false, strength, quality, resolution, kernelSize);
            }
            if (superclass)
                BlurYFilter.__proto__ = superclass;
            BlurYFilter.prototype = Object.create(superclass && superclass.prototype);
            BlurYFilter.prototype.constructor = BlurYFilter;
            return BlurYFilter;
        }(PIXI.filters.BlurFilterPass));
        Object.assign(PIXI.filters, {
            BlurXFilter: BlurXFilter,
            BlurYFilter: BlurYFilter,
        });
        var Sprite = PIXI.Sprite;
        var Texture = PIXI.Texture;
        var Graphics = PIXI.Graphics;
        if (!Graphics.prototype.generateCanvasTexture) {
            Graphics.prototype.generateCanvasTexture = function generateCanvasTexture() {
                deprecation(v5, 'PIXI.Graphics.generateCanvasTexture method is only available in "pixi.js-legacy"');
            };
        }
        Object.defineProperty(PIXI.Graphics.prototype, 'graphicsData', {
            get: function get() {
                deprecation(v5, 'PIXI.Graphics.graphicsData property is deprecated, use PIXI.Graphics.geometry.graphicsData');
                return this.geometry.graphicsData;
            },
        });
        Object.defineProperty(PIXI.SimpleRope.prototype, 'points', {
            get: function get() {
                deprecation(v5, 'PIXI.SimpleRope.points property is deprecated, '
                    + 'use PIXI.SimpleRope.geometry.points');
                return this.geometry.points;
            },
            set: function set(value) {
                deprecation(v5, 'PIXI.SimpleRope.points property is deprecated, '
                    + 'use PIXI.SimpleRope.geometry.points');
                this.geometry.points = value;
            },
        });
        function spriteFrom(name, source, crossorigin, scaleMode) {
            deprecation(v5, ("PIXI.Sprite." + name + " method is deprecated, use PIXI.Sprite.from"));
            return Sprite.from(source, {
                resourceOptions: {
                    scale: scaleMode,
                    crossorigin: crossorigin,
                },
            });
        }
        Sprite.fromImage = spriteFrom.bind(null, 'fromImage');
        Sprite.fromSVG = spriteFrom.bind(null, 'fromSVG');
        Sprite.fromCanvas = spriteFrom.bind(null, 'fromCanvas');
        Sprite.fromVideo = spriteFrom.bind(null, 'fromVideo');
        Sprite.fromFrame = spriteFrom.bind(null, 'fromFrame');
        function textureFrom(name, source, crossorigin, scaleMode) {
            deprecation(v5, ("PIXI.Texture." + name + " method is deprecated, use PIXI.Texture.from"));
            return Texture.from(source, {
                resourceOptions: {
                    scale: scaleMode,
                    crossorigin: crossorigin,
                },
            });
        }
        Texture.fromImage = textureFrom.bind(null, 'fromImage');
        Texture.fromSVG = textureFrom.bind(null, 'fromSVG');
        Texture.fromCanvas = textureFrom.bind(null, 'fromCanvas');
        Texture.fromVideo = textureFrom.bind(null, 'fromVideo');
        Texture.fromFrame = textureFrom.bind(null, 'fromFrame');
        Object.defineProperty(PIXI.AbstractRenderer.prototype, 'autoResize', {
            get: function get() {
                deprecation(v5, 'PIXI.AbstractRenderer.autoResize property is deprecated, '
                    + 'use PIXI.AbstractRenderer.autoDensity');
                return this.autoDensity;
            },
            set: function set(value) {
                deprecation(v5, 'PIXI.AbstractRenderer.autoResize property is deprecated, '
                    + 'use PIXI.AbstractRenderer.autoDensity');
                this.autoDensity = value;
            },
        });
        Object.defineProperty(PIXI.Renderer.prototype, 'textureManager', {
            get: function get() {
                deprecation(v5, 'PIXI.Renderer.textureManager property is deprecated, use PIXI.Renderer.texture');
                return this.texture;
            },
        });
        PIXI.utils.mixins = {
            mixin: function mixin() {
                deprecation(v5, 'PIXI.utils.mixins.mixin function is no longer available');
            },
            delayMixin: function delayMixin() {
                deprecation(v5, 'PIXI.utils.mixins.delayMixin function is no longer available');
            },
            performMixins: function performMixins() {
                deprecation(v5, 'PIXI.utils.mixins.performMixins function is no longer available');
            },
        };
    }
    var MeshBatchUvs = function MeshBatchUvs(uvBuffer, uvMatrix) {
        this.uvBuffer = uvBuffer;
        this.uvMatrix = uvMatrix;
        this.data = null;
        this._bufferUpdateId = -1;
        this._textureUpdateId = -1;
        this._updateID = 0;
    };
    MeshBatchUvs.prototype.update = function update(forceUpdate) {
        if (!forceUpdate
            && this._bufferUpdateId === this.uvBuffer._updateID
            && this._textureUpdateId === this.uvMatrix._updateID) {
            return;
        }
        this._bufferUpdateId = this.uvBuffer._updateID;
        this._textureUpdateId = this.uvMatrix._updateID;
        var data = this.uvBuffer.data;
        if (!this.data || this.data.length !== data.length) {
            this.data = new Float32Array(data.length);
        }
        this.uvMatrix.multiplyUvs(data, this.data);
        this._updateID++;
    };
    var tempPoint$2 = new Point();
    var tempPolygon = new Polygon();
    var Mesh = (function (Container) {
        function Mesh(geometry, shader, state, drawMode) {
            if (drawMode === void 0) {
                drawMode = exports.DRAW_MODES.TRIANGLES;
            }
            Container.call(this);
            this.geometry = geometry;
            geometry.refCount++;
            this.shader = shader;
            this.state = state || State.for2d();
            this.drawMode = drawMode;
            this.start = 0;
            this.size = 0;
            this.uvs = null;
            this.indices = null;
            this.vertexData = new Float32Array(1);
            this.vertexDirty = 0;
            this._transformID = -1;
            this.tint = 0xFFFFFF;
            this.blendMode = exports.BLEND_MODES.NORMAL;
            this._roundPixels = settings.ROUND_PIXELS;
            this.batchUvs = null;
        }
        if (Container) {
            Mesh.__proto__ = Container;
        }
        Mesh.prototype = Object.create(Container && Container.prototype);
        Mesh.prototype.constructor = Mesh;
        var prototypeAccessors = { uvBuffer: { configurable: true }, verticesBuffer: { configurable: true }, material: { configurable: true }, blendMode: { configurable: true }, roundPixels: { configurable: true }, tint: { configurable: true }, texture: { configurable: true } };
        prototypeAccessors.uvBuffer.get = function () {
            return this.geometry.buffers[1];
        };
        prototypeAccessors.verticesBuffer.get = function () {
            return this.geometry.buffers[0];
        };
        prototypeAccessors.material.set = function (value) {
            this.shader = value;
        };
        prototypeAccessors.material.get = function () {
            return this.shader;
        };
        prototypeAccessors.blendMode.set = function (value) {
            this.state.blendMode = value;
        };
        prototypeAccessors.blendMode.get = function () {
            return this.state.blendMode;
        };
        prototypeAccessors.roundPixels.set = function (value) {
            if (this._roundPixels !== value) {
                this._transformID = -1;
            }
            this._roundPixels = value;
        };
        prototypeAccessors.roundPixels.get = function () {
            return this._roundPixels;
        };
        prototypeAccessors.tint.get = function () {
            return this.shader.tint;
        };
        prototypeAccessors.tint.set = function (value) {
            this.shader.tint = value;
        };
        prototypeAccessors.texture.get = function () {
            return this.shader.texture;
        };
        prototypeAccessors.texture.set = function (value) {
            this.shader.texture = value;
        };
        Mesh.prototype._render = function _render(renderer) {
            var vertices = this.geometry.buffers[0].data;
            if (this.shader.batchable && this.drawMode === exports.DRAW_MODES.TRIANGLES && vertices.length < Mesh.BATCHABLE_SIZE * 2) {
                this._renderToBatch(renderer);
            }
            else {
                this._renderDefault(renderer);
            }
        };
        Mesh.prototype._renderDefault = function _renderDefault(renderer) {
            var shader = this.shader;
            shader.alpha = this.worldAlpha;
            if (shader.update) {
                shader.update();
            }
            renderer.batch.flush();
            if (shader.program.uniformData.translationMatrix) {
                shader.uniforms.translationMatrix = this.transform.worldTransform.toArray(true);
            }
            renderer.shader.bind(shader);
            renderer.state.set(this.state);
            renderer.geometry.bind(this.geometry, shader);
            renderer.geometry.draw(this.drawMode, this.size, this.start, this.geometry.instanceCount);
        };
        Mesh.prototype._renderToBatch = function _renderToBatch(renderer) {
            var geometry = this.geometry;
            if (this.shader.uvMatrix) {
                this.shader.uvMatrix.update();
                this.calculateUvs();
            }
            this.calculateVertices();
            this.indices = geometry.indexBuffer.data;
            this._tintRGB = this.shader._tintRGB;
            this._texture = this.shader.texture;
            var pluginName = this.material.pluginName;
            renderer.batch.setObjectRenderer(renderer.plugins[pluginName]);
            renderer.plugins[pluginName].render(this);
        };
        Mesh.prototype.calculateVertices = function calculateVertices() {
            var geometry = this.geometry;
            var vertices = geometry.buffers[0].data;
            if (geometry.vertexDirtyId === this.vertexDirty && this._transformID === this.transform._worldID) {
                return;
            }
            this._transformID = this.transform._worldID;
            if (this.vertexData.length !== vertices.length) {
                this.vertexData = new Float32Array(vertices.length);
            }
            var wt = this.transform.worldTransform;
            var a = wt.a;
            var b = wt.b;
            var c = wt.c;
            var d = wt.d;
            var tx = wt.tx;
            var ty = wt.ty;
            var vertexData = this.vertexData;
            for (var i = 0; i < vertexData.length / 2; i++) {
                var x = vertices[(i * 2)];
                var y = vertices[(i * 2) + 1];
                vertexData[(i * 2)] = (a * x) + (c * y) + tx;
                vertexData[(i * 2) + 1] = (b * x) + (d * y) + ty;
            }
            if (this._roundPixels) {
                var resolution = settings.RESOLUTION;
                for (var i$1 = 0; i$1 < vertexData.length; ++i$1) {
                    vertexData[i$1] = Math.round((vertexData[i$1] * resolution | 0) / resolution);
                }
            }
            this.vertexDirty = geometry.vertexDirtyId;
        };
        Mesh.prototype.calculateUvs = function calculateUvs() {
            var geomUvs = this.geometry.buffers[1];
            if (!this.shader.uvMatrix.isSimple) {
                if (!this.batchUvs) {
                    this.batchUvs = new MeshBatchUvs(geomUvs, this.shader.uvMatrix);
                }
                this.batchUvs.update();
                this.uvs = this.batchUvs.data;
            }
            else {
                this.uvs = geomUvs.data;
            }
        };
        Mesh.prototype._calculateBounds = function _calculateBounds() {
            this.calculateVertices();
            this._bounds.addVertexData(this.vertexData, 0, this.vertexData.length);
        };
        Mesh.prototype.containsPoint = function containsPoint(point) {
            if (!this.getBounds().contains(point.x, point.y)) {
                return false;
            }
            this.worldTransform.applyInverse(point, tempPoint$2);
            var vertices = this.geometry.getBuffer('aVertexPosition').data;
            var points = tempPolygon.points;
            var indices = this.geometry.getIndex().data;
            var len = indices.length;
            var step = this.drawMode === 4 ? 3 : 1;
            for (var i = 0; i + 2 < len; i += step) {
                var ind0 = indices[i] * 2;
                var ind1 = indices[i + 1] * 2;
                var ind2 = indices[i + 2] * 2;
                points[0] = vertices[ind0];
                points[1] = vertices[ind0 + 1];
                points[2] = vertices[ind1];
                points[3] = vertices[ind1 + 1];
                points[4] = vertices[ind2];
                points[5] = vertices[ind2 + 1];
                if (tempPolygon.contains(tempPoint$2.x, tempPoint$2.y)) {
                    return true;
                }
            }
            return false;
        };
        Mesh.prototype.destroy = function destroy(options) {
            Container.prototype.destroy.call(this, options);
            this.geometry.refCount--;
            if (this.geometry.refCount === 0) {
                this.geometry.dispose();
            }
            this.geometry = null;
            this.shader = null;
            this.state = null;
            this.uvs = null;
            this.indices = null;
            this.vertexData = null;
        };
        Object.defineProperties(Mesh.prototype, prototypeAccessors);
        return Mesh;
    }(Container));
    Mesh.BATCHABLE_SIZE = 100;
    var vertex$5 = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\nuniform mat3 translationMatrix;\nuniform mat3 uTextureMatrix;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n\n    vTextureCoord = (uTextureMatrix * vec3(aTextureCoord, 1.0)).xy;\n}\n";
    var fragment$8 = "varying vec2 vTextureCoord;\nuniform vec4 uColor;\n\nuniform sampler2D uSampler;\n\nvoid main(void)\n{\n    gl_FragColor = texture2D(uSampler, vTextureCoord) * uColor;\n}\n";
    var MeshMaterial = (function (Shader) {
        function MeshMaterial(uSampler, options) {
            var uniforms = {
                uSampler: uSampler,
                alpha: 1,
                uTextureMatrix: Matrix.IDENTITY,
                uColor: new Float32Array([1, 1, 1, 1]),
            };
            options = Object.assign({
                tint: 0xFFFFFF,
                alpha: 1,
                pluginName: 'batch',
            }, options);
            if (options.uniforms) {
                Object.assign(uniforms, options.uniforms);
            }
            Shader.call(this, options.program || Program.from(vertex$5, fragment$8), uniforms);
            this._colorDirty = false;
            this.uvMatrix = new TextureMatrix(uSampler);
            this.batchable = options.program === undefined;
            this.pluginName = options.pluginName;
            this.tint = options.tint;
            this.alpha = options.alpha;
        }
        if (Shader) {
            MeshMaterial.__proto__ = Shader;
        }
        MeshMaterial.prototype = Object.create(Shader && Shader.prototype);
        MeshMaterial.prototype.constructor = MeshMaterial;
        var prototypeAccessors = { texture: { configurable: true }, alpha: { configurable: true }, tint: { configurable: true } };
        prototypeAccessors.texture.get = function () {
            return this.uniforms.uSampler;
        };
        prototypeAccessors.texture.set = function (value) {
            if (this.uniforms.uSampler !== value) {
                this.uniforms.uSampler = value;
                this.uvMatrix.texture = value;
            }
        };
        prototypeAccessors.alpha.set = function (value) {
            if (value === this._alpha) {
                return;
            }
            this._alpha = value;
            this._colorDirty = true;
        };
        prototypeAccessors.alpha.get = function () {
            return this._alpha;
        };
        prototypeAccessors.tint.set = function (value) {
            if (value === this._tint) {
                return;
            }
            this._tint = value;
            this._tintRGB = (value >> 16) + (value & 0xff00) + ((value & 0xff) << 16);
            this._colorDirty = true;
        };
        prototypeAccessors.tint.get = function () {
            return this._tint;
        };
        MeshMaterial.prototype.update = function update() {
            if (this._colorDirty) {
                this._colorDirty = false;
                var baseTexture = this.texture.baseTexture;
                premultiplyTintToRgba(this._tint, this._alpha, this.uniforms.uColor, baseTexture.alphaMode);
            }
            if (this.uvMatrix.update()) {
                this.uniforms.uTextureMatrix = this.uvMatrix.mapCoord;
            }
        };
        Object.defineProperties(MeshMaterial.prototype, prototypeAccessors);
        return MeshMaterial;
    }(Shader));
    var MeshGeometry = (function (Geometry) {
        function MeshGeometry(vertices, uvs, index) {
            Geometry.call(this);
            var verticesBuffer = new Buffer(vertices);
            var uvsBuffer = new Buffer(uvs, true);
            var indexBuffer = new Buffer(index, true, true);
            this.addAttribute('aVertexPosition', verticesBuffer, 2, false, exports.TYPES.FLOAT)
                .addAttribute('aTextureCoord', uvsBuffer, 2, false, exports.TYPES.FLOAT)
                .addIndex(indexBuffer);
            this._updateId = -1;
        }
        if (Geometry) {
            MeshGeometry.__proto__ = Geometry;
        }
        MeshGeometry.prototype = Object.create(Geometry && Geometry.prototype);
        MeshGeometry.prototype.constructor = MeshGeometry;
        var prototypeAccessors = { vertexDirtyId: { configurable: true } };
        prototypeAccessors.vertexDirtyId.get = function () {
            return this.buffers[0]._updateID;
        };
        Object.defineProperties(MeshGeometry.prototype, prototypeAccessors);
        return MeshGeometry;
    }(Geometry));
    var PlaneGeometry = (function (MeshGeometry) {
        function PlaneGeometry(width, height, segWidth, segHeight) {
            if (width === void 0) {
                width = 100;
            }
            if (height === void 0) {
                height = 100;
            }
            if (segWidth === void 0) {
                segWidth = 10;
            }
            if (segHeight === void 0) {
                segHeight = 10;
            }
            MeshGeometry.call(this);
            this.segWidth = segWidth;
            this.segHeight = segHeight;
            this.width = width;
            this.height = height;
            this.build();
        }
        if (MeshGeometry) {
            PlaneGeometry.__proto__ = MeshGeometry;
        }
        PlaneGeometry.prototype = Object.create(MeshGeometry && MeshGeometry.prototype);
        PlaneGeometry.prototype.constructor = PlaneGeometry;
        PlaneGeometry.prototype.build = function build() {
            var total = this.segWidth * this.segHeight;
            var verts = [];
            var uvs = [];
            var indices = [];
            var segmentsX = this.segWidth - 1;
            var segmentsY = this.segHeight - 1;
            var sizeX = (this.width) / segmentsX;
            var sizeY = (this.height) / segmentsY;
            for (var i = 0; i < total; i++) {
                var x = (i % this.segWidth);
                var y = ((i / this.segWidth) | 0);
                verts.push(x * sizeX, y * sizeY);
                uvs.push(x / segmentsX, y / segmentsY);
            }
            var totalSub = segmentsX * segmentsY;
            for (var i$1 = 0; i$1 < totalSub; i$1++) {
                var xpos = i$1 % segmentsX;
                var ypos = (i$1 / segmentsX) | 0;
                var value = (ypos * this.segWidth) + xpos;
                var value2 = (ypos * this.segWidth) + xpos + 1;
                var value3 = ((ypos + 1) * this.segWidth) + xpos;
                var value4 = ((ypos + 1) * this.segWidth) + xpos + 1;
                indices.push(value, value2, value3, value2, value4, value3);
            }
            this.buffers[0].data = new Float32Array(verts);
            this.buffers[1].data = new Float32Array(uvs);
            this.indexBuffer.data = new Uint16Array(indices);
            this.buffers[0].update();
            this.buffers[1].update();
            this.indexBuffer.update();
        };
        return PlaneGeometry;
    }(MeshGeometry));
    var RopeGeometry = (function (MeshGeometry) {
        function RopeGeometry(width, points, textureScale) {
            if (width === void 0) {
                width = 200;
            }
            if (textureScale === void 0) {
                textureScale = 0;
            }
            MeshGeometry.call(this, new Float32Array(points.length * 4), new Float32Array(points.length * 4), new Uint16Array((points.length - 1) * 6));
            this.points = points;
            this.width = width;
            this.textureScale = textureScale;
            this.build();
        }
        if (MeshGeometry) {
            RopeGeometry.__proto__ = MeshGeometry;
        }
        RopeGeometry.prototype = Object.create(MeshGeometry && MeshGeometry.prototype);
        RopeGeometry.prototype.constructor = RopeGeometry;
        RopeGeometry.prototype.build = function build() {
            var points = this.points;
            if (!points) {
                return;
            }
            var vertexBuffer = this.getBuffer('aVertexPosition');
            var uvBuffer = this.getBuffer('aTextureCoord');
            var indexBuffer = this.getIndex();
            if (points.length < 1) {
                return;
            }
            if (vertexBuffer.data.length / 4 !== points.length) {
                vertexBuffer.data = new Float32Array(points.length * 4);
                uvBuffer.data = new Float32Array(points.length * 4);
                indexBuffer.data = new Uint16Array((points.length - 1) * 6);
            }
            var uvs = uvBuffer.data;
            var indices = indexBuffer.data;
            uvs[0] = 0;
            uvs[1] = 0;
            uvs[2] = 0;
            uvs[3] = 1;
            var amount = 0;
            var prev = points[0];
            var textureWidth = this.width * this.textureScale;
            var total = points.length;
            for (var i = 0; i < total; i++) {
                var index = i * 4;
                if (this.textureScale > 0) {
                    var dx = prev.x - points[i].x;
                    var dy = prev.y - points[i].y;
                    var distance = Math.sqrt((dx * dx) + (dy * dy));
                    prev = points[i];
                    amount += distance / textureWidth;
                }
                else {
                    amount = i / (total - 1);
                }
                uvs[index] = amount;
                uvs[index + 1] = 0;
                uvs[index + 2] = amount;
                uvs[index + 3] = 1;
            }
            var indexCount = 0;
            for (var i$1 = 0; i$1 < total - 1; i$1++) {
                var index$1 = i$1 * 2;
                indices[indexCount++] = index$1;
                indices[indexCount++] = index$1 + 1;
                indices[indexCount++] = index$1 + 2;
                indices[indexCount++] = index$1 + 2;
                indices[indexCount++] = index$1 + 1;
                indices[indexCount++] = index$1 + 3;
            }
            uvBuffer.update();
            indexBuffer.update();
            this.updateVertices();
        };
        RopeGeometry.prototype.updateVertices = function updateVertices() {
            var points = this.points;
            if (points.length < 1) {
                return;
            }
            var lastPoint = points[0];
            var nextPoint;
            var perpX = 0;
            var perpY = 0;
            var vertices = this.buffers[0].data;
            var total = points.length;
            for (var i = 0; i < total; i++) {
                var point = points[i];
                var index = i * 4;
                if (i < points.length - 1) {
                    nextPoint = points[i + 1];
                }
                else {
                    nextPoint = point;
                }
                perpY = -(nextPoint.x - lastPoint.x);
                perpX = nextPoint.y - lastPoint.y;
                var perpLength = Math.sqrt((perpX * perpX) + (perpY * perpY));
                var num = this.textureScale > 0 ? this.textureScale * this.width / 2 : this.width / 2;
                perpX /= perpLength;
                perpY /= perpLength;
                perpX *= num;
                perpY *= num;
                vertices[index] = point.x + perpX;
                vertices[index + 1] = point.y + perpY;
                vertices[index + 2] = point.x - perpX;
                vertices[index + 3] = point.y - perpY;
                lastPoint = point;
            }
            this.buffers[0].update();
        };
        RopeGeometry.prototype.update = function update() {
            if (this.textureScale > 0) {
                this.build();
            }
            else {
                this.updateVertices();
            }
        };
        return RopeGeometry;
    }(MeshGeometry));
    var SimpleRope = (function (Mesh) {
        function SimpleRope(texture, points, textureScale) {
            if (textureScale === void 0) {
                textureScale = 0;
            }
            var ropeGeometry = new RopeGeometry(texture.height, points, textureScale);
            var meshMaterial = new MeshMaterial(texture);
            if (textureScale > 0) {
                texture.baseTexture.wrapMode = exports.WRAP_MODES.REPEAT;
            }
            Mesh.call(this, ropeGeometry, meshMaterial);
            this.autoUpdate = true;
        }
        if (Mesh) {
            SimpleRope.__proto__ = Mesh;
        }
        SimpleRope.prototype = Object.create(Mesh && Mesh.prototype);
        SimpleRope.prototype.constructor = SimpleRope;
        SimpleRope.prototype._render = function _render(renderer) {
            if (this.autoUpdate
                || this.geometry.width !== this.shader.texture.height) {
                this.geometry.width = this.shader.texture.height;
                this.geometry.update();
            }
            Mesh.prototype._render.call(this, renderer);
        };
        return SimpleRope;
    }(Mesh));
    var SimplePlane = (function (Mesh) {
        function SimplePlane(texture, verticesX, verticesY) {
            var planeGeometry = new PlaneGeometry(texture.width, texture.height, verticesX, verticesY);
            var meshMaterial = new MeshMaterial(Texture.WHITE);
            Mesh.call(this, planeGeometry, meshMaterial);
            this.texture = texture;
        }
        if (Mesh) {
            SimplePlane.__proto__ = Mesh;
        }
        SimplePlane.prototype = Object.create(Mesh && Mesh.prototype);
        SimplePlane.prototype.constructor = SimplePlane;
        var prototypeAccessors = { texture: { configurable: true } };
        SimplePlane.prototype.textureUpdated = function textureUpdated() {
            this._textureID = this.shader.texture._updateID;
            this.geometry.width = this.shader.texture.width;
            this.geometry.height = this.shader.texture.height;
            this.geometry.build();
        };
        prototypeAccessors.texture.set = function (value) {
            if (this.shader.texture === value) {
                return;
            }
            this.shader.texture = value;
            this._textureID = -1;
            if (value.baseTexture.valid) {
                this.textureUpdated();
            }
            else {
                value.once('update', this.textureUpdated, this);
            }
        };
        prototypeAccessors.texture.get = function () {
            return this.shader.texture;
        };
        SimplePlane.prototype._render = function _render(renderer) {
            if (this._textureID !== this.shader.texture._updateID) {
                this.textureUpdated();
            }
            Mesh.prototype._render.call(this, renderer);
        };
        Object.defineProperties(SimplePlane.prototype, prototypeAccessors);
        return SimplePlane;
    }(Mesh));
    var SimpleMesh = (function (Mesh) {
        function SimpleMesh(texture, vertices, uvs, indices, drawMode) {
            if (texture === void 0) {
                texture = Texture.EMPTY;
            }
            var geometry = new MeshGeometry(vertices, uvs, indices);
            geometry.getBuffer('aVertexPosition').static = false;
            var meshMaterial = new MeshMaterial(texture);
            Mesh.call(this, geometry, meshMaterial, null, drawMode);
            this.autoUpdate = true;
        }
        if (Mesh) {
            SimpleMesh.__proto__ = Mesh;
        }
        SimpleMesh.prototype = Object.create(Mesh && Mesh.prototype);
        SimpleMesh.prototype.constructor = SimpleMesh;
        var prototypeAccessors = { vertices: { configurable: true } };
        prototypeAccessors.vertices.get = function () {
            return this.geometry.getBuffer('aVertexPosition').data;
        };
        prototypeAccessors.vertices.set = function (value) {
            this.geometry.getBuffer('aVertexPosition').data = value;
        };
        SimpleMesh.prototype._render = function _render(renderer) {
            if (this.autoUpdate) {
                this.geometry.getBuffer('aVertexPosition').update();
            }
            Mesh.prototype._render.call(this, renderer);
        };
        Object.defineProperties(SimpleMesh.prototype, prototypeAccessors);
        return SimpleMesh;
    }(Mesh));
    var DEFAULT_BORDER_SIZE = 10;
    var NineSlicePlane = (function (SimplePlane) {
        function NineSlicePlane(texture, leftWidth, topHeight, rightWidth, bottomHeight) {
            SimplePlane.call(this, Texture.WHITE, 4, 4);
            this._origWidth = texture.orig.width;
            this._origHeight = texture.orig.height;
            this._width = this._origWidth;
            this._height = this._origHeight;
            this._leftWidth = typeof leftWidth !== 'undefined' ? leftWidth : DEFAULT_BORDER_SIZE;
            this._rightWidth = typeof rightWidth !== 'undefined' ? rightWidth : DEFAULT_BORDER_SIZE;
            this._topHeight = typeof topHeight !== 'undefined' ? topHeight : DEFAULT_BORDER_SIZE;
            this._bottomHeight = typeof bottomHeight !== 'undefined' ? bottomHeight : DEFAULT_BORDER_SIZE;
            this.texture = texture;
        }
        if (SimplePlane) {
            NineSlicePlane.__proto__ = SimplePlane;
        }
        NineSlicePlane.prototype = Object.create(SimplePlane && SimplePlane.prototype);
        NineSlicePlane.prototype.constructor = NineSlicePlane;
        var prototypeAccessors = { vertices: { configurable: true }, width: { configurable: true }, height: { configurable: true }, leftWidth: { configurable: true }, rightWidth: { configurable: true }, topHeight: { configurable: true }, bottomHeight: { configurable: true } };
        NineSlicePlane.prototype.textureUpdated = function textureUpdated() {
            this._textureID = this.shader.texture._updateID;
            this._refresh();
        };
        prototypeAccessors.vertices.get = function () {
            return this.geometry.getBuffer('aVertexPosition').data;
        };
        prototypeAccessors.vertices.set = function (value) {
            this.geometry.getBuffer('aVertexPosition').data = value;
        };
        NineSlicePlane.prototype.updateHorizontalVertices = function updateHorizontalVertices() {
            var vertices = this.vertices;
            var scale = this._getMinScale();
            vertices[9] = vertices[11] = vertices[13] = vertices[15] = this._topHeight * scale;
            vertices[17] = vertices[19] = vertices[21] = vertices[23] = this._height - (this._bottomHeight * scale);
            vertices[25] = vertices[27] = vertices[29] = vertices[31] = this._height;
        };
        NineSlicePlane.prototype.updateVerticalVertices = function updateVerticalVertices() {
            var vertices = this.vertices;
            var scale = this._getMinScale();
            vertices[2] = vertices[10] = vertices[18] = vertices[26] = this._leftWidth * scale;
            vertices[4] = vertices[12] = vertices[20] = vertices[28] = this._width - (this._rightWidth * scale);
            vertices[6] = vertices[14] = vertices[22] = vertices[30] = this._width;
        };
        NineSlicePlane.prototype._getMinScale = function _getMinScale() {
            var w = this._leftWidth + this._rightWidth;
            var scaleW = this._width > w ? 1.0 : this._width / w;
            var h = this._topHeight + this._bottomHeight;
            var scaleH = this._height > h ? 1.0 : this._height / h;
            var scale = Math.min(scaleW, scaleH);
            return scale;
        };
        prototypeAccessors.width.get = function () {
            return this._width;
        };
        prototypeAccessors.width.set = function (value) {
            this._width = value;
            this._refresh();
        };
        prototypeAccessors.height.get = function () {
            return this._height;
        };
        prototypeAccessors.height.set = function (value) {
            this._height = value;
            this._refresh();
        };
        prototypeAccessors.leftWidth.get = function () {
            return this._leftWidth;
        };
        prototypeAccessors.leftWidth.set = function (value) {
            this._leftWidth = value;
            this._refresh();
        };
        prototypeAccessors.rightWidth.get = function () {
            return this._rightWidth;
        };
        prototypeAccessors.rightWidth.set = function (value) {
            this._rightWidth = value;
            this._refresh();
        };
        prototypeAccessors.topHeight.get = function () {
            return this._topHeight;
        };
        prototypeAccessors.topHeight.set = function (value) {
            this._topHeight = value;
            this._refresh();
        };
        prototypeAccessors.bottomHeight.get = function () {
            return this._bottomHeight;
        };
        prototypeAccessors.bottomHeight.set = function (value) {
            this._bottomHeight = value;
            this._refresh();
        };
        NineSlicePlane.prototype._refresh = function _refresh() {
            var texture = this.texture;
            var uvs = this.geometry.buffers[1].data;
            this._origWidth = texture.orig.width;
            this._origHeight = texture.orig.height;
            var _uvw = 1.0 / this._origWidth;
            var _uvh = 1.0 / this._origHeight;
            uvs[0] = uvs[8] = uvs[16] = uvs[24] = 0;
            uvs[1] = uvs[3] = uvs[5] = uvs[7] = 0;
            uvs[6] = uvs[14] = uvs[22] = uvs[30] = 1;
            uvs[25] = uvs[27] = uvs[29] = uvs[31] = 1;
            uvs[2] = uvs[10] = uvs[18] = uvs[26] = _uvw * this._leftWidth;
            uvs[4] = uvs[12] = uvs[20] = uvs[28] = 1 - (_uvw * this._rightWidth);
            uvs[9] = uvs[11] = uvs[13] = uvs[15] = _uvh * this._topHeight;
            uvs[17] = uvs[19] = uvs[21] = uvs[23] = 1 - (_uvh * this._bottomHeight);
            this.updateHorizontalVertices();
            this.updateVerticalVertices();
            this.geometry.buffers[0].update();
            this.geometry.buffers[1].update();
        };
        Object.defineProperties(NineSlicePlane.prototype, prototypeAccessors);
        return NineSlicePlane;
    }(SimplePlane));
    var AnimatedSprite = (function (Sprite) {
        function AnimatedSprite(textures, autoUpdate) {
            Sprite.call(this, textures[0] instanceof Texture ? textures[0] : textures[0].texture);
            this._textures = null;
            this._durations = null;
            this.textures = textures;
            this._autoUpdate = autoUpdate !== false;
            this.animationSpeed = 1;
            this.loop = true;
            this.updateAnchor = false;
            this.onComplete = null;
            this.onFrameChange = null;
            this.onLoop = null;
            this._currentTime = 0;
            this.playing = false;
        }
        if (Sprite) {
            AnimatedSprite.__proto__ = Sprite;
        }
        AnimatedSprite.prototype = Object.create(Sprite && Sprite.prototype);
        AnimatedSprite.prototype.constructor = AnimatedSprite;
        var prototypeAccessors = { totalFrames: { configurable: true }, textures: { configurable: true }, currentFrame: { configurable: true } };
        AnimatedSprite.prototype.stop = function stop() {
            if (!this.playing) {
                return;
            }
            this.playing = false;
            if (this._autoUpdate) {
                Ticker.shared.remove(this.update, this);
            }
        };
        AnimatedSprite.prototype.play = function play() {
            if (this.playing) {
                return;
            }
            this.playing = true;
            if (this._autoUpdate) {
                Ticker.shared.add(this.update, this, exports.UPDATE_PRIORITY.HIGH);
            }
        };
        AnimatedSprite.prototype.gotoAndStop = function gotoAndStop(frameNumber) {
            this.stop();
            var previousFrame = this.currentFrame;
            this._currentTime = frameNumber;
            if (previousFrame !== this.currentFrame) {
                this.updateTexture();
            }
        };
        AnimatedSprite.prototype.gotoAndPlay = function gotoAndPlay(frameNumber) {
            var previousFrame = this.currentFrame;
            this._currentTime = frameNumber;
            if (previousFrame !== this.currentFrame) {
                this.updateTexture();
            }
            this.play();
        };
        AnimatedSprite.prototype.update = function update(deltaTime) {
            var elapsed = this.animationSpeed * deltaTime;
            var previousFrame = this.currentFrame;
            if (this._durations !== null) {
                var lag = this._currentTime % 1 * this._durations[this.currentFrame];
                lag += elapsed / 60 * 1000;
                while (lag < 0) {
                    this._currentTime--;
                    lag += this._durations[this.currentFrame];
                }
                var sign = Math.sign(this.animationSpeed * deltaTime);
                this._currentTime = Math.floor(this._currentTime);
                while (lag >= this._durations[this.currentFrame]) {
                    lag -= this._durations[this.currentFrame] * sign;
                    this._currentTime += sign;
                }
                this._currentTime += lag / this._durations[this.currentFrame];
            }
            else {
                this._currentTime += elapsed;
            }
            if (this._currentTime < 0 && !this.loop) {
                this._currentTime = 0;
                this.stop();
                if (this.onComplete) {
                    this.onComplete();
                }
            }
            else if (this._currentTime >= this._textures.length && !this.loop) {
                this._currentTime = this._textures.length - 1;
                this.stop();
                if (this.onComplete) {
                    this.onComplete();
                }
            }
            else if (previousFrame !== this.currentFrame) {
                if (this.loop && this.onLoop) {
                    if (this.animationSpeed > 0 && this.currentFrame < previousFrame) {
                        this.onLoop();
                    }
                    else if (this.animationSpeed < 0 && this.currentFrame > previousFrame) {
                        this.onLoop();
                    }
                }
                this.updateTexture();
            }
        };
        AnimatedSprite.prototype.updateTexture = function updateTexture() {
            this._texture = this._textures[this.currentFrame];
            this._textureID = -1;
            this._textureTrimmedID = -1;
            this._cachedTint = 0xFFFFFF;
            this.uvs = this._texture._uvs.uvsFloat32;
            if (this.updateAnchor) {
                this._anchor.copyFrom(this._texture.defaultAnchor);
            }
            if (this.onFrameChange) {
                this.onFrameChange(this.currentFrame);
            }
        };
        AnimatedSprite.prototype.destroy = function destroy(options) {
            this.stop();
            Sprite.prototype.destroy.call(this, options);
            this.onComplete = null;
            this.onFrameChange = null;
            this.onLoop = null;
        };
        AnimatedSprite.fromFrames = function fromFrames(frames) {
            var textures = [];
            for (var i = 0; i < frames.length; ++i) {
                textures.push(Texture.from(frames[i]));
            }
            return new AnimatedSprite(textures);
        };
        AnimatedSprite.fromImages = function fromImages(images) {
            var textures = [];
            for (var i = 0; i < images.length; ++i) {
                textures.push(Texture.from(images[i]));
            }
            return new AnimatedSprite(textures);
        };
        prototypeAccessors.totalFrames.get = function () {
            return this._textures.length;
        };
        prototypeAccessors.textures.get = function () {
            return this._textures;
        };
        prototypeAccessors.textures.set = function (value) {
            if (value[0] instanceof Texture) {
                this._textures = value;
                this._durations = null;
            }
            else {
                this._textures = [];
                this._durations = [];
                for (var i = 0; i < value.length; i++) {
                    this._textures.push(value[i].texture);
                    this._durations.push(value[i].time);
                }
            }
            this.gotoAndStop(0);
            this.updateTexture();
        };
        prototypeAccessors.currentFrame.get = function () {
            var currentFrame = Math.floor(this._currentTime) % this._textures.length;
            if (currentFrame < 0) {
                currentFrame += this._textures.length;
            }
            return currentFrame;
        };
        Object.defineProperties(AnimatedSprite.prototype, prototypeAccessors);
        return AnimatedSprite;
    }(Sprite));
    Renderer.registerPlugin('accessibility', AccessibilityManager);
    Renderer.registerPlugin('extract', Extract);
    Renderer.registerPlugin('interaction', InteractionManager);
    Renderer.registerPlugin('particle', ParticleRenderer);
    Renderer.registerPlugin('prepare', Prepare);
    Renderer.registerPlugin('batch', BatchRenderer);
    Renderer.registerPlugin('tilingSprite', TilingSpriteRenderer);
    Loader$1.registerPlugin(BitmapFontLoader);
    Loader$1.registerPlugin(SpritesheetLoader);
    Application.registerPlugin(TickerPlugin);
    Application.registerPlugin(AppLoaderPlugin);
    var VERSION$1 = '5.2.1';
    var filters = {
        AlphaFilter: AlphaFilter,
        BlurFilter: BlurFilter,
        BlurFilterPass: BlurFilterPass,
        ColorMatrixFilter: ColorMatrixFilter,
        DisplacementFilter: DisplacementFilter,
        FXAAFilter: FXAAFilter,
        NoiseFilter: NoiseFilter,
    };
    exports.AbstractBatchRenderer = AbstractBatchRenderer;
    exports.AbstractRenderer = AbstractRenderer;
    exports.AnimatedSprite = AnimatedSprite;
    exports.AppLoaderPlugin = AppLoaderPlugin;
    exports.Application = Application;
    exports.Attribute = Attribute;
    exports.BasePrepare = BasePrepare;
    exports.BaseRenderTexture = BaseRenderTexture;
    exports.BaseTexture = BaseTexture;
    exports.BatchDrawCall = BatchDrawCall;
    exports.BatchGeometry = BatchGeometry;
    exports.BatchPluginFactory = BatchPluginFactory;
    exports.BatchRenderer = BatchRenderer;
    exports.BatchShaderGenerator = BatchShaderGenerator;
    exports.BatchTextureArray = BatchTextureArray;
    exports.BitmapFontLoader = BitmapFontLoader;
    exports.BitmapText = BitmapText;
    exports.Bounds = Bounds;
    exports.Buffer = Buffer;
    exports.Circle = Circle;
    exports.Container = Container;
    exports.CountLimiter = CountLimiter;
    exports.CubeTexture = CubeTexture;
    exports.DEG_TO_RAD = DEG_TO_RAD;
    exports.DisplayObject = DisplayObject;
    exports.Ellipse = Ellipse;
    exports.Extract = Extract;
    exports.FillStyle = FillStyle;
    exports.Filter = Filter;
    exports.Framebuffer = Framebuffer;
    exports.GLProgram = GLProgram;
    exports.GLTexture = GLTexture;
    exports.GRAPHICS_CURVES = GRAPHICS_CURVES;
    exports.Geometry = Geometry;
    exports.Graphics = Graphics;
    exports.GraphicsData = GraphicsData;
    exports.GraphicsGeometry = GraphicsGeometry;
    exports.LineStyle = LineStyle;
    exports.Loader = Loader$1;
    exports.LoaderResource = LoaderResource;
    exports.MaskData = MaskData;
    exports.Matrix = Matrix;
    exports.Mesh = Mesh;
    exports.MeshBatchUvs = MeshBatchUvs;
    exports.MeshGeometry = MeshGeometry;
    exports.MeshMaterial = MeshMaterial;
    exports.NineSlicePlane = NineSlicePlane;
    exports.ObjectRenderer = ObjectRenderer;
    exports.ObservablePoint = ObservablePoint;
    exports.PI_2 = PI_2;
    exports.ParticleContainer = ParticleContainer;
    exports.ParticleRenderer = ParticleRenderer;
    exports.PlaneGeometry = PlaneGeometry;
    exports.Point = Point;
    exports.Polygon = Polygon;
    exports.Prepare = Prepare;
    exports.Program = Program;
    exports.Quad = Quad;
    exports.QuadUv = QuadUv;
    exports.RAD_TO_DEG = RAD_TO_DEG;
    exports.Rectangle = Rectangle;
    exports.RenderTexture = RenderTexture;
    exports.RenderTexturePool = RenderTexturePool;
    exports.Renderer = Renderer;
    exports.RopeGeometry = RopeGeometry;
    exports.RoundedRectangle = RoundedRectangle;
    exports.Runner = Runner;
    exports.Shader = Shader;
    exports.SimpleMesh = SimpleMesh;
    exports.SimplePlane = SimplePlane;
    exports.SimpleRope = SimpleRope;
    exports.Sprite = Sprite;
    exports.SpriteMaskFilter = SpriteMaskFilter;
    exports.Spritesheet = Spritesheet;
    exports.SpritesheetLoader = SpritesheetLoader;
    exports.State = State;
    exports.System = System;
    exports.TEXT_GRADIENT = TEXT_GRADIENT;
    exports.Text = Text;
    exports.TextMetrics = TextMetrics;
    exports.TextStyle = TextStyle;
    exports.Texture = Texture;
    exports.TextureLoader = TextureLoader;
    exports.TextureMatrix = TextureMatrix;
    exports.TextureUvs = TextureUvs;
    exports.Ticker = Ticker;
    exports.TickerPlugin = TickerPlugin;
    exports.TilingSprite = TilingSprite;
    exports.TilingSpriteRenderer = TilingSpriteRenderer;
    exports.TimeLimiter = TimeLimiter;
    exports.Transform = Transform;
    exports.UniformGroup = UniformGroup;
    exports.VERSION = VERSION$1;
    exports.ViewableBuffer = ViewableBuffer;
    exports.accessibility = accessibility_es;
    exports.autoDetectRenderer = autoDetectRenderer;
    exports.checkMaxIfStatementsInShader = checkMaxIfStatementsInShader;
    exports.defaultFilterVertex = defaultFilter;
    exports.defaultVertex = _default;
    exports.filters = filters;
    exports.graphicsUtils = index$2;
    exports.groupD8 = groupD8;
    exports.interaction = interaction_es;
    exports.isMobile = isMobile$1;
    exports.resources = index;
    exports.settings = settings;
    exports.systems = systems;
    exports.useDeprecated = useDeprecated;
    exports.utils = utils_es;
    return exports;
}({}));
PIXI.useDeprecated();
var CONST;
(function (CONST) {
    CONST.levelWidth = 28;
    CONST.levelHeight = 27;
    CONST.levelMask = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0,
        0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
        0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];
    CONST.levelScale = 0.12;
    CONST.checkedTileAlpha = 0.5;
    CONST.addedToPathTileAlpha = 1.0;
    CONST.inactiveTileAlpha = 0.8;
    CONST.stepDuration = 200;
    CONST.tileTex0 = PIXI.Texture.from("../assets/textures/1.png");
    CONST.tileTex1 = PIXI.Texture.from("../assets/textures/0.png");
    CONST.playerTex = PIXI.Texture.from("../assets/textures/player.png");
})(CONST || (CONST = {}));
class SceneDesigner {
    static get instance() {
        if (!this._instance) {
            this._instance = new SceneDesigner();
        }
        return this._instance;
    }
    constructor() {
        this.TILES = [];
        const scale = CONST.levelScale;
        const tileWidth = CONST.tileTex0.width * scale, tileHeight = CONST.tileTex0.height * scale;
        let xPos = 0, yPos = 0;
        for (let i = 0; i < CONST.levelHeight * CONST.levelWidth; ++i) {
            const sprite = new PIXI.Sprite(CONST.levelMask[i] ? CONST.tileTex1 : CONST.tileTex0);
            sprite.name = "tile-" + i;
            sprite.anchor.set(0.0);
            sprite.scale.set(scale);
            sprite.position.set(xPos, yPos);
            if ((i + 1) % CONST.levelWidth === 0) {
                xPos = 0;
                yPos += tileHeight;
            }
            else {
                xPos += tileWidth;
            }
            this.TILES.push(sprite);
        }
        this.PLAYER = new PIXI.Sprite(CONST.playerTex);
        this.PLAYER.name = "player";
        this.PLAYER.anchor.set(0.0);
        this.PLAYER.scale.set(CONST.levelScale);
        this.PLAYER.position.set(0.0);
        this.SOLVER = new PIXI.Text("", new PIXI.TextStyle({ fill: "#FFFFFF" }));
        this.SOLVER.name = "solver";
        this.SOLVER.anchor.set(0.0);
        this.SOLVER.position.set(0.0);
        this.PACMAN_SCENE = new PIXI.Container();
        this.PACMAN_SCENE.addChild(...this.TILES);
        this.PACMAN_SCENE.addChild(this.PLAYER);
        this.PACMAN_SCENE.addChild(this.SOLVER);
        APP.stage.addChild(this.PACMAN_SCENE);
        console.log("[SceneDesigner] SCENE WAS BUILT");
    }
}
class Player {
    constructor(playerContainer) {
        this.container = playerContainer;
        this.index = 0;
    }
    get position() {
        return this.container.position;
    }
}
class Button {
    constructor(sprite) {
        this.sprite = sprite;
        this.init();
    }
    get touchEnabled() {
        return this.sprite.interactive;
    }
    set touchEnabled(value) {
        this.sprite.interactive = value;
    }
    set onPointerTap(callback) {
        this.sprite.on("pointertap", callback);
    }
    set onPointerDown(callback) {
        this.sprite.on("pointerdown", callback);
    }
    set onPointerMove(callback) {
        this.sprite.on("pointermove", callback);
    }
    set onPointerUp(callback) {
        this.sprite.on("pointerup", callback);
    }
    init() {
        this.sprite.interactive = true;
        this.sprite.buttonMode = true;
    }
}
class Tile {
    constructor(tileSprite) {
        this.sprite = tileSprite;
        this.button = new Button(tileSprite);
    }
    get position() {
        return this.sprite.position;
    }
    get alpha() {
        return this.sprite.alpha;
    }
    set alpha(value) {
        this.sprite.alpha = value;
    }
}
class GameState {
    constructor(game) {
        this.game = game;
    }
    get isActiveState() {
        return this === this.game.currentState;
    }
}
GameState.key = "GameState";
class IdleState extends GameState {
    constructor(game) {
        super(game);
        this.onPlayState = false;
        this.onSolverPointerDown = () => {
            if (!this.isActiveState) {
                return;
            }
            this.game.nextSolver();
        };
        this.onTilePointerDown = (value, index) => {
            if (!this.isActiveState || !CONST.levelMask[index] || !CONST.levelMask[this.game.player.index]) {
                return;
            }
            for (const tile of this.game.tiles) {
                tile.alpha = CONST.inactiveTileAlpha;
            }
            const path = this.game.currentSolver.solve(this.game.player.index, index);
            const toX = [];
            const toY = [];
            for (let i = 0; i < path.length; ++i) {
                const pos = this.game.tiles[path[i]].position;
                toX.push(pos.x);
                toY.push(pos.y);
            }
            const from = { x: this.game.player.position.x, y: this.game.player.position.y };
            const to = { x: toX, y: toY };
            this.game.moveTween =
                new TWEEN.Tween(from)
                    .to(to, path.length * CONST.stepDuration)
                    .onUpdate((value) => this.game.player.position.set(value.x, value.y))
                    .easing(TWEEN.Easing.Linear.None)
                    .interpolation(TWEEN.Interpolation.Linear);
            this.game.player.index = index;
            this.onPlayState = true;
        };
    }
    enter() {
        this.onPlayState = false;
    }
    update() {
        if (this.onPlayState) {
            return this.game.states[MoveState.key];
        }
        return this;
    }
    exit() {
    }
}
IdleState.key = "IdleState";
class MoveState extends GameState {
    constructor(game) {
        super(game);
    }
    enter() {
        this.game.moveTween.start();
    }
    update() {
        if (this.game.moveTween.isPlaying()) {
            return this;
        }
        return this.game.states[IdleState.key];
    }
    exit() {
        for (const tile of this.game.tiles) {
            tile.alpha = 1.0;
        }
    }
}
MoveState.key = "MoveState";
class PathSolver {
    constructor(g) {
        this._onVertexPending = null;
        this._onVertexChecked = null;
        this._onVertexAddedToPath = null;
        this.g = g || [];
    }
    static getXY(a) {
        const v = [0, 0];
        v[0] = a % CONST.levelWidth;
        v[1] = Math.floor(a / CONST.levelWidth);
        return v;
    }
    static heuristic(a, b) {
        const A = PathSolver.getXY(a);
        const B = PathSolver.getXY(b);
        return Math.abs(A[0] - B[0]) + Math.abs(A[1] - B[1]);
    }
    set onVertexPending(value) {
        this._onVertexPending = value;
    }
    set onVertexChecked(value) {
        this._onVertexChecked = value;
    }
    set onVertexAddedToPath(value) {
        this._onVertexAddedToPath = value;
    }
}
class PriorityQueue {
    constructor() {
        this.arr = [];
        this._comparator = (a, b) => a > b;
    }
    set comparator(value) {
        if (value) {
            this._comparator = value;
        }
    }
    get empty() {
        return this.arr.length === 0;
    }
    put(value, priority) {
        this.arr.push([value, priority]);
        let i = this.arr.length - 1;
        let p = Math.floor((i - 1) / 2);
        while (i > 0 && !this._comparator(this.arr[p][1], this.arr[i][1])) {
            const t = this.arr[i];
            this.arr[i] = this.arr[p];
            this.arr[p] = t;
            i = p;
            p = Math.floor((i - 1) / 2);
        }
    }
    get() {
        const value = this.arr[0][0];
        this.arr.shift();
        let last;
        if (last = this.arr.pop()) {
            this.arr.unshift(last);
            this.heapify(0);
        }
        return value;
    }
    heapify(index) {
        const n = this.arr.length;
        let l, r, m, i;
        i = index;
        for (;;) {
            l = i * 2 + 1;
            r = i * 2 + 2;
            m = i;
            if (l < n && this._comparator(this.arr[l][1], this.arr[m][1])) {
                m = l;
            }
            if (r < n && this._comparator(this.arr[r][1], this.arr[m][1])) {
                m = r;
            }
            if (m === i) {
                break;
            }
            const t = this.arr[i];
            this.arr[i] = this.arr[m];
            this.arr[m] = t;
            i = m;
        }
    }
}
class DijkstraSolver extends PathSolver {
    constructor(g) {
        super(g);
    }
    get name() { return "Dijkstra"; }
    solve(start, end) {
        const front = new PriorityQueue();
        front.comparator = (a, b) => a < b;
        front.put(start, 0);
        const previous = {};
        previous[start] = -1;
        const cost = {};
        cost[start] = 0;
        let current;
        while (!front.empty) {
            current = front.get();
            if (current === end) {
                break;
            }
            for (const next of this.g[current]) {
                const newCost = cost[current] + 1;
                if (!(next in cost) || newCost < cost[next]) {
                    cost[next] = newCost;
                    previous[next] = current;
                    front.put(next, newCost);
                    this._onVertexPending && this._onVertexPending(next);
                }
            }
            this._onVertexChecked && this._onVertexChecked(current);
        }
        const path = [];
        while (previous[current] !== -1) {
            path.push(current);
            this._onVertexAddedToPath && this._onVertexAddedToPath(current);
            current = previous[current];
        }
        this._onVertexAddedToPath && this._onVertexAddedToPath(current);
        path.push(current);
        return path.reverse();
    }
}
class GreedySolver extends PathSolver {
    constructor(g) {
        super(g);
    }
    get name() { return "Greedy"; }
    solve(start, end) {
        const front = new PriorityQueue();
        front.comparator = (a, b) => a < b;
        front.put(start, 0);
        const previous = {};
        previous[start] = -1;
        let current;
        while (!front.empty) {
            current = front.get();
            if (current === end) {
                break;
            }
            for (const next of this.g[current]) {
                if (!(next in previous)) {
                    previous[next] = current;
                    front.put(next, GreedySolver.heuristic(end, next));
                    this._onVertexPending && this._onVertexPending(next);
                }
            }
            this._onVertexChecked && this._onVertexChecked(current);
        }
        const path = [];
        while (previous[current] !== -1) {
            path.push(current);
            this._onVertexAddedToPath && this._onVertexAddedToPath(current);
            current = previous[current];
        }
        this._onVertexAddedToPath && this._onVertexAddedToPath(current);
        path.push(start);
        return path.reverse();
    }
}
class AstarSolver extends PathSolver {
    constructor(g) {
        super(g);
    }
    get name() { return "A-Star"; }
    solve(start, end) {
        const front = new PriorityQueue();
        front.comparator = (a, b) => a < b;
        front.put(start, 0);
        const previous = {};
        previous[start] = -1;
        const cost = {};
        cost[start] = 0;
        let current;
        while (!front.empty) {
            current = front.get();
            if (current === end) {
                break;
            }
            for (const next of this.g[current]) {
                const newCost = cost[current] + 1;
                if (!(next in cost) || newCost < cost[next]) {
                    cost[next] = newCost;
                    previous[next] = current;
                    front.put(next, newCost + AstarSolver.heuristic(end, next));
                    this._onVertexPending && this._onVertexPending(next);
                }
            }
            this._onVertexChecked && this._onVertexChecked(current);
        }
        const path = [];
        while (previous[current] !== -1) {
            path.push(current);
            this._onVertexAddedToPath && this._onVertexAddedToPath(current);
            current = previous[current];
        }
        this._onVertexAddedToPath && this._onVertexAddedToPath(current);
        path.push(current);
        return path.reverse();
    }
}
class GameController {
    constructor() {
        this.moveTween = null;
        this.solverIndex = 0;
        this._currentState = null;
        this._previousState = null;
        this.onVertexPending = (index) => {
        };
        this.onVertexChecked = (index) => {
            this.tiles[index].alpha = CONST.checkedTileAlpha;
        };
        this.onVertexAddedToPath = (index) => {
            this.tiles[index].alpha = CONST.addedToPathTileAlpha;
        };
        this.onTilePointerDown = (value, index) => {
            this.notifyStates("onTilePointerDown", value, index);
        };
        this.onSolverPointerDown = () => {
            this.notifyStates("onSolverPointerDown");
        };
        this.states = {};
        this.player = new Player(DESIGNER.PLAYER);
        this.tiles = DESIGNER.TILES.map((value) => new Tile(value));
        this.solverButton = new Button(DESIGNER.SOLVER);
        this.graph = Object.keys(CONST.levelMask).map(Number).map(value => getNeighbors(value));
        this.solvers = [
            new DijkstraSolver(this.graph),
            new GreedySolver(this.graph),
            new AstarSolver(this.graph),
        ];
    }
    get currentState() {
        return this._currentState;
    }
    get previousState() {
        return this._previousState;
    }
    get currentSolver() {
        return this.solvers[this.solverIndex];
    }
    start() {
        this.init();
        this._currentState && this.currentState.enter();
    }
    update() {
        if (!this._currentState) {
            return;
        }
        const nextState = this._currentState.update();
        if (nextState !== this._currentState) {
            this._previousState = this._currentState;
            this._currentState.exit();
            this._currentState = nextState;
            this._currentState.enter();
        }
    }
    nextSolver() {
        this.solverIndex = (this.solverIndex + 1) % this.solvers.length;
        DESIGNER.SOLVER.text = this.currentSolver.name;
    }
    init() {
        this.states[IdleState.key] = new IdleState(this);
        this.states[MoveState.key] = new MoveState(this);
        for (let i = 0; i < this.tiles.length; ++i) {
            this.tiles[i].button.onPointerDown = () => this.onTilePointerDown(this.tiles[i], i);
        }
        const startTile = this.tiles.find((value, index) => !!CONST.levelMask[index]);
        this.player.position.set(startTile.position.x, startTile.position.y);
        this.player.index = this.tiles.indexOf(startTile);
        for (const solver of this.solvers) {
            solver.onVertexPending = this.onVertexPending;
            solver.onVertexChecked = this.onVertexChecked;
            solver.onVertexAddedToPath = this.onVertexAddedToPath;
        }
        DESIGNER.SOLVER.text = this.currentSolver.name;
        this.solverButton.onPointerDown = this.onSolverPointerDown;
        this._currentState = this.states[IdleState.key];
    }
    notifyStates(callbackName, ...args) {
        for (const key in this.states) {
            if (key) {
                this.states[key][callbackName] && this.states[key][callbackName](...args);
            }
        }
    }
}
const APP = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0xFFFFFF,
});
APP.ticker.add(() => onUpdate());
document.body.appendChild(APP.view);
const DESIGNER = SceneDesigner.instance;
const GAME = new GameController();
function onUpdate() {
    TWEEN.update();
    GAME.update();
}
GAME.start();
function getNeighbors(index) {
    const neighbors = [];
    const n = CONST.levelMask.length;
    let x;
    x = index - 1;
    if (x >= 0 && CONST.levelMask[x]) {
        neighbors.push(x);
    }
    x = index + 1;
    if (x < n && CONST.levelMask[x]) {
        neighbors.push(x);
    }
    x = index - CONST.levelWidth;
    if (x >= 0 && CONST.levelMask[x]) {
        neighbors.push(x);
    }
    x = index + CONST.levelWidth;
    if (x < n && CONST.levelMask[x]) {
        neighbors.push(x);
    }
    return neighbors;
}
