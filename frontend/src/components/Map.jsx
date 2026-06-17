import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'

// Fix Leaflet default icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Source marker — green pulsing pin ─────────────────────────
const sourceIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:32px;height:42px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.5))">
      <div style="position:absolute;top:-4px;left:0;width:32px;height:32px;">
        <div style="position:absolute;inset:0;background:rgba(0,212,170,0.3);border-radius:50%;animation:srcPulse 1.8s ease-out infinite;"></div>
        <div style="position:absolute;top:4px;left:4px;width:24px;height:24px;background:linear-gradient(135deg,#00D4AA,#00FF88);border:3px solid white;border-radius:50%;box-shadow:0 2px 12px rgba(0,212,170,0.8);"></div>
        <div style="position:absolute;top:8px;left:8px;width:8px;height:8px;background:white;border-radius:50%;"></div>
      </div>
      <div style="position:absolute;bottom:0;left:14px;width:4px;height:14px;background:linear-gradient(#00D4AA,transparent);border-radius:2px;"></div>
    </div>
    <style>@keyframes srcPulse{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.5);opacity:0}}</style>
  `,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
})

// ── Destination marker — red drop pin ─────────────────────────
const destIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:32px;height:42px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.5))">
      <div style="position:absolute;top:-4px;left:0;width:32px;height:32px;">
        <div style="position:absolute;inset:0;background:rgba(239,68,68,0.3);border-radius:50%;animation:dstPulse 1.8s ease-out infinite;animation-delay:.4s;"></div>
        <div style="position:absolute;top:4px;left:4px;width:24px;height:24px;background:linear-gradient(135deg,#EF4444,#FF6B6B);border:3px solid white;border-radius:50%;box-shadow:0 2px 12px rgba(239,68,68,0.8);"></div>
        <div style="position:absolute;top:8px;left:8px;width:8px;height:8px;background:white;border-radius:50%;"></div>
      </div>
      <div style="position:absolute;bottom:0;left:14px;width:4px;height:14px;background:linear-gradient(#EF4444,transparent);border-radius:2px;"></div>
    </div>
    <style>@keyframes dstPulse{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.5);opacity:0}}</style>
  `,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
})

// ── Vehicle marker ────────────────────────────────────────────
const vehicleIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:36px;height:36px;">
      <div style="position:absolute;inset:0;background:rgba(0,212,170,0.2);border-radius:50%;animation:vPulse 1.5s ease-in-out infinite;"></div>
      <div style="position:absolute;top:4px;left:4px;width:28px;height:28px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 12px rgba(0,0,0,0.3);">🚗</div>
    </div>
    <style>@keyframes vPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}</style>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

// ── Fit bounds when routes change ────────────────────────────
const MapUpdater = ({ routes, selectedRoute }) => {
  const map = useMap()
  useEffect(() => {
    if (selectedRoute?.coordinates?.length) {
      try {
        map.fitBounds(L.latLngBounds(selectedRoute.coordinates), { padding: [80, 80], maxZoom: 15 })
      } catch (e) {
        console.warn("Failed to fit bounds to selectedRoute:", e)
      }
      return
    }
    if (!routes?.length) return
    const coords = routes.flatMap(r => r.coordinates || [])
    if (!coords.length) return
    try { map.fitBounds(L.latLngBounds(coords), { padding: [80, 80], maxZoom: 15 }) } catch {}
  }, [routes, selectedRoute, map])
  return null
}

// ── Animate vehicle along selected route ─────────────────────
const AnimatedVehicle = ({ coordinates }) => {
  const [pos, setPos] = useState(null)
  const prog = useRef(0)
  const raf  = useRef(null)
  useEffect(() => {
    if (!coordinates?.length) return
    prog.current = 0
    const step = () => {
      prog.current = (prog.current + 0.0012) % 1
      const i  = Math.floor(prog.current * (coordinates.length - 1))
      const j  = Math.min(i + 1, coordinates.length - 1)
      const t  = prog.current * (coordinates.length - 1) - i
      setPos([
        coordinates[i][0] + (coordinates[j][0] - coordinates[i][0]) * t,
        coordinates[i][1] + (coordinates[j][1] - coordinates[i][1]) * t,
      ])
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [coordinates])
  if (!pos) return null
  return <Marker position={pos} icon={vehicleIcon} />
}

// ── Main Map ──────────────────────────────────────────────────
const Map = ({ routes = [], selectedRoute = null, source = null, destination = null, height = '100%', className = '' }) => {
  const center  = source || selectedRoute?.coordinates?.[0] || [28.5708, 77.3258]
  const zoom    = routes.length > 0 ? 13 : 11
  const mapRef  = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapRef.current?.requestFullscreen().catch((err) => {
        console.error("Error enabling fullscreen:", err)
      })
    } else {
      document.exitFullscreen()
    }
  }

  const typeColors = { Fastest: '#2563EB', Shortest: '#7C3AED', Greenest: '#059669' }

  return (
    <div ref={mapRef} className={`relative ${className}`} style={{ height, width: '100%' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        {/*
          CartoDB Dark Matter — shows roads, streets, labels clearly
          in a dark style exactly like Ola / Rapido dark map mode.
          100% free, no API key required.
        */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com">CARTO</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        <ZoomControl position="bottomright" />

        {routes.length > 0 && <MapUpdater routes={routes} selectedRoute={selectedRoute} />}

        {/* Non-selected routes — thin dashed */}
        {routes.filter(r => r.id !== selectedRoute?.id).map(r => (
          <Polyline
            key={r.id}
            positions={r.coordinates || []}
            pathOptions={{ color: typeColors[r.type] || '#64748B', weight: 3, opacity: 0.35, dashArray: '10 7' }}
          />
        ))}

        {/* Selected route — outer glow */}
        {selectedRoute?.coordinates?.length > 0 && (
          <Polyline
            positions={selectedRoute.coordinates}
            pathOptions={{ color: typeColors[selectedRoute.type] || '#00D4AA', weight: 16, opacity: 0.12, lineCap: 'round' }}
          />
        )}
        {/* Selected route — main line */}
        {selectedRoute?.coordinates?.length > 0 && (
          <Polyline
            positions={selectedRoute.coordinates}
            pathOptions={{ color: typeColors[selectedRoute.type] || '#00D4AA', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
          />
        )}

        {/* Fallback: show first route if nothing selected */}
        {!selectedRoute && routes[0]?.coordinates?.length > 0 && (
          <Polyline
            positions={routes[0].coordinates}
            pathOptions={{ color: '#00D4AA', weight: 4, opacity: 0.9, lineCap: 'round' }}
          />
        )}

        {source && (
          <Marker position={source} icon={sourceIcon}>
            <Popup><b>📍 Start</b></Popup>
          </Marker>
        )}
        {destination && (
          <Marker position={destination} icon={destIcon}>
            <Popup><b>🏁 Destination</b></Popup>
          </Marker>
        )}
        {selectedRoute?.coordinates?.length > 1 && (
          <AnimatedVehicle coordinates={selectedRoute.coordinates} />
        )}
      </MapContainer>

      {/* Premium Custom Fullscreen Toggle Control */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-[1000] p-2.5 rounded-xl bg-[#0A0F1E]/90 border border-white/10 text-[#00D4AA] hover:bg-[#111827] hover:scale-105 transition-all shadow-lg flex items-center justify-center"
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        style={{
          boxShadow: '0 4px 20px rgba(0,212,170,0.2)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {isFullscreen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
        )}
      </button>
    </div>
  )
}

export default Map
