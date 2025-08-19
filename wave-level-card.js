class WaveLevelCard extends HTMLElement {
  static getConfigElement() { return document.createElement("wave-level-card-editor"); }
  static getStubConfig() { return { entity: "sensor.example_moisture", name: "Moisture" }; }

  setConfig(config) {
    if (!config.entity) throw new Error("You must set an entity");
    this._config = {
      name: "Moisture",
      min: 0,
      max: 100,
      size: 280,
      fg: "#4d6de3",       // لون الماء
      crest: "#c7eeff",    // لون قمّة الموجة الخلفية
      bg: "#020438",       // خلفية الدائرة
      text: "#ffffff",
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    const st = hass.states[this._config.entity];
    const raw = st ? Number(st.state) : 0;
    const min = this._config.min, max = this._config.max;
    const val = isNaN(raw) ? 0 : Math.max(min, Math.min(max, Math.round(raw)));
    this._value = val;
    this._updateWave();
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const { name, size, bg, fg, crest, text } = this._config;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; padding:12px; }
        .card {
          border-radius:18px; padding:12px;
          background: var(--card-background-color, #1c1c1c);
          color: var(--primary-text-color, #fff);
        }
        .title { margin-bottom:8px; font-weight:600 }
        .wrap { position:relative; height:${size+40}px; display:flex; align-items:center; justify-content:center; }
        .box {
          height:${size}px; width:${size}px; background:${bg};
          border-radius:50%; overflow:hidden; position:relative;
        }
        .percent {
          position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
          color:${text}; font-size:${Math.max(28, Math.round(size*0.23))}px; z-index:3
        }
        .water { position:absolute; inset:0; background:${fg}; transition: transform .3s; z-index:2 }
        .water_wave { width:200%; position:absolute; bottom:100% }
        .water_wave_back { right:0; fill:${crest}; animation: wb 1.4s linear infinite }
        .water_wave_front { left:0; fill:${fg}; margin-bottom:-1px; animation: wf .7s linear infinite }
        @keyframes wf { 100% { transform: translate(-50%, 0); } }
        @keyframes wb { 100% { transform: translate(50%, 0); } }
      </style>
      <ha-card class="card">
        ${name ? `<div class="title">${name}</div>` : ""}
        <div class="wrap">
          <svg width="0" height="0" style="position:absolute">
            <symbol id="wave" viewBox="0 0 560 20">
              <path d="M420,20c21.5-.4,38.8-2.5,51.1-4.5c13.4-2.2,26.5-5.2,27.3-5.4C514,6.5,518,4.7,528.5,2.7c7.1-1.3,17.9-2.8,31.5-2.7v20H420z"></path>
              <path d="M420,20c-21.5-.4-38.8-2.5-51.1-4.5c-13.4-2.2-26.5-5.2-27.3-5.4C326,6.5,322,4.7,311.5,2.7C304.3,1.4,293.6-.1,280,0v20H420z"></path>
              <path d="M140,20c21.5-.4,38.8-2.5,51.1-4.5c13.4-2.2,26.5-5.2,27.3-5.4C234,6.5,238,4.7,248.5,2.7c7.1-1.3,17.9-2.8,31.5-2.7v20H140z"></path>
              <path d="M140,20c-21.5-.4-38.8-2.5-51.1-4.5c-13.4-2.2-26.5-5.2-27.3-5.4C46,6.5,42,4.7,31.5,2.7C24.3,1.4,13.6-.1,0,0v20H140z"></path>
            </symbol>
          </svg>
          <div class="box">
            <div class="percent"><span id="pct">--</span><span style="margin-left:4px">%</span></div>
            <div id="water" class="water">
              <svg viewBox="0 0 560 20" class="water_wave water_wave_back"><use href="#wave"></use></svg>
              <svg viewBox="0 0 560 20" class="water_wave water_wave_front"><use href="#wave"></use></svg>
            </div>
          </div>
        </div>
      </ha-card>
    `;
    this._pctEl = this.shadowRoot.getElementById("pct");
    this._waterEl = this.shadowRoot.getElementById("water");
    this._updateWave(); // أول رندر
  }

  _updateWave() {
    if (!this._pctEl || this._value === undefined) return;
    const { min, max } = this._config;
    const span = max - min || 100;
    const norm = Math.max(0, Math.min(100, Math.round(((this._value - min) / span) * 100)));
    this._pctEl.textContent = String(norm);
    // ارفع الماء: 100% يعني translate(0,0), 0% يعني translate(0,100%)
    if (this._waterEl) this._waterEl.style.transform = `translate(0, ${100 - norm}%)`;
  }

  getCardSize(){ return 5; }
}

customElements.define("wave-level-card", WaveLevelCard);

// محرر بسيط (اختياري) لواجهة يملأ الحقول في UI
class WaveLevelCardEditor extends HTMLElement {
  setConfig(config){ this._config = config; this._render(); }
  _render(){
    if (!this.shadowRoot) this.attachShadow({mode:"open"});
    this.shadowRoot.innerHTML = `
      <style> .row{display:flex;gap:12px;margin:8px 0} label{width:110px} input{flex:1} </style>
      <div class="row"><label>Entity</label><input id="entity" placeholder="sensor.xxx"></div>
      <div class="row"><label>Name</label><input id="name" placeholder="Title"></div>
      <div class="row"><label>Size</label><input id="size" type="number" min="120" max="420" step="10"></div>
      <div class="row"><label>Min</label><input id="min" type="number" value="0"></div>
      <div class="row"><label>Max</label><input id="max" type="number" value="100"></div>
    `;
    const ids = ["entity","name","size","min","max"];
    ids.forEach(id=>{
      const el=this.shadowRoot.getElementById(id);
      el.value = this._config?.[id] ?? "";
      el.onchange = () => this._update(ids);
    });
  }
  _update(ids){
    const cfg = {...this._config};
    ids.forEach(id=>{
      const v = this.shadowRoot.getElementById(id).value;
      if (v === "" && (id==="name")) delete cfg[id];
      else cfg[id] = (id==="size"||id==="min"||id==="max") ? Number(v) : v;
    });
    const e = new Event("config-changed",{bubbles:true,composed:true});
    e.detail = { config: cfg };
    this.dispatchEvent(e);
  }
}
customElements.define("wave-level-card-editor", WaveLevelCardEditor);
