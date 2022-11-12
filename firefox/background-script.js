const istwitterscreenshot = new Istwitterscreenshot()

const ports = {}
const buffers = {}

let badge = true

const request = function(portname, threadid, thumburl, fullsizeurl) {
  try {
    const thumb = new Image()
    thumb.crossOrigin = "anonymous"
    thumb.onload = async function() {
      if (!ports[portname]) {
        return null
      }
      let result = await istwitterscreenshot.request(thumb, fullsizeurl, portname)
      
      if (ports[portname]) {
        let buffer = {
          type: "response", 
          data: {
            threadid, 
            status: result
          }
        }
        if (!ports[portname].ready) {
          buffers[portname].push(buffer)
        }
        else {
          ports[portname].postMessage(buffer)          
        }
      }
    }
    thumb.src = thumburl
  }
  catch(e) {
    console.error(e)
  }
}

function hidebadges() {
  for (portname in ports) {
    const port = ports[portname]
    if (port && port.tabid) {
      chrome.browserAction.setBadgeBackgroundColor({
        color: "#4285F4" 
      })
      chrome.browserAction.setBadgeTextColor({
        color: "#FFFFFF" 
      })
      chrome.browserAction.setBadgeText({
        text: "", 
        tabId: port.tabid
      })
    }
  }  
}

function setbadges() {
  for (portname in ports) {
    setbadge(portname)
  }
}

function setbadge(portname) {
  const port = ports[portname]
  if (badge && port && port.tabid) {
    chrome.browserAction.setBadgeTextColor({
      color: "#FFFFFF" 
    })
    chrome.browserAction.setBadgeBackgroundColor({
      color: "#4285F4" 
    })
    chrome.browserAction.setBadgeText({
      text: port.count.toString(), 
      tabId: port.tabid
    })
  }
}

chrome.runtime.onConnect.addListener(function(port) {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, ([currentTab]) => {
    port.tabid = currentTab.id
    setbadge(port.name)
  })
  
  port.ready = true
  port.count = 0
  const portname = port.name
  ports[portname] = port
  buffers[portname] = []
  
  port.onMessage.addListener(function(msg) {
    if (msg.type === "request") {
      let {threadid, thumburl, fullsizeurl} = msg.data
      
      request(portname, threadid, thumburl, fullsizeurl)
    }
    else if (msg.type === "visibility") {
      let visibility = msg.data
      if (visibility === "resume") {
        port.ready = true
        let length = buffers[portname].length
        for (let i=0;i<length;i++) {
          let buffer = buffers[portname][0]
          ports[portname].postMessage(buffer)
          buffers[portname].shift()
        }
      }
      else if (visibility === "suspend") {
        port.ready = false
      }
    }
    else if (msg.type === "count") {
      port.count++
      setbadge(port.name)
    }
  })

  port.onDisconnect.addListener(function() {
    istwitterscreenshot.cancel(portname)
    port = null
    delete ports[portname]
    buffers[portname] = []
    delete buffers[portname]
  })
  
  chrome.storage.sync.get(['enabled'], function(result) {
    if (!result || result.enabled === undefined) {
      result = {}
      result.enabled = true
      chrome.storage.sync.set({
        enabled: true
      })
    }
    try {
      const message = {
        type: "enabled",
        data: result.enabled    
      }
      if (!ports[portname].ready) {
        buffers[portname].push(message)
      }
      else {
        ports[portname].postMessage(message)          
      }
    }
    catch(e) {
      console.error(e)
    }
  })
})


chrome.runtime.onMessage.addListener((msg, sender, res) => {
  
  if (msg.type === "set") {
    chrome.storage.sync.set({
      enabled: msg.data.enabled
    })
    chrome.storage.sync.set({
      badge: msg.data.badge
    })
    
    badge = msg.data.badge
    if (!msg.data.enabled) {
      badge = false
    }
    for (const portname in buffers) {
      try {
        const message = {
          type: "enabled",
          data: msg.data.enabled       
        }
        if (ports[portname].ready) {
          ports[portname].postMessage(message)
        }
        else {
          buffers[portname].push(message)
        }
      }
      catch(e) {
        console.error(e)
      }
    }
    if (badge) {
      setbadges()
    }
    else {
      hidebadges()
    }
  }
  
  else if (msg.type === "get") {
    chrome.storage.sync.get(['enabled', 'badge'], function(result) {
      if (result.enabled === undefined) {
        result.enabled = true
        chrome.storage.sync.set({
          enabled: true
        })
      }
      if (result.badge === undefined) {
        result.badge = true
        chrome.storage.sync.set({
          badge: true
        })
      }
      badge = result.badge
      if (!result.enabled) {
        badge = false
      }
      chrome.runtime.sendMessage({
        msg: "get", 
        data: {
          enabled: result.enabled,
          badge: result.badge
        }
      })      
    })
  }
})
