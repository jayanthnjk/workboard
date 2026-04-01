const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/leaflet-src-BvESV9B0.js","assets/index-CA6DBhFW.js","assets/index-eKw7JpYe.css","assets/leaflet-Dgihpmma.css"])))=>i.map(i=>d[i]);
import{r as o,j as k,_ as $}from"./index-CA6DBhFW.js";const h={lat:12.8714,lng:74.8425},N=14,j={"government-office":"Government Office","bank-currency-chest":"Bank Currency Chest",court:"Court",hospital:"Hospital",ncc:"NCC"},A={"government-office":"#3B82F6","bank-currency-chest":"#22C55E",court:"#8B5CF6",hospital:"#EF4444",ncc:"#1B4D3E"},R={"government-office":"🏛️","bank-currency-chest":"🏦",court:"⚖️",hospital:"🏥",ncc:"🎖️"};function P({locations:u,onSelectLocation:b,selectedLocationId:d}){const g=o.useRef(null),i=o.useRef(null),f=o.useRef(new Map),v=o.useRef(u),E=o.useRef(null);v.current=u;const m=o.useRef(b);m.current=b;const y=o.useRef(d);y.current=d;const C=o.useCallback(x=>{var t;(t=m.current)==null||t.call(m,x)},[]);o.useEffect(()=>!g.current||i.current?void 0:((async()=>{const t=await $(()=>import("./leaflet-src-BvESV9B0.js").then(e=>e.l),__vite__mapDeps([0,1,2]));await $(()=>Promise.resolve({}),__vite__mapDeps([3])),E.current=t;const r=t.map(g.current,{center:[h.lat,h.lng],zoom:N,zoomControl:!1,scrollWheelZoom:!0,attributionControl:!1});t.control.zoom({position:"topright"}).addTo(r),t.control.attribution({position:"bottomright",prefix:!1}).addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>').addTo(r),t.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19}).addTo(r),u.forEach(e=>{if(!e.lat||!e.lng)return;const p=A[e.type]||"#1B4D3E",n=R[e.type]||"📍",l=j[e.type]||e.type,s=t.divIcon({className:"custom-marker",html:`<div style="
            width: 36px; height: 36px; border-radius: 50%;
            background: ${p}; border: 3px solid white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; font-size: 16px; transition: transform 0.15s;
          ">${n}</div>`,iconSize:[36,36],iconAnchor:[18,36],popupAnchor:[0,-38]}),c=t.marker([e.lat,e.lng],{icon:s}).addTo(r);c.bindPopup(`
          <div style="min-width: 200px; font-family: Inter, system-ui, sans-serif; padding: 4px 0;">
            <div style="font-weight: 700; font-size: 13px; color: #1E293B; margin-bottom: 2px;">${e.name}</div>
            <div style="font-size: 11px; color: #94A3B8; font-family: monospace; margin-bottom: 8px;">${e.code}</div>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; background: ${p}18; color: ${p}; letter-spacing: 0.3px;">${l}</span>
              <span style="display: inline-flex; align-items: center; gap: 3px; font-size: 10px; color: ${e.isActive?"#22C55E":"#94A3B8"}; font-weight: 600;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: ${e.isActive?"#22C55E":"#94A3B8"};"></span>
                ${e.isActive?"Active":"Inactive"}
              </span>
            </div>
            <div style="font-size: 11px; color: #64748B; display: flex; align-items: center; gap: 4px;">
              <span>👥</span> ${e.requiredPersonnel} personnel required
            </div>
          </div>
        `,{closeButton:!0,maxWidth:260,className:"custom-popup"}),c.on("click",()=>C(e)),f.current.set(e.id,c)}),t.circle([h.lat,h.lng],{radius:3e3,color:"#1B4D3E",fillColor:"#1B4D3E",fillOpacity:.04,weight:1.5,dashArray:"6, 4"}).addTo(r),i.current=r,w(t)})(),()=>{i.current&&(i.current.remove(),i.current=null,f.current.clear())}),[u]);function w(x){const t=x||E.current;if(!t||!i.current)return;const r=y.current,e=!!r,p="#6B7280";if(v.current.forEach(n=>{const l=f.current.get(n.id);if(!l)return;const s=n.id===r,c=!e||s,z=c?A[n.type]||"#1B4D3E":p,_=R[n.type]||"📍",a=s?44:36,B=3,O=c?1:.5,T=s?"0 4px 14px rgba(0,0,0,0.4), 0 0 0 4px rgba(59,130,246,0.25)":"0 2px 10px rgba(0,0,0,0.3)",M=s?20:16,D=s?1e3:0,I=t.divIcon({className:"custom-marker",html:`<div style="
          width: ${a}px; height: ${a}px; border-radius: 50%;
          background: ${z}; border: ${B}px solid white;
          box-shadow: ${T};
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: ${M}px;
          opacity: ${O};
        ">${_}</div>`,iconSize:[a,a],iconAnchor:[a/2,a],popupAnchor:[0,-a-2]});l.setIcon(I),l.setZIndexOffset(D)}),r){const n=f.current.get(r);n&&(i.current.setView(n.getLatLng(),16,{animate:!0}),n.openPopup())}}return o.useEffect(()=>{y.current=d,w()},[d]),k.jsx("div",{className:"relative w-full h-full",children:k.jsx("div",{ref:g,className:"w-full h-full"})})}export{P as LocationMap,P as default};
