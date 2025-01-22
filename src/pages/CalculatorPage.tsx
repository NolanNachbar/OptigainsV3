import React, { useState } from 'react';
import ActionBar from '../components/Actionbar';

const CalcPage: React.FC = () => {
    const [reps, setReps] = useState<number | ''>('');
    const [weight, setWeight] = useState<number | ''>('');
    const [rir, setRir] = useState<number | ''>('');
    const [oneRm, setOneRm] = useState<number | null>(null);
    const [repRange, setRepRange] = useState<number[][] | null>(null);
    const [formula, setFormula] = useState<string>('epley'); // Formula selection: epley, brzycki, lombardi

    // Calculate 1RM based on the selected formula
    const calculateOneRm = () => {
        if (reps !== '' && weight !== '' && rir !== '') {
            const adjustedReps = Math.max(0, reps + rir); // Ensure reps doesn't go below 0
            let calculatedOneRm = 0;

            // Use the selected formula
            if (formula === 'epley') {
                calculatedOneRm = weight * (1 + 0.0333 * adjustedReps);
            } else if (formula === 'brzycki') {
                calculatedOneRm = (36 * weight) / (37 - adjustedReps);
            } else if (formula === 'lombardi') {
                calculatedOneRm = weight * Math.pow(adjustedReps, 0.10);
            }

            setOneRm(calculatedOneRm);

            // Generate the rep range
            const temp = Array.from({ length: 12 }, (_, i) => {
                const repsForRange = i + 1; // Reps from 1 to 12
                let estimatedWeight = 0;

                if (formula === 'epley') {
                    estimatedWeight = calculatedOneRm / (1 + 0.0333 * repsForRange);
                } else if (formula === 'brzycki') {
                    estimatedWeight = calculatedOneRm * (37 - repsForRange) / 36;
                } else if (formula === 'lombardi') {
                    estimatedWeight = calculatedOneRm / Math.pow(repsForRange, 0.10);
                }

                return [repsForRange, estimatedWeight];
            });
            setRepRange(temp);
        }
    };

    return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
            <ActionBar/>
            <h2>Weight Calculator</h2>

            <div style={{ marginBottom: '2rem' }}>
                <input
                    type="number"
                    placeholder="Weight (lbs)"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    style={{
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        width: '20%',
                        marginRight: '0.5rem',
                    }}
                />
                <input
                    type="number"
                    placeholder="Reps"
                    value={reps}
                    onChange={(e) => setReps(Number(e.target.value))}
                    style={{
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        width: '20%',
                        marginRight: '0.5rem',
                    }}
                />
                <input
                    type="number"
                    placeholder="Rir"
                    value={rir}
                    onChange={(e) => setRir(Number(e.target.value))}
                    style={{
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        width: '20%',
                        marginRight: '0.5rem',
                    }}
                />
                <select
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    style={{
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        marginRight: '0.5rem',
                    }}
                >
                    <option value="epley">Epley</option>
                    <option value="brzycki">Brzycki</option>
                    <option value="lombardi">Lombardi</option>
                </select>
                <button
                    onClick={calculateOneRm}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#007BFF',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                    }}
                >
                    Calculate 1RM
                </button>
            </div>

            {oneRm !== null && (
                <div style={{ marginTop: '2rem' }}>
                    <h3>Your Estimated 1RM: {oneRm.toFixed(2)} lbs</h3>
                    {repRange && (
                        <table style={{ marginTop: '1rem', width: '50%', margin: '0 auto' }}>
                            <thead>
                                <tr>
                                    <th>Reps</th>
                                    <th>Estimated Weight (lbs)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {repRange.map((range, index) => (
                                    <tr key={index}>
                                        <td>{range[0]}</td>
                                        <td>{range[1].toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default CalcPage;
