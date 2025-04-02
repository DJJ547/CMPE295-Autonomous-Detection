import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import LivestreamWindow from "../components/LiveStreamWindow";
import Heatmap from "./HeatmapPage";
import GoogleMapView from "./googleMap";

const Dashboard = () => {
    const [startLatGlobal, setStartLatGlobal] = useState('');
    const [startLngGlobal, setStartLngGlobal] = useState('');
    const [endLatGlobal, setEndLatGlobal] = useState('');
    const [endLngGlobal, setEndLngGlobal] = useState('');
    return (

        <div className="p-4 flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <div>
                <LivestreamWindow setStartLatGlobal={setStartLatGlobal} setStartLngGlobal={setStartLngGlobal} setEndLatGlobal={setEndLatGlobal} setEndLngGlobal={setEndLngGlobal}/>
                
            </div>
        </div>

    );
};

export default Dashboard;