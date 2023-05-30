const fs = require('fs');
const url = require('url');
const path = require('path');
const https = require('https');
const multer = require('multer');
const { Axios } = require('axios');
const { Buffer } = require('buffer');
const express = require('express');
const cp = require('child_process');
const { v4: uuidv4 } = require('uuid');
const serializeYML = require('js-yaml');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { Configuration, OpenAIApi } = require('openai');
const userDirectoryPath = path.resolve(__dirname, './user');
const publicDirectoryPath = path.resolve(__dirname, './public');
const sslDirectoryPath = path.resolve(publicDirectoryPath, './SSL');
const LOCATE = '/etc/clash/locate'
const CLASHYAMLPATH = '/etc/clash/config.yaml'
const ef_sub = 'https://www.efcloud.net/api/v1/client/subscribe?token=df03297a313071d85bc15eda2da19af4'
const api_key = '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'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    '2023-05-08-19_06_34'.slice(0,11)
  let dest = `${publicDirectoryPath}/pubg/${file.originalname.slice(0,10)}`
  if(!fs.existsSync(dest)) fs.mkdirSync(dest)
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname.slice(11)}`);
    
  },
});
const upload = multer({ storage: storage });
const errMessageRole = [{ role: 'assistant', content: '破逼节点又挂了, 侧边栏切换节点。', typed: true }]
const app = express();
const configuration = new Configuration({
  apiKey: api_key,
});
const openAi = new OpenAIApi(configuration);
const ssl_option = {
  key: fs.readFileSync(`${sslDirectoryPath}/knockdoor.top.key`, { encoding: 'utf-8' }),
  cert: fs.readFileSync(`${sslDirectoryPath}/knockdoor.top.pem`, { encoding: 'utf-8' })
}
const proxy = {
  proxy: {
    host: '127.0.0.1',
    port: '7890',
    protocol: 'http'
  }
}
const models = {
  chat: [
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-0301'
  ],
  prompt: [
    'text-davinci-002',
    'text-davinci-003'
  ]
}

async function get_trojan() {
  return new Promise(reslove => {
    let base64_str_full = ''
    let base64_str = ''
    https.get(ef_sub, resp => {
      resp.setEncoding('utf-8')
      resp.addListener('readable', () => {
        if ((base64_str = resp.read()) != null) base64_str_full += base64_str
      })
      resp.addListener('end', () => {
        reslove(base64_str_full)
      })
      resp.addListener('error', err => {
        rej('订阅更新失败')
      })
    })

  })
}

async function get_trojan_axios() {
  let ax = new Axios(proxy)
  try{
    let resp = await ax.get(ef_sub)
    return resp.data
  }catch(err){
    console.log(err);
  }
}

function toggle_proxy_node(index, json, proxies_desc) {
  json = json || serializeYML.load(fs.readFileSync(CLASHYAMLPATH, { encoding: 'utf-8' }))
  proxies_desc = proxies_desc || JSON.parse(fs.readFileSync(LOCATE, { encoding: 'utf-8' }))
  let select = [proxies_desc[index]]
  json['proxy-groups'].forEach(group => {
    group.proxies = select
  })
  let update_yaml = serializeYML.dump(json)
  fs.writeFileSync(CLASHYAMLPATH, update_yaml, { encoding: 'utf-8' })
  return select
}

async function set_proxies_js_yml() {
  let proxies_desc = []
  let b64_full = await get_trojan_axios() || await get_trojan()
  if (!b64_full) return
  let utf8_str = Buffer.from(b64_full, 'base64').toString('utf-8')
  let proxies = utf8_str.split('\r\n').slice(3, -1).map(proxy => {
    const parsedUrl = url.parse(proxy);
    const query = new URLSearchParams(parsedUrl.query);
    let name = decodeURIComponent(parsedUrl.hash.slice(1))
    proxies_desc.push(name)
    return {
      name,
      type: 'trojan',
      server: parsedUrl.hostname,
      port: parseInt(parsedUrl.port),
      password: parsedUrl.auth,
      udp: true,
      sni: query.get('sni'),
      'skip-cert-verify': query.get('allowInsecure') === '1',
    }
  })
  fs.writeFileSync(LOCATE, JSON.stringify(proxies_desc), { encoding: 'utf-8' })
  let json = serializeYML.load(fs.readFileSync(CLASHYAMLPATH, { encoding: 'utf-8' }))
  json.proxies = proxies
  return toggle_proxy_node(0, json, proxies_desc)
}

async function chatCompletion(roles, { model = 'gpt-3.5-turbo', temperature = 0.8, maxTokens = 1000, n = 1 }) {
  const response = await openAi.createChatCompletion({
    user: 'catch_me',
    model: model,
    messages: roles,
    temperature: Number(temperature),
    max_tokens: Number(maxTokens),
    n: 1,
  }, proxy)
  // @type Array 
  // response.data.choices.map(r => r.message)
  return [response.data.choices[0].message]
}
async function promptCompletion([{ content = 'examples' } = prompt] = roles, { model = 'text-davinci-002', temperature = 0.8, maxTokens = 1000, n = 1 }) {
  const response = await openAi.createCompletion({
    user: 'catch_me',
    model: model,
    prompt: content,
    temperature: Number(temperature),
    max_tokens: Number(maxTokens),
    n: Number(n),
  }, proxy)
  return response.data.choices.map(t => ({ role: 'assistant', content: t.text }))
}
async function errhandlerPromise(res, roles, completionConfig) {
  let assistantRoles = null
  let useModel = completionConfig.model
  try {
    if (models.chat.some(model => model === useModel)) {
      assistantRoles = await chatCompletion(roles, completionConfig)
      // console.log('chat');
    }
    else if (models.prompt.some(model => model === useModel)) {
      assistantRoles = await promptCompletion(roles, completionConfig)
      // console.log('prompt');
    }
  } catch (err) {
    res.json(errMessageRole)
    // console.log(err?.data);
    // console.log(err?.code);
    // console.log(err?.status);
    // console.log(err?.response);
    // console.log(err?.response?.data);
    // console.log(err?.response?.status);
  }
  return assistantRoles
}
function uuidForHistory(uuid, res) {
  let historyPath = path.join(userDirectoryPath, `${uuid}.json`)
  fs.readFile(historyPath, { encoding: 'utf-8', flag: 'r+' }, (err, rawHistory) => {
    if (rawHistory) {
      res.json(JSON.parse(rawHistory))
      return null;
    }
    res.json([])
  })
}
function uuidForWritable(uuid, roles) {
  let historyPath = path.join(userDirectoryPath, `${uuid}.json`)
  fs.writeFile(historyPath, JSON.stringify(roles), { encoding: 'utf-8', flag: 'w+' }, err => {
    if (err) {
      throw new Error('gateway_err')
    }
  })
  return true
}
function authForV4(res, expires) {
  res.cookie('v4', uuidv4(), {
    path: '/',
    sameSite: 'Strict',
    expires: expires,
    httpOnly: true,
    secure: true,
    // verify cookie is safe
    // signed:true
  })
}
function radomHotEntryGenerate(target = []) {
  let selectedIndexes = [];
  for (let i = 0; i < 4; i++) {
    const unselectedIndexes = Array.from({ length: target.length }, (_, index) => index).filter((index) => !selectedIndexes.includes(index));
    const randomIndex = unselectedIndexes[Math.floor(Math.random() * unselectedIndexes.length)];
    selectedIndexes.push(randomIndex);
  }
  return selectedIndexes.map((index) => target[index]);
}
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(publicDirectoryPath, { cacheControl: true, extensions: ['html'] }));
app.use(bodyParser.json());
app.use(cookieParser());


app.get('/getHistoryMessage', async (req, res) => {
  let { v4 } = req.cookies
  let { v4: v4s } = req.query
  v4 = v4s || v4;
  if (!v4) {
    let date = new Date()
    date.setDate(date.getDate() + 1)
    authForV4(res, date)
  }
  uuidForHistory(v4, res)
});
// block
app.use((req, res, next) => req.cookies.v4 ? next() : next())

app.get('/getCurrentAuth', async (req, res) => { res.send(req.cookies['v4']) })
app.get('/getAllHistory', async (req, res) => {
  fs.readdir(userDirectoryPath, (err, ns) => {
    res.json(ns.map(n => n.replace('.json', '')))
  });
})
app.get('/clearConversation', async (req, res) => { res.clearCookie('v4'); res.end() });

app.get('/radomHotEntryItem', async (req, res) => {
  fs.readFile(`${publicDirectoryPath}/hotEntry.json`, { encoding: 'utf-8', flag: 'r+' }, (err, radomHotEntry) => {
    res.json(radomHotEntryGenerate(JSON.parse(radomHotEntry)))
  })
});
app.post('/getQuestionCompletion', async (req, res) => {
  const requestData = req.body;
  const { v4 } = req.cookies
  let userTypedRole = requestData.map(item => !(delete item.typed) || item)
  if (!req.query.carryMemory) {
    userTypedRole = requestData.slice(-1)
  }
  let assistantRoles = await errhandlerPromise(res, userTypedRole, req.query)
  /*  let assistantRoles = [
     { role: 'assistant', content: '发生了一些错误! 请联系开发者' },
     { role: 'assistant', content: '发生了一些错误! 请联系开发者' },
   ] */
  // console.log(assistantRoles);
  if (assistantRoles) {
    let assistantTypedRoles = assistantRoles.map(r => ({ role: r.role, content: r.content.trim(), typed: true }))
    res.json(assistantTypedRoles);
    uuidForWritable(v4, [...requestData, ...assistantRoles])
  }
});
// magisk
app.post("/installedApps", (req, res) => {
  let body = req.body
  if (body) {
    let wable = fs.createWriteStream(`${publicDirectoryPath}/pubg/${Date.now().toString(32)}.txt`, { encoding: 'utf-8', flags: 'a+' })
    body.forEach(element => {
      wable.write(`${element}\n`)
    });
    wable.end()
    wable.close()
    res.end()
  }
})
app.post('/timeStampScreen', upload.single('screen'), (req, res) => {

  res.setHeader('Connection', 'keep-alive');
  res.end()
})

app.get('/updateSubscription', async (req, res) => {
  // no-clobber
  cp.execSync(`cp -f ${CLASHYAMLPATH} ${CLASHYAMLPATH}.bak`)
  await set_proxies_js_yml()
  cp.execSync('systemctl restart clash.service')
  res.send('<h1>更新完成!</h1>')
})

app.get('/proxiesList', (req, res) => fs.readFile(LOCATE, { encoding: 'utf-8' }, (err, data) => { res.json(JSON.parse(data)) }))

app.get('/switchProxyEnable', (req, res) => {
  cp.execSync(`cp -f ${CLASHYAMLPATH} ${CLASHYAMLPATH}.bak`)
  let selected = toggle_proxy_node(req.query.idx)
  cp.execSync('systemctl restart clash.service')
  res.json(selected)
})
https.createServer(ssl_option, app).listen(443, () => {
  console.log('Server listening on port 443!');
})
process.addListener('rejectionHandled', async err => {
  console.log(await err);
})




