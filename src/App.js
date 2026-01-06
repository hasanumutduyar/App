import React, { useState, useEffect, useRef } from 'react';

const MonthlyCirclesUI = () => {
  const months = [
    { name: 'Oca', days: 31 },
    { name: 'Şub', days: 28 },
    { name: 'Mar', days: 31 },
    { name: 'Nis', days: 30 },
    { name: 'May', days: 31 },
    { name: 'Haz', days: 30 },
    { name: 'Tem', days: 31 },
    { name: 'Ağu', days: 31 },
    { name: 'Eyl', days: 30 },
    { name: 'Eki', days: 31 },
    { name: 'Kas', days: 30 },
    { name: 'Ara', days: 31 }
  ];
  
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [dayPaintings, setDayPaintings] = useState({});
  const [tempPainting, setTempPainting] = useState(null);
  const [currentSessionKey, setCurrentSessionKey] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [canDrawOutside, setCanDrawOutside] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('yearPaintings');
    if (saved) {
      setDayPaintings(JSON.parse(saved));
    }
  }, []);

  const colors = [
    { name: 'blue', bg: 'bg-blue-300', hex: '#93c5fd', active: 'ring-4 ring-blue-200' },
    { name: 'yellow', bg: 'bg-yellow-200', hex: '#fef08a', active: 'ring-4 ring-yellow-100' },
    { name: 'red', bg: 'bg-red-300', hex: '#fca5a5', active: 'ring-4 ring-red-200' },
    { name: 'green', bg: 'bg-green-300', hex: '#86efac', active: 'ring-4 ring-green-200' }
  ];

  const getMonthColors = (monthIndex) => {
    const monthDays = months[monthIndex].days;
    const colorCounts = {
      blue: 0,
      yellow: 0,
      red: 0,
      green: 0
    };
    
    for (let day = 1; day <= monthDays; day++) {
      const key = `${monthIndex}-${day}`;
      if (dayPaintings[key]) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = dayPaintings[key];
        canvas.width = 400;
        canvas.height = 400;
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, 400, 400);
        
        for (let i = 0; i < imageData.data.length; i += 4) {
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          const a = imageData.data[i + 3];
          
          if (a > 0) {
            // Check which color this pixel is closest to
            colors.forEach(color => {
              const hexColor = color.hex;
              const colorR = parseInt(hexColor.slice(1, 3), 16);
              const colorG = parseInt(hexColor.slice(3, 5), 16);
              const colorB = parseInt(hexColor.slice(5, 7), 16);
              
              const distance = Math.sqrt(
                Math.pow(r - colorR, 2) +
                Math.pow(g - colorG, 2) +
                Math.pow(b - colorB, 2)
              );
              
              if (distance < 50) {
                colorCounts[color.name]++;
              }
            });
          }
        }
      }
    }
    
    return colorCounts;
  };

  const getMonthGradient = (monthIndex) => {
    const colorCounts = getMonthColors(monthIndex);
    const colorEntries = Object.entries(colorCounts).filter(([_, count]) => count > 0);
    
    if (colorEntries.length === 0) return 'bg-white';
    
    const colorMap = {
      blue: '#93c5fd',
      yellow: '#fef08a',
      red: '#fca5a5',
      green: '#86efac'
    };
    
    if (colorEntries.length === 1) {
      const colorClass = colors.find(c => c.name === colorEntries[0][0])?.bg;
      return colorClass || 'bg-white';
    }
    
    const totalCount = colorEntries.reduce((sum, [_, count]) => sum + count, 0);
    const sortedColors = colorEntries.sort((a, b) => b[1] - a[1]);
    
    let currentPercent = 0;
    const gradientStops = sortedColors.map(([color, count], i, arr) => {
      const percent = (count / totalCount) * 100;
      const start = currentPercent;
      const end = currentPercent + percent;
      currentPercent = end;
      
      const nextColor = i < arr.length - 1 ? colorMap[arr[i + 1][0]] : colorMap[arr[0][0]];
      const blendZone = 5;
      
      return `${colorMap[color]} ${start}%, ${colorMap[color]} ${end - blendZone}%, ${nextColor} ${end}%`;
    });
    
    return { background: `conic-gradient(${gradientStops.join(', ')})` };
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    
    const key = `${selectedMonth}-${selectedDay}`;
    const dataUrl = canvasRef.current.toDataURL();
    
    const newDayPaintings = {
      ...dayPaintings,
      [key]: dataUrl
    };
    
    setDayPaintings(newDayPaintings);
    localStorage.setItem('yearPaintings', JSON.stringify(newDayPaintings));
    setSaveMessage('Kaydedildi!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleDelete = () => {
    if (selectedMonth === null || selectedDay === null) return;
    
    const key = `${selectedMonth}-${selectedDay}`;
    const newDayPaintings = { ...dayPaintings };
    delete newDayPaintings[key];
    setDayPaintings(newDayPaintings);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const initCanvas = (canvas) => {
    if (!canvas) return;
    
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 400;
    
    const key = `${selectedMonth}-${selectedDay}`;
    if (dayPaintings[key]) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 400, 400);
      };
      img.src = dayPaintings[key];
    }
  };

  const startDrawing = (e) => {
    if (!selectedColor) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let x, y;
    if (e.type.includes('touch')) {
      e.preventDefault();
      x = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
      y = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
    } else {
      x = (e.clientX - rect.left) * (canvas.width / rect.width);
      y = (e.clientY - rect.top) * (canvas.height / rect.height);
    }
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2;
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    
    setIsDrawing(true);
    
    // If starting inside, allow drawing immediately
    if (distance <= radius) {
      setCanDrawOutside(false);
      draw(e);
    } else {
      // If starting outside, wait until pointer enters circle
      setCanDrawOutside(true);
    }
  };

  const draw = (e) => {
    if (!isDrawing && e.type !== 'mousedown' && e.type !== 'touchstart') return;
    if (!selectedColor) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    let x, y;
    if (e.type.includes('touch')) {
      e.preventDefault();
      x = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
      y = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
    } else {
      x = (e.clientX - rect.left) * (canvas.width / rect.width);
      y = (e.clientY - rect.top) * (canvas.height / rect.height);
    }
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2;
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    
    // If we started outside and just entered the circle, start drawing
    if (canDrawOutside && distance <= radius) {
      setCanDrawOutside(false);
    }
    
    // Only draw if inside the circle and not in the "waiting to enter" state
    if (distance <= radius && !canDrawOutside) {
      const color = colors.find(c => c.name === selectedColor);
      ctx.fillStyle = color.hex;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setCanDrawOutside(false);
  };

  // Drawing view (expanded day)
  if (selectedMonth !== null && selectedDay !== null) {
    const month = months[selectedMonth];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelectedDay(null)}
              className="text-white hover:text-purple-300 transition-colors flex items-center gap-2"
            >
              <span className="text-2xl">←</span>
              <span className="text-lg">Geri</span>
            </button>
            <h1 className="text-3xl font-bold text-white">
              {month.name} - Gün {selectedDay}
            </h1>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedColor(null)}
                  className={`w-10 h-10 rounded-full bg-white border-2 border-gray-300 transition-all ${
                    selectedColor === null ? 'ring-4 ring-gray-300' : ''
                  }`}
                />
                {colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-10 h-10 rounded-full ${color.bg} transition-all ${
                      selectedColor === color.name ? color.active : ''
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="flex-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded transition-colors"
                >
                  Sil
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded transition-colors"
                >
                  Kaydet
                </button>
              </div>
              {saveMessage && (
                <div className="text-center text-green-300 text-xs font-medium">
                  Kaydedildi!
                </div>
              )}
            </div>
          </div>
          
          <p className="text-purple-200 text-center mb-8">
            {selectedColor ? '🖌️ Fırça aktif - Çizmeye başlayın' : 'Bir renk seçin'}
          </p>
          
          <div className="flex justify-center">
            <div className="relative">
              <canvas
                ref={initCanvas}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="rounded-full bg-white shadow-2xl cursor-crosshair max-w-md w-full aspect-square"
                style={{ touchAction: 'none' }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Month days view
  if (selectedMonth !== null) {
    const month = months[selectedMonth];
    const daysArray = Array.from({ length: month.days }, (_, i) => i + 1);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelectedMonth(null)}
              className="text-white hover:text-purple-300 transition-colors flex items-center gap-2"
            >
              <span className="text-2xl">←</span>
              <span className="text-lg">Geri</span>
            </button>
            <h1 className="text-3xl font-bold text-white">
              {month.name}
            </h1>
            <div className="w-20"></div>
          </div>
          
          <p className="text-purple-200 text-center mb-8">
            {month.days} gün - Bir güne tıklayarak çizim yapın
          </p>
          
          <div className="grid grid-cols-7 gap-3">
            {daysArray.map((day) => {
              const key = `${selectedMonth}-${day}`;
              const hasPainting = dayPaintings[key];
              
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className="flex flex-col items-center gap-2 hover:scale-105 transition-all"
                >
                  {hasPainting ? (
                    <div className="aspect-square w-full rounded-full overflow-hidden bg-white">
                      <img src={hasPainting} alt={`Day ${day}`} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-square w-full rounded-full bg-white" />
                  )}
                  <span className="text-white text-xs font-medium">
                    {day}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Main months view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Yıllık Bakış
        </h1>
        <p className="text-purple-200 text-center mb-8">
          Günleri görmek için bir ay seçin
        </p>
        
        <div className="grid grid-cols-3 gap-6">
          {months.map((month, index) => {
            const gradient = getMonthGradient(index);
            const isStyleObject = typeof gradient === 'object';
            
            return (
              <button
                key={month.name}
                onClick={() => setSelectedMonth(index)}
                className="flex flex-col items-center gap-3 hover:scale-105 transition-all duration-300"
              >
                <div 
                  className={`aspect-square w-full rounded-full ${isStyleObject ? '' : gradient}`}
                  style={isStyleObject ? gradient : {}}
                />
                <span className="text-sm font-semibold text-white">
                  {month.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MonthlyCirclesUI;