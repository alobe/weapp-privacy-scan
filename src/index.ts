#!/usr/bin/env node
import fg from 'fast-glob';
import mst from 'minimist';
import fs from 'fs';
import path from 'path';

// 计时开始
console.time('文件处理总耗时')

const args = mst(process.argv.slice(2));
const base = args.p || '.';
const needDetails = args.d || false;
const appjson = JSON.parse(fs.readFileSync(`${base}/app.json`, 'utf-8'));
// 所有打包后的页面
const allPages = appjson.pages.concat(appjson.subPackages.map((p: any) => p.pages.map((_p: any) => p.root + '/' + _p)).flat())

// 所有打包的文件
const files = fg.sync(`${base}/**/*.{js,wxml,json}`)
const fileMap = {
  js: files.filter(f => f.endsWith('.js')),
  wxml: files.filter(f => f.endsWith('.wxml')),
  json: files.filter(f => f.endsWith('.json')),
}
// 隐私指引相关的组件或接口
const privacySet = {
  wx: [
    'getUserInfo',
    'getUserProfile',
    'authorize', // 需要特殊处理
    'getLocation',
    'startLocationUpdate',
    'startLocationUpdateBackground',
    'getFuzzyLocation',
    'choosePoi',
    'chooseLocation',
    'chooseAddress',
    'chooseInvoiceTitle',
    'chooseInvoice',
    'getWeRunData',
    'chooseLicensePlate',
    'chooseImage',
    'chooseMedia',
    'chooseVideo',
    'chooseMessageFile',
    'startRecord',
    'joinVoIPChat',
    'createVKSession',
    'openBluetoothAdapter',
    'createBLEPeripheralServer',
    'saveImageToPhotosAlbum',
    'saveVideoToPhotosAlbum',
    'addPhoneContact',
    'addPhoneRepeatCalendar',
    'addPhoneCalendar',
    'stopAccelerometer',
    'startAccelerometer',
    'onAccelerometerChange',
    'offAccelerometerChange',
    'stopCompass',
    'startCompass',
    'onCompassChange',
    'offCompassChange',
    'stopDeviceMotionListening',
    'startDeviceMotionListening',
    'onDeviceMotionChange',
    'offDeviceMotionChange',
    'stopGyroscope',
    'startGyroscope',
    'onGyroscopeChange',
    'offGyroscopeChange',
    'setClipboardData',
    'getClipboardData',
  ],
  raw: ['RecorderManager.start'],
  component: {
    openType: [
      'chooseAvatar',
      'userInfo',
      'getPhoneNumber',
      'getRealtimePhoneNumber'
    ],
    type: [
      'nickname'
    ],
    raw: [
      'live-pusher',
      'camera',
      'live-pusher',
      'voip-room'
    ]
  }
}

const mark = {
  js: fileMap.js.map(f => {
    const content = fs.readFileSync(f, 'utf8')
    let flag = false
    let markApi = ''
    
    // 校验wx api
    privacySet.wx.forEach(api => {
        if (flag) return
        // 特殊处理authorize Api
        if (api !== 'authorize' && content.includes(`.${api}(`) || api === 'authorize' && content.includes(`.${api}({scope`)) {
          flag = true
          markApi = api
        }
    })
  
    // 校验原生api
    privacySet.raw.forEach(api => {
      if (flag) return
      if (content.includes(api)) {
        flag = true
        markApi = api
      }
    })
    return flag ? { file: f, api: markApi } : null
  }).filter(Boolean),
  wxml: fileMap.wxml.map(f => {
    const content = fs.readFileSync(f, 'utf8')
    let flag = false
    let markObj = null

    // open-type属性检测
    privacySet.component.openType.forEach(type => {
      if (flag) return
      if (content.includes(`open-type="${type}"`)) {
        flag = true
        markObj = { type: 'open-type', file: f, attr: type }
      }
    })

    // 原生type属性检测
    privacySet.component.type.forEach(type => {
      if (flag) return
      if (content.includes(`type="${type}`)) {
        flag = true
        markObj = { type: 'type', file: f, attr: type }
      }
    })

    // 原生组件检测
    privacySet.component.raw.forEach(r => {
      if (flag) return
      if (content.includes(`<${r}`)) {
        flag = true
        markObj = { type: 'raw-component', file: f, component: r }
      }
    })

    return markObj
  }).filter(Boolean)
}

const needHandlePages = allPages.map((p: string) => {
  const f = analysisFile(p)
  if (f) {
    return {
      page: p,
      detail: f
    }
  }
}).filter(Boolean)

if (needHandlePages.length) {
  fs.writeFileSync(
    path.join(process.cwd(), './privacy-pages.json'),
    JSON.stringify({
      ...(needDetails ? { details: needHandlePages } : {}),
      needPrivacySettingPages: needHandlePages.map((p: any) => p.page),
      allPages,
    }, null, 2),
    'utf8',
  )
}

function analysisFile (p: string): any {
  // 当前路径文件检测
  let f: any = mark.wxml.find((m: any) => m.file.includes(p))
  if (f) {
    return {
      page: p,
      file: f,
    }
  }

  f = mark.js.find((m: any) => m.file.includes(p))
  if (f) {
    return {
      page: p,
      file: f,
    }
  }
  // 当前文件依赖文件检测
  const fp = `${base}/${p}.json`
  if (fs.existsSync(fp)) {
    const json = fs.readFileSync(fp, 'utf8')
    const jsonObj = JSON.parse(json)
    const deps = Object.values(jsonObj.usingComponents || {})
    if (deps.length) {
      const result = deps.map((d: any) => analysisFile(d)).filter(Boolean)
      if (result.length) return result.flat()
    }
  }
}
// 计时结束
console.timeEnd('文件处理总耗时')