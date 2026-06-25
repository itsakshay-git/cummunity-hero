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
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Incident Location Address</label>
        <button
          id="btn-gps-locate"
          type="button"
          onClick={onLocateMe}
          disabled={locating}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center space-x-1 focus:outline-none disabled:opacity-55 cursor-pointer"
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
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
        <input 
          id="report-input-address"
          type="text" 
          placeholder="e.g. Lane 3, opposite Flat 402"
          value={address}
          onChange={(e) => onChangeAddress(e.target.value)}
          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          required
        />
      </div>

      {/* Map display */}
      <div className="h-44 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner">
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
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200">
        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-bold">Coordinates:</span>
          <span>Lat: {latitude.toFixed(5)}</span>
          <span>•</span>
          <span>Lon: {longitude.toFixed(5)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
            Map Picker Active
          </span>
          {hasValidKey && (
            <button
              type="button"
              onClick={() => setMapProvider(prev => prev === 'google' ? 'osm' : 'google')}
              className="text-[9px] text-slate-500 hover:text-slate-800 font-bold underline"
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
