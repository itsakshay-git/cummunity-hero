import React from 'react';
import { Loader2, Navigation, MapPin } from 'lucide-react';
import { GoogleMapSection, hasValidKey } from '../../../maps/components/GoogleMapSection';
import { Map as GMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import OpenStreetMapSection from '../../../maps/components/OpenStreetMapSection';
import { IssueCategory, SeverityLevel } from '../../../../types';

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  address: string;
  category: IssueCategory;
  severity: SeverityLevel;
  title: string;
  locating: boolean;
  mapProvider: 'google' | 'osm';
  onLocateMe: () => void;
  onChangeAddress: (address: string) => void;
  onMapClick: (lat: number, lng: number) => void;
  setMapProvider: React.Dispatch<React.SetStateAction<'google' | 'osm'>>;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  address,
  category,
  severity,
  title,
  locating,
  mapProvider,
  onLocateMe,
  onChangeAddress,
  onMapClick,
  setMapProvider
}) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider">Incident Location Address</label>
        <button
          id="btn-gps-locate"
          type="button"
          onClick={onLocateMe}
          disabled={locating}
          className={`text-xs text-emerald-600 dark:text-emerald-450 hover:text-emerald-700 dark:hover:text-emerald-350 font-bold flex items-center space-x-1 focus:outline-none disabled:opacity-55 cursor-pointer bg-transparent border-0 py-0.5 px-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all ${
            locating ? 'animate-pulse text-emerald-500' : ''
          }`}
        >
          {locating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          <span>{locating ? 'Locating...' : 'Use Current GPS'}</span>
        </button>
      </div>
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-405 dark:text-slate-500" />
        <input 
          id="report-input-address"
          type="text" 
          placeholder="e.g. Lane 3, opposite Flat 402"
          value={address}
          onChange={(e) => onChangeAddress(e.target.value)}
          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900 transition-all"
          required
        />
      </div>

      {/* Map display */}
      <div className="h-44 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner relative group">
        {mapProvider === 'osm' ? (
          <OpenStreetMapSection
            height="100%"
            center={{ lat: latitude, lng: longitude }}
            zoom={14}
            markers={[{
              id: 'picked-location',
              latitude: latitude,
              longitude: longitude,
              title: title || 'Selected Coordinate',
              category: category,
              severity: severity,
              priorityScore: 0,
              address: address || 'Click map to pick new coordinate'
            }]}
            onMapClick={onMapClick}
          />
        ) : (
          <GoogleMapSection height="100%" fallbackMessage="API Key unconfigured. Set GOOGLE_MAPS_PLATFORM_KEY to pick exact coordinates on an interactive map.">
            <GMap
              defaultCenter={{ lat: latitude, lng: longitude }}
              defaultZoom={14}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
              gestureHandling="cooperative"
              disableDefaultUI={true}
              center={{ lat: latitude, lng: longitude }}
              onClick={(e) => {
                if (e.detail.latLng) {
                  onMapClick(e.detail.latLng.lat, e.detail.latLng.lng);
                }
              }}
            >
              <AdvancedMarker
                position={{ lat: latitude, lng: longitude }}
                draggable={true}
                onDragEnd={(e) => {
                  if (e.latLng) {
                    onMapClick(e.latLng.lat(), e.latLng.lng());
                  }
                }}
              >
                <Pin background="#10B981" borderColor="#FFFFFF" glyphColor="#FFFFFF" />
              </AdvancedMarker>
            </GMap>
          </GoogleMapSection>
        )}
        
        {/* Floating Locator Indicator */}
        {locating && (
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all duration-300">
            <div className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center space-x-2.5 shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-205">Fetching GPS coordinates...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase text-[9px]">Coordinates</span>
          <span className="bg-slate-200/50 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">Lat: {latitude.toFixed(5)}</span>
          <span className="bg-slate-200/50 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">Lon: {longitude.toFixed(5)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
            Map Picker
          </span>
          {hasValidKey && (
            <button
              type="button"
              onClick={() => setMapProvider(prev => prev === 'google' ? 'osm' : 'google')}
              className="text-[9px] text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-bold underline bg-transparent border-0 cursor-pointer transition-colors"
            >
              Switch to {mapProvider === 'google' ? 'OSM' : 'Google'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
