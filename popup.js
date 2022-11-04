document.addEventListener('DOMContentLoaded', ()=>{
  chrome.runtime.sendMessage({
    type: "get", 
    data: null
  })
})

function set() {
  chrome.runtime.sendMessage({
    type: "set", 
    data: {
      enabled: document.getElementById('enabled').checked,
      badge: document.getElementById('badge').checked
    }
  })
  if (!document.getElementById('enabled').checked) {
    document.getElementById("badgespan").classList.add("disabled")
  }
  else {
    document.getElementById("badgespan").classList.remove("disabled")
  }
}

document.getElementById('enabled').addEventListener('change', set)
document.getElementById('badge').addEventListener('change', set)

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.msg === "get") {
      document.getElementById('enabled').checked = request.data.enabled
      document.getElementById('badge').checked = request.data.badge
    }
    if (!request.data.enabled) {
      document.getElementById("badgespan").classList.add("disabled")
    }
    else {
      document.getElementById("badgespan").classList.remove("disabled")
    }
  }
)

