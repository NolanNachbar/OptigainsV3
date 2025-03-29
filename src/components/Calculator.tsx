import React from "react";
import { calculateNextWeight } from "../utils/localStorage";
import { Exercise } from "../utils/types";

interface CalculatorProps {
  currentWeight: number;
  repsAchieved: number;
  rir: number;
}

const Calculator: React.FC<CalculatorProps> = ({
  currentWeight,
  repsAchieved,
  rir,
}) => {
  // Create an exercise object with current weight and empty logs
  const exercise: Exercise = {
    name: "Example Exercise", // Example name, you can modify this
    sets: [{ weight: currentWeight, reps: repsAchieved, rir: rir }], // Define sets properly
    rir: rir,
    logs: [], // Empty logs for now
  };

  // Get the next weight based on current weight, reps, and RIR
  const nextWeight = calculateNextWeight(exercise, repsAchieved, rir);

  return (
    <div>
      <p>Current Weight: {currentWeight} lbs</p>
      <p>Reps Achieved: {repsAchieved}</p>
      <p>RIR: {rir}</p>
      <p>Next Recommended Weight: {nextWeight.toFixed(2)} lbs</p>
    </div>
  );
};

export default Calculator;