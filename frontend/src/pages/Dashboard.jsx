import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Heatmap from "./HeatmapPage";
import GoogleMapView from "./googleMap";

const Dashboard = () => {
    return (

        <div className="p-4 flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <div>
                <Link to="/heatmap" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-center">
                    Live View
                </Link>
            </div>
            <div>
                <Link to="/heatmap" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-center">
                    Heat map
                </Link>
            </div>
            <div className="mt-2">
                <Link to="/googlemap" className="px-4 py-2 bg-green-500 text-white rounded-lg text-center">
                    Marker Map
                </Link>
            </div>
            <div>
                <Link to="/analytics" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-center">
                    Analytics Map
                </Link>
            </div>

        </div>

    );
};

export default Dashboard;
