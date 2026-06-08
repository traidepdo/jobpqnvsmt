'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface JobMapDisplayProps {
  latitude: number;
  longitude: number;
  companyName?: string;
  address?: string;
}

export default function JobMapDisplay({
  latitude,
  longitude,
  companyName = '',
  address = '',
}: JobMapDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Layer | null>(null);

  const [showCalculator, setShowCalculator] = useState(false);
  const [startAddress, setStartAddress] = useState('');
  const [startLat, setStartLat] = useState('');
  const [startLng, setStartLng] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<{ distance: string; duration: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Custom modern marker dot matching primary candidate green theme (#00b14f)
    const customIcon = L.divIcon({
      html: `<div style="background-color: #00b14f; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px;">🏢</div>`,
      className: 'custom-leaflet-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: false, // Prevent zoom on scroll for better page navigation
    }).setView([latitude, longitude], 15);
    leafletMapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    const marker = L.marker([latitude, longitude], {
      icon: customIcon,
    }).addTo(map);

    if (companyName || address) {
      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 2px;">
          <b style="color: #00b14f; font-size: 13px;">${companyName}</b>
          ${address ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #666;">${address}</p>` : ''}
        </div>
      `).openPopup();
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [latitude, longitude, companyName, address]);

  // Clean map layers from previous route and user marker
  const clearMapRoute = () => {
    const map = leafletMapRef.current;
    if (!map) return;

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
  };

  // Get current browser GPS location
  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }

    setCalculating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: gpsLat, longitude: gpsLng } = position.coords;
        setStartLat(gpsLat.toFixed(6));
        setStartLng(gpsLng.toFixed(6));
        setStartAddress('Vị trí GPS hiện tại của bạn');
        setCalculating(false);
        calculateCommute(gpsLat, gpsLng);
      },
      () => {
        setError('Không thể lấy vị trí GPS. Vui lòng cho phép quyền truy cập vị trí hoặc tự nhập tọa độ.');
        setCalculating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Geocoding and route calculation when submitting coordinates or address
  const handleCalculate = async () => {
    setError('');
    setResult(null);

    // Case 1: Coordinates are entered manually
    if (startLat.trim() && startLng.trim()) {
      const lat = parseFloat(startLat);
      const lng = parseFloat(startLng);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        setError('Tọa độ nhập vào không hợp lệ.');
        return;
      }
      calculateCommute(lat, lng);
      return;
    }

    // Case 2: Address is entered
    if (!startAddress.trim()) {
      setError('Vui lòng nhập địa chỉ, tọa độ, hoặc sử dụng nút GPS.');
      return;
    }

    setCalculating(true);
    const map = leafletMapRef.current;
    try {
      const query = `${startAddress}, Phú Quốc, Kiên Giang, Việt Nam`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );

      if (leafletMapRef.current !== map) return;
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (leafletMapRef.current !== map) return;

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setStartLat(lat.toFixed(6));
        setStartLng(lng.toFixed(6));
        calculateCommute(lat, lng);
      } else {
        // Fallback search
        const fallbackRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startAddress)}&limit=1`
        );
        if (leafletMapRef.current !== map) return;
        const fallbackData = await fallbackRes.json();
        if (leafletMapRef.current !== map) return;
        if (fallbackData && fallbackData.length > 0) {
          const lat = parseFloat(fallbackData[0].lat);
          const lng = parseFloat(fallbackData[0].lon);
          setStartLat(lat.toFixed(6));
          setStartLng(leafletMapRef.current ? lng.toFixed(6) : '');
          calculateCommute(lat, lng);
        } else {
          setError('Không tìm thấy địa chỉ này ở Phú Quốc. Bạn có thể tự nhập vĩ độ/kinh độ.');
        }
      }
    } catch {
      if (leafletMapRef.current === map) {
        setError('Lỗi kết nối dịch vụ bản đồ địa điểm.');
      }
    } finally {
      if (leafletMapRef.current === map) {
        setCalculating(false);
      }
    }
  };

  // Connects to OSRM API to fetch driving route coordinates and distance
  const calculateCommute = async (fromLat: number, fromLng: number) => {
    const map = leafletMapRef.current;
    if (!map) return;

    setCalculating(true);
    clearMapRoute();

    try {
      // Create user marker (blue color with house emoji)
      const userIcon = L.divIcon({
        html: `<div style="background-color: #0052CC; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px;">🏠</div>`,
        className: 'user-location-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const userMarker = L.marker([fromLat, fromLng], { icon: userIcon }).addTo(map);
      userMarker.bindPopup(`<b>Vị trí xuất phát của bạn</b>`).openPopup();
      userMarkerRef.current = userMarker;

      // Call OSRM API for actual driving route
      const routeRes = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${longitude},${latitude}?overview=full&geometries=geojson`
      );

      if (leafletMapRef.current !== map) return;

      if (routeRes.ok) {
        const routeData = await routeRes.json();
        if (leafletMapRef.current !== map) return;
        if (routeData.routes && routeData.routes.length > 0) {
          const route = routeData.routes[0];
          const distKm = (route.distance / 1000).toFixed(1);
          const durMin = Math.round(route.duration / 60);

          setResult({
            distance: `${distKm} km`,
            duration: `${durMin} phút (xe máy/ô tô)`,
          });

          // Draw a beautiful glowing solid route path (like Google Maps)
          const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          
          const routeBg = L.polyline(coords, {
            color: '#0052CC',
            weight: 8,
            opacity: 0.3,
          }).addTo(map);

          const routeFg = L.polyline(coords, {
            color: '#0070F3',
            weight: 4,
            opacity: 0.9,
          }).addTo(map);

          const routeGroup = L.featureGroup([routeBg, routeFg]).addTo(map);
          routeLineRef.current = routeGroup;

          // Fit map boundaries to display both points
          map.fitBounds(routeGroup.getBounds(), { padding: [40, 40] });
          return;
        }
      }

      if (leafletMapRef.current !== map) return;

      // Straight line fallback if OSRM fails
      const R = 6371; // Earth radius
      const dLat = ((latitude - fromLat) * Math.PI) / 180;
      const dLon = ((longitude - fromLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((fromLat * Math.PI) / 180) *
          Math.cos((latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = (R * c).toFixed(1);

      const durationMinutes = Math.round((parseFloat(distance) / 40) * 60);
      setResult({
        distance: `${distance} km (đường chim bay)`,
        duration: `${durationMinutes} phút (ước lượng - 40km/h)`,
      });

      const polyline = L.polyline([[fromLat, fromLng], [latitude, longitude]], {
        color: '#ff4d4f',
        weight: 4,
        dashArray: '5, 10',
      }).addTo(map);
      routeLineRef.current = polyline;

      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    } catch {
      if (leafletMapRef.current === map) {
        setError('Lỗi khi tính toán đường đi.');
      }
    } finally {
      if (leafletMapRef.current === map) {
        setCalculating(false);
      }
    }
  };

  return (
    <div className="space-y-3 mt-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setShowCalculator(!showCalculator);
            clearMapRoute();
            setResult(null);
            setError('');
          }}
          className="apply-btn flex items-center gap-1.5 px-4 py-2 bg-green-50 border border-green-200 hover:bg-green-100 text-[#00b14f] text-xs font-semibold rounded-xl cursor-pointer transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" strokeWidth={2}/>
          </svg>
          Tính quãng đường đi làm 🛵
        </button>
      </div>

      {showCalculator && (
        <div className="bg-[#f8faf9] border border-gray-150 rounded-xl p-4 space-y-3 animate-[fadeIn_0.25s_ease]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-[10px] font-semibold text-gray-500 mb-1">Nhập địa chỉ nhà của bạn</label>
              <input
                type="text"
                placeholder="VD: 150 Trần Hưng Đạo, Dương Đông"
                value={startAddress}
                onChange={(e) => {
                  setStartAddress(e.target.value);
                  setStartLat('');
                  setStartLng('');
                }}
                className="w-full h-8 px-2 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:border-[#00b14f]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 mb-1">Vĩ độ (Hoặc nhập tọa độ)</label>
              <input
                type="number"
                step="0.000001"
                placeholder="Vĩ độ nhà bạn"
                value={startLat}
                onChange={(e) => {
                  setStartLat(e.target.value);
                  setStartAddress('');
                }}
                className="w-full h-8 px-2 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:border-[#00b14f]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 mb-1">Kinh độ</label>
              <input
                type="number"
                step="0.000001"
                placeholder="Kinh độ nhà bạn"
                value={startLng}
                onChange={(e) => {
                  setStartLng(e.target.value);
                  setStartAddress('');
                }}
                className="w-full h-8 px-2 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:border-[#00b14f]"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUseGPS}
              disabled={calculating}
              className="h-8 px-3 border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg disabled:opacity-60 cursor-pointer flex items-center gap-1"
            >
              🎯 GPS của bạn
            </button>
            <button
              type="button"
              onClick={handleCalculate}
              disabled={calculating}
              className="flex-1 h-8 bg-[#00b14f] hover:bg-[#009940] text-white text-xs font-bold rounded-lg disabled:opacity-60 cursor-pointer"
            >
              {calculating ? 'Đang tính toán...' : 'Tính khoảng cách'}
            </button>
          </div>

          {error && <p className="text-[11px] text-red-500 leading-normal">{error}</p>}

          {result && (
            <div className="bg-white border border-green-100 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Quãng đường lái xe:</span>
                <span className="font-bold text-[#00b14f]">{result.distance}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Thời gian di chuyển ước tính:</span>
                <span className="font-bold text-gray-700">{result.duration}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div
        ref={mapRef}
        className="w-full h-48 rounded-xl border border-gray-150 overflow-hidden relative z-10"
        style={{ minHeight: '220px' }}
      />
    </div>
  );
}
