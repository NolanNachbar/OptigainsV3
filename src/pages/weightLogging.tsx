import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ActionBar from "../components/Actionbar";
import { bodyWeight } from "../utils/types"; // Import bodyWeight type
import { saveWeights } from "../utils/localStorage";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const WeightLibrary: React.FC = () => {
  const [weights, setWeights] = useState<bodyWeight[]>([]); // Use bodyWeight type
  const [newWeight, setNewWeight] = useState<number | string>(""); // Allow it to be string initially
  const [newDate, setNewDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Load weights from localStorage
  const loadWeights = () => {
    const savedWeights = JSON.parse(localStorage.getItem("weights") || "[]");
    setWeights(savedWeights);
  };

  useEffect(() => {
    loadWeights();
    window.addEventListener("storage", loadWeights);
    return () => {
      window.removeEventListener("storage", loadWeights);
    };
  }, []);

  // Handle adding new bodyweight
  const handleAddWeight = () => {
    const parsedWeight = parseFloat(newWeight.toString()); // Ensure newWeight is a number
    if (!isNaN(parsedWeight) && parsedWeight > 0) {
      const newWeightLog: bodyWeight = {
        date: newDate,
        weight: parsedWeight,
      };

      const updatedWeights = [...weights, newWeightLog];
      setWeights(updatedWeights);
      saveWeights(updatedWeights);

      setNewWeight(""); // Reset input field after successful entry
    } else {
      alert("Please enter a valid weight.");
    }
  };

  // Get progress data for the chart
  const getProgressData = () => {
    const labels = weights.map((log) => log.date);
    const data = weights.map((log) => log.weight);

    return {
      labels,
      datasets: [
        {
          label: "Bodyweight",
          data: data,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.2,
        },
      ],
    };
  };

  return (
    <div>
      <ActionBar />
      <div style={{ marginTop: "60px" }}>
        <h1>Bodyweight Log</h1>
        <div>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <input
            type="number"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            placeholder="Enter weight"
            style={{ marginRight: "10px" }}
          />
          <button onClick={handleAddWeight}>Log Weight</button>
        </div>

        {weights.length > 0 && (
          <>
            <h2>Progress</h2>
            <Line data={getProgressData()} />
          </>
        )}

        <h2>Weigh-in History</h2>
        <ul>
          {weights.map((weight, index) => (
            <li key={index}>
              {weight.date}: {weight.weight} lbs
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WeightLibrary;
