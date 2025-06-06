import React, { useState, useEffect } from "react";
import BarChartComponent from "../components/analytics/BarChart";
import LineChartComponent from "../components/analytics/LineChart";
import PieChartComponent from "../components/analytics/PieChart";
import LoadingSpinner from "../components/common/LoadingSpinner";
import axios from "axios";

const GRAPH_TYPES = ["Bar", "Line", "Pie"];
const DATA_TYPES = ["graffiti", "tent", "road damage"];

const ChartSection = () => {
  const [graphType, setGraphType] = useState("Bar");
  const [dataType, setDataType] = useState("graffiti");
  const [chartData, setChartData] = useState([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const baseUrl = process.env.REACT_APP_LOCALHOST || "http://127.0.0.1:8000/";
  const url = `${baseUrl}api/chart-data`;

  useEffect(() => {
    const queryParams = new URLSearchParams({
      type: dataType,
      ...(dateRange.start && { start: dateRange.start }),
      ...(dateRange.end && { end: dateRange.end }),
    });

    const fetchChartData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${url}?${queryParams.toString()}`);
        setChartData(response.data);
        setError(null);
      } catch (err) {
        setChartData([]);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [dataType, dateRange, graphType]);

  const renderChart = () => {
    if (!chartData.length) {
      return <p style={{ textAlign: "center", color: "#6B7280" }}>No data available for selected parameters.</p>;
    }

    switch (graphType) {
      case "Bar":
        return <BarChartComponent data={chartData} />;
      case "Line":
        return <LineChartComponent data={chartData} />;
      case "Pie":
        return <PieChartComponent data={chartData} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: "2rem", background: "linear-gradient(to bottom, #eff6ff, white, #eff6ff)", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "2rem", textAlign: "center", color: "#1D4ED8", textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        Urban Maintenance Analytics
      </h1>

      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.5rem", marginBottom: "2rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.25rem" }}>Chart Type</label>
          <select
            value={graphType}
            onChange={(e) => setGraphType(e.target.value)}
            style={{
              border: "1px solid #D1D5DB",
              borderRadius: "0.5rem",
              padding: "0.5rem 0.75rem",
              width: "10rem",
              backgroundColor: "white",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
            }}
          >
            {GRAPH_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.25rem" }}>Anomaly Type</label>
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
            style={{
              border: "1px solid #D1D5DB",
              borderRadius: "0.5rem",
              padding: "0.5rem 0.75rem",
              width: "10rem",
              backgroundColor: "white",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
            }}
          >
            {DATA_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.25rem" }}>Start Date</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
            style={{
              border: "1px solid #D1D5DB",
              borderRadius: "0.5rem",
              padding: "0.5rem 0.75rem",
              width: "10rem",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.25rem" }}>End Date</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
            style={{
              border: "1px solid #D1D5DB",
              borderRadius: "0.5rem",
              padding: "0.5rem 0.75rem",
              width: "10rem",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
            }}
          />
        </div>
      </div>

      {/* Chart */}
      <div style={{
        backgroundColor: "white",
        padding: "1.5rem",
        borderRadius: "1rem",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        transition: "box-shadow 0.3s ease-in-out"
      }}>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div style={{ color: "#EF4444", textAlign: "center" }}>{error}</div>
        ) : (
          renderChart()
        )}
      </div>
    </div>
  );
};

export default ChartSection;
