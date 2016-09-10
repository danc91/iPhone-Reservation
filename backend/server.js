'use strict'
const http = require('http')
const https = require('https')
const url = require('url')
const fs = require('fs')
const modelName = ["iPhone 7 128G", "iPhone 7 256G", "iPhone 7 Plus 128G", "iPhone 7 Plus 256G"]

let stockData, resultData
let queryUrl, model, list, name
let resultArray = []

let getAreaInfo = areaCode => {
  if (areaCode === 'CN') {
    model = ["MNH22CH/A", "MNH72CH/A", "MNFU2CH/A", "MNG02CH/A"]
    list = ["R359", "R389", "R390", "R401", "R581", "R683", "R493", "R643", "R577", "R471", "R532", "R484" , "R572"]
    name = ["上海 南京东路", "上海 浦东", "上海 香港广场", "上海 环贸iapm", "上海 五角场", "上海 环球港", "南京 艾尚天地", "南京 虹悦城", "广州 天环广场", "无锡 恒隆广场", "杭州 西湖", "杭州 万象城", "深圳 益田假日", "郑州 万象城"]
    //old queryUrl = 'https://reserve-cn.apple.com/CN/zh_CN/reserve/iPhone/availability.json'
    queryUrl = 'https://reserve.cdn-apple.com/CN/zh_CN/reserve/iPhone/availability.json'
    return
  }

  if (areaCode === 'HK') {
    model = ["MN8Q2ZP/A", "MN8Q2ZP/A", "MN4D2ZP/A", "MN4L2ZP/A"]
    list = ["R499", "R610", "R485", "R409", "R428"]
    name = ["Causeway Bay", "ifc mall", "Festival Walk", "Canton Road", "New Town Plaza"]
    //old queryUrl = 'https://reserve-hk.apple.com/HK/zh_HK/reserve/iPhone/availability.json'
    queryUrl = 'https://reserve.cdn-apple.com/HK/zh_HK/reserve/iPhone/availability.json'
    return
  }

  if (areaCode === 'JP') {
    model = ["MNCP2J/A", "MNCV2J/A", "MN6K2J/A", "MN6Q2J/A"]
    list = ["R079", "R150", "R005", "R091", "R119", "R224", "R048"]
    name = ["東京　銀座", "仙台 一番町", "名古屋 栄", "大阪 心斎橋", "東京 渋谷", "東京 表参道", "福岡 天神"]
    queryUrl = 'https://reserve.cdn-apple.com/JP/ja_JP/reserve/iPhone/availability.json'
    return
  }
}

let queryAppleStore = (callback, areaCode) => {
  let chunks = []
  let size = 0
  let data = null
  https.get(queryUrl, (request, response) => {
    request.on('data', chunk => {
      chunks.push(chunk)
      size += chunk.length
    })
    request.on('end', () => {
      if (chunks.length > 0) {
        data = new Buffer(size)
        for (var i = 0, pos = 0, l = chunks.length; i < l; i++) {  
          var chunk = chunks[i];  
          chunk.copy(data, pos);  
          pos += chunk.length;  
        }
      }
      stockData = JSON.parse(data)
      console.log('Got Data from ' + areaCode + ' Apple API')
      callback()
    })
  })
}

let processData = (data, callback) => {
  resultArray = []
  for (var i = 0; i < list.length; i++) {
    for (var j = 0; j < model.length; j++) {
      if (data && data[list[i]][model[j]] === 'NONE') {

      } else {
        resultData = {
          list: list[i],
          store: name[i],
          model: model[j],
          name: modelName[j]
        }
        resultArray.push(resultData)
      }
    }
  }
  callback()
}

let acceptRequest = (request, response) => {
  let pathname = url.parse(request.url).pathname
  let areaCode = url.parse(request.url, true).query.area
  if (pathname === '/front/index.html') {
      fs.readFile(pathname.substring(1), "binary", (err, file) => {
        response.writeHead(200, {'Content-Type': 'text/html'})
        response.write(file, "binary")
        response.end()
    })
  }

  if (areaCode && areaCode.length === 2) {
    response.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'})
    getAreaInfo(areaCode)
    queryAppleStore(() => {
      processData(stockData, () => {
        response.end(JSON.stringify(resultArray))
      })
    }, areaCode)
  }
}

let serverStart = () => {
  http.createServer(acceptRequest).listen(2333)
}

serverStart()