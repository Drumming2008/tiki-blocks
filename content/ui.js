class UIDiv extends HTMLElement {
  constructor() {
    super()
  }
}

customElements.define("ui-div", UIDiv)

id("open-settings").onclick = () => {
  id("settings").classList.remove("hidden")
}

id("close-settings").onclick = () => {
  id("settings").classList.add("hidden")
}

id("open-keybinds").onclick = () => {
  id("keybinds").classList.remove("hidden")
}

id("close-keybinds").onclick = () => {
  id("keybinds").classList.add("hidden")
}

class UISlider extends HTMLElement {
  static currentDragging = null
  static {
    document.addEventListener("mousemove", e => {
      this.currentDragging?.updateDrag(e)
    })
    document.addEventListener("mouseup", () => {
      this.currentDragging = null
    })
  }

  constructor() {
    super()
    let shadow = this.attachShadow({ mode: "open" })
    let link = document.createElement("link")
    link.href = "./style.css"
    link.rel = "stylesheet"
    link.type = "text/css"
    shadow.append(link)

    let label = document.createElement("label")
    label.innerHTML = "<slot></slot>"
    label.id = "slider-label"
    shadow.append(label)

    this.output = document.createElement("output")
    this.output.id = "slider-output"
    shadow.append(this.output)

    this.track = document.createElement("div")
    this.track.id = "slider-track"
    shadow.append(this.track)

    this.thumb = document.createElement("button")
    this.thumb.id = "slider-thumb"
    this.track.append(this.thumb)

    this.thumb.onmousedown = () => {
      UISlider.currentDragging = this
    }
  }

  updateDrag(e) {
    let trackBox = this.track.getBoundingClientRect()
    let percent = clamp(this.getPercent(e.clientX, trackBox.left, trackBox.right), 0, 100)

    this.setAttribute("value", Math.round(this.getValue(percent, this.min, this.max)))

    this.thumb.style.left = `${percent}%`

    this.updateSlider(true)
  }

  connectedCallback() {
    this.min = parseInt(this.getAttribute("min"))
    this.max = parseInt(this.getAttribute("max"))

    this.updateSlider()
  }

  getPercent(n, min, max) {
    return (n - min) / (max - min) * 100
  }

  getValue(percent, min, max) {
    return percent / 100 * (max - min) + min
  }

  updateSlider(onlyNumber = false) {
    let value = this.getAttribute("value")
    this.output.innerText = value
    uiSliderInput(this)
    if (onlyNumber) return
    this.thumb.style.left = `${this.getPercent(value, this.min, this.max)}%`
  }
}

customElements.define("ui-slider", UISlider)

function setInputWidth(input) {
  let span = document.createElement("span")
  span.innerText = input.value
  span.style.pointerEvents = "none"
  span.style.position = "absolute"
  span.style.top = "200vh"
  document.body.append(span)
  let box = span.getBoundingClientRect()
  input.style.setProperty("--width", box.width + "px")
  span.remove()
}

function setKeybindValue(input, value, k) {
  input.value = value.toUpperCase().replace(" ", "SPACE").replace("ALT", "OPTION").replace("META", "COMMAND").replace("BACKSPACE", "DELETE")
  keybinds[k].key = value
  setInputWidth(input)
}

function createKeybind(v, k) {
  let wrapper = document.createElement("div")
  wrapper.classList.add("keybind-wrapper")
  id("keybinds-scroller").append(wrapper)

  let desc = document.createElement("span")
  desc.innerText = v.desc
  wrapper.append(desc)

  let input = document.createElement("input")
  input.onkeydown = e => {
    e.preventDefault()
    setKeybindValue(input, e.key, k)
  }
  wrapper.append(input)
  setKeybindValue(input, v.default, k)
}

for (let [k, v] of Object.entries(keybinds)) {
  createKeybind(v, k)
}

function uiSliderInput(elem) {
  if (elem == id("fov-slider")) {
    FOV = glMatrix.toRadian(elem.getAttribute("value"))
    resizeCanvas()
  }
}
