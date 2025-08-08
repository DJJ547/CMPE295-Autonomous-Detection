import React, { useState, useEffect, useMemo } from "react";
import BarChartComponent from "../components/analytics/BarChart";
import LineChartComponent from "../components/analytics/LineChart";
import PieChartComponent from "../components/analytics/PieChart";
import LoadingSpinner from "../components/common/LoadingSpinner";
import axios from "axios";

const GRAPH_TYPES = ["Bar", "Line"];
const DATA_TYPES = ["graffiti", "tent", "road_damage"];

const ChartSection = () => {
  const [graphType, setGraphType] = useState("Bar");
  const [dataType, setDataType] = useState("graffiti");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const [tsData, setTsData] = useState([]);
  const [tsLoading, setTsLoading] = useState(false);
  const [tsError, setTsError] = useState(null);

  const [stats, setStats] = useState({ graffiti: 0, tent: 0, road_damage: 0 });
  const [stLoading, setStLoading] = useState(false);
  const [stError, setStError] = useState(null);

  const baseUrl = process.env.REACT_APP_LOCALHOST || "http://127.0.0.1:8000/";

  // ── Fetch time-series ─────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams({
      type: dataType,
      ...(dateRange.start && { start: dateRange.start }),
      ...(dateRange.end && { end: dateRange.end }),
    }).toString();

    setTsLoading(true);
    axios
      .get(`${baseUrl}api/chart-data?${params}`)
      .then((res) => {
        setTsData(res.data);
        setTsError(null);
      })
      .catch((err) => {
        setTsData([]);
        setTsError(err.message);
      })
      .finally(() => setTsLoading(false));
  }, [dataType, dateRange]);

  // ── Fetch pie-stats ────────────────────────────────────
  useEffect(() => {
    const statsUrl = `${baseUrl.replace(/\/+$/, "")}/api/anomalies/stats`;
    console.log("📡 Fetching stats from:", statsUrl);

    setStLoading(true);
    axios
      .get(statsUrl)
      .then((res) => {
        console.log("✅ stats response:", res.data);
        setStats(res.data);
        setStError(null);
      })
      .catch((err) => {
        // if there's an HTTP response payload, log it too
        if (err.response) {
          console.log("❌ stats error response:", err.response.status, err.response.data);
        } else {
          console.log("❌ stats error:", err.message);
        }
        setStats({ graffiti: 0, tent: 0, road_damage: 0 });
        setStError(err.message);
      })
      .finally(() => {
        console.log("🔄 stats loading complete");
        setStLoading(false);
      });
  }, []);

  const pieData = useMemo(
    () => [
      { name: "Graffiti", count: stats.graffiti },
      { name: "Tent", count: stats.tent },
      { name: "Road Damage", count: stats.road_damage },
    ],
    [stats]
  );

  // parse ISO to timestamp
  const timeSeries = useMemo(
    () =>
      tsData.map((d) => ({
        ...d,
        date: new Date(d.date).getTime(),
      })),
    [tsData]
  );

  return (
    <div style={{ padding: "2rem", background: "#f3f4f6", minHeight: "100vh" }}>
      {/* ── Controls ───────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        {/* Chart Type */}
        <div>
          <label style={{ display: "block", marginBottom: "0.25rem" }}>Chart Type</label>
          <select
            value={graphType}
            onChange={(e) => setGraphType(e.target.value)}
            style={{ padding: ".5rem", borderRadius: ".5rem" }}
          >
            {GRAPH_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Anomaly Type */}
        <div>
          <label style={{ display: "block", marginBottom: "0.25rem" }}>Anomaly Type</label>
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
            style={{ padding: ".5rem", borderRadius: ".5rem" }}
          >
            {DATA_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label style={{ display: "block", marginBottom: "0.25rem" }}>Start Date</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
            style={{ padding: ".5rem", borderRadius: ".5rem" }}
          />
        </div>

        {/* End Date */}
        <div>
          <label style={{ display: "block", marginBottom: "0.25rem" }}>End Date</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
            style={{ padding: ".5rem", borderRadius: ".5rem" }}
          />
        </div>
      </div>

      {/* ── Charts Container ───────────────────────────────── */}
      <div style={{ display: "flex", gap: "1rem" }}>
        {/* Left: Bar or Line */}
        <div
          style={{
            flex: 2,
            minWidth: "600px",      // ← ensure at least 600px of room
            overflowX: "auto",      // ← allow the user to scroll if narrower
            background: "white",
            padding: "1rem",
            borderRadius: "1rem",
          }}
        >
          {tsLoading ? (
            <LoadingSpinner />
          ) : tsError ? (
            <p style={{ color: "red", textAlign: "center" }}>{tsError}</p>
          ) : graphType === "Bar" ? (
            <BarChartComponent data={timeSeries} />
          ) : (
            <LineChartComponent data={timeSeries} />
          )}
        </div>

        {/* Right: Pie */}
        <div style={{ flex: 1, background: "white", padding: "1rem", borderRadius: "1rem" }}>
          {stLoading ? (
            <LoadingSpinner />
          ) : stError ? (
            <p style={{ color: "red", textAlign: "center" }}>{stError}</p>
          ) : (
            <PieChartComponent data={pieData} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartSection;
