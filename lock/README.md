##手势密码解锁

这个插件是我在项目中用到的一个功能，本来是直接写在逻辑代码里面，并没有封装出来，但是考虑到以后开发的复用性，还是花了点时间封装一下，如果使用是有问题欢迎提出，一起改进~

示例：
```html
var unlockFlag = !1; // 是否是解锁，true为解锁，false为设置手势密码
var lock = new Lock({
        strokeColor: "#6144fc", // 描边颜色
        fillColor: "#685EFC", // 填充颜色
        width: $(document).width(), // Number
        height: $(document).height(), // Number height >= width
        canvasId: 'container_lock', // 用_作为连接父元素id和canvasid,不能为空
        unlockFlag: unlockFlag,
        firstLock: function (pwd) { // 第一次设置手势密码成功回调
            console.log("再次绘制解锁图案")
        },
        finalLock: function (pwd, state) { // 只有二次验证失败时会触发该函数
            console.log("解锁图案不一致，请重新设置")
        },
        initCallback: function (module) {
            console.log('初始化完成！')
        },
        successLock: function (pwd) { // 设置密码成功/解锁成功回调
            if (lock.unlockFlag) { 
                // 验证登录密码
                const puts =  [1, 2, 3, 6, 5, 4, 7, 8, 9]
                if (pwd.toString() === puts.toString()) {
                    console.log("解锁成功!")
                } else {
                    console.log('密码错误')
                }
            } else {
                // 设置手势密码
                console.log("设置成功!")
            }
        },
        pwdIsNotSafe (pwd) { // 密码设置少于6位数触发
            console.log('密码过于简单，请再次设置')
        }
    })
```
```html
setOptions // 修改参数，接受一个对象参数
```
