'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface JobMapPickerProps {
  latitude: string;
  longitude: string;
  onChange: (lat: string, lng: string) => void;
  addressDetail?: string;
}

export default function JobMapPicker({
  latitude,
  longitude,
  onChange,
  addressDetail = '',
}: JobMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState(addressDetail);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  // Default coordinate for Phu Quoc center if none is provided
  const defaultLat = 10.2289;
  const defaultLng = 103.9572;

  const latNum = latitude ? parseFloat(latitude) : defaultLat;
  const lngNum = longitude ? parseFloat(longitude) : defaultLng;

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Custom modern blue dot marker icon
    const customIcon = L.divIcon({
      html: `<div style="background-color: #0052CC; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="background-color: white; width: 8px; height: 8px; border-radius: 50%;"></div></div>`,
      className: 'custom-leaflet-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // Initialize map centered at current coordinates
    const map = L.map(mapRef.current).setView([latNum, lngNum], 13);
    leafletMapRef.current = map;

    // Light-themed modern map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    // Create marker if coordinates exist
    const marker = L.marker([latNum, lngNum], {
      icon: customIcon,
      draggable: true,
    }).addTo(map);
    markerRef.current = marker;

    // Listen to dragend on marker
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      onChange(position.lat.toFixed(6), position.lng.toFixed(6));
    });

    // Listen to map clicks to place marker
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onChange(lat.toFixed(6), lng.toFixed(6));
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update map center and marker when lat/lng change from outside
  useEffect(() => {
    if (!leafletMapRef.current || !markerRef.current) return;

    const currentMarkerLatLng = markerRef.current.getLatLng();
    if (
      currentMarkerLatLng.lat.toFixed(6) !== latNum.toFixed(6) ||
      currentMarkerLatLng.lng.toFixed(6) !== lngNum.toFixed(6)
    ) {
      markerRef.current.setLatLng([latNum, lngNum]);
      leafletMapRef.current.setView([latNum, lngNum]);
    }
  }, [latitude, longitude]);

  // Geocoding search function using Nominatim API
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError('');

    try {
      // Append Phu Quoc, Kien Giang to help narrow down the search on the island
      const query = `${searchQuery}, Phú Quốc, Kiên Giang, Việt Nam`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );

      if (!res.ok) throw new Error('Yêu cầu tìm kiếm thất bại');

      const data = await res.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);

        if (leafletMapRef.current && markerRef.current) {
          leafletMapRef.current.setView([newLat, newLng], 15);
          markerRef.current.setLatLng([newLat, newLng]);
          onChange(newLat.toFixed(6), newLng.toFixed(6));
        }
      } else {
        // Fallback search without specific suffix
        const fallbackRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
        );
        const fallbackData = await fallbackRes.json();
        if (fallbackData && fallbackData.length > 0) {
          const { lat, lon } = fallbackData[0];
          const newLat = parseFloat(lat);
          const newLng = parseFloat(lon);

          if (leafletMapRef.current && markerRef.current) {
            leafletMapRef.current.setView([newLat, newLng], 15);
            markerRef.current.setLatLng([newLat, newLng]);
            onChange(newLat.toFixed(6), newLng.toFixed(6));
          }
        } else {
          setError('Không tìm thấy vị trí này. Vui lòng thử tìm kiếm lại hoặc chọn trực tiếp trên bản đồ.');
        }
      }
    } catch (err) {
      setError('Lỗi khi kết nối dịch vụ bản đồ. Bạn có thể chọn vị trí bằng cách click trực tiếp.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nhập địa chỉ cơ sở tuyển dụng để tìm nhanh (VD: 125 Trần Hưng Đạo)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 h-10 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <button
          type="button"
          onClick={() => handleSearch()}
          disabled={searching}
          className="h-10 px-4 bg-[#0052CC] hover:bg-[#0040a2] text-white text-xs font-bold rounded-lg disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
        >
          {searching ? 'Đang tìm...' : 'Tìm vị trí'}
        </button>
      </div>

      {error && <p className="text-[11px] text-red-500">{error}</p>}

      <div
        ref={mapRef}
        className="w-full h-64 rounded-xl border border-gray-150 overflow-hidden relative z-10"
        style={{ minHeight: '250px' }}
      />

      <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-150">
        <div>
          <span className="text-[10px] text-gray-400 font-semibold uppercase block mb-1">Vĩ độ (Latitude)</span>
          <input
            type="number"
            step="0.000001"
            placeholder="VD: 10.2289"
            value={latitude}
            onChange={(e) => onChange(e.target.value, longitude)}
            className="w-full h-8 px-2 text-xs border border-gray-200 rounded bg-white outline-none focus:border-[#0052CC]"
          />
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-semibold uppercase block mb-1">Kinh độ (Longitude)</span>
          <input
            type="number"
            step="0.000001"
            placeholder="VD: 103.9572"
            value={longitude}
            onChange={(e) => onChange(latitude, e.target.value)}
            className="w-full h-8 px-2 text-xs border border-gray-200 rounded bg-white outline-none focus:border-[#0052CC]"
          />
        </div>
        <p className="col-span-2 text-[10px] text-gray-400 leading-normal">
          * Mẹo: Bạn có thể click trực tiếp vào một điểm bất kỳ trên bản đồ hoặc kéo thả chấm xanh để tinh chỉnh vị trí.
        </p>
      </div>
    </div>
  );
}
