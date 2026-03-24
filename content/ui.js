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

    this.dragging = false

    this.thumb.onmousedown = () => {
      this.dragging = true
    }

    document.addEventListener("mouseup", () => {
      this.dragging = false
    })

    document.addEventListener("mousemove", e => {
      if (this.dragging) {
        let trackBox = this.track.getBoundingClientRect()
        let percent = this.getPercent(e.clientX, trackBox.left, trackBox.right)

        if (percent > 100) {
          this.setAttribute("value", this.max)
          percent = 100
        } else if (percent < 0) {
          this.setAttribute("value", this.min)
          percent = 0
        } else this.setAttribute("value", Math.round(this.getValue(percent, this.min, this.max)))

        this.thumb.style.left = `${percent}%`

        this.updateSlider(true)
      }
    })
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
    if (onlyNumber) return
    this.thumb.style.left = `${this.getPercent(value, this.min, this.max)}%`
  }
}

customElements.define("ui-slider", UISlider)

