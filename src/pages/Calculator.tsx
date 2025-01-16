import React, { useState } from 'react';
import HomeButton from '../components/HomeButton';

const CalcPage: React.FC = () => {
    const [reps, setReps] = useState<number | ''>('');
    const [weight, setWeight] = useState<number | ''>('');
    const [rir, setRir] = useState<number | ''>('');
    const [oneRm, setOneRm] = useState<number | null>(null);
    const [repRange, setRepRange] = useState<number[][] | null>(
        Array.from({ length: 12 }, () => Array(2).fill(0))
    );

    // Calculate 1RM based on the Epley formula and adjusted reps
    const calculateOneRm = () => {
        if (reps !== '' && weight !== '' && rir !== '') {
            const adjustedReps = Math.max(0, reps + rir);  // Ensure reps doesn't go below 0
            const calculatedOneRm = weight * (1 + 0.0333 * adjustedReps);
            setOneRm(calculatedOneRm);

            // Now, generate the rep range based on the calculated 1RM
            const temp = Array.from({ length: 12 }, () => Array(2).fill(0));
            for (let i = 1; i <= 12; i++) {
                temp[i - 1][0] = i;  // Rep range (1 to 12)
                temp[i - 1][1] = calculatedOneRm / (1 + (30 / i));  // Estimated weight for each rep
            }
            setRepRange(temp);
        }
    };

    return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
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

            <HomeButton />
        </div>
    );
};

export default CalcPage;
