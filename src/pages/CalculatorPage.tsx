import React, { useState } from "react";
import ActionBar from "../components/Actionbar";

const CalcPage: React.FC = () => {
  const [reps, setReps] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [rir, setRir] = useState<number | "">("");
  const [oneRm, setOneRm] = useState<number | null>(null);
  const [repRange, setRepRange] = useState<number[][] | null>(null);
  const [formula, setFormula] = useState<string>("epley");
  const [unit, setUnit] = useState<"lbs" | "kg">("lbs");
  const [plateWeight, setPlateWeight] = useState<number | "">("");
  const [barWeight, setBarWeight] = useState<number | "">(45);
  const [selectedPercentages] = useState<number[]>([50, 60, 70, 80, 85, 90, 95]);

  // Update bar weight when unit changes
  React.useEffect(() => {
    setBarWeight(unit === "lbs" ? 45 : 20);
  }, [unit]);

  // Conversion helpers
  // const lbsToKg = (lbs: number) => lbs / 2.20462; // Unused for now
  
  // Available plates in lbs
  const availablePlatesLbs = [45, 35, 25, 10, 5, 2.5];
  const availablePlatesKg = [25, 20, 15, 10, 5, 2.5, 1.25];

  // Calculate plates needed
  const calculatePlates = (targetWeight: number) => {
    const plates = unit === "lbs" ? availablePlatesLbs : availablePlatesKg;
    const actualBarWeight = barWeight === "" ? (unit === "lbs" ? 45 : 20) : barWeight;
    // Bar weight is already in the correct unit, no conversion needed
    const weightPerSide = (targetWeight - actualBarWeight) / 2;
    
    if (weightPerSide <= 0) return [];
    
    const platesNeeded: number[] = [];
    let remainingWeight = weightPerSide;
    
    for (const plate of plates) {
      while (remainingWeight >= plate - 0.01) { // Small tolerance for floating point
        platesNeeded.push(plate);
        remainingWeight -= plate;
      }
    }
    
    return platesNeeded;
  };

  // Generate warm-up sets
  const generateWarmupSets = (workingWeight: number) => {
    const warmupPercentages = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    const warmupReps = [10, 8, 5, 3, 2, 1];
    
    return warmupPercentages.map((pct, index) => ({
      weight: Math.round(workingWeight * pct / 5) * 5, // Round to nearest 5
      reps: warmupReps[index],
      percentage: Math.round(pct * 100)
    }));
  };

  // Calculate 1RM based on the selected formula
  const calculateOneRm = () => {
    if (reps !== "" && weight !== "" && rir !== "") {
      const adjustedReps = Math.max(0, reps + rir);
      let calculatedOneRm = 0;

      if (formula === "epley") {
        calculatedOneRm = weight * (1 + 0.0333 * adjustedReps);
      } else if (formula === "brzycki") {
        calculatedOneRm = (36 * weight) / (37 - adjustedReps);
      } else if (formula === "lombardi") {
        calculatedOneRm = weight * Math.pow(adjustedReps, 0.1);
      }

      setOneRm(calculatedOneRm);

      // Generate the rep range
      const temp = Array.from({ length: 12 }, (_, i) => {
        const repsForRange = i + 1;
        let estimatedWeight = 0;

        if (formula === "epley") {
          estimatedWeight = calculatedOneRm / (1 + 0.0333 * repsForRange);
        } else if (formula === "brzycki") {
          estimatedWeight = (calculatedOneRm * (37 - repsForRange)) / 36;
        } else if (formula === "lombardi") {
          estimatedWeight = calculatedOneRm / Math.pow(repsForRange, 0.1);
        }

        return [repsForRange, estimatedWeight];
      });
      setRepRange(temp);
    }
  };

  return (
    <div className="calculator-page">
      <ActionBar />
      <div className="calculator-container">
        <h1>Training Calculators</h1>
        
        {/* Unit Toggle */}
        <div className="unit-toggle">
          <button
            className={`toggle-btn ${unit === "lbs" ? "active" : ""}`}
            onClick={() => setUnit("lbs")}
          >
            LBS
          </button>
          <button
            className={`toggle-btn ${unit === "kg" ? "active" : ""}`}
            onClick={() => setUnit("kg")}
          >
            KG
          </button>
        </div>

        {/* 1RM Calculator Section */}
        <div className="calculator-section">
          <h2>1RM Calculator</h2>
          <div className="input-group">
            <div className="input-container">
              <label>Weight</label>
              <input
                type="number"
                placeholder={`Weight (${unit})`}
                value={weight}
                onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                className="calc-input"
              />
            </div>
            <div className="input-container">
              <label>Reps</label>
              <input
                type="number"
                placeholder="Reps"
                value={reps}
                onChange={(e) => setReps(e.target.value === "" ? "" : Number(e.target.value))}
                className="calc-input"
              />
            </div>
            <div className="input-container">
              <label>RIR</label>
              <input
                type="number"
                placeholder="RIR"
                value={rir}
                onChange={(e) => setRir(e.target.value === "" ? "" : Number(e.target.value))}
                className="calc-input"
              />
            </div>
            <div className="input-container">
              <label>Formula</label>
              <select
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                className="calc-select"
              >
                <option value="epley">Epley</option>
                <option value="brzycki">Brzycki</option>
                <option value="lombardi">Lombardi</option>
              </select>
            </div>
            <button onClick={calculateOneRm} className="calc-button primary">
              Calculate 1RM
            </button>
          </div>

          {oneRm !== null && (
            <div className="results-section">
              <div className="one-rm-result">
                <h3>Estimated 1RM</h3>
                <div className="big-number">
                  {oneRm.toFixed(0)} {unit}
                </div>
              </div>

              {/* Percentage Calculator */}
              <div className="percentage-section">
                <h3>Percentage of 1RM</h3>
                <div className="percentage-grid">
                  {selectedPercentages.map((pct) => (
                    <div key={pct} className="percentage-item">
                      <div className="percentage-label">{pct}%</div>
                      <div className="percentage-weight">
                        {Math.round((oneRm * pct) / 100 / 5) * 5} {unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warm-up Sets */}
              <div className="warmup-section">
                <h3>Warm-up Progression</h3>
                <div className="warmup-list">
                  {generateWarmupSets(oneRm * 0.85).map((set, index) => (
                    <div key={index} className="warmup-item">
                      <span className="warmup-set">Set {index + 1}:</span>
                      <span className="warmup-weight">{set.weight} {unit}</span>
                      <span className="warmup-reps">× {set.reps} reps</span>
                      <span className="warmup-percent">({set.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rep Range Table */}
              {repRange && (
                <div className="rep-range-section">
                  <h3>Rep Ranges</h3>
                  <table className="rep-table">
                    <thead>
                      <tr>
                        <th>Reps</th>
                        <th>Weight ({unit})</th>
                        <th>% of 1RM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repRange.map((range, index) => (
                        <tr key={index}>
                          <td>{range[0]}</td>
                          <td>{range[1].toFixed(0)}</td>
                          <td>{((range[1] / oneRm) * 100).toFixed(0)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Plate Calculator Section */}
        <div className="calculator-section">
          <h2>Plate Calculator</h2>
          <div className="input-group">
            <div className="input-container">
              <label>Target Weight</label>
              <input
                type="number"
                placeholder={`Target weight (${unit})`}
                value={plateWeight}
                onChange={(e) => setPlateWeight(e.target.value === "" ? "" : Number(e.target.value))}
                className="calc-input"
              />
            </div>
            <div className="input-container">
              <label>Bar Weight</label>
              <input
                type="number"
                value={barWeight}
                onChange={(e) => setBarWeight(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Bar weight"
                className="calc-input"
              />
            </div>
          </div>

          {plateWeight !== "" && Number(plateWeight) > (barWeight === "" ? 0 : barWeight) && (
            <div className="plate-results">
              <h3>Plates Per Side</h3>
              <div className="plates-display">
                {calculatePlates(Number(plateWeight)).length > 0 ? (
                  calculatePlates(Number(plateWeight)).map((plate, index) => (
                    <div key={index} className="plate-item">
                      {plate} {unit}
                    </div>
                  ))
                ) : (
                  <p>Weight too light for plates</p>
                )}
              </div>
              <div className="total-weight">
                Total: {(() => {
                  const actualBarWeight = barWeight === "" ? (unit === "lbs" ? 45 : 20) : barWeight;
                  const platesPerSide = calculatePlates(Number(plateWeight));
                  const totalPlateWeight = platesPerSide.reduce((sum, plate) => sum + plate, 0) * 2;
                  return actualBarWeight + totalPlateWeight;
                })()} {unit}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .calculator-page {
          min-height: 100vh;
          background-color: var(--background);
          padding-top: 80px;
          padding-bottom: 80px;
        }

        .calculator-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem;
        }

        .calculator-container h1 {
          text-align: center;
          color: var(--text);
          margin-bottom: 2rem;
        }

        .unit-toggle {
          display: flex;
          justify-content: center;
          gap: 0;
          margin-bottom: 2rem;
        }

        .toggle-btn {
          padding: 0.75rem 2rem;
          border: 1px solid var(--border);
          background: var(--card-background);
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toggle-btn:first-child {
          border-radius: 8px 0 0 8px;
        }

        .toggle-btn:last-child {
          border-radius: 0 8px 8px 0;
          border-left: none;
        }

        .toggle-btn.active {
          background: var(--primary);
          color: white;
        }

        .calculator-section {
          background: var(--card-background);
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 4px var(--shadow);
        }

        .calculator-section h2 {
          color: var(--text);
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .input-group {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: center;
          align-items: flex-end;
          margin-bottom: 1.5rem;
        }

        .input-container {
          display: flex;
          flex-direction: column;
        }

        .input-container label {
          color: var(--text);
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .calc-input,
        .calc-select {
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--input-background);
          color: var(--text);
          font-size: 1rem;
          width: 150px;
        }

        .calc-button {
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .calc-button.primary {
          background: var(--primary);
          color: white;
        }

        .calc-button.primary:hover {
          opacity: 0.9;
        }

        .results-section {
          margin-top: 2rem;
        }

        .one-rm-result {
          text-align: center;
          margin-bottom: 2rem;
        }

        .one-rm-result h3 {
          color: var(--text);
          margin-bottom: 0.5rem;
        }

        .big-number {
          font-size: 3rem;
          font-weight: bold;
          color: var(--primary);
        }

        .percentage-section,
        .warmup-section,
        .rep-range-section {
          margin-top: 2rem;
        }

        .percentage-section h3,
        .warmup-section h3,
        .rep-range-section h3 {
          color: var(--text);
          margin-bottom: 1rem;
        }

        .percentage-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 1rem;
        }

        .percentage-item {
          background: var(--input-background);
          padding: 1rem;
          border-radius: 8px;
          text-align: center;
        }

        .percentage-label {
          font-size: 1.2rem;
          color: var(--primary);
          font-weight: bold;
        }

        .percentage-weight {
          color: var(--text);
          margin-top: 0.5rem;
        }

        .warmup-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .warmup-item {
          display: grid;
          grid-template-columns: 1fr 2fr 2fr 1fr;
          gap: 1rem;
          padding: 0.75rem;
          background: var(--input-background);
          border-radius: 6px;
          align-items: center;
        }

        .warmup-set {
          font-weight: bold;
          color: var(--primary);
        }

        .warmup-weight,
        .warmup-reps,
        .warmup-percent {
          color: var(--text);
        }

        .rep-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }

        .rep-table th,
        .rep-table td {
          padding: 0.75rem;
          text-align: center;
          border-bottom: 1px solid var(--border);
        }

        .rep-table th {
          background: var(--input-background);
          color: var(--text);
          font-weight: bold;
        }

        .rep-table td {
          color: var(--text);
        }

        .rep-table tr:hover {
          background: var(--input-background);
        }

        .plate-results {
          text-align: center;
          margin-top: 1.5rem;
        }

        .plate-results h3 {
          color: var(--text);
          margin-bottom: 1rem;
        }

        .plates-display {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .plate-item {
          background: var(--primary);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: bold;
        }

        .total-weight {
          font-size: 1.2rem;
          color: var(--text);
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .calculator-container {
            padding: 1rem;
          }

          .input-group {
            flex-direction: column;
            align-items: stretch;
          }

          .calc-input,
          .calc-select {
            width: 100%;
          }

          .warmup-item {
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
          }

          .percentage-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default CalcPage;
