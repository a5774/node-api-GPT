const fs = require('fs');
// const buffer = Buffer.alloc(1024); // 创建一个1024字节的Buffer对象

/* // 打开文件
fs.open('test.txt', 'r+', function(err, fd) {
    if (err) {
        console.log(err);
        return;
    }
    // 从文件指定位置读取数据
    fs.read(fd, buffer, 0, 1024, -2, function(err, bytesRead, buffer) {
        if (err) {
            console.log(err);
            return;
        }
        console.log(bytesRead + ' bytes read');
        console.log(buffer.subarray(0, bytesRead).toString()); // 将读取的数据转换为字符串并打印出来
    });
});
 */
function dly(timeout) {
    return new Promise(res => {
        setTimeout(() => {
            // 异步操作
        console.log("statement:"+timeout);
           console.log('sync'+timeout);
            // 保证结果有序性
            res(timeout)
        }, timeout);
    })
}

let dlys = []
for (let index = 0; index < 5; index++) {
    let shuffle = 2000 * Math.random()
    console.log('sort_ori:'+shuffle);
    dlys.push(dly(shuffle))
}

async function main(){
        for await (const item of dlys) {
            // 对于已创建的异步队列，仅保证异步结果的有序性
            // 异步操作不受影响 
        }
} 
Promise.all(dlys).then(r =>console.log(r))
// main()



