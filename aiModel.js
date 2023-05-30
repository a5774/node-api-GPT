const { OpenAIApi, Configuration } = require('openai')
const fs = require('fs')

let api_key = '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'
let configuration = new Configuration({
    apiKey: api_key,
})
let openAi = new OpenAIApi(configuration)
let proxy = {
    proxy: {
        host: '127.0.0.1',
        port: '7890',
        protocol: 'http'
    }
}


let temp = (async () => {
    let response = openAi.createImage({
        "prompt": "穿着衣服的马",
        "n": 1,
        response_format:'url',
        "size": "1024x1024"
    }, proxy)
    console.log((await response).data.data);
  /*   let response = openAi.createCompletion({
        "model": "text-davinci-003",
    "prompt": '我',
    // 前缀 look like  ：what Say this is a test？
    // suffix:'use chainese',
    "max_tokens":1000,        
    "temperature": 0.8,
    // stop:'indeed'
    // echo:true,
    // logprobs:5,
    // stream :true
    n:2
    },proxy)
    // fs.createWriteStream('./chosices',{flags:'w'}).write(JSON.stringify((await response).data.choices[0]))
    // console.log((await response).data.choices[0].logprobs); 
    console.log((await response).data.choices); 
    console.log((await response).data.choices[0]); 
    console.log((await response).data.choices[1]);  */
    // let response = openAi.createEdit
    // let response = openAi.createImageEdit()

})





