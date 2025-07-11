# Optigains - Progressive Workout Tracking App

A modern, feature-rich workout tracking application built with React, TypeScript, and Supabase. Track your workouts, monitor progress, and achieve your fitness goals with intelligent programming and progression tracking.

## Features

### Core Functionality
- **Workout Templates**: Create and manage custom workout templates with exercises, sets, and reps
- **Training Blocks**: Build periodized training programs with customizable rotation patterns
- **Exercise Tracking**: Log workouts with detailed set-by-set tracking including weight, reps, and RPE
- **Progress Monitoring**: Track your progress over time with visual charts and performance metrics
- **Body Weight Tracking**: Monitor body weight changes alongside training data
- **Calendar Integration**: Schedule workouts and view your training plan on an interactive calendar

### Workout Types
- **Programmed Workouts**: Follow pre-planned templates with suggested weights and reps
- **Freestyle Workouts**: Create workouts on the fly for flexibility
- **Custom Rotations**: Build complex training splits (PPL, Upper/Lower, Full Body, etc.)

### Advanced Features
- **Auto-progression**: Intelligent weight progression based on RPE and performance
- **Exercise Library**: Comprehensive database of exercises with detailed information
- **Workout History**: Complete history of all workouts with search and filter capabilities
- **Rest Timer**: Built-in rest timer between sets with customizable durations
- **Drag-and-Drop**: Reorder exercises and sets with intuitive drag-and-drop interface

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Authentication**: Clerk (OAuth with Google, GitHub, etc.)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Routing**: React Router DOM v7
- **Styling**: CSS Modules + Custom CSS
- **State Management**: React Hooks + Context
- **Charts**: Chart.js with react-chartjs-2

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Clerk account for authentication
- Supabase project for database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/OptigainsV3.git
cd OptigainsV3
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your credentials:
```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your_anon_key_here
```

4. Start the development server:
```bash
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint checks

## Database Schema

The app uses Supabase with the following main tables:
- `users` - User profiles linked to Clerk authentication
- `workout_templates` - Saved workout plans
- `exercise_templates` - Exercises within workouts
- `workout_instances` - Logged workout sessions
- `exercise_logs` - Individual exercise performance data
- `body_weight_logs` - Body weight tracking

All tables use Row Level Security (RLS) to ensure users can only access their own data.

## Future Development Plans

### Multi-User Features
- **Social Features**: Follow other users and share workout templates
- **Leaderboards**: Compare performance on common exercises
- **Training Partners**: Coordinate workouts with friends
- **Coach Mode**: Allow coaches to program workouts for clients
- **Team Training**: Group workout planning and tracking

### Enhanced Analytics
- **Advanced Metrics**: Volume landmarks, fatigue management, and periodization analysis
- **AI Recommendations**: Machine learning-based workout suggestions
- **Performance Predictions**: Estimate 1RM and project future progress
- **Recovery Tracking**: Integrate sleep, nutrition, and stress data

### Mobile Experience
- **Progressive Web App**: Offline support and mobile optimization
- **Native Mobile Apps**: iOS and Android applications
- **Wearable Integration**: Connect with fitness trackers and smartwatches
- **Voice Commands**: Hands-free logging during workouts

### Additional Features
- **Exercise Videos**: Form guides and technique tutorials
- **Nutrition Tracking**: Macro and calorie logging
- **Community Templates**: Marketplace for sharing workout programs
- **Competition Prep**: Specialized tools for powerlifting/bodybuilding meets
- **Export Options**: Generate PDF reports and training logs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with love for the lifting community
- Inspired by the need for a modern, user-friendly workout tracker
- Special thanks to all beta testers and contributors