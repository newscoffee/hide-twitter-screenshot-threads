;(()=>{

const hidetwitterscreenshotthreads = function(catalog) {
  
  const count = () => {
    port.postMessage({
      type: "count",
      data: null
    })         
  }
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  let started = false
  
  let htst = {}
  const htstid = catalog ? "htst-catalog" : "htst"
  
  if (localStorage.getItem(htstid) ) {
    htst = JSON.parse(localStorage.getItem(htstid))
  }
  else {
    localStorage.setItem(htstid, JSON.stringify(htst))
  }
  
  if (Object.keys(htst).length > 3000) {
    let count = 0
    for (key in htst) {
      delete htst[key]
      if (++count >= 2500) {
        break
      }
    }
    localStorage.setItem(htstid, JSON.stringify(htst))
  }
  
  const types = {}
  const portname = crypto.randomUUID()
  
  let observer = null
  
  const appendviewlink = function(threadid) {
    let md5 = null
    try {
      md5 = document.querySelector(`#${threadid} a.fileThumb img`).dataset.md5
    }
    catch(e) {
      
    }
    if (!md5) {
      return null
    }
    htst = JSON.parse(localStorage.getItem(htstid))
    if (htst && htst[md5] !== true) {
      return null
    }
    let preview = document.querySelector(`#${threadid} span.filter-preview`)
    if (!preview) {
      document.body.insertAdjacentHTML(
        `afterbegin`, 
        `<style>
          div#quote-preview span[data-hidden="${threadid.substring(1)}"] {
            display: block; position: absolute;
            z-index: 8; top: 0; left: 0;
            pointer-events: none;
            width: 100%; height: 100%;
            background: var(--twitter-background);
            opacity:.25; display: block;
            mix-blend-mode:multiply;
          }
        </style>`)
      setTimeout(()=>{

        document.querySelector(`#${threadid} a.postMenuBtn`).insertAdjacentHTML(
          `beforebegin`, 
          `<span class="filter-preview">[<a data-cmd="unfilter" data-filtered="1" href="thread/${threadid.substring(1)}">View</a>]</span>`
        )          
      },10)
    }
    return null
  }
  const istwitter = function(threadid) {
    let thread = document.querySelector(`#${threadid}`)
    count()
    let hide = document.querySelector(`img[data-cmd="hide"][data-id="${threadid.substring(1)}"]`)
    hide.click()
    setTimeout(()=>{
      appendviewlink(threadid)
      setTimeout(()=>{
        appendviewlink(threadid)
      },1200)
    },200)
    return null
  }
  const evalsize = function(string) {
    let response = {
      evaluate: true,
      width: 0,
      height: 0
    }
    try {
      var sub = string.split(" (")
      sub = sub[sub.length - 1]
      sub = sub.split(")")
      sub = sub[0]
      sub = sub.split(", ")
      let filesize = sub[0]
      let resolution = sub[1]
      resolution = resolution.toLowerCase().split("x")
      let width = Number(resolution[0])
      let height = Number(resolution[1])
      // filesize = filesize.split(" ")
      // let int = Number(filesize[0])
      // let mult = filesize[1].toLowerCase()
      // if (mult === "mb") {
      //   if (int > 2.3) {
      //     response.evaluate = false
      //   }
      // }
      // if (width > 3600) {
      //   response.evaluate = false
      // }
      // if (height > 3600) {
      //   response.evaluate = false
      // }
      response.width = width
      response.height = height
    }
    catch(e) {
      console.error(e)
    }
    return response
  }
  types.enabled = function(data) {
    
    let enabled = data
    if (!started && enabled) {
      startup()
    }
    else if (started && !enabled) {
      shutdown()
    }
  }
  types.response = function(data) {
    if (!started) {
      return
    }
    
    const {threadid, status} = data
    const thread = document.querySelector(`#${threadid}`)
    
    thread.dataset.htst = "response"
    
    let token = document.querySelector(`#${threadid} a.fileThumb img`).dataset.md5
    htst = JSON.parse(localStorage.getItem(htstid))
    if (status) {
      htst[token] = true
      istwitter(threadid)
      thread.dataset.htst = "istwitter-response"
    }
    else {
      htst[token] = false
      thread.dataset.htst = "isnottwitter-response"
    }
    localStorage.setItem(htstid, JSON.stringify(htst))
  }
  const port = chrome.runtime.connect({name: portname})
  
  port.onMessage.addListener((msg) => {
    types[msg.type] ? types[msg.type](msg.data) : () => {}
  })
  
  function Gather() {
    
    this.busy = false
    this.requested = false
    
    function scanthread(thread) {
      try {
        if (!started) {
          return
        }        
        const threadid = thread.id
        
        if (thread.classList.contains("post-hidden")) {
          let md5 = null
          try {
            md5 = document.querySelector(`#${threadid} a.fileThumb img`).dataset.md5
          }
          catch(e) {
            
          }
          htst = JSON.parse(localStorage.getItem(htstid))
          if (md5 && htst && htst[md5] === true) {
            count()
          }            
          setTimeout(()=>{
            appendviewlink(threadid)
            thread.dataset.htst = "hidden"
            setTimeout(()=>{
              appendviewlink(threadid)
            },1200)
          },200)
          return
        }
        
        let target = null
        let html = null
        let fullsizeurl = null
        let thumburl = null
        let md5 = null
        let text = null
        try {
          target = thread.childNodes[0].childNodes[0].childNodes[2]
          html = target.childNodes[0].innerHTML.toLowerCase()
          fullsizeurl = target.childNodes[1] && target.childNodes[1].href ? target.childNodes[1].href : null
          thumburl = target.childNodes[1].childNodes[0].src
          md5 = target.childNodes[1].childNodes[0].dataset.md5
          text = document.querySelector(`div#${threadid} .file`).innerText
        }
        catch(e) {
          thread.dataset.htst = "dom-error"
          return
        }
        if ( target === null 
          || html === null 
          || fullsizeurl === null 
          || thumburl === null 
          || md5 === null 
          || text === null ) {
          thread.dataset.htst = "content-error"
          return
        }
        if (html.indexOf("webm</a>") !== -1) {
          thread.dataset.htst = "isnottwitter-webm"
          return
        }
        if ( md5 === "066YJcEQYoIrSVN/wlV9HA==" 
          || md5 === "cWa/oe08KEzAJsN5I7csMw=="
          || md5 === "2ioEPaxeq+G12hmNCLVvxQ=="
          || md5 === "55cJZhux16WPZdBUUj8UoA=="
          || md5 === "uZUeZeB14FVR+Mc2ScHvVA=="
          || md5 === "p4mZMmoQme4FXqMryrlq5A=="
          || md5 === "fXlzSIjoI0KSQVKti3l+Eg==" ) {
          thread.dataset.htst = "isnottwitter-md5"
          return
        }
        htst = JSON.parse(localStorage.getItem(htstid))
        if (htst && htst[md5]) {
          thread.dataset.htst = "istwitter-md5"
          istwitter(threadid)
          return
        }
        else if (htst && htst[md5] === false) {
          thread.dataset.htst = "isnottwitter-md5"
          return
        }
        let {evaluate, width, height} = evalsize(text)
        
        if (!evaluate) {
          htst[md5] = false
          localStorage.setItem(htstid, JSON.stringify(htst))
          thread.dataset.htst = "isnottwitter-size"
          return
        }
        
        thread.dataset.htst = "requested"
        if (!started) {
          return
        }

        if (width > 2100 || height > 2600) {
          thread.dataset.htst = "requested-guess"
          fullsizeurl = null
        }
        
        port.postMessage({
          type: "request",
          data: {
            threadid,
            thumburl,
            fullsizeurl
          }
        })
        return
      }
      catch(e) {
        console.error(e)
        return
      }
    }
    const routine = async () => {
      
      let threads
      threads = document.querySelectorAll(`div.thread:not(.htst)`)
      
      for (let i=0;i<threads.length;i++) {
        await sleep(1)
        const thread = threads[i]
        thread.classList.add("htst")
        scanthread(thread)
      }
      
      if (this.requested) {
        this.busy = true
        this.requested = false
        setTimeout(routine,0)
      }
      else {
        this.requested = false
        this.busy = false
      }
    }
    this.request = () => {
      this.requested = true
      if (this.busy) {
        return null
      }
      this.busy = true
      this.requested = false
      routine()
    }
  }
  
  const gather = new Gather
  
  function startup() {
    started = true
    const targetNode = document.querySelector('div.board')
    const config = { attributes: false, childList: true, subtree: false }
    const callback = (mutationList, observer) => {
      for (const mutation of mutationList) {
        if (mutation.type === 'childList') {
          gather.request()
        } 
      }
    }
    observer = new MutationObserver(callback)
    observer.observe(targetNode, config)
    gather.request()
  }
  
  function shutdown() {
    started = false
    observer.disconnect()
    observer = null
  }
  document.addEventListener("visibilitychange", (event) => {
    let state = document.visibilityState == "visible" ? "resume" : "suspend"
    port.postMessage({
      type: "visibility",
      data: state
    })
  })
}

if ((( window.location.pathname.match(/\//g)||[]).length <= 2 ) 
  && (window.location.pathname.indexOf("catalog") === -1)) {
  if (document.readyState !== 'loading') {
    setTimeout(()=>{
      hidetwitterscreenshotthreads()
    },10)
  } 
  else {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(()=>{
        hidetwitterscreenshotthreads()
      },10)
    })
  }
}

})();