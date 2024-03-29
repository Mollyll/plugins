/**
 *
 * width canvas宽度
 * height canvas高度
 * canvasId 通过'_'连接父元素id和canvas的id
 * unlockFlag 是否解锁 true解锁 false设置手势密码
 * initCallback 初始化完成回调函数
 * firstLock 第一次设置解锁图案回调函数 参数【密码Array】
 * finalLock 第二次绘制解锁图案与第一次不一致回调函数 参数【密码Array】
 * successLock 解锁成功/二次绘制密码成功回调函数 参数【密码Array】
 * setOptions 修改参数并重新加载组件
 * */

(function (global) {
    var LockTypeException = function (message, code) {
        this.message = message
        this.code = code
    }

    var Lock = function (config) {
        var _this = this;
        _this.config = config;

        _this.validReference(),
            _this.width = _this.config.width,
            _this.height = _this.config.height;

        const canvasIdList = _this.config.canvasId.split('_'),
            canvasId = canvasIdList[canvasIdList.length - 1],
            parentId = canvasIdList.slice(0, canvasIdList.length - 1).join('_');

        var canvas = document.createElement("canvas");
        canvas.width = _this.width + .5,
            canvas.height = _this.height + .5,
            canvas.id = canvasId,
            document.getElementById(parentId).appendChild(canvas);

        _this.lockCnavs = document.getElementById(canvasId),
            _this.canvas = canvas,
            _this.unlockFlag = _this.config.unlockFlag || !1,
            _this.isMouseDown = !1,
            _this.confirmPwd = [],
            _this.pwd = [],
            _this.currentPointer,
            _this.pointerArr = [],
            _this.startX,
            _this.startY,
            _this.puts = [],
            _this.ctx = _this.lockCnavs.getContext("2d"),
            _this.hasTouch = "ontouchstart" in window ? !0 : !1,
            _this.tapstart = _this.hasTouch ? "touchstart" : "mousedown",
            _this.tapmove = _this.hasTouch ? "touchmove" : "mousemove",
            _this.tapend = _this.hasTouch ? "touchend" : "mouseup",
            _this.strokeColor = _this.config.strokeColor || '#6144fc',
            _this.fillColor = _this.config.fillColor || '#685EFC',
            _this.strokeLineWidth = .8,
            _this.lineWidth = 1,
            _this.innerRadius = 10,
            _this.safeLength = _this.config.safeLength || 6,
            _this.offset = (_this.width - _this.height) / 2;

        _this.arr = _this.getArr();
        _this.init();
        _this.setEvent();
        typeof _this.config.initCallback === 'function' && _this.config.initCallback(_this)
    }

    Lock.prototype = {
        /**
         * 验证参数
         * */
        validReference () {
            const _this = this
            if (typeof _this.config.unlockFlag !== 'boolean')
                throw new LockTypeException('unlockFlag is invalid!', 602)

            if (typeof _this.config.width !== 'number')
                throw new LockTypeException('width is invalid!', 602)

            if (typeof _this.config.height !== 'number')
                throw new LockTypeException('height is invalid!', 602)

            if (_this.config.height < _this.config.width)
                throw new LockTypeException('height should not less than width!', 603)

            if (!_this.config.canvasId)
                throw new LockTypeException('canvasId is not found!', 601)

            if (typeof _this.config.canvasId !== 'string')
                throw new LockTypeException('canvasId is invalid!', 602)
        },
        init () {
            const _this = this
            _this.ctx.clearRect(0, 0, _this.width, _this.height)
            _this.pointerArr = []
            for (var t = 0; t < _this.arr.length; t++)
                _this.arr[t].state = 0,
                    _this.drawPointer(t)
        },
        /**
         * 计算所有点的位置
         * return [Array]
         * */
        getArr () {
            const _this = this
            var arr = [],
                width = _this.width,
                height= _this.height,
                offset= _this.offset,
                lockCicle = {
                    x: 0,
                    y: 0,
                    state: "1"
                }
            for (var i = 1; 3 >= i; i++)
                for (var j = 1; 3 >= j; j++) {
                    lockCicle = {}
                    offset > 0 ?
                        (
                            lockCicle.x = height / 4 * j + Math.abs(offset),
                                lockCicle.y = height / 4 * i,
                                lockCicle.state = 0
                        )
                        : (
                            lockCicle.x = width / 4 * j,
                                lockCicle.y = width / 4 * i + Math.abs(offset),
                                lockCicle.state = 0
                        ),
                        arr.push(lockCicle)
                }
            return arr
        },
        setEvent () {
            const _this = this
            var hastouch = _this.hasTouch,
                canvas = _this.canvas,
                isMouseDown = _this.isMouseDown,
                tapstart = this.tapstart,
                tapmove = _this.tapmove,
                tapend = _this.tapend
            _this.lockCnavs.addEventListener(tapstart, function (t) {
                isMouseDown = !0
                var e = hastouch ? t.targetTouches[0].pageX : t.clientX - canvas.offsetLeft,
                    r = hastouch ? t.targetTouches[0].pageY : t.clientY - canvas.offsetTop
                _this.startX = e, _this.startY = r
                _this.drawLinePointer(e, r, !0)
            })
            _this.lockCnavs.addEventListener(tapmove, function (t) {
                if (isMouseDown) {
                    var e = hastouch ? t.targetTouches[0].pageX : t.clientX - canvas.offsetLeft,
                        r = hastouch ? t.targetTouches[0].pageY : t.clientY - canvas.offsetTop
                    _this.drawLinePointer(e, r, !0)
                }
            })
            _this.lockCnavs.addEventListener(tapend, function (t) {
                _this.drawLinePointer(0, 0, !1),
                    isMouseDown = !1,
                    _this.pointerArr = []
                if (_this.pwd.length <= 0) {
                    if (_this.puts.length >= _this.safeLength) {
                        if (_this.unlockFlag) {
                            _this.unlock()
                        } else {
                            _this.settingUnlockPwd()
                        }
                    } else {
                        typeof _this.config.pwdIsNotSafe === 'function' && _this.config.pwdIsNotSafe(_this.puts),
                            _this.init()
                    }
                } else {
                    if (_this.unlockFlag) {
                        _this.unlock()
                    } else {
                        _this.settingUnlockPwd()
                    }
                }

                _this.puts = []
            })
        },
        drawPointer (t) {
            const _this = this
            const ctx = _this.ctx
            ctx.save()
            var e = 0
            e = _this.hastouch ? _this.width / 14 : 24
            var r = _this.fillColor,
                o = _this.strokeColor
            1 == _this.arr[t].state,
                ctx.beginPath(),
                ctx.strokeStyle = o,
                ctx.lineWidth = _this.strokeLineWidth,
                ctx.lineCap = "round",
                ctx.lineJoin = "round",
                ctx.arc(_this.arr[t].x, _this.arr[t].y, e, 0, 2 * Math.PI, !1),
                ctx.stroke(),
                ctx.closePath(),
                ctx.restore()
        },
        drawLinePointer (t, e, r) {
            const _this = this;
            var ctx = _this.ctx,
                arr = _this.arr
            ctx.clearRect(0, 0, _this.width, _this.height),
                ctx.save(),
                ctx.beginPath(),
                ctx.strokeStyle = _this.strokeColor,
                ctx.lineWidth = _this.lineWidth,
                ctx.lineCap = "round",
                ctx.lineJoin = "round"
            var right = false, bottom = false
            if (t > _this.startX) {
                right = true
            } else {
                right = false
            }
            if (e > _this.startY) {
                bottom = true
            } else {
                bottom = false
            }
            for (var o = 0; o < _this.pointerArr.length; o++) {
                if (o == 0) {
                    ctx.moveTo(_this.pointerArr[o].x, _this.pointerArr[o].y)
                } else {
                    ctx.lineTo(_this.pointerArr[o].x, _this.pointerArr[o].y)
                }
            }
            ctx.stroke(),
                ctx.closePath(),
                ctx.restore()
            for (var o = 0; o < arr.length; o++) {
                _this.drawPointer(o)
                if (ctx.isPointInPath(t, e) && _this.currentPointer != o) {
                    _this.pointerArr.push({
                        x: arr[o].x,
                        y: arr[o].y
                    })
                    _this.currentPointer = o,
                        _this.puts.push(o + 1),
                        _this.startX = arr[o].x,
                        _this.startY = arr[o].y,
                        arr[o].state = 1

                }
            }

            for (var o = 0; o < _this.pointerArr.length; o++) {
                ctx.beginPath(),
                    ctx.fillStyle = _this.fillColor,
                    ctx.arc(_this.pointerArr[o].x, _this.pointerArr[o].y, _this.innerRadius, 0, 2 * Math.PI, !1),
                    ctx.fill(),
                    ctx.closePath()
            }
            r && (ctx.save(),
                ctx.beginPath(),
                ctx.globalCompositeOperation = "destination-over",
                ctx.strokeStyle = _this.strokeColor,
                ctx.lineWidth = _this.lineWidth,
                ctx.lineCap = "round",
                ctx.lineJoin = "round",
                ctx.moveTo(_this.startX, _this.startY),
                ctx.lineTo(t, e),
                ctx.stroke(),
                ctx.beginPath(),
                ctx.restore())
        },
        settingUnlockPwd () {
            const _this = this
            if (_this.pwd.length <= 0) {
                _this.pwd = _this.puts
                _this.init()
                typeof _this.config.firstLock === 'function' && _this.config.firstLock(_this.pwd)
            } else {
                _this.confirmPwd.length <= 0 && (_this.confirmPwd = _this.puts),
                console.log(_this.pwd + "  " + _this.confirmPwd)

                if (_this.pwd.length > 0 && _this.confirmPwd.length > 0) {
                    const equal = _this.compareArr(_this.pwd, _this.confirmPwd)
                    if (equal) {
                        _this.unlock()
                    } else {
                        _this.puts = []
                        _this.pwd = []
                        _this.confirmPwd = []
                        _this.init()
                        typeof _this.config.finalLock === 'function' && _this.config.finalLock(_this.confirmPwd, equal)
                    }

                }
            }
        },
        unlock() {
            const _this = this
            typeof _this.config.successLock === 'function' && typeof _this.config.successLock(_this.puts)
            _this.init()
        },
        compareArr(t, e) {
            return t.toString() === e.toString()
        },
        setOptions (config) {
            const _this = this;
            var $config = _this.config;
            for (var key in config) {
                $config[key] = config[key]
                if (_this[key] !== undefined) {
                    _this[key] = config[key]
                }
            }
            _this.puts = []
            _this.pwd = []
            _this.confirmPwd = []
            _this.init()
        },
        trimStr(str) {
            return str.replace(/^\s*|\s*$/g, "")
        }
    }

    if (typeof module != 'undefined' && module.exports) {
        module.exports = Lock;
    }
    else if (typeof define == 'function' && define.amd) {
        define(function () {
            return Lock;
        });
    }
    else {
        window.Lock = Lock;
    }
})(window)