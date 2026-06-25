import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Info, Compass, Loader2 } from 'lucide-react';

interface OSMMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  category: string;
  severity: string;
  priorityScore: number;
  address: string;
  imageUrl?: string;
}

interface OpenStreetMapSectionProps {
  height?: string;
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: OSMMarker[];
  onSelectIssue?: (issueId: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  interactive?: boolean;
}

export default function OpenStreetMapSection({
  height = '400px',
  center,
  zoom = 13,
  markers = [],
  onSelectIssue,
  onMapClick,
  interactive = true,
}: OpenStreetMapSectionProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load Leaflet dynamically from CDN
  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true);
      setLoading(false);
      return;
    }

    // Load CSS
    const cssId = 'leaflet-cdn-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    // Load JS
    const jsId = 'leaflet-cdn-js';
    if (!document.getElementById(jsId)) {
      const script = document.createElement('script');
      script.id = jsId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.onload = () => {
        setLeafletLoaded(true);
        setLoading(false);
      };
      document.head.appendChild(script);
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Avoid double initialization
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: zoom,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive ? 'center' : false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Handle Map Click for Location Picking
    if (onMapClick) {
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        onMapClick(lat, lng);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded, interactive]);

  // Handle center updates
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom]);

  // Handle markers updates
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current || !markersGroupRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Clear old markers
    markersGroupRef.current.clearLayers();

    // Add new markers
    markers.forEach((marker) => {
      // Define custom icon depending on severity/category
      const color =
        marker.severity === 'Critical' ? '#EF4444' :
        marker.severity === 'High' ? '#F59E0B' : '#3B82F6';

      const customHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-3 h-3 rounded-full animate-ping opacity-75" style="background-color: ${color}"></div>
          <div class="relative w-4 h-4 rounded-full border-2 border-white shadow-md" style="background-color: ${color}"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: customHtml,
        className: 'custom-osm-marker-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const leafletMarker = L.marker([marker.latitude, marker.longitude], { icon: customIcon })
        .addTo(markersGroupRef.current);

      // Create a gorgeous custom HTML popup box
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 text-slate-800 space-y-1.5 max-w-[200px] font-sans';
      popupContent.innerHTML = `
        ${marker.imageUrl ? `<img src="${marker.imageUrl}" class="w-full h-20 object-cover rounded-md mb-1 border border-slate-100" />` : ''}
        <div class="text-[9px] font-bold uppercase tracking-wider text-emerald-600">${marker.category}</div>
        <div class="font-bold text-xs text-slate-900 leading-tight">${marker.title}</div>
        <div class="text-[10px] text-slate-500 line-clamp-1">${marker.address}</div>
        <div class="text-[10px] font-semibold text-slate-700">Priority Score: ${marker.priorityScore}</div>
        <button id="view-osm-btn-${marker.id}" class="w-full mt-1.5 py-1 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 cursor-pointer text-center">
          View Details →
        </button>
      `;

      leafletMarker.bindPopup(popupContent);

      // Bind callback inside DOM
      leafletMarker.on('popupopen', () => {
        const btn = document.getElementById(`view-osm-btn-${marker.id}`);
        if (btn && onSelectIssue) {
          btn.addEventListener('click', () => {
            onSelectIssue(marker.id);
          });
        }
      });
    });
  }, [markers, leafletLoaded]);

  if (loading) {
    return (
      <div style={{ height }} className="w-full flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <span className="text-xs text-slate-500 mt-2 font-medium">Booting OpenStreetMap Fallback...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-0 border border-slate-200 rounded-2xl" />
      
      {/* Decorative Floating OSM Status indicator */}
      <div className="absolute top-2.5 right-2.5 z-[1000] bg-white/95 backdrop-blur-md px-2.5 py-1 border border-slate-200/80 rounded-xl shadow-md flex items-center gap-1.5 pointer-events-none">
        <Compass className="w-3.5 h-3.5 text-emerald-600 animate-spin-slow" />
        <span className="text-[10px] font-bold text-slate-700 tracking-wide font-sans">OpenStreetMap Active</span>
      </div>
    </div>
  );
}
