import React, { useState, useEffect } from 'react';
import './App.css';

const LOG_SLOTS = [
  "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
];

const CHART_TIMES = ["07:00", ...LOG_SLOTS];

const COMMON_LINENS = [
  "Lençol", "Fronha", "Toalha de Banho", "Toalha de Rosto", 
  "Piso de Banheiro", "Edredom", "Toalha de Mesa", "Guardanapo"
];

const STORAGE_KEY = "laundry_oee_dashboard_data";

function App() {

  const [selectedDate, setSelectedDate] = useState(() => {

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [db, setDb] = useState({});
  const [logs, setLogs] = useState([]);

  const [timeSlot, setTimeSlot] = useState("07:30");
  const [weight, setWeight] = useState(50);
  const [linenType, setLinenType] = useState("");
  const [isRewash, setIsRewash] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(400);
  const [editingLogId, setEditingLogId] = useState(null);

  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
  const [printDateTime, setPrintDateTime] = useState("");
  const [highlightedRowId, setHighlightedRowId] = useState(null);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let loadedDb = {};
    if (saved) {
      try {
        loadedDb = JSON.parse(saved);
        setDb(loadedDb);
      } catch (e) {
        console.error("Error parsing localStorage data", e);
      }
    }

    const savedGoal = localStorage.getItem("laundry_oee_goal");
    if (savedGoal) {
      setDailyGoal(Number(savedGoal));
    }

    if (!saved || Object.keys(loadedDb).length === 0) {
      const todayStr = getLocalDateString(new Date());
      const yesterdayStr = getLocalDateString(new Date(Date.now() - 86400000));

      const mockDb = {
        [todayStr]: [
          { id: "t1", timeSlot: "07:30", weight: 50, linenType: "Lençol Solteiro", isRewash: false },
          { id: "t2", timeSlot: "08:00", weight: 50, linenType: "Fronha", isRewash: false },
          { id: "t3", timeSlot: "09:30", weight: 100, linenType: "Toalha de Banho", isRewash: false },
          { id: "t4", timeSlot: "10:00", weight: 50, linenType: "Toalha de Rosto", isRewash: false },
          { id: "t5", timeSlot: "11:30", weight: 50, linenType: "Edredom", isRewash: true },
          { id: "t6", timeSlot: "12:00", weight: 50, linenType: "Lençol Casal", isRewash: false },
          { id: "t7", timeSlot: "14:00", weight: 50, linenType: "Piso de Banheiro", isRewash: false },
          { id: "t8", timeSlot: "15:00", weight: 50, linenType: "Toalha de Mesa", isRewash: false },
          { id: "t9", timeSlot: "16:30", weight: 50, linenType: "Lençol Solteiro", isRewash: false }
        ],
        [yesterdayStr]: [
          { id: "y1", timeSlot: "07:30", weight: 50, linenType: "Lençol", isRewash: false },
          { id: "y2", timeSlot: "08:00", weight: 50, linenType: "Fronha", isRewash: false },
          { id: "y3", timeSlot: "08:30", weight: 50, linenType: "Toalha", isRewash: false },
          { id: "y4", timeSlot: "10:30", weight: 100, linenType: "Lençol", isRewash: false },
          { id: "y5", timeSlot: "11:00", weight: 50, linenType: "Cobertor", isRewash: false },
          { id: "y6", timeSlot: "13:30", weight: 100, linenType: "Toalha de Mesa", isRewash: false },
          { id: "y7", timeSlot: "15:00", weight: 50, linenType: "Guardanapo", isRewash: false },
          { id: "y8", timeSlot: "16:00", weight: 50, linenType: "Fronha", isRewash: false }
        ]
      };
      setDb(mockDb);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockDb));
    }
  }, []);

  useEffect(() => {
    if (db[selectedDate]) {
      setLogs(db[selectedDate]);
    } else {
      setLogs([]);
    }
  }, [selectedDate, db]);

  useEffect(() => {
    document.body.className = "";
  }, []);

  function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatLocalDate(dateStr) {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  }

  const saveDb = (newDb) => {
    setDb(newDb);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDb));
  };

  const handleAddOrUpdate = (e) => {
    e.preventDefault();
    if (weight <= 0) return;

    const currentLogs = db[selectedDate] || [];
    let updatedLogs;

    if (editingLogId) {

      updatedLogs = currentLogs.map(log => 
        log.id === editingLogId 
          ? { ...log, timeSlot, weight: Number(weight), linenType: linenType.trim() || "Diversos", isRewash }
          : log
      );
      setEditingLogId(null);
    } else {

      const newLog = {
        id: 'log_' + Date.now() + Math.random().toString(36).substr(2, 4),
        timeSlot,
        weight: Number(weight),
        linenType: linenType.trim() || "Diversos",
        isRewash
      };
      updatedLogs = [...currentLogs, newLog];

      setHighlightedRowId(newLog.id);
      setTimeout(() => setHighlightedRowId(null), 1500);
    }

    updatedLogs.sort((a, b) => LOG_SLOTS.indexOf(a.timeSlot) - LOG_SLOTS.indexOf(b.timeSlot));

    const newDb = { ...db, [selectedDate]: updatedLogs };
    saveDb(newDb);

    setWeight(50);
    setLinenType("");
    setIsRewash(false);

    const currentIndex = LOG_SLOTS.indexOf(timeSlot);
    if (currentIndex < LOG_SLOTS.length - 1 && !editingLogId) {
      setTimeSlot(LOG_SLOTS[currentIndex + 1]);
    }
  };

  const handleEditInit = (log) => {
    setEditingLogId(log.id);
    setTimeSlot(log.timeSlot);
    setWeight(log.weight);
    setLinenType(log.linenType);
    setIsRewash(log.isRewash);

    document.querySelector('.form-card-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setWeight(50);
    setLinenType("");
    setIsRewash(false);
  };

  const handleDelete = (id) => {
    const currentLogs = db[selectedDate] || [];
    const updatedLogs = currentLogs.filter(log => log.id !== id);
    const newDb = { ...db, [selectedDate]: updatedLogs };
    saveDb(newDb);
    if (editingLogId === id) {
      handleCancelEdit();
    }
  };

  const handleClearDay = () => {
    if (window.confirm("Deseja realmente limpar todos os registros deste dia?")) {
      const newDb = { ...db, [selectedDate]: [] };
      saveDb(newDb);
      handleCancelEdit();
    }
  };

  const handleLoadDemoData = () => {
    const demoLogs = [
      { id: "demo1", timeSlot: "07:30", weight: 50, linenType: "Lençol Solteiro", isRewash: false },
      { id: "demo2", timeSlot: "08:00", weight: 50, linenType: "Fronha", isRewash: false },
      { id: "demo3", timeSlot: "09:30", weight: 100, linenType: "Toalha de Banho", isRewash: false },
      { id: "demo4", timeSlot: "10:00", weight: 50, linenType: "Toalha de Rosto", isRewash: false },
      { id: "demo5", timeSlot: "11:30", weight: 50, linenType: "Edredom", isRewash: true },
      { id: "demo6", timeSlot: "12:00", weight: 50, linenType: "Lençol Casal", isRewash: false },
      { id: "demo7", timeSlot: "14:00", weight: 50, linenType: "Piso de Banheiro", isRewash: false },
      { id: "demo8", timeSlot: "15:00", weight: 50, linenType: "Toalha de Mesa", isRewash: false },
      { id: "demo9", timeSlot: "16:30", weight: 50, linenType: "Lençol Solteiro", isRewash: false }
    ];
    const newDb = { ...db, [selectedDate]: demoLogs };
    saveDb(newDb);
  };

  const handlePrint = () => {

    const now = new Date();
    const formatted = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setPrintDateTime(formatted);

    setTimeout(() => {
      window.print();
    }, 150);
  };

  const changeDateByDays = (days) => {
    const currentDate = new Date(selectedDate + "T12:00:00");
    currentDate.setDate(currentDate.getDate() + days);
    setSelectedDate(getLocalDateString(currentDate));
    handleCancelEdit();
  };

  const handleGoalChange = (newGoal) => {
    const val = Math.max(50, Number(newGoal));
    setDailyGoal(val);
    localStorage.setItem("laundry_oee_goal", val.toString());
  };

  const totalWeight = logs.reduce((acc, log) => acc + log.weight, 0);
  const conformWeight = logs.reduce((acc, log) => acc + (log.isRewash ? 0 : log.weight), 0);
  const rewashWeight = totalWeight - conformWeight;

  const activeSlotsSet = new Set(logs.map(log => log.timeSlot));
  const activeSlotsCount = activeSlotsSet.size;
  const availability = activeSlotsCount > 0 ? (activeSlotsCount / LOG_SLOTS.length) * 100 : 0;

  const performance = totalWeight > 0 ? Math.min(100, (totalWeight / dailyGoal) * 100) : 0;
  const rawPerformance = totalWeight > 0 ? (totalWeight / dailyGoal) * 100 : 0;

  const quality = totalWeight > 0 ? (conformWeight / totalWeight) * 100 : 100;

  const oee = (availability * performance * quality) / 10000;

  const cycleCount = logs.length;
  const averageLoad = cycleCount > 0 ? (totalWeight / cycleCount).toFixed(1) : 0;

  const graphPoints = [];
  let runningSum = 0;

  graphPoints.push({
    time: "07:00",
    intervalWeight: 0,
    cumulative: 0,
    linens: [],
    hasRewash: false
  });

  LOG_SLOTS.forEach((slot) => {
    const slotLogs = logs.filter(log => log.timeSlot === slot);
    const weightInSlot = slotLogs.reduce((sum, log) => sum + log.weight, 0);
    const hasRewashInSlot = slotLogs.some(log => log.isRewash);

    runningSum += weightInSlot;

    const slotLinens = slotLogs.map(log => `${log.linenType} (${log.weight}kg)${log.isRewash ? ' ⚠️' : ''}`);

    graphPoints.push({
      time: slot,
      intervalWeight: weightInSlot,
      cumulative: runningSum,
      linens: slotLinens,
      hasRewash: hasRewashInSlot
    });
  });

  const svgW = 1000;
  const svgH = 450;
  const padL = 70;
  const padR = 40;
  const padT = 30;
  const padB = 50;

  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  const maxCumulative = graphPoints[graphPoints.length - 1].cumulative;

  const yLimit = Math.max(400, Math.ceil(maxCumulative / 100) * 100);
  const yTicks = [];
  for (let i = 0; i <= yLimit; i += 50) {
    yTicks.push(i);
  }

  const getX = (index) => {
    return padL + (index / (CHART_TIMES.length - 1)) * chartW;
  };

  const getY = (val) => {
    return padT + chartH - (val / yLimit) * chartH;
  };

  let linePathD = "";

  if (graphPoints.length > 0) {

    const xStart = getX(0);
    const yStart = getY(0);
    linePathD = `M ${xStart} ${yStart}`;

    for (let i = 1; i < graphPoints.length; i++) {
      const x = getX(i);
      const y = getY(graphPoints[i].cumulative);
      linePathD += ` L ${x} ${y}`;
    }
  }

  return (
    <div className="app-container">

      <div className="print-only-info">
        <div className="print-header">
          <div>
            <h1 className="print-title">OEE - Controle de Lavagem de Lavanderia</h1>
            <p style={{ margin: "4px 0 0 0", fontSize: "12pt", color: "#333" }}>Lavanderia Modelo do Hotel</p>
          </div>
          <div className="print-meta">
            <div><strong>Data do Registro:</strong> {formatLocalDate(selectedDate)}</div>
            <div><strong>Impresso em:</strong> {printDateTime || new Date().toLocaleString('pt-BR')}</div>
          </div>
        </div>
      </div>

      <header className="dashboard-header">
        <div className="brand-section">
          <div className="brand-logo">OEE</div>
          <div className="title-area">
            <h1>Controle de Lavagem <span>(OEE)</span></h1>
            <p>Lavanderia Modelo de Hotel • Controle Diário de Produtividade</p>
          </div>
        </div>

        <div className="controls-area">

          <div className="calendar-container">
            <button className="calendar-nav-btn" onClick={() => changeDateByDays(-1)} title="Dia Anterior">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <input 
              type="date" 
              className="calendar-input"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); handleCancelEdit(); }}
            />
            <button className="calendar-nav-btn" onClick={() => changeDateByDays(1)} title="Próximo Dia">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>

          {logs.length === 0 && (
            <button className="btn-secondary" onClick={handleLoadDemoData} style={{ borderColor: 'rgba(245, 158, 11, 0.3)', color: '#fcd34d' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg></button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '4px 10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>META:</span>
            <input 
              type="number" 
              value={dailyGoal}
              onChange={(e) => handleGoalChange(e.target.value)}
              step="50"
              style={{ width: '60px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: '700', outline: 'none', textAlign: 'center' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Kg</span>
          </div>

          <button className="btn-primary" onClick={handlePrint} style={{ width: 'auto' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Imprimir Relatório
          </button>
        </div>
      </header>

      <section className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Lavado</span>
            <span className="kpi-value">{totalWeight} Kg</span>
            <span className="kpi-trend success">
              Meta: {dailyGoal} Kg ({rawPerformance.toFixed(0)}%)
            </span>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">OEE Geral</span>
            <span className="kpi-value" style={{ color: oee >= 65 ? 'var(--accent-success)' : oee >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)' }}>
              {oee.toFixed(1)}%
            </span>
            <span className="kpi-trend muted" title="D (Uso) x P (Meta) x Q (Conforme)">
              Fórmula: D {availability.toFixed(0)}% × P {performance.toFixed(0)}% × Q {quality.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon indigo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Ciclos de Carga</span>
            <span className="kpi-value">{cycleCount}</span>
            <span className="kpi-trend muted">
              Média por Ciclo: {averageLoad} Kg
            </span>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon success" style={{ color: rewashWeight > 0 ? 'var(--accent-warning)' : 'var(--accent-success)', background: rewashWeight > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Qualidade / Refugo</span>
            <span className="kpi-value">{quality.toFixed(1)}%</span>
            <span className="kpi-trend" style={{ color: rewashWeight > 0 ? 'var(--accent-warning)' : 'var(--text-muted)' }}>
              {rewashWeight > 0 ? `${rewashWeight} Kg re-lavados` : "100% Conforme"}
            </span>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">

        <section className="glass-card" style={{ position: 'relative' }}>
          <div className="card-header">
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--accent-cyan)' }}><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              Gráfico de Etapas OEE - Acumulado
            </h2>
            <div className="demo-badge">
              <span className="dot" style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%' }}></span>
              Escala de 30 em 30 min
            </div>
          </div>
          <p className="card-subtitle">
            Mostra o peso acumulado lavado (Kg) ao longo do turno. A linha sobe nos horários em que houve lavagem e corre na horizontal caso não tenha havido lavagem no período.
          </p>

          <div className="chart-container-wrapper">
            <svg className="svg-chart-container" viewBox={`0 0 ${svgW} ${svgH}`}>

              {yTicks.map((tickVal) => {
                const y = getY(tickVal);
                const isGoal = tickVal === dailyGoal;
                return (
                  <g key={tickVal}>
                    <line 
                      x1={padL} 
                      y1={y} 
                      x2={svgW - padR} 
                      y2={y} 
                      className={isGoal ? "chart-grid-line-major" : "chart-grid-line"} 
                      style={isGoal ? { stroke: 'rgba(239, 68, 68, 0.4)', strokeDasharray: '5 3' } : {}}
                    />
                    <text 
                      x={padL - 12} 
                      y={y + 4} 
                      textAnchor="end" 
                      className={`chart-label-text ${isGoal ? 'chart-label-text-major' : ''}`}
                      style={isGoal ? { fill: '#ef4444' } : {}}
                    >
                      {tickVal} kg {isGoal ? '🎯' : ''}
                    </text>
                  </g>
                );
              })}

              {CHART_TIMES.map((time, idx) => {
                const x = getX(idx);

                const isFullHour = time.endsWith(":00");
                return (
                  <g key={time}>
                    <line 
                      x1={x} 
                      y1={padT} 
                      x2={x} 
                      y2={svgH - padB} 
                      className={isFullHour ? "chart-grid-line-major" : "chart-grid-line"}
                      style={isFullHour ? {} : { stroke: 'rgba(255,255,255,0.03)' }}
                    />
                    <text 
                      x={x} 
                      y={svgH - padB + 20} 
                      textAnchor="middle" 
                      className={`chart-label-text ${isFullHour ? 'chart-label-text-major' : ''}`}
                      style={{ transform: 'rotate(-30deg)', transformOrigin: `${x}px ${svgH - padB + 20}px` }}
                    >
                      {time}
                    </text>
                  </g>
                );
              })}

              <line x1={padL} y1={svgH - padB} x2={svgW - padR} y2={svgH - padB} className="chart-axis-line" />
              <line x1={padL} y1={padT} x2={padL} y2={svgH - padB} className="chart-axis-line" />

              {linePathD && <path d={linePathD} className="chart-line-shadow" fill="none" />}
              {linePathD && <path d={linePathD} className="chart-line" fill="none" />}

              {hoveredPointIndex !== null && (
                <line
                  x1={getX(hoveredPointIndex)}
                  y1={padT}
                  x2={getX(hoveredPointIndex)}
                  y2={svgH - padB}
                  stroke="var(--accent-cyan)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  pointerEvents="none"
                />
              )}

              {graphPoints.map((pt, idx) => {
                const x = getX(idx);
                const y = getY(pt.cumulative);
                const isActive = hoveredPointIndex === idx;

                if (idx === 0) return null;

                return (
                  <g key={idx}>
                    {pt.intervalWeight > 0 && (
                      <circle 
                        cx={x} 
                        cy={y} 
                        r={isActive ? "12" : "8"} 
                        className="chart-point-pulse"
                        style={{ fill: pt.hasRewash ? 'var(--accent-danger)' : 'var(--accent-cyan)' }}
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={isActive ? "6" : "4.5"}
                      className={`chart-point ${isActive ? 'chart-point-active' : ''}`}
                      style={pt.hasRewash ? { stroke: 'var(--accent-danger)' } : {}}
                      onMouseEnter={() => setHoveredPointIndex(idx)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                    />
                  </g>
                );
              })}

              {graphPoints.map((pt, idx) => {
                const x = getX(idx);
                const halfCol = chartW / (CHART_TIMES.length - 1) / 2;
                return (
                  <rect
                    key={`bar-${idx}`}
                    x={x - halfCol}
                    y={padT}
                    width={halfCol * 2}
                    height={chartH}
                    className="chart-interactive-bar"
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  />
                );
              })}
            </svg>

            {hoveredPointIndex !== null && graphPoints[hoveredPointIndex] && (
              <div 
                className="chart-tooltip"
                style={{ 
                  left: `${(getX(hoveredPointIndex) / svgW) * 100}%`,
                  top: `${(getY(graphPoints[hoveredPointIndex].cumulative) / svgH) * 100}%` 
                }}
              >
                <div className="tooltip-time">Hora: {graphPoints[hoveredPointIndex].time}</div>
                <div className="tooltip-row">
                  <span className="tooltip-label">Acumulado:</span>
                  <span className="tooltip-val">{graphPoints[hoveredPointIndex].cumulative} kg</span>
                </div>
                <div className="tooltip-row">
                  <span className="tooltip-label">No Intervalo:</span>
                  <span className="tooltip-val" style={{ color: graphPoints[hoveredPointIndex].intervalWeight > 0 ? '#22d3ee' : 'var(--text-muted)' }}>
                    {graphPoints[hoveredPointIndex].intervalWeight} kg
                  </span>
                </div>

                {graphPoints[hoveredPointIndex].linens.length > 0 && (
                  <div style={{ marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '2px' }}>ENXOVAL:</div>
                    {graphPoints[hoveredPointIndex].linens.map((linen, lIdx) => (
                      <div key={lIdx} style={{ fontSize: '11px', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        • {linen}
                      </div>
                    ))}
                  </div>
                )}
                {graphPoints[hoveredPointIndex].hasRewash && (
                  <div style={{ color: '#ef4444', fontSize: '10px', fontWeight: 'bold', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    ⚠️ Contém Re-lavagem
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <section className="glass-card form-card-section">
            <div className="card-header">
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-cyan)' }}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                {editingLogId ? "Editar Registro de Lavagem" : "Registrar Nova Lavagem"}
              </h2>
              {editingLogId && (
                <button className="btn-icon" onClick={handleCancelEdit} title="Cancelar Edição">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              )}
            </div>

            <form onSubmit={handleAddOrUpdate}>

              <div className="form-group">
                <label htmlFor="time-select">Horário do Fechamento (Intervalo de 30m)</label>
                <select 
                  id="time-select" 
                  className="input-style"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                >
                  {LOG_SLOTS.map(slot => {
                    const idx = LOG_SLOTS.indexOf(slot);
                    const startTime = CHART_TIMES[idx];
                    return (
                      <option key={slot} value={slot}>
                        {startTime} às {slot}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="weight-input">Quantidade Lavada (Kg)</label>
                <div className="weight-stepper">
                  <button 
                    type="button" 
                    className="btn-step"
                    onClick={() => setWeight(w => Math.max(0, w - 50))}
                  >
                    -50
                  </button>
                  <input 
                    type="number" 
                    id="weight-input"
                    className="input-style" 
                    value={weight}
                    onChange={(e) => setWeight(Math.max(0, Number(e.target.value)))}
                    min="0"
                    required
                  />
                  <button 
                    type="button" 
                    className="btn-step"
                    onClick={() => setWeight(w => w + 50)}
                  >
                    +50
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="linen-input">Tipo de Enxoval</label>
                <input 
                  type="text" 
                  id="linen-input"
                  className="input-style"
                  placeholder="Ex: Lençol, Fronha, Toalha de Banho..."
                  value={linenType}
                  onChange={(e) => setLinenType(e.target.value)}
                />

                <div className="suggestions-label">Sugestões rápidas:</div>
                <div className="suggestions-container">
                  {COMMON_LINENS.map(item => (
                    <button 
                      type="button" 
                      key={item} 
                      className="btn-suggest"
                      onClick={() => setLinenType(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                <input 
                  type="checkbox" 
                  id="rewash-checkbox"
                  checked={isRewash}
                  onChange={(e) => setIsRewash(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-danger)' }}
                />
                <label htmlFor="rewash-checkbox" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '600', color: isRewash ? '#f87171' : 'var(--text-primary)' }}>Registrar como Re-lavagem / Refugo?</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Afeta a qualidade e reduz a porcentagem do OEE geral.</span>
                </label>
              </div>

              <div className="action-buttons">
                <button type="submit" className="btn-primary">
                  {editingLogId ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Atualizar Registro
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      Adicionar Registro
                    </>
                  )}
                </button>
                {editingLogId && (
                  <button type="button" className="btn-secondary" onClick={handleCancelEdit} style={{ width: 'auto' }}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      </div>

      <section className="glass-card">
        <div className="card-header">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--accent-cyan)' }}><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            Registros do Dia
          </h2>
          {logs.length > 0 && (
            <button className="btn-danger-outline" onClick={handleClearDay} style={{ padding: '6px 12px', fontSize: '11px' }}>
              Limpar Dia
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </div>
            <div>
              <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>Nenhum registro para esta data</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Utilize o formulário acima para registrar uma lavagem ou carregue dados de exemplo para demonstração.</p>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Horário</th>
                  <th>Qtd (Kg)</th>
                  <th>Tipo Enxoval</th>
                  <th className="action-col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr 
                    key={log.id} 
                    className={highlightedRowId === log.id ? "table-row-new" : ""}
                    style={log.isRewash ? { borderLeft: '3px solid var(--accent-danger)', background: 'rgba(239, 68, 68, 0.02)' } : {}}
                  >
                    <td>
                      <span className="badge-time">{log.timeSlot}</span>
                    </td>
                    <td>
                      <span className="badge-weight" style={log.isRewash ? { color: '#f87171' } : {}}>
                        {log.weight} Kg
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge-linen">{log.linenType}</span>
                        {log.isRewash && (
                          <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 'bold', background: 'rgba(239,68,68,0.1)', padding: '2px 5px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            ⚠️ Refugo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="action-col">
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          className="btn-icon edit" 
                          onClick={() => handleEditInit(log)} 
                          title="Editar Registro"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        <button 
                          className="btn-icon delete" 
                          onClick={() => handleDelete(log.id)} 
                          title="Excluir Registro"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
